from flask import Blueprint, request, jsonify
from services.auth_service import register_user, login_user

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Route: /api/auth/register
    Desc: Registers a new user.
    """
    # Safety Check: Agar request JSON nahi hai
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    response, status = register_user(data)
    return jsonify(response), status

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Route: /api/auth/login
    Desc: Logs in a user and returns JWT Token.
    """
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    response, status = login_user(data)
    return jsonify(response), status