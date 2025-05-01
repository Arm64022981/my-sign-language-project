import datetime
import os
from flask import Flask, abort, jsonify, request
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import sql
from flask_cors import CORS
import traceback
from datetime import datetime
from werkzeug.utils import secure_filename 
from flask_jwt_extended import JWTManager, create_access_token
from PIL import Image
from werkzeug.security import check_password_hash
from flask_jwt_extended import jwt_required, get_jwt_identity


app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# PostgreSQL connection configuration
DB_CONFIG = {
    'dbname': 'postgres',
    'user': 'postgres',
    'password': 'postgres',
    'host': 'localhost',
    'port': 5432
}

# ตั้งค่า secret key สำหรับ JWT
app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # เปลี่ยนเป็น secret key ที่คุณต้องการ

# Initialize JWTManager
jwt = JWTManager(app)

# Establish a connection to PostgreSQL
def get_db_connection():
    conn = psycopg2.connect(**DB_CONFIG)
    return conn

# ฟังก์ชัน login
@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')

        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # ค้นหาผู้ใช้ในตาราง nurses
        cursor.execute("SELECT * FROM nurses WHERE email = %s;", (email,))
        user = cursor.fetchone()
        user_type = 1 if user else None

        # ถ้าไม่พบใน nurses ให้ตรวจสอบใน doctors
        if not user:
            cursor.execute("SELECT * FROM doctors WHERE email = %s;", (email,))
            user = cursor.fetchone()
            user_type = 2 if user else None

        cursor.close()
        conn.close()

        if user:
            if user['password'] == password:  # เปรียบเทียบรหัสผ่าน
                user.pop('password', None)  # ลบรหัสผ่านออกจากข้อมูลก่อนส่งกลับ
                # สร้าง JWT token
                access_token = create_access_token(identity=user['email'])
                return jsonify({
                    'success': True,
                    'message': 'Login successful',
                    'user_type': user_type,
                    'user_data': user,
                    'access_token': access_token  # ส่ง token กลับไป
                }), 200
            else:
                return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

    except Exception as e:
        print(f"Error during login: {e}")
        return jsonify({'error': str(e)}), 500


# การเพิ่มข้อมูลผู้ป่วย
@app.route('/api/patients', methods=['POST'])
def add_patient():
    data = request.json
    print("DATA RECEIVED:", data)
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        admission_date = datetime.strptime(data['admissionDate'], '%Y-%m-%d').date()

        query = sql.SQL("""
            INSERT INTO patients (
                name, age, weight, height, symptoms, allergy, admission_date, chronic_diseases, medications,
                surgery_history, emergency_contact, blood_type, gender
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """)
        
        cursor.execute(query, (
            data['name'],
            data['age'],
            data['weight'],
            data['height'],
            data['symptoms'],
            data['allergy'],
            admission_date,
            data.get('chronicDiseases', ''),
            data.get('medications', ''),
            data.get('surgeryHistory', ''),
            data.get('emergencyContact', ''),
            data.get('bloodType', ''),
            data.get('gender', '')
        ))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"message": "บันทึกข้อมูลสำเร็จ"}), 201
    except Exception as e:
        print("ERROR:", str(e))
        traceback.print_exc()  
        return jsonify({"message": f"เกิดข้อผิดพลาด: {str(e)}"}), 500


