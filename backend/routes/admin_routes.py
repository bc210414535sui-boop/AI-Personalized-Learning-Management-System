from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from database.connection import get_db
from utils.serializers import serialize_list
from bson import ObjectId

admin_bp = Blueprint('admin', __name__)

def is_admin(claims):
    """Helper to verify Admin Role"""
    return claims.get('role') == 'Admin'

# 1. System Stats
@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    try:
        claims = get_jwt()
        if not is_admin(claims):
            return jsonify({"error": "Access Denied: Admins Only"}), 403

        db = get_db()
        stats = {
            "total_students": db.users.count_documents({"role": "Student"}),
            "total_teachers": db.users.count_documents({"role": "Teacher"}),
            "total_modules": db.modules.count_documents({}),
            "total_quizzes": db.quizzes.count_documents({})
        }
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 2. Get All Users
@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    try:
        claims = get_jwt()
        if not is_admin(claims):
            return jsonify({"error": "Unauthorized"}), 403

        db = get_db()
        # Security: Password kabhi return nahi karna, Newest users first
        users = db.users.find({}, {"password": 0}).sort("created_at", -1)
        return jsonify(serialize_list(users)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 3. Delete User (Ban & Cleanup)
@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    try:
        claims = get_jwt()
        if not is_admin(claims):
            return jsonify({"error": "Unauthorized"}), 403

        db = get_db()
        
        # 1. User Delete karo
        result = db.users.delete_one({"_id": ObjectId(user_id)})
        
        if result.deleted_count == 0:
            return jsonify({"error": "User not found"}), 404

        # 2. Cleanup: User ka sara data (Progress, Chat Logs) bhi uda do
        db.progress.delete_many({"user_id": user_id})
        db.chat_logs.delete_many({"user_id": user_id})
        
        return jsonify({"message": "User and all associated data deleted successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": "Invalid User ID"}), 400