from pymongo import MongoClient
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# --- MongoDB Atlas connection only ---
mongo_uri = settings.MONGO_URI
mongo_db_name = settings.MONGO_DB_NAME

if not mongo_uri:
    raise RuntimeError(
        "MONGO_URI is not set. Add it to backend/.env, e.g.\n"
        "MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=Cluster0"
    )

logger.info("Connecting to MongoDB Atlas")
client = MongoClient(mongo_uri)

# Database
db = client[mongo_db_name]

logger.info("MongoDB Atlas connection initialized (db=%s)", mongo_db_name)
