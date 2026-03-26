import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import StudyTrackerPage from './pages/StudyTrackerPage';
import NotesPage from './pages/NotesPage';
import FlashcardsPage from './pages/FlashcardsPage';
import ExamScoresPage from './pages/ExamScoresPage';
import RecommendationsPage from './pages/RecommendationsPage';

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/study-tracker" element={<StudyTrackerPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/flashcards" element={<FlashcardsPage />} />
        <Route path="/exam-scores" element={<ExamScoresPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
      </Routes>
    </AppShell>
  );
}

export default App;
