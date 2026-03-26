import StudySession from '../models/StudySession.js';
import Flashcard from '../models/Flashcard.js';
import ExamScore from '../models/ExamScore.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getRecommendations = asyncHandler(async (_req, res) => {
  const [sessions, flashcards, examScores] = await Promise.all([
    StudySession.find().sort({ date: -1 }),
    Flashcard.find(),
    ExamScore.find().sort({ date: -1 })
  ]);

  if (!sessions.length && !examScores.length && !flashcards.length) {
    return res.json({
      recommendations: [],
      message: 'Add study sessions, flashcards, or exam scores to unlock recommendations.'
    });
  }

  const recommendations = [];

  const weeklyHours = sessions
    .filter((session) => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return new Date(session.date) >= oneWeekAgo;
    })
    .reduce((sum, session) => sum + session.durationHours, 0);

  if (weeklyHours < 6) {
    recommendations.push('Your recent study time is under 6 hours this week. Try scheduling two more focused sessions.');
  }

  if (examScores.length) {
    const averageScore = examScores.reduce((sum, exam) => sum + exam.percentage, 0) / examScores.length;
    if (averageScore < 75) {
      recommendations.push('Your average exam score is below 75%. Increase time spent on active recall and practice problems.');
    }
  }

  const techniqueCounts = sessions.reduce((acc, session) => {
    acc[session.technique] = (acc[session.technique] || 0) + 1;
    return acc;
  }, {});

  const topTechnique = Object.entries(techniqueCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (topTechnique && topTechnique.toLowerCase().includes('reread')) {
    recommendations.push('You rely heavily on rereading. Try active recall or practice problems for better retention.');
  }

  const groupSessions = sessions.filter((session) => session.studyType === 'Group').length;
  const soloSessions = sessions.filter((session) => session.studyType === 'Solo').length;
  if (soloSessions > 0 && groupSessions === 0) {
    recommendations.push('You have only logged solo sessions so far. Test one group session to compare results.');
  }

  if (flashcards.length < 10) {
    recommendations.push('Your flashcard count is still low. Build more cards from your notes for quick review sessions.');
  }

  if (!recommendations.length) {
    recommendations.push('Your current habits look consistent. Keep logging sessions so recommendations can become more personalized.');
  }

  res.json({ recommendations });
});
