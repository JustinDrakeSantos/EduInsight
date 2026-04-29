let activeRoomId = null;
let activeRoom = null;
let socket = null;
let lastRoomSearch = "";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setChatEnabled(enabled) {
  document.getElementById("chat-input").disabled = !enabled;
  document.getElementById("chat-submit").disabled = !enabled;
}

function resetActiveRoom(message = "No room selected yet.") {
  activeRoomId = null;
  activeRoom = null;
  document.getElementById("active-room-title").textContent = "Choose a room";
  document.getElementById("active-room-meta").textContent = "Select or create a course room to view messages.";
  document.getElementById("delete-room-button").hidden = true;
  const box = document.getElementById("chat-messages");
  box.classList.add("empty-state");
  box.innerHTML = escapeHtml(message);
  setChatEnabled(false);
}

async function loadCourses() {
  const response = await fetch("/api/chat/courses");
  const courses = await response.json();
  const datalist = document.getElementById("course-options");
  datalist.innerHTML = "";

  courses.forEach(course => {
    const option = document.createElement("option");
    option.value = course;
    datalist.appendChild(option);
  });
}

function renderRoomCard(room, list) {
  const wrapper = document.createElement("div");
  wrapper.className = `room-card-wrap ${room.id === activeRoomId ? "active" : ""}`;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "room-card";
  button.innerHTML = `
    <div class="room-card-top">
      <strong>${escapeHtml(room.room_name)}</strong>
      <span>${escapeHtml(room.course)}</span>
    </div>
    <small>Created by ${escapeHtml(room.created_by)} · ${escapeHtml(formatDate(room.created_at))}</small>
  `;
  button.addEventListener("click", () => selectRoom(room.id));
  wrapper.appendChild(button);

  if (room.can_delete) {
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "room-delete-btn delete-btn";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", event => {
      event.stopPropagation();
      deleteRoom(room.id, room.room_name);
    });
    wrapper.appendChild(deleteButton);
  }

  list.appendChild(wrapper);
}

async function loadRooms(search = lastRoomSearch) {
  lastRoomSearch = search;
  const response = await fetch(`/api/chat/rooms?q=${encodeURIComponent(search)}`);
  const rooms = await response.json();
  const list = document.getElementById("room-list");
  list.innerHTML = "";

  if (!rooms.length) {
    list.innerHTML = `<p class="muted-text">No rooms found yet. Create the first one for your course.</p>`;
    return;
  }

  rooms.forEach(room => renderRoomCard(room, list));
}

async function selectRoom(roomId) {
  const previousRoomId = activeRoomId;
  activeRoomId = roomId;

  if (socket && previousRoomId && previousRoomId !== roomId) {
    socket.emit("leave_room", { room_id: previousRoomId });
  }

  await loadRooms(document.getElementById("room-search").value.trim());
  await loadMessages();

  if (socket) {
    socket.emit("join_room", { room_id: roomId });
  }
}

function renderActiveRoom(room) {
  activeRoom = room;
  const title = document.getElementById("active-room-title");
  const meta = document.getElementById("active-room-meta");
  const deleteButton = document.getElementById("delete-room-button");

  title.textContent = room.room_name;
  meta.textContent = `${room.course} · Created by ${room.created_by}`;
  deleteButton.hidden = !room.can_delete;
  deleteButton.onclick = () => deleteRoom(room.id, room.room_name);
  setChatEnabled(true);
}

function appendMessage(msg) {
  const box = document.getElementById("chat-messages");
  const emptyNotice = box.querySelector(".muted-text");
  if (emptyNotice && emptyNotice.textContent.includes("No messages yet")) {
    box.innerHTML = "";
  }

  const div = document.createElement("div");
  div.className = "chat-message";
  div.innerHTML = `
    <div class="chat-message-header">
      <strong>${escapeHtml(msg.username)}</strong>
      <small>${escapeHtml(formatDate(msg.created_at))}</small>
    </div>
    <p>${escapeHtml(msg.message)}</p>
  `;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

async function loadMessages() {
  if (!activeRoomId) return;

  const response = await fetch(`/api/chat/messages?room_id=${encodeURIComponent(activeRoomId)}`);
  const data = await response.json();
  const box = document.getElementById("chat-messages");

  if (!response.ok) {
    resetActiveRoom(data.error || "Unable to load this room.");
    await loadRooms();
    return;
  }

  renderActiveRoom(data.room);
  box.classList.remove("empty-state");
  box.innerHTML = "";

  if (!data.messages.length) {
    box.innerHTML = `<p class="muted-text">No messages yet. Start the conversation.</p>`;
    return;
  }

  data.messages.forEach(appendMessage);
}

async function createRoom(event) {
  event.preventDefault();
  const courseInput = document.getElementById("course-input");
  const roomNameInput = document.getElementById("room-name-input");

  const response = await fetch("/api/chat/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      course: courseInput.value.trim(),
      room_name: roomNameInput.value.trim(),
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    alert(payload.error || "Unable to create room.");
    return;
  }

  event.target.reset();
  await loadCourses();
  await loadRooms();
  if (payload.room?.id) {
    await selectRoom(payload.room.id);
  }
}

async function deleteRoom(roomId, roomName) {
  const confirmed = confirm(`Delete "${roomName}" and all of its messages? Only the owner or an admin can do this.`);
  if (!confirmed) return;

  const response = await fetch(`/api/chat/rooms/${encodeURIComponent(roomId)}`, {
    method: "DELETE"
  });
  const payload = await response.json();

  if (!response.ok) {
    alert(payload.error || "Unable to delete room.");
    return;
  }

  if (activeRoomId === roomId) {
    if (socket) {
      socket.emit("leave_room", { room_id: roomId });
    }
    resetActiveRoom("Room deleted.");
  }
  await loadCourses();
  await loadRooms();
}

function sendMessage(event) {
  event.preventDefault();
  if (!activeRoomId) return;

  const input = document.getElementById("chat-input");
  const message = input.value.trim();
  if (!message) return;

  if (!socket || !socket.connected) {
    alert("The live chat connection is not ready yet. Please refresh and try again.");
    return;
  }

  socket.emit("send_message", {
    room_id: activeRoomId,
    message,
  });
  input.value = "";
}

function setupSearch() {
  const search = document.getElementById("room-search");
  search.addEventListener("input", () => loadRooms(search.value.trim()));
}

function setupSocket() {
  if (typeof io === "undefined") {
    alert("Socket.IO could not load. Check your network connection and refresh the page.");
    return;
  }

  socket = io();

  socket.on("connect", () => {
    if (activeRoomId) {
      socket.emit("join_room", { room_id: activeRoomId });
    }
  });

  socket.on("new_message", msg => {
    if (msg.room_id === activeRoomId) {
      appendMessage(msg);
    }
  });

  socket.on("room_created", async () => {
    await loadCourses();
    await loadRooms();
  });

  socket.on("room_deleted", async payload => {
    if (payload.room_id === activeRoomId) {
      resetActiveRoom("This room was deleted.");
    }
    await loadCourses();
    await loadRooms();
  });

  socket.on("chat_error", payload => {
    alert(payload.error || "Chat error.");
  });
}

document.getElementById("room-create-form").addEventListener("submit", createRoom);
document.getElementById("chat-form").addEventListener("submit", sendMessage);
setupSearch();
setupSocket();
loadCourses();
loadRooms();
