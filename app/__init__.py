import os
from flask import Flask
from dotenv import load_dotenv
from .extensions import login_manager, socketio
from .eduinsight_db import init_db

def create_app():
    load_dotenv()

    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "fallback-secret")
    app.config["MONGO_URI"] = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/")
    app.config["MONGO_DB_NAME"] = os.getenv("MONGO_DB_NAME", "eduinsight")

    init_db(app)
    login_manager.init_app(app)
    login_manager.login_view = "auth.login"
    socketio.init_app(app)

    from .routes.auth import auth_bp
    from .routes.main import main_bp
    from .routes.api import api_bp
    from .routes.chat import chat_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(api_bp)
    app.register_blueprint(chat_bp)

    return app