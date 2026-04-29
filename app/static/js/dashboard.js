async function loadDashboard() {
  const response = await fetch("/api/dashboard/summary");
  const data = await response.json();

  document.getElementById("totalHours").textContent = data.totalHours ?? 0;
  document.getElementById("totalSessions").textContent = data.totalSessions ?? 0;
  document.getElementById("notesCount").textContent = data.notesCount ?? 0;
  document.getElementById("flashcardCount").textContent = data.flashcardCount ?? 0;
  document.getElementById("averageExamScore").textContent =
    data.averageExamScore !== null ? `${data.averageExamScore}%` : "N/A";

  const recentSessions = document.getElementById("recentSessions");
  recentSessions.innerHTML = "";

  if (!data.recentSessions || data.recentSessions.length === 0) {
    recentSessions.innerHTML = "<p>No recent study sessions yet.</p>";
    return;
  }

  data.recentSessions.forEach(session => {
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = `
      <strong>${session.course || "Untitled Course"}</strong>
      <p>Date: ${session.date || "N/A"}</p>
      <p>Hours: ${session.durationHours || 0}</p>
      <p>Technique: ${session.technique || "N/A"}</p>
    `;
    recentSessions.appendChild(div);
  });
}

loadDashboard();