from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from database.connection import mongo # Make sure your connection.py exports 'mongo'

# Import Blueprints (Routes)
from routes.auth_routes import auth_bp
from routes.student_routes import student_bp
from routes.module_routes import module_bp
from routes.ai_routes import ai_bp
from routes.progress_routes import progress_bp
from routes.teacher_routes import teacher_bp
from routes.performance_routes import performance_bp
from routes.admin_routes import admin_bp

def create_app():
    app = Flask(__name__)
    
    # 1. Load Configuration (Secret Keys, DB URI)
    app.config.from_object(Config)

    # 2. Initialize Plugins & Security
    try:
        mongo.init_app(app)
        
        # --- SECURITY FIX (Req #7): Restrict Access to Frontend Only ---
        # Pehle '*' tha, ab humne specific 'http://localhost:3000' kar diya hai
        CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})
        
        JWTManager(app)
        print("✅ Plugins Initialized Successfully")
    except Exception as e:
        print(f"❌ Plugin Initialization Error: {e}")

    # 3. Register Blueprints (API Endpoints)
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(student_bp, url_prefix='/api/student')
    app.register_blueprint(module_bp, url_prefix='/api/modules')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(progress_bp, url_prefix='/api/progress')
    app.register_blueprint(teacher_bp, url_prefix='/api/teacher')
    app.register_blueprint(performance_bp, url_prefix='/api/performance')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    # 4. Global Error Handlers (JSON Format for Frontend)
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Endpoint not found", "status": 404}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"error": "Internal Server Error. Please contact admin.", "status": 500}), 500

    # 5. Health Check Route
    @app.route('/', methods=['GET'])
    def health_check():
        return jsonify({
            "message": "AI Learning System Backend is Secure & Live 🚀",
            "security": "Active",
            "status": "Running"
        }), 200

    return app

if __name__ == '__main__':
    app = create_app()
    # Debug=True development ke liye theek hai
    app.run(debug=True, port=5000)