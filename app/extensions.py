from flask_login import LoginManager, UserMixin
from flask_socketio import SocketIO

login_manager = LoginManager()
socketio = SocketIO(async_mode="threading", cors_allowed_origins="*")

class User(UserMixin):
    def __init__(self, user_doc):
        self.id = str(user_doc["_id"])
        self.username = user_doc["username"]
        self.email = user_doc["email"]
        self.role = user_doc.get("role", "user")
        self.is_admin = bool(user_doc.get("is_admin")) or self.role == "admin"

    def get_id(self):
        return self.id
