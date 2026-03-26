function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="card loading-state">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  );
}

export default LoadingState;
