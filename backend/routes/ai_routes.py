from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.ai_service import get_chat_response, generate_quiz_json, generate_study_plan
from database.connection import get_db
from datetime import datetime, timezone
from bson import ObjectId

ai_bp = Blueprint('ai', __name__)

# 1. Chat Route
@ai_bp.route('/chat', methods=['POST'])
@jwt_required()
def chat():
    try:
        data = request.json
        reply = get_chat_response(data.get('message'))
        user_id = get_jwt_identity()
        try: uid = ObjectId(user_id)
        except: uid = user_id
        
        get_db().chat_logs.insert_one({
            "user_id": uid,
            "message": data.get('message'),
            "reply": reply,
            "timestamp": datetime.now(timezone.utc)
        })
        return jsonify({"reply": reply}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 2. Quiz Route
@ai_bp.route('/generate-quiz', methods=['POST'])
@jwt_required()
def quiz():
    try:
        data = request.json
        quiz_data = generate_quiz_json(data.get('topic'), 'Medium')
        if not quiz_data: return jsonify({"error": "AI failed"}), 500
        return jsonify(quiz_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 3. Recommendation Route
@ai_bp.route('/recommendation', methods=['GET'])
@jwt_required()
def get_recommendation():
    try:
        user_id = get_jwt_identity()
        db = get_db()
        try: uid = ObjectId(user_id)
        except: uid = user_id

        weak_records = list(db.progress.find({"user_id": uid, "score": {"$lt": 60}}))
        if not weak_records: return jsonify({"message": "Great job! No weak areas found."})

        topics = list(set([r.get('topic', 'General') for r in weak_records]))
        ai_plan = generate_study_plan(", ".join(topics))
        return jsonify({"message": ai_plan}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 4. ADAPTIVE QUIZ (NEW FEATURE)
@ai_bp.route('/generate-adaptive-quiz', methods=['POST'])
@jwt_required()
def adaptive_quiz():
    try:
        user_id = get_jwt_identity()
        db = get_db()
        try: uid = ObjectId(user_id)
        except: uid = user_id

        # Find weakest topic
        weakest_record = db.progress.find_one({"user_id": uid, "score": {"$lt": 60}}, sort=[("score", 1)])
        
        if weakest_record and weakest_record.get('topic'):
            target_topic = weakest_record['topic']
        else:
            target_topic = "General Knowledge" # Fallback if no failure

        # Generate Quiz
        quiz_data = generate_quiz_json(target_topic, 'Hard')
        
        if not quiz_data: return jsonify({"error": "AI failed"}), 500

        return jsonify({"quiz": quiz_data, "topic": target_topic}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500