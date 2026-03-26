function StatCard({ label, value, helper }) {
  return (
    <div className="card stat-card accent-border">
      <span className="eyebrow">{label}</span>
      <h3>{value ?? '--'}</h3>
      {helper ? <p>{helper}</p> : null}
    </div>
  );
}

export default StatCard;
