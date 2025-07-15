# routes/auth.py
from flask import Blueprint, jsonify, request
from werkzeug.security import check_password_hash
from flask_jwt_extended import create_access_token
from database import get_db_connection
from psycopg2.extras import RealDictCursor

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')

        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # ตรวจสอบ nurses ก่อน
        cursor.execute("SELECT * FROM nurses WHERE email = %s;", (email,))
        user = cursor.fetchone()
        user_type = 1 if user else None

        # ถ้าไม่เจอใน nurses → ตรวจสอบใน doctors
        if not user:
            cursor.execute("SELECT * FROM doctors WHERE email = %s;", (email,))
            user = cursor.fetchone()
            user_type = 2 if user else None

        cursor.close()
        conn.close()

        if user and check_password_hash(user['password'], password):
            user.pop('password', None)
            access_token = create_access_token(identity=user['email'])
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'user_type': user_type,
                'user_data': user,
                'access_token': access_token
            }), 200
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

    except Exception as e:
        print(f"Error during login: {e}")
        return jsonify({'error': str(e)}), 500