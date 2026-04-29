const resourceType = window.RESOURCE_TYPE;
const pageTitle = window.PAGE_TITLE;
let editingId = null;

function getFields(resourceType) {
  if (resourceType === "study-sessions") {
    return [
      { name: "course", label: "Course" },
      { name: "date", label: "Date" },
      { name: "durationHours", label: "Duration Hours", type: "number" },
      { name: "technique", label: "Technique" },
      { name: "studyType", label: "Study Type" },
      { name: "note", label: "Note" }
    ];
  }

  if (resourceType === "notes") {
    return [
      { name: "course", label: "Course" },
      { name: "title", label: "Title" },
      { name: "content", label: "Content" }
    ];
  }

  if (resourceType === "flashcards") {
    return [
      { name: "course", label: "Course" },
      { name: "deckName", label: "Deck Name" },
      { name: "front", label: "Front" },
      { name: "back", label: "Back" }
    ];
  }

  if (resourceType === "exam-scores") {
    return [
      { name: "course", label: "Course" },
      { name: "examName", label: "Exam Name" },
      { name: "date", label: "Date" },
      { name: "score", label: "Score", type: "number" },
      { name: "totalPoints", label: "Total Points", type: "number" },
      { name: "percentage", label: "Percentage", type: "number" },
      { name: "note", label: "Note" }
    ];
  }

  return [];
}

function buildForm() {
  const form = document.getElementById("resource-form");
  const fields = getFields(resourceType);

  form.innerHTML = "";

  fields.forEach(field => {
    const input = document.createElement("input");
    input.name = field.name;
    input.placeholder = field.label;
    input.type = field.type || "text";
    input.required = field.name !== "note" && field.name !== "deckName" && field.name !== "percentage";
    form.appendChild(input);
  });

  const button = document.createElement("button");
  button.type = "submit";
  button.textContent = "Save";
  form.appendChild(button);

  form.addEventListener("submit", submitForm);
}

async function submitForm(e) {
  e.preventDefault();

  const form = e.target;
  const fields = getFields(resourceType);
  const payload = {};

  fields.forEach(field => {
    payload[field.name] = form[field.name].value;
  });

  if (resourceType === "exam-scores" && (!payload.percentage || payload.percentage === "")) {
    const score = parseFloat(payload.score || 0);
    const total = parseFloat(payload.totalPoints || 1);
    payload.percentage = total ? ((score / total) * 100).toFixed(1) : 0;
  }

  const method = editingId ? "PUT" : "POST";
  const url = editingId ? `/api/${resourceType}/${editingId}` : `/api/${resourceType}`;

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  editingId = null;
  form.reset();
  loadItems();
}

async function loadItems() {
  const response = await fetch(`/api/${resourceType}`);
  const data = await response.json();

  const list = document.getElementById("resource-list");
  list.innerHTML = "";

  if (!data.length) {
    list.innerHTML = `<p>No ${pageTitle.toLowerCase()} found yet.</p>`;
    return;
  }

  data.forEach(item => {
    const div = document.createElement("div");
    div.className = "list-item";

    const content = Object.entries(item)
      .filter(([key]) => key !== "id" && key !== "user_id")
      .map(([key, value]) => `<p><strong>${key}:</strong> ${value ?? ""}</p>`)
      .join("");

    div.innerHTML = `
      ${content}
      <div class="action-row">
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;

    div.querySelector(".edit-btn").addEventListener("click", () => {
      const form = document.getElementById("resource-form");
      const fields = getFields(resourceType);

      fields.forEach(field => {
        if (form[field.name]) {
          form[field.name].value = item[field.name] ?? "";
        }
      });

      editingId = item.id;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    div.querySelector(".delete-btn").addEventListener("click", async () => {
      await fetch(`/api/${resourceType}/${item.id}`, { method: "DELETE" });
      loadItems();
    });

    list.appendChild(div);
  });
}

buildForm();
loadItems();