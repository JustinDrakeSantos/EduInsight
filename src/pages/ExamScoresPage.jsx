import PageHeader from '../components/PageHeader';
import ResourceForm from '../components/ResourceForm';
import ResourceTable from '../components/ResourceTable';
import LoadingState from '../components/LoadingState';
import { examScoresApi } from '../api/resources';
import { useResourcePage } from '../components/useResourcePage';

const fields = [
  { name: 'course', label: 'Course', required: true },
  { name: 'examName', label: 'Exam name', required: true },
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'score', label: 'Score earned', type: 'number', required: true },
  { name: 'totalPoints', label: 'Total points', type: 'number', required: true },
  { name: 'note', label: 'Note', type: 'textarea', full: true }
];

function ExamScoresPage() {
  const resource = useResourcePage(examScoresApi, fields);

  if (resource.loading) return <LoadingState label="Loading exam scores..." />;

  return (
    <>
      <PageHeader title="Exam Scores" description="Track exam performance and feed the recommendation engine." />
      {resource.error ? <p className="error-text">{resource.error}</p> : null}
      <div className="page-grid">
        <ResourceForm
          fields={fields}
          initialValues={resource.initialValues}
          onSubmit={resource.saveItem}
          submitLabel="Add exam score"
          editingId={resource.editing?._id}
        />
        <ResourceTable
          columns={[
            { key: 'course', label: 'Course' },
            { key: 'examName', label: 'Exam' },
            { key: 'date', label: 'Date', render: (item) => new Date(item.date).toLocaleDateString() },
            { key: 'percentage', label: 'Percent', render: (item) => `${item.percentage}%` }
          ]}
          items={resource.items}
          onEdit={resource.setEditing}
          onDelete={resource.deleteItem}
          emptyText="No exam scores yet. Add one so the system can start making recommendations."
        />
      </div>
    </>
  );
}

export default ExamScoresPage;
