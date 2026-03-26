import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import RecommendationPanel from '../components/RecommendationPanel';
import { fetchRecommendations } from '../api/dashboard';

function RecommendationsPage() {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const data = await fetchRecommendations();
        setRecommendations(data.recommendations || []);
        setMessage(data.message || '');
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, []);

  if (loading) return <LoadingState label="Loading recommendations..." />;

  return (
    <>
      <PageHeader title="Recommendations" description="Rule-based suggestions powered by the data you log." />
      {!recommendations.length ? (
        <EmptyState
          title="No recommendations yet"
          description={message || 'Add more study data and exam scores to unlock suggestions.'}
        />
      ) : (
        <RecommendationPanel recommendations={recommendations} />
      )}
    </>
  );
}

export default RecommendationsPage;
