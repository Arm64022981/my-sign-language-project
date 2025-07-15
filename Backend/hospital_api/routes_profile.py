# routes/profile.py
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db_connection
import re
from datetime import datetime
import logging

profile_bp = Blueprint('profile', __name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@profile_bp.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    email = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute('SELECT * FROM doctors WHERE email = %s', (email,))
        doctor = cur.fetchone()

        if doctor:
            doctor_data = {
                "id": doctor[0], "user_id": doctor[1], "department_id": doctor[2],
                "fullname": doctor[3], "gender": doctor[4],
                "birthdate": doctor[5].strftime('%Y-%m-%d') if doctor[5] else None,
                "contact_number": doctor[6], "email": doctor[7],
                "department": doctor[9], "role": doctor[10]
            }
            cur.close()
            conn.close()
            return jsonify({"doctor": doctor_data}), 200

        cur.execute('SELECT * FROM nurses WHERE email = %s', (email,))
        nurse = cur.fetchone()

        if nurse:
            nurse_data = {
                "id": nurse[0], "user_id": nurse[1], "department_id": nurse[2],
                "fullname": nurse[3], "gender": nurse[4],
                "birthdate": nurse[5].strftime('%Y-%m-%d') if nurse[5] else None,
                "contact_number": nurse[6], "email": nurse[7],
                "department": nurse[9], "role": nurse[10]
            }
            cur.close()
            conn.close()
            return jsonify({"nurse": nurse_data}), 200

        cur.close()
        conn.close()
        return jsonify({"message": "User not found"}), 404

    except Exception as e:
        cur.close()
        conn.close()
        logger.error(f"Error fetching profile for email: {email}, error: {str(e)}")
        return jsonify({"message": f"เกิดข้อผิดพลาด: {str(e)}"}), 500

@profile_bp.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    email = get_jwt_identity()
    data = request.get_json()

    if not data:
        logger.warning(f"Empty request body for email: {email}")
        return jsonify({"message": "ไม่มีข้อมูลสำหรับอัปเดต"}), 400

    allowed_fields = ['fullname', 'gender', 'birthdate', 'contact_number', 'email']
    update_data = {k: v for k, v in data.items() if k in allowed_fields}

    if not update_data:
        logger.warning(f"No valid fields provided for email: {email}")
        return jsonify({"message": "ไม่มีฟิลด์ที่อนุญาตให้อัปเดต"}), 400

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
                "id": updated_doctor[0], "user_id": updated_doctor[1], "department_id": updated_doctor[2],
                "fullname": updated_doctor[3], "gender": updated_doctor[4],
                "birthdate": updated_doctor[5].strftime('%Y-%m-%d') if updated_doctor[5] else None,
                "contact_number": updated_doctor[6], "email": updated_doctor[7],
                "department": updated_doctor[9], "role": updated_doctor[10]
            }
            logger.info(f"Profile updated successfully for doctor: {email}")
            cur.close()
            conn.close()
            return jsonify({"doctor": doctor_data}), 200

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
                "id": updated_nurse[0], "user_id": updated_nurse[1], "department_id": updated_nurse[2],
                "fullname": updated_nurse[3], "gender": updated_nurse[4],
                "birthdate": updated_nurse[5].strftime('%Y-%m-%d') if updated_nurse[5] else None,
                "contact_number": updated_nurse[6], "email": updated_nurse[7],
                "department": updated_nurse[9], "role": updated_nurse[10]
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