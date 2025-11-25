from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.connection import get_db
from datetime import datetime, timezone
from bson import ObjectId

progress_bp = Blueprint('progress', __name__)

def safe_object_id(uid):
    """Safely convert string ID to ObjectId if valid."""
    try:
        return ObjectId(uid)
    except:
        return uid

# 1. Update Progress (Save Quiz Score)
@progress_bp.route('/update', methods=['POST'])
@jwt_required()
def update_progress():
    try:
        user_id = get_jwt_identity()
        data = request.json
        db = get_db()

        # Validation
        identifier = data.get('module_id') or data.get('topic')
        if not identifier:
            return jsonify({"error": "Module ID or Topic is required"}), 400

        topic_name = data.get('topic') or "Unknown Topic"
        user_obj_id = safe_object_id(user_id)

        # Upsert Progress
        db.progress.update_one(
            {"user_id": user_obj_id, "module_id": identifier},
            {
                "$set": {
                    "topic": topic_name,
                    "status": data.get('status', 'Completed'),
                    "score": data.get('score', 0),
                    "last_updated": datetime.now(timezone.utc)
                }
            },
            upsert=True
        )
        return jsonify({"message": "Progress saved successfully"}), 200

    except Exception as e:
        print(f"❌ Save Error: {e}")
        return jsonify({"error": str(e)}), 500

# 2. Get User's Progress History & Stats
@progress_bp.route('/', methods=['GET'])
@jwt_required()
def get_my_progress():
    try:
        user_id = get_jwt_identity()
        db = get_db()
        user_obj_id = safe_object_id(user_id)

        print(f"📡 Fetching History for User: {user_obj_id}")

        # Fetch from DB (Newest first)
        cursor = db.progress.find({"user_id": user_obj_id}).sort("last_updated", -1)
        history = list(cursor)

        # --- Clean & Serialize Data ---
        clean_history = []
        total_score = 0
        
        for h in history:
            # Convert ObjectIds to String for JSON
            h['_id'] = str(h.get('_id'))
            h['user_id'] = str(h.get('user_id'))
            
            if isinstance(h.get('module_id'), ObjectId):
                h['module_id'] = str(h['module_id'])
            
            # Ensure Topic Name exists
            if 'topic' not in h:
                h['topic'] = str(h.get('module_id', 'Unknown Quiz'))

            # Score Sum for Average Calculation
            total_score += h.get('score', 0)
            clean_history.append(h)

        # Calculate Statistics
        total_quizzes = len(clean_history)
        avg_score = round(total_score / total_quizzes, 1) if total_quizzes > 0 else 0
        
        print(f"✅ Returns: {total_quizzes} records, Avg: {avg_score}%")

        return jsonify({
            "history": clean_history,
            "stats": {
                "total_quizzes": total_quizzes,
                "average_score": avg_score
            }
        }), 200

    except Exception as e:
        print(f"❌ History Error: {e}")
        return jsonify({"error": str(e)}), 500