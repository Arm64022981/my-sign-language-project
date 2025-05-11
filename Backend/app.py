import datetime
import os
import re
from venv import logger
from flask import Flask, abort, jsonify, request
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import sql
from flask_cors import CORS
import traceback
from datetime import datetime
from werkzeug.utils import secure_filename 
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from PIL import Image
from werkzeug.security import check_password_hash

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
    
#เพิ่มข้อมูลผู้ป่วย
@app.route('/api/patients', methods=['POST'])
def add_patient():
    data = request.json
    print("DATA RECEIVED:", data)

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        admission_date = datetime.strptime(data['admissionDate'], '%Y-%m-%d').date()

        # Convert allergy to boolean
        allergy = data.get('allergy')
        if isinstance(allergy, str):
            allergy = allergy.lower() == 'true'

        query = """
            INSERT INTO patients (
                id_card, name, age, weight, height, symptoms, allergy, allergy_details,
                admission_date, chronic_diseases, medications, surgery_history,
                emergency_contact, blood_type, gender, nurse_name, nationality
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id_card) DO UPDATE SET
                name = EXCLUDED.name,
                age = EXCLUDED.age,
                weight = EXCLUDED.weight,
                height = EXCLUDED.height,
                symptoms = EXCLUDED.symptoms,
                allergy = EXCLUDED.allergy,
                allergy_details = EXCLUDED.allergy_details,
                admission_date = EXCLUDED.admission_date,
                chronic_diseases = EXCLUDED.chronic_diseases,
                medications = EXCLUDED.medications,
                surgery_history = EXCLUDED.surgery_history,
                emergency_contact = EXCLUDED.emergency_contact,
                blood_type = EXCLUDED.blood_type,
                gender = EXCLUDED.gender,
                nurse_name = EXCLUDED.nurse_name,
                nationality = EXCLUDED.nationality
        """

        cursor.execute(query, (
            data['id_card'],
            data['name'],
            data['age'],
            data['weight'],
            data['height'],
            data['symptoms'],
            allergy,
            data.get('allergydetails', ''),
            admission_date,
            data.get('chronicDiseases', ''),
            data.get('medications', ''),
            data.get('surgeryHistory', ''),
            data.get('emergencyContact', ''),
            data.get('bloodType', ''),
            data.get('gender', ''),
            data.get('nurseName', '16'),
            data.get('nationality', '17')
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
def get_all_patients():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, id_card, name, gender, age, height, weight, nationality FROM patients")
        rows = cursor.fetchall()
        patients = [
            {
                "id": row[0],
                "id_card": row[1],
                "name": row[2],
                "gender": row[3],
                "age": row[4],
                "height": row[5],
                "weight": row[6],
                "nationality": row[7],
            } for row in rows
        ]
        cursor.close()
        conn.close()
        return jsonify(patients)
    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({"error": f"เกิดข้อผิดพลาด: {str(e)}"}), 500

# การลบข้อมูลผู้ป่วย
@app.route('/api/patients/<int:id>', methods=['DELETE'])
def delete_patient(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM patients WHERE id = %s", (id,))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "ไม่พบผู้ป่วยที่ต้องการลบ"}), 404

        cursor.close()
        conn.close()

        return jsonify({"message": "ลบข้อมูลผู้ป่วยสำเร็จ"}), 200
    except Exception as e:
        print("ERROR:", str(e))
        traceback.print_exc()
        return jsonify({"message": f"เกิดข้อผิดพลาด: {str(e)}"}), 500

#ดึงข้อมูลหมอและพยาบาล    
@app.route('/api/profile', methods=['GET'])
@jwt_required()  
def get_profile():
    email = get_jwt_identity()  

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute('SELECT * FROM doctors WHERE email = %s', (email,))
    doctor = cur.fetchone()

    if doctor:
        doctor_data = {
            "id": doctor[0],
            "user_id": doctor[1],
            "department_id": doctor[2],
            "fullname": doctor[3],
            "gender": doctor[4],
            "birthdate": doctor[5],
            "contact_number": doctor[6],
            "email": doctor[7],
            "department": doctor[9],  
            "role": doctor[10]         
        }
        cur.close()
        conn.close()
        return jsonify({"doctor": doctor_data}), 200

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
            "email": nurse[7],
            "department": nurse[9],  
            "role": nurse[10]         
        }
        cur.close()
        conn.close()
        return jsonify({"nurse": nurse_data}), 200
 
    cur.close()
    conn.close()
    return jsonify({"message": "User not found"}), 404

# อัปเดตโปรไฟล์
@app.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    email = get_jwt_identity()
    data = request.get_json()

    if not data:
        logger.warning(f"Empty request body for email: {email}")
        return jsonify({"message": "ไม่มีข้อมูลสำหรับอัปเดต"}), 400

    # ฟิลด์ที่อนุญาตให้อัปเดต
    allowed_fields = ['fullname', 'gender', 'birthdate', 'contact_number', 'email']
    update_data = {k: v for k, v in data.items() if k in allowed_fields}

    if not update_data:
        logger.warning(f"No valid fields provided for email: {email}")
        return jsonify({"message": "ไม่มีฟิลด์ที่อนุญาตให้อัปเดต"}), 400

    # การตรวจสอบข้อมูล
    if 'fullname' in update_data and (not update_data['fullname'] or len(update_data['fullname']) > 100):
        logger.warning(f"Invalid fullname for email: {email}")
        return jsonify({"message": "ชื่อ-นามสกุลต้องไม่ว่างและยาวไม่เกิน 100 ตัวอักษร"}), 400

    if 'gender' in update_data:
        valid_genders = ['Male', 'Female', 'Other']
        if update_data['gender'] not in valid_genders:
            logger.warning(f"Invalid gender: {update_data['gender']} for email: {email}")
            return jsonify({"message": "เพศต้องเป็น 'Male', 'Female', หรือ 'Other'"}), 400

    if 'birthdate' in update_data and update_data['birthdate']:
        try:
            birthdate = datetime.strptime(update_data['birthdate'], '%Y-%m-%d')
            if birthdate > datetime.now():
                logger.warning(f"Future birthdate: {update_data['birthdate']} for email: {email}")
                return jsonify({"message": "วันเกิดต้องไม่เป็นวันในอนาคต"}), 400
        except ValueError:
            logger.warning(f"Invalid birthdate format: {update_data['birthdate']} for email: {email}")
            return jsonify({"message": "รูปแบบวันเกิดไม่ถูกต้อง ต้องเป็น YYYY-MM-DD"}), 400

    if 'contact_number' in update_data and update_data['contact_number']:
        if not re.match(r'^\d{10}$', update_data['contact_number']):
            logger.warning(f"Invalid contact number: {update_data['contact_number']} for email: {email}")
            return jsonify({"message": "เบอร์โทรต้องเป็นตัวเลข 10 หลัก"}), 400

    if 'email' in update_data and update_data['email'] != email:
        logger.warning(f"Attempt to change email from {email} to {update_data['email']}")
        return jsonify({"message": "ไม่สามารถเปลี่ยนอีเมลได้"}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # อัปเดตข้อมูลแพทย์
        cur.execute('SELECT * FROM doctors WHERE email = %s', (email,))
        doctor = cur.fetchone()

        if doctor:
            set_clause = ', '.join([f"{key} = %s" for key in update_data])
            values = list(update_data.values()) + [email]
            query = f'UPDATE doctors SET {set_clause} WHERE email = %s'
            cur.execute(query, values)
            conn.commit()

            cur.execute('SELECT * FROM doctors WHERE email = %s', (email,))
            updated_doctor = cur.fetchone()
            doctor_data = {
                "id": updated_doctor[0],
                "user_id": updated_doctor[1],
                "department_id": updated_doctor[2],
                "fullname": updated_doctor[3],
                "gender": updated_doctor[4],
                "birthdate": updated_doctor[5].strftime('%Y-%m-%d') if updated_doctor[5] else None,
                "contact_number": updated_doctor[6],
                "email": updated_doctor[7],
                "department": updated_doctor[9],
                "role": updated_doctor[10]
            }
            logger.info(f"Profile updated successfully for doctor: {email}")
            cur.close()
            conn.close()
            return jsonify({"doctor": doctor_data}), 200

        # อัปเดตข้อมูลพยาบาล
        cur.execute('SELECT * FROM nurses WHERE email = %s', (email,))
        nurse = cur.fetchone()

        if nurse:
            set_clause = ', '.join([f"{key} = %s" for key in update_data])
            values = list(update_data.values()) + [email]
            query = f'UPDATE nurses SET {set_clause} WHERE email = %s'
            cur.execute(query, values)
            conn.commit()

            cur.execute('SELECT * FROM nurses WHERE email = %s', (email,))
            updated_nurse = cur.fetchone()
            nurse_data = {
                "id": updated_nurse[0],
                "user_id": updated_nurse[1],
                "department_id": updated_nurse[2],
                "fullname": updated_nurse[3],
                "gender": updated_nurse[4],
                "birthdate": updated_nurse[5].strftime('%Y-%m-%d') if updated_nurse[5] else None,
                "contact_number": updated_nurse[6],
                "email": updated_nurse[7],
                "department": updated_nurse[9],
                "role": updated_nurse[10]
            }
            logger.info(f"Profile updated successfully for nurse: {email}")
            cur.close()
            conn.close()
            return jsonify({"nurse": nurse_data}), 200

        logger.warning(f"User not found for email: {email}")
        cur.close()
        conn.close()
        return jsonify({"message": "ไม่พบผู้ใช้ในระบบ"}), 404

    except Exception as e:
        conn.rollback()
        logger.error(f"Error updating profile for email: {email}, error: {str(e)}")
        cur.close()
        conn.close()
        return jsonify({"message": f"เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์: {str(e)}"}), 500
    
#ดึงข้อมูลผู้ป่วย
from flask import jsonify
import traceback

@app.route('/api/patients/<string:id_card>', methods=['GET'])
def get_patient(id_card):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # ดึงข้อมูลผู้ป่วยด้วย id_card (แก้ allergydetails เป็น allergy_details)
        cursor.execute("SELECT id, id_card, name, age, weight, height, symptoms, allergy, allergy_details, admission_date, chronic_diseases, medications, surgery_history, emergency_contact, blood_type, gender, nurse_name, nationality FROM patients WHERE id_card = %s", (id_card,))
        row = cursor.fetchone()

        if not row:
            cursor.close()
            conn.close()
            return jsonify({"message": "ไม่พบผู้ป่วย"}), 404

        # เตรียมข้อมูลผู้ป่วย
        patient = {
            "id": str(row[0]),
            "name": row[2],
            "age": row[3],
            "weight": row[4],
            "height": row[5],
            "symptoms": row[6],
            "allergy": row[7],
            "admission_date": str(row[9]),  
            "chronic_diseases": row[10],
            "medications": row[11],
            "surgery_history": row[12],
            "emergency_contact": row[13],
            "blood_type": row[14],
            "gender": row[15],
            "allergydetails": row[8],  # คอลัมน์นี้เป็น allergy_details (index 8)
            "nurse_name": row[16],
            "nationality": row[17],
        }

        # ใช้ id_card เพื่อตรวจสอบการวินิจฉัยล่าสุด
        id_card_value = str(id_card)
        print(f"DEBUG: id_card = {id_card_value}")
        cursor.execute("""
            SELECT patient_id, main_symptom, preliminary_diagnosis, treatment_plan, appointment, doctor_name, created_at
            FROM diagnoses
            WHERE patient_id = %s
            ORDER BY created_at DESC
            LIMIT 1
        """, (id_card_value,))
        diagnosis = cursor.fetchone()
        print(f"DEBUG: diagnosis = {diagnosis}")

        if diagnosis:
            patient["diagnosis"] = {
                "patient_id": diagnosis[0],
                "main_symptom": diagnosis[1],
                "preliminary_diagnosis": diagnosis[2],
                "treatment_plan": diagnosis[3],
                "appointment": diagnosis[4],
                "doctor_name": diagnosis[5],
                "created_at": str(diagnosis[6]),
            }
        else:
            patient["diagnosis"] = None

        cursor.close()
        conn.close()
        return jsonify(patient)

    except Exception as e:
        print("ERROR:", str(e))
        traceback.print_exc()
        return jsonify({"message": f"เกิดข้อผิดพลาด: {str(e)}"}), 500

    
#รายงานปัญหาส่งไปยังแอดมิน
@app.route('/api/reports', methods=['POST'])
def report_issue():
    data = request.get_json()
    fullname = data.get('fullname')
    role = data.get('role')
    department = data.get('department')
    issue_description = data.get('issueDescription')

    if not fullname or not role or not department or not issue_description:
        return jsonify({"error": "กรุณากรอกข้อมูลให้ครบถ้วน"}), 400

    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute(
        """
        INSERT INTO reports (fullname, role, department, issue_description)
        VALUES (%s, %s, %s, %s)
        """,
        (fullname, role, department, issue_description)
    )
    connection.commit()
    cursor.close()
    connection.close()

    return jsonify({"message": "รายงานได้รับการส่งเรียบร้อยแล้ว"}), 200

# # PUT: อัปเดตข้อมูลผู้ป่วยตาม id
# @app.route('/api/patients/<int:id>', methods=['GET'])
# def get_patient_with_diagnosis(id):
#     try:
#         conn = get_db_connection()
#         cursor = conn.cursor()
        
#         # ดึงข้อมูลผู้ป่วย
#         cursor.execute("SELECT * FROM patients WHERE id = %s", (id,))
#         patient_row = cursor.fetchone()

#         # ถ้าหากไม่พบผู้ป่วย
#         if not patient_row:
#             return jsonify({"message": "ไม่พบผู้ป่วย"}), 404
        
#         # ดึงข้อมูลการวินิจฉัยที่เกี่ยวข้องกับผู้ป่วย
#         cursor.execute("""
#     SELECT main_symptom, preliminary_diagnoses, treatment_plan, appointment, doctor_name
#     FROM diagnoses
#     WHERE patient_id = %s
#     ORDER BY created_at DESC
#     LIMIT 1
# """, (str(patient_row[0]),))  # แปลง patient_id ให้เป็น string (TEXT)

#         diagnoses_row = cursor.fetchone()
        
#         # ถ้ามีข้อมูลการวินิจฉัย
#         if diagnoses_row:
#             diagnosis = {
#                 "main_symptom": diagnoses_row[0],
#                 "preliminary_diagnosis": diagnoses_row[1],
#                 "treatment_plan": diagnoses_row[2],
#                 "appointment": diagnoses_row[3],
#                 "doctor_name": diagnoses_row[4]
#             }
#         else:
#            diagnoses = None  # ถ้าไม่มีข้อมูลการวินิจฉัย

#         # รวมข้อมูลผู้ป่วยและการวินิจฉัย
#         patient = {
#             "id": patient_row[0],
#             "name": patient_row[2],
#             "age": patient_row[3],
#             "weight": patient_row[4],
#             "height": patient_row[5],
#             "symptoms": patient_row[6],
#             "allergy": patient_row[7],
#             "allergydetails": patient_row[8],
#             "blood_type": patient_row[14],
#             "gender": patient_row[15],
#             "nurse_name": patient_row[16],
#             "nationality": patient_row[17],
#             "diagnoses": diagnoses  # เพิ่มข้อมูลการวินิจฉัย
#         }

#         return jsonify(patient)

#     except Exception as e:
#         print("ERROR:", str(e))
#         return jsonify({"message": f"เกิดข้อผิดพลาด: {str(e)}"}), 500



# API Endpoint สำหรับบันทึกการวินิจฉัย
@app.route('/api/diagnosis', methods=['POST'])
def save_diagnosis():
    conn = None
    cursor = None
    try:
        # รับข้อมูลจาก request
        data = request.get_json()
        if not data:
            return jsonify({'error': 'ไม่มีข้อมูลใน request'}), 400

        patient_id_input = data.get('patientId')
        main_symptom = data.get('mainSymptom')
        preliminary_diagnosis = data.get('preliminaryDiagnosis')
        treatment_plan = data.get('treatmentPlan')
        appointment = data.get('appointment') or None
        doctor_name = data.get('doctorName')

        # ตรวจสอบข้อมูลที่จำเป็น
        if not all([patient_id_input, main_symptom, preliminary_diagnosis, doctor_name]):
            return jsonify({'error': 'กรุณากรอกข้อมูลให้ครบถ้วน (patientId, mainSymptom, preliminaryDiagnosis, doctorName)'}), 400

        # เชื่อมต่อฐานข้อมูล
        conn = get_db_connection()
        cursor = conn.cursor()

        # ลองใช้ patient_id_input เป็น id_card ก่อน
        cursor.execute('SELECT id, id_card FROM patients WHERE id_card = %s', (str(patient_id_input),))
        patient = cursor.fetchone()

        if not patient:
            # ถ้าไม่พบด้วย id_card ลองใช้เป็น id
            cursor.execute('SELECT id, id_card FROM patients WHERE id = %s', (patient_id_input,))
            patient = cursor.fetchone()
            if not patient:
                return jsonify({'error': 'ไม่พบผู้ป่วยที่มี patientId นี้'}), 404

        # ได้ patient_id_card จากตาราง patients
        patient_id_card = patient[1]  # id_card จาก patients

        # บันทึกข้อมูลการวินิจฉัย
        query = """
            INSERT INTO diagnoses (patient_id, main_symptom, preliminary_diagnosis, treatment_plan, appointment, doctor_name, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        values = (
            patient_id_card,  # ใช้ id_card เป็น patient_id
            main_symptom,
            preliminary_diagnosis,
            treatment_plan,
            appointment,
            doctor_name,
            datetime.now()
        )
        cursor.execute(query, values)
        diagnosis_id = cursor.fetchone()[0]

        # Commit การเปลี่ยนแปลง
        conn.commit()

        return jsonify({
            'message': 'บันทึกการวินิจฉัยสำเร็จ',
            'diagnosisId': diagnosis_id
        }), 201

    except psycopg2.Error as err:
        print(f"ข้อผิดพลาดฐานข้อมูล: {err}")
        return jsonify({'error': f'เกิดข้อผิดพลาดในการบันทึกการวินิจฉัย: {str(err)}'}), 500
    except Exception as e:
        print(f"ข้อผิดพลาดที่ไม่คาดคิด: {e}")
        return jsonify({'error': f'เกิดข้อผิดพลาดที่ไม่คาดคิด: {str(e)}'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
@app.route('/api/patients/<string:id_card>', methods=['PUT'])
def update_patient(id_card):
    data = request.get_json()

    # กำหนดฟิลด์ที่จำเป็นต้องมี
    required_fields = ['name', 'gender', 'age', 'nationality', 'height', 'weight']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing fields in request'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # ค้นหาผู้ป่วยด้วย id_card
    cursor.execute('SELECT * FROM patients WHERE id_card = %s', (id_card,))
    patient = cursor.fetchone()

    if not patient:
        conn.close()
        return jsonify({'error': 'Patient not found'}), 404

    # อัปเดตข้อมูลผู้ป่วยในฐานข้อมูล
    cursor.execute('''
        UPDATE patients
        SET name = %s, gender = %s, age = %s, nationality = %s, height = %s, weight = %s
        WHERE id_card = %s
    ''', (
        data['name'], data['gender'], data['age'],
        data['nationality'], data['height'], data['weight'], id_card
    ))

    conn.commit()
    conn.close()

    return jsonify({'message': 'Patient updated successfully'}), 200

    

if __name__ == '__main__':
    print("Starting Flask app...")
    app.run(debug=True)