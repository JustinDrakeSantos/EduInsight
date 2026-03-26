import PageHeader from '../components/PageHeader';
import ResourceForm from '../components/ResourceForm';
import ResourceTable from '../components/ResourceTable';
import LoadingState from '../components/LoadingState';
import { studySessionsApi } from '../api/resources';
import { useResourcePage } from '../components/useResourcePage';

const fields = [
  { name: 'course', label: 'Course', required: true, placeholder: 'CS 240' },
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'durationHours', label: 'Hours studied', type: 'number', step: '0.5', required: true },
  { name: 'technique', label: 'Technique', type: 'select', required: true, options: ['Active Recall', 'Practice Problems', 'Flashcards', 'Spaced Repetition', 'Rereading', 'Notes Review'] },
  { name: 'studyType', label: 'Study type', type: 'select', required: true, options: ['Solo', 'Group'] },
  { name: 'note', label: 'Session note', type: 'textarea', full: true, placeholder: 'What did you focus on?' }
];

function StudyTrackerPage() {
  const resource = useResourcePage(studySessionsApi, fields);

  if (resource.loading) return <LoadingState label="Loading study sessions..." />;

  return (
    <>
      <PageHeader title="Study Tracker" description="Log sessions and feed the dashboard from your database." />
      {resource.error ? <p className="error-text">{resource.error}</p> : null}
      <div className="page-grid">
        <ResourceForm
          fields={fields}
          initialValues={resource.initialValues}
          onSubmit={resource.saveItem}
          submitLabel="Add study session"
          editingId={resource.editing?._id}
        />
        <ResourceTable
          columns={[
            { key: 'course', label: 'Course' },
            { key: 'date', label: 'Date', render: (item) => new Date(item.date).toLocaleDateString() },
            { key: 'durationHours', label: 'Hours' },
            { key: 'technique', label: 'Technique' },
            { key: 'studyType', label: 'Type' }
          ]}
          items={resource.items}
          onEdit={resource.setEditing}
          onDelete={resource.deleteItem}
          emptyText="No study sessions yet. Add one to start filling your dashboard."
        />
      </div>
    </>
  );
}

export default StudyTrackerPage;
