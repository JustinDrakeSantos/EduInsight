function SimpleBarChart({ title, data, labelKey, valueKey, emptyText = 'No data yet.' }) {
  const max = Math.max(...data.map((item) => item[valueKey]), 0);

  return (
    <div className="card chart-card">
      <div className="card-heading">
        <h3>{title}</h3>
      </div>
      {!data.length ? (
        <p className="muted-text">{emptyText}</p>
      ) : (
        <div className="bar-chart">
          {data.map((item) => (
            <div key={item[labelKey]} className="bar-item">
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${max ? (item[valueKey] / max) * 100 : 0}%` }}
                />
              </div>
              <div className="bar-meta">
                <span>{item[labelKey]}</span>
                <strong>{item[valueKey]}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SimpleBarChart;
