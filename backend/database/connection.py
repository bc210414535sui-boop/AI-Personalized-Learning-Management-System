from flask_pymongo import PyMongo

# Initialize the instance globally
# Hum isay yahan banate hain taake poori app mein kahin bhi import kar sakein
mongo = PyMongo()

def get_db():
    """
    Returns the MongoDB Database instance for CRUD operations.
    Includes a safety check to ensure the database is actually connected.
    """
    # Safety Check: Agar DB connect nahi hua ya config ghalat hai
    if mongo.db is None:
        print("❌ CRITICAL ERROR: MongoDB connection lost or not initialized.")
        raise ConnectionError("Database not connected. Check MONGO_URI in .env")
    
    return mongo.db