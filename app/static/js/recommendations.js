async function loadRecommendations() {
  const response = await fetch("/api/recommendations");
  const data = await response.json();

  const container = document.getElementById("recommendations-list");
  container.innerHTML = "";

  if (!data.recommendations || data.recommendations.length === 0) {
    container.innerHTML = "<p>No recommendations available yet.</p>";
    return;
  }

  data.recommendations.forEach(item => {
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = `<p>${item}</p>`;
    container.appendChild(div);
  });
}

loadRecommendations();