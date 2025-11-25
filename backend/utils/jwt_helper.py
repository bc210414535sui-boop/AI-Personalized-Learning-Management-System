from flask_jwt_extended import create_access_token
from datetime import timedelta

def generate_token(user_id, role):
    # Tokens expire in 1 day
    expires = timedelta(days=1)
    return create_access_token(identity=str(user_id), additional_claims={"role": role}, expires_delta=expires)
