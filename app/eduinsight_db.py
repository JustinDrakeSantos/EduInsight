from pymongo import MongoClient
from flask import current_app
from bson import ObjectId
from .extensions import login_manager, User

mongo_client = None
mongo_db = None

def init_db(app):
    global mongo_client, mongo_db
    mongo_client = MongoClient(app.config["MONGO_URI"])
    mongo_db = mongo_client[app.config["MONGO_DB_NAME"]]

def get_db():
    return mongo_db

@login_manager.user_loader
def load_user(user_id):
    db = get_db()
    if db is None:
        return None

    try:
        user_doc = db.users.find_one({"_id": ObjectId(user_id)})
        if not user_doc:
            return None
        return User(user_doc)
    except Exception:
        return None