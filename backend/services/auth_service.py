from database.connection import get_db
from utils.hash_helper import hash_password, check_password
from utils.jwt_helper import generate_token
from utils.serializers import serialize_doc
from datetime import datetime, timezone

def register_user(data):
    """
    Registers a new user (Student or Teacher).
    Prevents creation of 'Admin' accounts via public registration.
    """
    # 1. Input Validation
    if not data.get('email') or not data.get('password') or not data.get('name'):
        return {"error": "Missing required fields (Name, Email, Password)"}, 400

    db = get_db()

    # 2. Check if Email already exists
    if db.users.find_one({"email": data['email']}):
        return {"error": "Email already exists"}, 409

    # 3. Role Security (Prevent fake Admin creation)
    # Default role is Student. Only allow 'Teacher' if explicitly sent.
    # Admin accounts can ONLY be created via seed script or database access.
    requested_role = data.get('role', 'Student')
    if requested_role == 'Admin':
        return {"error": "Admin registration is restricted."}, 403

    # 4. Create User Object
    user = {
        "name": data['name'],
        "email": data['email'],
        "password": hash_password(data['password']),
        "role": requested_role,
        "created_at": datetime.now(timezone.utc) # Timezone aware
    }

    result = db.users.insert_one(user)
    return {"message": "User registered successfully", "id": str(result.inserted_id)}, 201

def login_user(data):
    """
    Authenticates a user and returns a JWT Token.
    """
    # 1. Input Validation
    if not data.get('email') or not data.get('password'):
        return {"error": "Please provide email and password"}, 400

    db = get_db()
    
    # 2. Find User
    user = db.users.find_one({"email": data['email']})
    
    # 3. Verify Password
    if user and check_password(data['password'], user['password']):
        # Generate Secure Token
        token = generate_token(user['_id'], user['role'])
        
        # Remove password from response (Security Best Practice)
        user.pop('password', None)
        
        return {
            "token": token,
            "user": serialize_doc(user),
            "message": "Login successful"
        }, 200
    
    return {"error": "Invalid email or password"}, 401