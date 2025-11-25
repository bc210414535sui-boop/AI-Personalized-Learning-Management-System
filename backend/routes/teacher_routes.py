from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from database.connection import get_db
from services.ai_service import generate_quiz_json
from utils.serializers import serialize_list
from datetime import datetime, timezone

teacher_bp = Blueprint('teacher', __name__)

def is_teacher(claims):
    return claims.get('role') == 'Teacher'

# 1. Get Analytics & Detailed Student Progress
@teacher_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    try:
        claims = get_jwt()
        if not is_teacher(claims): return jsonify({"error": "Unauthorized"}), 403
        
        db = get_db()
        
        # 1. Basic Stats
        total_students = db.users.count_documents({"role": "Student"})
        total_quizzes = db.quizzes.count_documents({"created_by": "Teacher"})
        
        # 2. Detailed Student Performance
        students_cursor = db.users.find({"role": "Student"})
        student_performance = []
        
        class_total_score = 0
        total_attempts_class = 0

        for student in students_cursor:
            uid = student["_id"]
            # Fetch this student's progress
            progress = list(db.progress.find({"user_id": uid}))
            
            quizzes_taken = len(progress)
            total_score = sum([p.get('score', 0) for p in progress])
            
            # Student Average
            avg_score = round(total_score / quizzes_taken, 1) if quizzes_taken > 0 else 0
            
            # Class Totals Calculation
            class_total_score += total_score
            total_attempts_class += quizzes_taken

            student_performance.append({
                "_id": str(uid),
                "name": student['name'],
                "email": student['email'],
                "quizzes_taken": quizzes_taken,
                "average_score": avg_score,
                "status": "Active" if quizzes_taken > 0 else "Inactive"
            })

        # Class Average Calculation
        class_avg = round(class_total_score / total_attempts_class, 1) if total_attempts_class > 0 else 0

        return jsonify({
            "stats": {
                "total_students": total_students,
                "total_quizzes": total_quizzes,
                "class_average": class_avg
            },
            "students": student_performance
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 2. Create Quiz (Same as before)
@teacher_bp.route('/create-quiz', methods=['POST'])
@jwt_required()
def create_class_quiz():
    try:
        claims = get_jwt()
        if not is_teacher(claims): return jsonify({"error": "Access Denied"}), 403

        data = request.json
        topic = data.get('topic')
        if not topic: return jsonify({"error": "Topic is required"}), 400

        # AI Generation
        quiz_questions = generate_quiz_json(topic, 'Medium')
        if not quiz_questions: return jsonify({"error": "AI failed"}), 500

        new_quiz = {
            "topic": topic,
            "difficulty": 'Medium',
            "questions": quiz_questions,
            "created_by": "Teacher",
            "teacher_id": get_jwt_identity(),
            "created_at": datetime.now(timezone.utc)
        }
        get_db().quizzes.insert_one(new_quiz)

        return jsonify({"message": "Quiz Published Successfully!", "quiz": quiz_questions}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 3. Get Students List (Simple)
@teacher_bp.route('/students', methods=['GET'])
@jwt_required()
def get_students():
    if not is_teacher(get_jwt()): return jsonify({"error": "Unauthorized"}), 403
    students = get_db().users.find({"role": "Student"}, {"password": 0})
    return jsonify(serialize_list(students)), 200