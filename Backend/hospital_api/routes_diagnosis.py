# routes/diagnosis.py
from flask import Blueprint, jsonify, request
from database import get_db_connection
from datetime import datetime
import psycopg2

diagnosis_bp = Blueprint('diagnosis', __name__)

@diagnosis_bp.route('/api/diagnosis', methods=['POST'])
def save_diagnosis():
    conn = None
    cursor = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'ไม่มีข้อมูลใน request'}), 400

        patient_id_input = data.get('patientId')
        main_symptom = data.get('mainSymptom')
        preliminary_diagnosis = data.get('preliminaryDiagnosis')
        treatment_plan = data.get('treatmentPlan')
        appointment = data.get('appointment') or None
        doctor_name = data.get('doctorName')

        if not all([patient_id_input, main_symptom, preliminary_diagnosis, doctor_name]):
            return jsonify({'error': 'กรุณากรอกข้อมูลให้ครบถ้วน (patientId, mainSymptom, preliminaryDiagnosis, doctorName)'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('SELECT id, id_card FROM patients WHERE id_card = %s', (str(patient_id_input),))
        patient = cursor.fetchone()

        if not patient:
            cursor.execute('SELECT id, id_card FROM patients WHERE id = %s', (patient_id_input,))
            patient = cursor.fetchone()
            if not patient:
                return jsonify({'error': 'ไม่พบผู้ป่วยที่มี patientId นี้'}), 404

        patient_id_card = patient[1]

        query = """
            INSERT INTO diagnoses (patient_id, main_symptom, preliminary_diagnosis, treatment_plan, appointment, doctor_name, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        values = (
            patient_id_card, main_symptom, preliminary_diagnosis, treatment_plan,
            appointment, doctor_name, datetime.now()
        )
        cursor.execute(query, values)
        diagnosis_id = cursor.fetchone()[0]

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