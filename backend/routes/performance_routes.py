from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.connection import get_db
from bson import ObjectId  # <--- YEH ZAROORI HAI

performance_bp = Blueprint('performance', __name__)

@performance_bp.route('/summary', methods=['GET'])
@jwt_required()
def performance_summary():
    """
    Route: /api/performance/summary
    Desc: Returns the user's learning statistics (Avg Score, Total Quizzes).
    """
    try:
        user_id = get_jwt_identity()
        db = get_db()
        
        # --- FIX: ID Convert karo ---
        try:
            user_obj_id = ObjectId(user_id)
        except:
            user_obj_id = user_id

        # Correct Query using ObjectId
        attempts = list(db.progress.find({"user_id": user_obj_id}))
        
        if not attempts:
            return jsonify({
                "average_score": 0,
                "total_quizzes": 0,
                "modules_completed": 0
            }), 200

        # Stats Calculation
        total_score = sum([a.get('score', 0) for a in attempts])
        completed_count = len(attempts)
        
        average = round(total_score / completed_count, 1) if completed_count > 0 else 0
        
        return jsonify({
            "average_score": average,
            "total_quizzes": completed_count,
            "modules_completed": completed_count
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500