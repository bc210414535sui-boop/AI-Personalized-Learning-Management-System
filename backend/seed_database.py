import bcrypt
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from datetime import datetime, timezone, timedelta

# --- CONFIGURATION ---
URI = "mongodb+srv://admin:Zain@5083@cluster0.h09op38.mongodb.net/?appName=Cluster0"
DB_NAME = "ai_learning_db"

client = MongoClient(URI)

try:
    # 1. Connect
    db = client[DB_NAME]
    print(f"🔄 Connecting to database: {DB_NAME}...")
    
    # --- CLEANUP (PURANA DATA SAAF KARO) ---
    print("🧹 Cleaning old data...")
    db.users.delete_many({})
    db.modules.delete_many({})
    db.progress.delete_many({})
    db.quizzes.delete_many({})
    db.chat_logs.delete_many({})
    db.enrollments.delete_many({})
    print("✅ Old data cleared.")

    # --- 2. SETUP INDEXES ---
    db.users.create_index("email", unique=True)
    
    # --- 3. HELPER FUNCTIONS ---
    def hash_pw(pw): 
        return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

    def create_user(name, email, password, role, extra_profile={}):
        user = {
            "name": name,
            "email": email,
            "password": hash_pw(password),
            "role": role,
            "created_at": datetime.now(timezone.utc),
            "student_id": extra_profile.get("student_id", None)
        }
        try:
            uid = db.users.insert_one(user).inserted_id
            print(f"✅ User Created: {name} ({role})")
            return uid
        except DuplicateKeyError:
            return db.users.find_one({"email": email})["_id"]

    # --- 4. SEED USERS ---
    student_id = create_user("Shams ul Islam", "shams@gmail.com", "1234", "Student", {"student_id": "BC210414535"})
    teacher_id = create_user("Dr. Saima", "dr.saima@gmail.com", "1234", "Teacher", {})
    admin_id = create_user("System Admin", "admin@lms.com", "1234", "Admin", {})

    # --- 5. SEED 5 COURSES (RICH CONTENT) ---
    modules_data = [
        {
            "title": "Python Zero to Hero",
            "content": "Module 1: Introduction\n- Variables\n- Loops\n\nModule 2: OOP\n- Classes\n- Inheritance",
            "subject": "Programming",
            "difficulty": "Beginner",
            "created_by": teacher_id,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "title": "Web Development Bootcamp",
            "content": "HTML5 & CSS3 Basics.\nJavaScript ES6 features.\nReact.js Introduction.",
            "subject": "Web Dev",
            "difficulty": "Beginner",
            "created_by": teacher_id,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "title": "Data Structures & Algorithms",
            "content": "Arrays, Linked Lists, Trees, Graphs, Sorting Algorithms.",
            "subject": "CS Core",
            "difficulty": "Hard",
            "created_by": teacher_id,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "title": "Digital Marketing 101",
            "content": "SEO, Social Media Marketing, Google Analytics.",
            "subject": "Marketing",
            "difficulty": "Beginner",
            "created_by": teacher_id,
            "created_at": datetime.now(timezone.utc)
        },
        {
            "title": "Cybersecurity Essentials",
            "content": "Network security, ethical hacking basics, Phishing prevention.",
            "subject": "Security",
            "difficulty": "Medium",
            "created_by": teacher_id,
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    db.modules.insert_many(modules_data)
    print(f"✅ Created {len(modules_data)} Courses.")

    # --- 6. SEED PROGRESS & ENROLLMENT (Safe Way) ---
    # Hum specific courses dhoondenge jo humne abhi banaye hain
    py_module = db.modules.find_one({"title": "Python Zero to Hero"})
    web_module = db.modules.find_one({"title": "Web Development Bootcamp"})
    
    # --- 6. SEED PROGRESS & ENROLLMENT ---
    if py_module and web_module:
        progress_data = [
            {
                "user_id": student_id,
                "module_id": str(py_module["_id"]),
                "topic": py_module["title"],  
                "status": "Completed",
                "score": 85.0,
                "last_updated": datetime.now(timezone.utc)
            },
            {
                "user_id": student_id,
                "module_id": str(web_module["_id"]),
                "topic": web_module["title"], 
                "status": "In-progress",
                "score": 40.0,
                "last_updated": datetime.now(timezone.utc)
            }
        ]
        
        # Save Progress & Enrollments
        for p in progress_data:
            # 1. Progress Save
            db.progress.update_one(
                {"user_id": p["user_id"], "module_id": p["module_id"]},
                {"$set": p},
                upsert=True
            )
            # 2. Enrollment Save (Zaroori hai taake 'Start Learning' button aaye)
            db.enrollments.update_one(
                {"user_id": p["user_id"], "course_id": p["module_id"]},
                {"$set": {"enrolled_at": datetime.now(timezone.utc)}},
                upsert=True
            )
            
        print("✅ Seeded Student Progress & Enrollment.")

    # --- 7. SEED TEACHER QUIZ ---
    teacher_quiz = {
        "topic": "Python Basics",
        "difficulty": "Easy",
        "created_by": "Teacher",
        "created_at": datetime.now(timezone.utc),
        "questions": [
            {"question": "Output of print(2*3)?", "options": ["5", "6", "Error"], "answer": "6"},
            {"question": "Define function keyword?", "options": ["def", "func"], "answer": "def"}
        ]
    }
    
    if db.quizzes.count_documents({"topic": "Python Basics"}) == 0:
        db.quizzes.insert_one(teacher_quiz)
        print("✅ Created Teacher Assigned Quiz.")

    print("\n🎉 SUCCESS: Database Refreshed & Ready!")

except Exception as e:
    print(f"❌ Error Seeding Database: {e}")

finally:
    client.close()
