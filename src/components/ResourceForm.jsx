import { useEffect, useState } from 'react';

function ResourceForm({ fields, initialValues, onSubmit, submitLabel, editingId }) {
  const [form, setForm] = useState(initialValues);

  useEffect(() => {
    setForm(initialValues);
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <div className="card-heading">
        <h3>{editingId ? 'Edit entry' : submitLabel}</h3>
      </div>
      <div className="form-grid">
        {fields.map((field) => (
          <label key={field.name} className={field.full ? 'full-width' : ''}>
            <span>{field.label}</span>
            {field.type === 'textarea' ? (
              <textarea
                name={field.name}
                value={form[field.name] || ''}
                onChange={handleChange}
                rows={field.rows || 4}
                required={field.required}
                placeholder={field.placeholder}
              />
            ) : field.type === 'select' ? (
              <select
                name={field.name}
                value={form[field.name] || ''}
                onChange={handleChange}
                required={field.required}
              >
                <option value="">Select</option>
                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                name={field.name}
                type={field.type || 'text'}
                value={form[field.name] || ''}
                onChange={handleChange}
                required={field.required}
                placeholder={field.placeholder}
                step={field.step}
              />
            )}
          </label>
        ))}
      </div>
      <button className="primary-button" type="submit">
        {editingId ? 'Save changes' : submitLabel}
      </button>
    </form>
  );
}

export default ResourceForm;
