function RecommendationPanel({ recommendations }) {
  return (
    <div className="card list-card accent-card">
      <div className="card-heading">
        <h3>Recommendation engine</h3>
      </div>
      {!recommendations.length ? (
        <p className="muted-text">Recommendations will appear after you add data.</p>
      ) : (
        <div className="stack-list">
          {recommendations.map((item) => (
            <div className="list-row" key={item}>
              <div>
                <strong>Suggestion</strong>
                <p>{item}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RecommendationPanel;
