# routes/reports.py
from flask import Blueprint, jsonify, request
from database import get_db_connection

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/api/reports', methods=['POST'])
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
    try:
        cursor.execute(
            """
            INSERT INTO reports (fullname, role, department, issue_description)
            VALUES (%s, %s, %s, %s)
            """,
            (fullname, role, department, issue_description)
        )
        connection.commit()
        return jsonify({"message": "รายงานได้รับการส่งเรียบร้อยแล้ว"}), 200
    except Exception as e:
        connection.rollback()
        return jsonify({"error": f"เกิดข้อผิดพลาด: {str(e)}"}), 500
    finally:
        cursor.close()
        connection.close()