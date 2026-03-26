function RecentSessionsList({ sessions }) {
  return (
    <div className="card list-card">
      <div className="card-heading">
        <h3>Recent study sessions</h3>
      </div>
      {!sessions.length ? (
        <p className="muted-text">Your recent sessions will show up here once you log them.</p>
      ) : (
        <div className="stack-list">
          {sessions.map((session) => (
            <div className="list-row" key={session._id}>
              <div>
                <strong>{session.course}</strong>
                <p>{session.technique} · {session.studyType}</p>
              </div>
              <div className="list-row-right">
                <strong>{session.durationHours}h</strong>
                <p>{new Date(session.date).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RecentSessionsList;
