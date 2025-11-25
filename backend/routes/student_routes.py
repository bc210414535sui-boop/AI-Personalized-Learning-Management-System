from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.connection import get_db
from utils.serializers import serialize_doc, serialize_list
from utils.hash_helper import hash_password
from bson import ObjectId
from datetime import datetime, timezone

student_bp = Blueprint('student', __name__)

# 1. Get Student Profile
@student_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        user_id = get_jwt_identity()
        db = get_db()
        user = db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            return jsonify({"error": "User not found"}), 404

        user.pop("password", None)
        return jsonify(serialize_doc(user)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 2. Get Assigned Quizzes
@student_bp.route('/assigned-quizzes', methods=['GET'])
@jwt_required()
def get_assigned_quizzes():
    try:
        db = get_db()
        quizzes = db.quizzes.find({"created_by": "Teacher"}).sort("created_at", -1)
        return jsonify(serialize_list(quizzes)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 3. Get Available Courses (FIXED: ObjectId Issue Solved)
@student_bp.route('/courses', methods=['GET'])
@jwt_required()
def get_courses():
    try:
        user_id = get_jwt_identity()
        db = get_db()
        
        # 1. Fetch all courses
        all_courses = list(db.modules.find({}))
        
        final_courses = []
        for course in all_courses:
            # --- FIX: Convert ALL ObjectIds to String ---
            course['_id'] = str(course['_id'])
            
            # Agar created_by field hai, usay bhi string banao
            if course.get('created_by'):
                course['created_by'] = str(course['created_by'])

            # 2. Check Enrollment Status
            is_enrolled = db.enrollments.find_one({
                "user_id": user_id, 
                "course_id": course['_id']
            })
            
            course['is_enrolled'] = True if is_enrolled else False
            final_courses.append(course)

        return jsonify(final_courses), 200

    except Exception as e:
        print(f"❌ COURSES ERROR: {str(e)}")
        return jsonify({"error": "Server Error loading courses"}), 500

# 4. Enroll in Course
@student_bp.route('/enroll', methods=['POST'])
@jwt_required()
def enroll_course():
    try:
        user_id = get_jwt_identity()
        data = request.json
        course_id = data.get('course_id')
        
        if not course_id:
            return jsonify({"error": "Course ID required"}), 400

        db = get_db()
        
        db.enrollments.update_one(
            {"user_id": user_id, "course_id": course_id},
            {"$set": {"enrolled_at": datetime.now(timezone.utc)}},
            upsert=True
        )
        return jsonify({"message": "Enrolled Successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 5. Update Profile
@student_bp.route('/update-profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        data = request.json
        db = get_db()
        
        updates = {}
        if data.get('name'): updates['name'] = data['name']
        if data.get('password'): updates['password'] = hash_password(data['password'])

        if updates:
            db.users.update_one({"_id": ObjectId(user_id)}, {"$set": updates})
        
        return jsonify({"message": "Profile Updated!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500