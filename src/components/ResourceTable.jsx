function ResourceTable({ columns, items, onEdit, onDelete, emptyText }) {
  return (
    <div className="card table-card">
      {!items.length ? (
        <p className="muted-text">{emptyText}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  {columns.map((column) => (
                    <td key={column.key}>{column.render ? column.render(item) : item[column.key]}</td>
                  ))}
                  <td>
                    <div className="row-actions">
                      <button className="secondary-button" onClick={() => onEdit(item)}>
                        Edit
                      </button>
                      <button className="danger-button" onClick={() => onDelete(item._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ResourceTable;
