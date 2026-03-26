function VerticalMiniChart({ title, data }) {
  const max = Math.max(...data.map((item) => item.hours), 0);

  return (
    <div className="card chart-card">
      <div className="card-heading">
        <h3>{title}</h3>
      </div>
      {!data.length || max === 0 ? (
        <p className="muted-text">No study hours logged for this period.</p>
      ) : (
        <div className="mini-chart-wrap">
          {data.map((item) => (
            <div className="mini-bar-group" key={item.date}>
              <div className="mini-bar-track">
                <div
                  className="mini-bar-fill"
                  style={{ height: `${(item.hours / max) * 100}%` }}
                />
              </div>
              <span>{new Date(item.date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VerticalMiniChart;
