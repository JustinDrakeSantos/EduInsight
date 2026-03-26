import { useEffect, useMemo, useState } from 'react';

const getEmptyValues = (fields) =>
  fields.reduce((acc, field) => ({ ...acc, [field.name]: field.defaultValue || '' }), {});

export const useResourcePage = (api, fields) => {
  const emptyValues = useMemo(() => getEmptyValues(fields), [fields]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const loadItems = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getAll();
      setItems(data);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const saveItem = async (formData) => {
    try {
      if (editing?._id) {
        await api.update(editing._id, formData);
      } else {
        await api.create(formData);
      }
      setEditing(null);
      await loadItems();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Save failed');
    }
  };

  const deleteItem = async (id) => {
    try {
      await api.remove(id);
      await loadItems();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Delete failed');
    }
  };

  return {
    items,
    loading,
    error,
    editing,
    setEditing,
    emptyValues,
    initialValues: editing || emptyValues,
    saveItem,
    deleteItem,
    reload: loadItems
  };
};