# การดึงข้อมูลผู้ป่วย
@app.route('/api/patients', methods=['GET'])
def get_patients():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, name, gender, age, height, weight 
            FROM patients
        """)
        rows = cursor.fetchall()

        patients = []
        for row in rows:
            patient = {
                'id': row[0],
                'name': row[1],
                'gender': row[2],
                'age': row[3],
                'height': row[4],
                'weight': row[5]
            }
            patients.append(patient)

        cursor.close()
        conn.close()

        return jsonify(patients), 200
    except Exception as e:
        print("ERROR:", str(e))
        traceback.print_exc()
        return jsonify({"message": f"เกิดข้อผิดพลาด: {str(e)}"}), 500


# การลบข้อมูลผู้ป่วย
@app.route('/api/patients/<int:id>', methods=['DELETE'])
def delete_patient(id):
    try:
        # เชื่อมต่อกับฐานข้อมูล
        conn = get_db_connection()
        cursor = conn.cursor()

        # ลบข้อมูลจากฐานข้อมูลที่มี id ตรงกับค่าที่ส่งมา
        cursor.execute("DELETE FROM patients WHERE id = %s", (id,))
        conn.commit()

        # ตรวจสอบว่าลบข้อมูลสำเร็จหรือไม่
        if cursor.rowcount == 0:
            return jsonify({"message": "ไม่พบผู้ป่วยที่ต้องการลบ"}), 404

        # ปิดการเชื่อมต่อฐานข้อมูล
        cursor.close()
        conn.close()

        return jsonify({"message": "ลบข้อมูลผู้ป่วยสำเร็จ"}), 200
    except Exception as e:
        print("ERROR:", str(e))
        traceback.print_exc()
        return jsonify({"message": f"เกิดข้อผิดพลาด: {str(e)}"}), 500


# การดึงข้อมูลผู้ป่วยโดย ID
from flask import jsonify
import traceback

#การดึงข้อมูลผู้ป่วย
@app.route('/api/patients', methods=['POST'])
def create_patient():
    try:
        data = request.get_json()
        print("Received data:", data)  # พิมพ์ข้อมูลเพื่อ debug

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO patients (
                name, age, weight, height, symptoms, allergy, allergydetails, admission_date,
                chronic_diseases, medications, surgery_history, emergency_contact, blood_type, gender
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            data['name'], data['age'], data['weight'], data['height'], data['symptoms'],
            data['allergy'], data['allergydetails'], data['admissionDate'], data['chronicDiseases'],
            data['medications'], data['surgeryHistory'], data['emergencyContact'],
            data['bloodType'], data['gender']
        ))
        conn.commit()  # ต้องมีคำสั่งนี้เพื่อบันทึกข้อมูล
        cursor.close()
        conn.close()
        return jsonify({"message": "บันทึกข้อมูลสำเร็จ"}), 201
    except Exception as e:
        print("ERROR:", str(e))
        traceback.print_exc()
        return jsonify({"message": f"เกิดข้อผิดพลาด: {str(e)}"}), 500



# อัพโหลดรูปภาพ
@app.route('/api/patients/<int:patient_id>/upload-image', methods=['POST'])
def upload_image(patient_id):
    if 'image' not in request.files:
        return jsonify({"error": "ไม่พบไฟล์ภาพ"}), 400

    image = request.files['image']
    
    # ตรวจสอบว่าไฟล์เป็นประเภทที่รองรับหรือไม่
    if image and image.filename.endswith(('jpg', 'jpeg', 'png')):
        filename = f"{patient_id}_{secure_filename(image.filename)}"
        image_path = os.path.join(app.config['UPLOADED_PHOTOS_DEST'], filename)
        image.save(image_path)
        
        # สร้าง URL ของภาพที่ถูกอัปโหลด
        image_url = f"http://localhost:5000/{image_path}"
        
        return jsonify({"image_url": image_url}), 200
    else:
        return jsonify({"error": "ไฟล์ไม่ใช่รูปภาพที่รองรับ"}), 400
    
#ดึงข้อมูลหมอและพยาบาล    
@app.route('/api/profile', methods=['GET'])
@jwt_required()  
def get_profile():
    email = get_jwt_identity()  

    conn = get_db_connection()
    cur = conn.cursor()

    # ค้นหาผู้ใช้ในตาราง doctors
    cur.execute('SELECT * FROM doctors WHERE email = %s', (email,))
    doctor = cur.fetchone()

    # ถ้าไม่พบข้อมูลของ doctor
    if doctor:
        doctor_data = {
            "id": doctor[0],
            "user_id": doctor[1],
            "department_id": doctor[2],
            "fullname": doctor[3],
            "gender": doctor[4],
            "birthdate": doctor[5],
            "contact_number": doctor[6],
            "email": doctor[7]
        }
        cur.close()
        conn.close()
        return jsonify({"doctor": doctor_data}), 200

    # ค้นหาผู้ใช้ในตาราง nurses ถ้าไม่พบใน doctors
    cur.execute('SELECT * FROM nurses WHERE email = %s', (email,))
    nurse = cur.fetchone()

    if nurse:
        nurse_data = {
            "id": nurse[0],
            "user_id": nurse[1],
            "department_id": nurse[2],
            "fullname": nurse[3],
            "gender": nurse[4],
            "birthdate": nurse[5],
            "contact_number": nurse[6],
            "email": nurse[7]
        }
        cur.close()
        conn.close()
        return jsonify({"nurse": nurse_data}), 200

    # ถ้าไม่พบทั้งหมอและพยาบาล
    cur.close()
    conn.close()
    return jsonify({"message": "User not found"}), 404


if __name__ == '__main__':
    print("Starting Flask app...")
    app.run(debug=True)
