from datetime import datetime
import re

from bson import ObjectId
from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required
from flask_socketio import emit, join_room, leave_room

from app.eduinsight_db import get_db
from app.extensions import socketio

chat_bp = Blueprint("chat_api", __name__, url_prefix="/api/chat")

RESOURCE_COLLECTIONS = [
    "study_sessions",
    "notes",
    "flashcards",
    "exam_scores",
]


def room_channel(room_id):
    return f"chat_room_{room_id}"


def parse_object_id(value):
    try:
        return ObjectId(value)
    except Exception:
        return None


def user_can_delete_room(room):
    if not current_user.is_authenticated:
        return False
    return room.get("created_by") == current_user.id or getattr(current_user, "is_admin", False)


def serialize_room(room):
    return {
        "id": str(room["_id"]),
        "course": room.get("course", "General"),
        "room_name": room.get("room_name", "Untitled Room"),
        "created_by": room.get("created_by_username", "Unknown"),
        "created_by_id": room.get("created_by", ""),
        "created_at": room.get("created_at", ""),
        "can_delete": user_can_delete_room(room),
    }


def serialize_message(message):
    return {
        "id": str(message["_id"]),
        "room_id": message["room_id"],
        "username": message["username"],
        "user_id": message.get("user_id", ""),
        "message": message["message"],
        "created_at": message.get("created_at", ""),
    }


def get_room_or_error(room_id):
    room_object_id = parse_object_id(room_id)
    if not room_object_id:
        return None, (jsonify({"error": "Invalid room_id"}), 400)

    db = get_db()
    room = db.chat_rooms.find_one({"_id": room_object_id})
    if not room:
        return None, (jsonify({"error": "Room not found"}), 404)

    return room, None


def create_message_document(room_id, message_text):
    db = get_db()
    result = db.chat_messages.insert_one({
        "room_id": room_id,
        "user_id": current_user.id,
        "username": current_user.username,
        "message": message_text,
        "created_at": datetime.utcnow().isoformat(),
    })
    message = db.chat_messages.find_one({"_id": result.inserted_id})
    return serialize_message(message)


@chat_bp.route("/courses", methods=["GET"])
@login_required
def chat_courses():
    db = get_db()
    courses = set()

    for collection_name in RESOURCE_COLLECTIONS:
        docs = db[collection_name].find(
            {"user_id": current_user.id, "course": {"$exists": True}},
            {"course": 1}
        )
        for doc in docs:
            course = str(doc.get("course", "")).strip()
            if course:
                courses.add(course)

    room_courses = db.chat_rooms.distinct("course")
    for course in room_courses:
        value = str(course).strip()
        if value:
            courses.add(value)

    return jsonify(sorted(courses, key=str.lower))


@chat_bp.route("/rooms", methods=["GET", "POST"])
@login_required
def chat_rooms():
    db = get_db()

    if request.method == "GET":
        query = request.args.get("q", "").strip()
        filters = {}
        if query:
            regex = re.compile(re.escape(query), re.IGNORECASE)
            filters = {"$or": [{"course": regex}, {"room_name": regex}]}

        rooms = list(db.chat_rooms.find(filters).sort("_id", -1))
        return jsonify([serialize_room(room) for room in rooms])

    data = request.get_json() or {}
    course = data.get("course", "").strip()
    room_name = data.get("room_name", "").strip()

    if not course:
        return jsonify({"error": "Course is required"}), 400

    if not room_name:
        room_name = f"{course} Discussion"

    existing = db.chat_rooms.find_one({
        "course": {"$regex": f"^{re.escape(course)}$", "$options": "i"},
        "room_name": {"$regex": f"^{re.escape(room_name)}$", "$options": "i"},
    })
    if existing:
        return jsonify({
            "message": "Room already exists",
            "room": serialize_room(existing)
        }), 200

    result = db.chat_rooms.insert_one({
        "course": course,
        "room_name": room_name,
        "created_by": current_user.id,
        "created_by_username": current_user.username,
        "created_at": datetime.utcnow().isoformat()
    })
    room = db.chat_rooms.find_one({"_id": result.inserted_id})
    payload = serialize_room(room)
    socketio.emit("room_created", payload)
    return jsonify({"message": "Room created", "room": payload}), 201


@chat_bp.route("/rooms/<room_id>", methods=["DELETE"])
@login_required
def delete_chat_room(room_id):
    db = get_db()
    room_object_id = parse_object_id(room_id)
    if not room_object_id:
        return jsonify({"error": "Invalid room_id"}), 400

    room = db.chat_rooms.find_one({"_id": room_object_id})
    if not room:
        return jsonify({"error": "Room not found"}), 404

    if not user_can_delete_room(room):
        return jsonify({"error": "Only the room owner or an admin can delete this room."}), 403

    db.chat_messages.delete_many({"room_id": room_id})
    db.chat_rooms.delete_one({"_id": room_object_id})
    socketio.emit("room_deleted", {"room_id": room_id})
    return jsonify({"message": "Room deleted"})


@chat_bp.route("/messages", methods=["GET", "POST"])
@login_required
def chat_messages():
    room_id = request.args.get("room_id", "").strip()

    if not room_id:
        return jsonify({"error": "room_id is required"}), 400

    room, error = get_room_or_error(room_id)
    if error:
        return error

    db = get_db()
    if request.method == "GET":
        messages = list(db.chat_messages.find({"room_id": room_id}).sort("_id", 1))
        return jsonify({
            "room": serialize_room(room),
            "messages": [serialize_message(message) for message in messages]
        })

    data = request.get_json() or {}
    message_text = data.get("message", "").strip()

    if not message_text:
        return jsonify({"error": "Message cannot be empty"}), 400

    message = create_message_document(room_id, message_text)
    socketio.emit("new_message", message, to=room_channel(room_id))
    return jsonify({"message": "Sent successfully", "chat_message": message}), 201


@socketio.on("join_room")
def handle_join_room(data):
    if not current_user.is_authenticated:
        emit("chat_error", {"error": "Please log in before joining a chat room."})
        return

    room_id = str((data or {}).get("room_id", "")).strip()
    room, error = get_room_or_error(room_id)
    if error:
        emit("chat_error", {"error": "Room not found."})
        return

    join_room(room_channel(room_id))
    emit("room_joined", {"room": serialize_room(room)})


@socketio.on("leave_room")
def handle_leave_room(data):
    if not current_user.is_authenticated:
        return

    room_id = str((data or {}).get("room_id", "")).strip()
    if room_id:
        leave_room(room_channel(room_id))


@socketio.on("send_message")
def handle_send_message(data):
    if not current_user.is_authenticated:
        emit("chat_error", {"error": "Please log in before sending messages."})
        return

    room_id = str((data or {}).get("room_id", "")).strip()
    message_text = str((data or {}).get("message", "")).strip()

    if not room_id:
        emit("chat_error", {"error": "Choose a room before sending a message."})
        return

    if not message_text:
        emit("chat_error", {"error": "Message cannot be empty."})
        return

    room, error = get_room_or_error(room_id)
    if error:
        emit("chat_error", {"error": "Room not found."})
        return

    message = create_message_document(room_id, message_text)
    socketio.emit("new_message", message, to=room_channel(room_id))
