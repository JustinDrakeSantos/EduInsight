import PageHeader from '../components/PageHeader';
import ResourceForm from '../components/ResourceForm';
import ResourceTable from '../components/ResourceTable';
import LoadingState from '../components/LoadingState';
import { flashcardsApi } from '../api/resources';
import { useResourcePage } from '../components/useResourcePage';

const fields = [
  { name: 'course', label: 'Course', required: true },
  { name: 'deckName', label: 'Deck name', required: true },
  { name: 'front', label: 'Front', type: 'textarea', required: true, full: true, rows: 4 },
  { name: 'back', label: 'Back', type: 'textarea', required: true, full: true, rows: 4 }
];

function FlashcardsPage() {
  const resource = useResourcePage(flashcardsApi, fields);

  if (resource.loading) return <LoadingState label="Loading flashcards..." />;

  return (
    <>
      <PageHeader title="Flashcards" description="Create flashcards and build lightweight decks for review." />
      {resource.error ? <p className="error-text">{resource.error}</p> : null}
      <div className="page-grid">
        <ResourceForm
          fields={fields}
          initialValues={resource.initialValues}
          onSubmit={resource.saveItem}
          submitLabel="Add flashcard"
          editingId={resource.editing?._id}
        />
        <ResourceTable
          columns={[
            { key: 'course', label: 'Course' },
            { key: 'deckName', label: 'Deck' },
            { key: 'front', label: 'Front', render: (item) => `${item.front.slice(0, 60)}${item.front.length > 60 ? '...' : ''}` },
            { key: 'back', label: 'Back', render: (item) => `${item.back.slice(0, 60)}${item.back.length > 60 ? '...' : ''}` }
          ]}
          items={resource.items}
          onEdit={resource.setEditing}
          onDelete={resource.deleteItem}
          emptyText="No flashcards yet. Add one to start building review material."
        />
      </div>
    </>
  );
}

export default FlashcardsPage;
