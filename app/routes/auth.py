from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required
from werkzeug.security import generate_password_hash, check_password_hash
from app.eduinsight_db import get_db
from app.extensions import User

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        db = get_db()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")

        user_doc = db.users.find_one({"email": email})
        if user_doc and check_password_hash(user_doc["password_hash"], password):
            login_user(User(user_doc))
            return redirect(url_for("main.dashboard"))

        flash("Invalid email or password.", "error")

    return render_template("login.html")

@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        db = get_db()
        username = request.form.get("username", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")

        if not username or not email or not password:
            flash("All fields are required.", "error")
            return render_template("register.html")

        existing_user = db.users.find_one({"email": email})
        if existing_user:
            flash("Email already registered.", "error")
            return render_template("register.html")

        db.users.insert_one({
            "username": username,
            "email": email,
            "password_hash": generate_password_hash(password, method="pbkdf2:sha256")
        })

        flash("Registration successful. Please log in.", "success")
        return redirect(url_for("auth.login"))

    return render_template("register.html")

@auth_bp.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("auth.login"))