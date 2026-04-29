from flask import Blueprint, render_template
from flask_login import login_required

main_bp = Blueprint("main", __name__)

@main_bp.route("/")
@login_required
def dashboard():
    return render_template("dashboard.html")

@main_bp.route("/study-tracker")
@login_required
def study_tracker():
    return render_template(
        "resource_page.html",
        page_title="Study Tracker",
        resource_type="study-sessions"
    )

@main_bp.route("/notes")
@login_required
def notes():
    return render_template(
        "resource_page.html",
        page_title="Notes",
        resource_type="notes"
    )

@main_bp.route("/flashcards")
@login_required
def flashcards():
    return render_template(
        "resource_page.html",
        page_title="Flashcards",
        resource_type="flashcards"
    )

@main_bp.route("/exam-scores")
@login_required
def exam_scores():
    return render_template(
        "resource_page.html",
        page_title="Exam Scores",
        resource_type="exam-scores"
    )

@main_bp.route("/recommendations")
@login_required
def recommendations():
    return render_template("recommendations.html")

@main_bp.route("/chat")
@login_required
def chat():
    return render_template("chat.html")