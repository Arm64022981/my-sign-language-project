# routes/patients.py
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from database import get_db_connection
from datetime import datetime
import traceback

patients_bp = Blueprint('patients', __name__)

@patients_bp.route('/api/patients', methods=['POST'])
@jwt_required()
def add_patient():
    data = request.get_json()
    print("DATA RECEIVED:", data)

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        admission_date = datetime.strptime(data['admission_date'], '%Y-%m-%d').date() if data.get('admission_date') else None
        allergy = data.get('allergy')
        if isinstance(allergy, str):
            allergy = allergy.lower() == 'true'

        query = """
            INSERT INTO patients (
                id_card, name, age, weight, height, symptoms, allergy, allergy_drug, allergy_food,
                admission_date, chronic_diseases, medications, surgery_history,
                emergency_contact, blood_type, gender, nurse_name, nationality
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id_card) DO UPDATE SET
                name = EXCLUDED.name,
                age = EXCLUDED.age,
                weight = EXCLUDED.weight,
                height = EXCLUDED.height,
                symptoms = EXCLUDED.symptoms,
                allergy = EXCLUDED.allergy,
                allergy_drug = EXCLUDED.allergy_drug,
                allergy_food = EXCLUDED.allergy_food,
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
            data['id_card'], data['name'], data['age'], data['weight'], data['height'],
            data['symptoms'], allergy, data.get('allergy_drug', ''), data.get('allergy_food', ''),
            admission_date, data.get('chronic_diseases', ''), data.get('medications', ''),
            data.get('surgery_history', ''), data.get('emergency_contact', ''), data.get('blood_type', ''),
            data.get('gender', ''), data.get('nurse_name', ''), data.get('nationality', '')
        ))

        conn.commit()
        return jsonify({"message": "บันทึกข้อมูลสำเร็จ"}), 201

    except Exception as e:
        print("ERROR:", str(e))
        traceback.print_exc()
        conn.rollback()
        return jsonify({"message": f"เกิดข้อผิดพลาด: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

@patients_bp.route('/api/patients', methods=['GET'])
def get_all_patients():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, id_card, name, gender, age, height, weight, nationality FROM patients")
        rows = cursor.fetchall()
        patients = [
            {
                "id": row[0], "id_card": row[1], "name": row[2], "gender": row[3],
                "age": row[4], "height": row[5], "weight": row[6], "nationality": row[7],
            } for row in rows
        ]
        cursor.close()
        conn.close()
        return jsonify(patients)
    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({"error": f"เกิดข้อผิดพลาด: {str(e)}"}), 500

@patients_bp.route('/api/patients/<string:id_card>', methods=['GET'])
@jwt_required()
def get_patient(id_card):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, id_card, name, age, weight, height, symptoms, allergy, allergy_drug, allergy_food,
                   admission_date, chronic_diseases, medications, surgery_history,
                   emergency_contact, blood_type, gender, nurse_name, nationality
            FROM patients WHERE id_card = %s
        """, (id_card,))
        row = cursor.fetchone()

        if not row:
            cursor.close()
            conn.close()
            return jsonify({"message": "ไม่พบผู้ป่วย"}), 404

        patient = {
            "id": str(row[0]), "id_card": row[1], "name": row[2], "age": row[3],
            "weight": row[4], "height": row[5], "symptoms": row[6], "allergy": row[7],
            "allergy_drug": row[8], "allergy_food": row[9], "admission_date": str(row[10]) if row[10] else None,
            "chronic_diseases": row[11], "medications": row[12], "surgery_history": row[13],
            "emergency_contact": row[14], "blood_type": row[15], "gender": row[16],
            "nurse_name": row[17], "nationality": row[18]
        }

        cursor.execute("""
            SELECT patient_id, main_symptom, preliminary_diagnosis, treatment_plan, appointment, doctor_name, created_at
            FROM diagnoses WHERE patient_id = %s ORDER BY created_at DESC LIMIT 1
        """, (id_card,))
        diagnosis = cursor.fetchone()

        if diagnosis:
            patient["diagnosis"] = {
                "patient_id": diagnosis[0], "main_symptom": diagnosis[1], "preliminary_diagnosis": diagnosis[2],
                "treatment_plan": diagnosis[3], "appointment": diagnosis[4], "doctor_name": diagnosis[5],
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

@patients_bp.route('/api/patients/<string:id_card>', methods=['PUT'])
@jwt_required()
def update_patient(id_card):
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "ไม่มีข้อมูลใน request"}), 400

        allergy = data.get('allergy')
        if isinstance(allergy, str):
            allergy = allergy.lower() == 'true'
        if allergy and not (data.get('allergy_drug') or data.get('allergy_food')):
            return jsonify({"error": "กรุณาระบุแพ้ยาหรือแพ้อาหารอย่างน้อยหนึ่งรายการเมื่อเลือกแพ้"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM patients WHERE id_card = %s", (id_card,))
        patient = cursor.fetchone()
        if not patient:
            cursor.close()
            conn.close()
            return jsonify({"error": "ไม่พบผู้ป่วยที่มีเลขบัตรประชาชนนี้"}), 404

        admission_date = None
        if data.get('admission_date'):
            try:
                admission_date = datetime.strptime(data['admission_date'], '%Y-%m-%d').date()
            except ValueError:
                cursor.close()
                conn.close()
                return jsonify({"error": "รูปแบบวันที่ไม่ถูกต้อง ต้องเป็น YYYY-MM-DD"}), 400

        query = """
            UPDATE patients
            SET
                name = %s, age = %s, weight = %s, height = %s, symptoms = %s, allergy = %s,
                allergy_drug = %s, allergy_food = %s, admission_date = %s, chronic_diseases = %s,
                medications = %s, surgery_history = %s, emergency_contact = %s, blood_type = %s,
                gender = %s, nurse_name = %s, nationality = %s
            WHERE id_card = %s
        """
        values = (
            data.get('name', ''), data.get('age', 0), data.get('weight', 0), data.get('height', 0),
            data.get('symptoms', ''), allergy, data.get('allergy_drug', ''), data.get('allergy_food', ''),
            admission_date, data.get('chronic_diseases', ''), data.get('medications', ''),
            data.get('surgery_history', ''), data.get('emergency_contact', ''), data.get('blood_type', ''),
            data.get('gender', ''), data.get('nurse_name', ''), data.get('nationality', ''), id_card
        )

        cursor.execute(query, values)
        conn.commit()

        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({"error": "ไม่สามารถอัปเดตข้อมูลได้"}), 500

        cursor.close()
        conn.close()
        return jsonify({"message": "อัปเดตข้อมูลผู้ป่วยสำเร็จ"}), 200

    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()
        conn.rollback()
        return jsonify({"error": f"เกิดข้อผิดพลาด: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

@patients_bp.route('/api/patients/<int:id>', methods=['DELETE'])
def delete_patient(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM patients WHERE id = %s", (id,))
        conn.commit()

        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({"message": "ไม่พบผู้ป่วยที่ต้องการลบ"}), 404

        cursor.close()
        conn.close()
        return jsonify({"message": "ลบข้อมูลผู้ป่วยสำเร็จ"}), 200
    except Exception as e:
        print("ERROR:", str(e))
        traceback.print_exc()
        return jsonify({"message": f"เกิดข้อผิดพลาด: {str(e)}"}), 500