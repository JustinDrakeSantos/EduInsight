from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from app.eduinsight_db import get_db
from bson import ObjectId
from datetime import datetime, timedelta

api_bp = Blueprint("api", __name__, url_prefix="/api")

RESOURCE_COLLECTIONS = {
    "study-sessions": "study_sessions",
    "notes": "notes",
    "flashcards": "flashcards",
    "exam-scores": "exam_scores",
}

def serialize_doc(doc):
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

def add_user_scope(payload):
    payload["user_id"] = current_user.id
    return payload

@api_bp.route("/<resource>", methods=["GET", "POST"])
@login_required
def resource_collection(resource):
    db = get_db()
    collection_name = RESOURCE_COLLECTIONS.get(resource)
    if not collection_name:
        return jsonify({"error": "Resource not found"}), 404

    collection = db[collection_name]

    if request.method == "GET":
        docs = list(collection.find({"user_id": current_user.id}).sort("_id", -1))
        return jsonify([serialize_doc(doc) for doc in docs])

    payload = request.get_json() or {}
    payload = add_user_scope(payload)
    result = collection.insert_one(payload)
    doc = collection.find_one({"_id": result.inserted_id})
    return jsonify(serialize_doc(doc)), 201

@api_bp.route("/<resource>/<item_id>", methods=["PUT", "DELETE"])
@login_required
def resource_item(resource, item_id):
    db = get_db()
    collection_name = RESOURCE_COLLECTIONS.get(resource)
    if not collection_name:
        return jsonify({"error": "Resource not found"}), 404

    collection = db[collection_name]

    try:
        query = {"_id": ObjectId(item_id), "user_id": current_user.id}
    except Exception:
        return jsonify({"error": "Invalid ID"}), 400

    existing = collection.find_one(query)
    if not existing:
        return jsonify({"error": "Item not found"}), 404

    if request.method == "PUT":
        payload = request.get_json() or {}
        payload["user_id"] = current_user.id
        collection.update_one(query, {"$set": payload})
        updated = collection.find_one(query)
        return jsonify(serialize_doc(updated))

    collection.delete_one(query)
    return jsonify({"message": "Deleted successfully"})

@api_bp.route("/dashboard/summary", methods=["GET"])
@login_required
def dashboard_summary():
    db = get_db()

    study_sessions = list(db.study_sessions.find({"user_id": current_user.id}))
    notes_count = db.notes.count_documents({"user_id": current_user.id})
    flashcards_count = db.flashcards.count_documents({"user_id": current_user.id})
    exam_scores = list(db.exam_scores.find({"user_id": current_user.id}))

    total_hours = 0
    for session in study_sessions:
        total_hours += float(session.get("durationHours", 0))

    avg_exam = None
    if exam_scores:
        percentages = []
        for exam in exam_scores:
            if "percentage" in exam:
                percentages.append(float(exam["percentage"]))
            else:
                try:
                    score = float(exam.get("score", 0))
                    total_points = float(exam.get("totalPoints", 1))
                    percentages.append(round((score / total_points) * 100, 1))
                except Exception:
                    pass
        if percentages:
            avg_exam = round(sum(percentages) / len(percentages), 1)

    recent_sessions = sorted(
        study_sessions,
        key=lambda x: str(x.get("_id")),
        reverse=True
    )[:5]

    return jsonify({
        "totalHours": round(total_hours, 1),
        "totalSessions": len(study_sessions),
        "notesCount": notes_count,
        "flashcardCount": flashcards_count,
        "averageExamScore": avg_exam,
        "recentSessions": [serialize_doc(s) for s in recent_sessions]
    })

@api_bp.route("/recommendations", methods=["GET"])
@login_required
def recommendations():
    db = get_db()

    study_sessions = list(db.study_sessions.find({"user_id": current_user.id}))
    flashcards = list(db.flashcards.find({"user_id": current_user.id}))
    exam_scores = list(db.exam_scores.find({"user_id": current_user.id}))

    recommendations_list = []

    total_hours = sum(float(s.get("durationHours", 0)) for s in study_sessions)
    if total_hours < 6:
        recommendations_list.append(
            "Your total recorded study time is still low. Try adding more focused study sessions this week."
        )

    if len(flashcards) < 10:
        recommendations_list.append(
            "Build more flashcards from your notes so you can practice active recall more consistently."
        )

    if exam_scores:
        percentages = []
        for exam in exam_scores:
            if "percentage" in exam:
                percentages.append(float(exam["percentage"]))
            else:
                try:
                    score = float(exam.get("score", 0))
                    total_points = float(exam.get("totalPoints", 1))
                    percentages.append(round((score / total_points) * 100, 1))
                except Exception:
                    pass

        if percentages:
            avg_score = sum(percentages) / len(percentages)
            if avg_score < 75:
                recommendations_list.append(
                    "Your average exam score is below 75 percent. Increase time spent on practice and review."
                )

    if not recommendations_list:
        recommendations_list.append(
            "Your study habits look consistent. Keep logging data so recommendations can become more personalized."
        )

    return jsonify({"recommendations": recommendations_list})