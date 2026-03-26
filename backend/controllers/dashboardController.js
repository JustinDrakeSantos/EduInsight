import StudySession from '../models/StudySession.js';
import Note from '../models/Note.js';
import Flashcard from '../models/Flashcard.js';
import ExamScore from '../models/ExamScore.js';
import asyncHandler from '../utils/asyncHandler.js';

const startOfWeek = (date) => {
  const clone = new Date(date);
  const day = clone.getDay();
  const diff = clone.getDate() - day + (day === 0 ? -6 : 1);
  clone.setDate(diff);
  clone.setHours(0, 0, 0, 0);
  return clone;
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

export const getDashboardSummary = asyncHandler(async (_req, res) => {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const [sessions, notesCount, flashcardsCount, examScores] = await Promise.all([
    StudySession.find().sort({ date: -1 }),
    Note.countDocuments(),
    Flashcard.countDocuments(),
    ExamScore.find().sort({ date: -1 })
  ]);

  const totalHoursThisWeek = sessions
    .filter((session) => new Date(session.date) >= weekStart)
    .reduce((sum, session) => sum + session.durationHours, 0);

  const totalHoursThisMonth = sessions
    .filter((session) => new Date(session.date) >= monthStart)
    .reduce((sum, session) => sum + session.durationHours, 0);

  const averageExamScore = examScores.length
    ? Number(
        (
          examScores.reduce((sum, exam) => sum + (exam.percentage || 0), 0) / examScores.length
        ).toFixed(1)
      )
    : null;

  const hoursByDayMap = {};
  const last7Dates = Array.from({ length: 7 }, (_, index) => {
    const d = new Date();
    d.setDate(now.getDate() - (6 - index));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  last7Dates.forEach((date) => {
    const key = date.toISOString().split('T')[0];
    hoursByDayMap[key] = 0;
  });

  sessions.forEach((session) => {
    const key = new Date(session.date).toISOString().split('T')[0];
    if (Object.hasOwn(hoursByDayMap, key)) {
      hoursByDayMap[key] += session.durationHours;
    }
  });

  const hoursByDay = Object.entries(hoursByDayMap).map(([date, hours]) => ({
    date,
    hours: Number(hours.toFixed(1))
  }));

  const hoursByCourseMap = {};
  const techniqueBreakdownMap = {};

  sessions.forEach((session) => {
    hoursByCourseMap[session.course] = (hoursByCourseMap[session.course] || 0) + session.durationHours;
    techniqueBreakdownMap[session.technique] = (techniqueBreakdownMap[session.technique] || 0) + 1;
  });

  const hoursByCourse = Object.entries(hoursByCourseMap)
    .map(([course, hours]) => ({ course, hours: Number(hours.toFixed(1)) }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5);

  const techniqueBreakdown = Object.entries(techniqueBreakdownMap)
    .map(([technique, count]) => ({ technique, count }))
    .sort((a, b) => b.count - a.count);

  const recentSessions = sessions.slice(0, 5);

  const hasData = sessions.length > 0 || notesCount > 0 || flashcardsCount > 0 || examScores.length > 0;

  res.json({
    hasData,
    totalHoursThisWeek: Number(totalHoursThisWeek.toFixed(1)),
    totalHoursThisMonth: Number(totalHoursThisMonth.toFixed(1)),
    totalSessions: sessions.length,
    averageExamScore,
    flashcardCount: flashcardsCount,
    notesCount,
    hoursByDay,
    hoursByCourse,
    techniqueBreakdown,
    recentSessions
  });
});
