import PageHeader from '../components/PageHeader';
import ResourceForm from '../components/ResourceForm';
import ResourceTable from '../components/ResourceTable';
import LoadingState from '../components/LoadingState';
import { notesApi } from '../api/resources';
import { useResourcePage } from '../components/useResourcePage';

const fields = [
  { name: 'course', label: 'Course', required: true },
  { name: 'title', label: 'Title', required: true },
  { name: 'content', label: 'Content', type: 'textarea', required: true, full: true, rows: 8 }
];

function NotesPage() {
  const resource = useResourcePage(notesApi, fields);

  if (resource.loading) return <LoadingState label="Loading notes..." />;

  return (
    <>
      <PageHeader title="Notes" description="Create and manage note sets by course." />
      {resource.error ? <p className="error-text">{resource.error}</p> : null}
      <div className="page-grid">
        <ResourceForm
          fields={fields}
          initialValues={resource.initialValues}
          onSubmit={resource.saveItem}
          submitLabel="Add note"
          editingId={resource.editing?._id}
        />
        <ResourceTable
          columns={[
            { key: 'course', label: 'Course' },
            { key: 'title', label: 'Title' },
            { key: 'content', label: 'Preview', render: (item) => `${item.content.slice(0, 80)}${item.content.length > 80 ? '...' : ''}` }
          ]}
          items={resource.items}
          onEdit={resource.setEditing}
          onDelete={resource.deleteItem}
          emptyText="No notes yet. Add notes so the dashboard can count them."
        />
      </div>
    </>
  );
}

export default NotesPage;
