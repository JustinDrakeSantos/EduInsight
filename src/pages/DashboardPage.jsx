import { useEffect, useState } from 'react';
import { fetchDashboardSummary, fetchRecommendations } from '../api/dashboard';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import VerticalMiniChart from '../components/VerticalMiniChart';
import SimpleBarChart from '../components/SimpleBarChart';
import RecentSessionsList from '../components/RecentSessionsList';
import RecommendationPanel from '../components/RecommendationPanel';

function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [summaryData, recommendationData] = await Promise.all([
          fetchDashboardSummary(),
          fetchRecommendations()
        ]);
        setSummary(summaryData);
        setRecommendations(recommendationData.recommendations || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <LoadingState label="Loading dashboard..." />;
  }

  if (!summary?.hasData) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description="Your dashboard fills itself once data exists in the database."
        />
        <EmptyState
          title="No study data yet"
          description="Add a study session, note, flashcard, or exam score to populate the dashboard cards and charts."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="A dark lilac dashboard that only lights up when there is actual data in your backend."
      />

      <section className="stats-grid">
        <StatCard label="Hours this week" value={`${summary.totalHoursThisWeek}h`} helper="Recent study momentum" />
        <StatCard label="Hours this month" value={`${summary.totalHoursThisMonth}h`} helper="Monthly consistency" />
        <StatCard label="Average exam score" value={summary.averageExamScore ? `${summary.averageExamScore}%` : '--'} helper="Based on saved scores" />
        <StatCard label="Resources created" value={`${summary.notesCount + summary.flashcardCount}`} helper={`${summary.notesCount} notes · ${summary.flashcardCount} flashcards`} />
      </section>

      <section className="dashboard-grid top-grid">
        <div className="wide-panel">
          <VerticalMiniChart title="Activities this week" data={summary.hoursByDay} />
        </div>
        <SimpleBarChart title="Hours by course" data={summary.hoursByCourse} labelKey="course" valueKey="hours" />
        <RecommendationPanel recommendations={recommendations.slice(0, 3)} />
      </section>

      <section className="dashboard-grid bottom-grid">
        <SimpleBarChart
          title="Study techniques"
          data={summary.techniqueBreakdown}
          labelKey="technique"
          valueKey="count"
          emptyText="Log study sessions to see which techniques you use most."
        />
        <div className="big-accent-card card accent-card hero-value-card">
          <span className="eyebrow">Total study sessions</span>
          <h2>{summary.totalSessions}</h2>
          <p>Every new session stored in MongoDB updates this card automatically.</p>
        </div>
        <RecentSessionsList sessions={summary.recentSessions} />
      </section>
    </>
  );
}

export default DashboardPage;
