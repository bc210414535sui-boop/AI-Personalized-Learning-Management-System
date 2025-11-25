from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from database.connection import get_db
from utils.serializers import serialize_list
from datetime import datetime, timezone

module_bp = Blueprint('module', __name__)

# Helper: Verify if user is authorized (Teacher/Admin)
def is_staff(claims):
    role = claims.get('role')
    return role in ['Teacher', 'Admin']

# 1. Get All Modules (Available to Everyone)
@module_bp.route('/', methods=['GET'])
@jwt_required()
def get_modules():
    try:
        db = get_db()
        # Sort by newest first
        modules = db.modules.find().sort("created_at", -1)
        return jsonify(serialize_list(modules)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 2. Create New Module (Restricted to Teachers/Admins)
@module_bp.route('/create', methods=['POST'])
@jwt_required()
def create_module():
    try:
        # Security Check
        claims = get_jwt()
        if not is_staff(claims):
            return jsonify({"error": "Unauthorized: Only Teachers/Admins can create modules"}), 403

        data = request.json
        title = data.get('title')
        content = data.get('content')
        subject = data.get('subject', 'General')

        # Validation
        if not title or not content:
            return jsonify({"error": "Title and Content are required"}), 400

        db = get_db()
        new_module = {
            "title": title,
            "content": content,
            "subject": subject,
            "created_by": claims.get('role'),
            "created_at": datetime.now(timezone.utc)
        }
        
        db.modules.insert_one(new_module)
        return jsonify({"message": "Module created successfully"}), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500