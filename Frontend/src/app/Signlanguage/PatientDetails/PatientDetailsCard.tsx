"use client";

import {
  User,
  Calendar,
  Stethoscope,
  Phone,
  FileText,
} from "lucide-react";

export default function PatientDetailsCard({ patient }: { patient: any }) {
  // ฟังก์ชันช่วยවිธีจัดการวันที่ให้อยู่ในรูปแบบที่อ่านง่าย
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-8 mt-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mt-12">
          รายละเอียดผู้ป่วย: {patient?.name || "ไม่ระบุ"}
        </h1>
      </div>

      <div className="flex items-start gap-8">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ข้อมูลส่วนตัว */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-43xl mb-4 flex items-center">
              <User className="w-6 h-6 text-blue-500 mr-2" />
              ข้อมูลส่วนตัว
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li>เพศ: {patient?.gender || '-'}</li>
              <li>อายุ: {patient?.age ? `${patient.age} ปี` : '-'}</li>
              <li>น้ำหนัก: {patient?.weight ? `${patient.weight} กก.` : '-'}</li>
              <li>ส่วนสูง: {patient?.height ? `${patient.height} ซม.` : '-'}</li>
              <li>กรุ๊ปเลือด: {patient?.blood_type || '-'}</li>
              <li>สัญชาติ: {patient?.nationality || '-'}</li>
              <li>
                <Phone className="w-4 h-4 text-blue-500 inline mr-1" />
                เบอร์ฉุกเฉิน: {patient?.emergency_contact || '-'}
              </li>
              <li>ผู้บันทึกข้อมูล: {patient?.nurse_name || '-'}</li>
            </ul>
          </div>

          {/* ข้อมูลการแอดมิท */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Calendar className="w-6 h-6 text-blue-500 mr-2" />
              ข้อมูลการแอดมิท
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li>วันที่เข้าโรงพยาบาล: {formatDate(patient?.admission_date)}</li>
            </ul>
          </div>

          {/* ข้อมูลสุขภาพ */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Stethoscope className="w-6 h-6 text-blue-500 mr-2" />
              ข้อมูลสุขภาพ
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li>อาการ: {patient?.symptoms || '-'}</li>
              <li>แพ้ยา: {patient?.allergy || '-'}</li>
              <li>ประเภทสิ่งที่แพ้: {patient?.allergydetails || '-'}</li>
              <li>โรคประจำตัว: {patient?.chronic_diseases || '-'}</li>
              <li>ยาที่ใช้: {patient?.medications || '-'}</li>
              <li>ประวัติการผ่าตัด: {patient?.surgery_history || '-'}</li>
            </ul>
          </div>

          {/* ข้อมูลการวินิจฉัย */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FileText className="w-6 h-6 text-blue-500 mr-2" />
              ข้อมูลการวินิจฉัย
            </h2>
            {patient?.diagnosis ? (
              <ul className="space-y-3 text-gray-700">
                <li>รหัสบัตรประชาชนผู้ป่วย: {patient.diagnosis.patient_id || '-'}</li>
                <li>อาการสำคัญ: {patient.diagnosis.main_symptom || '-'}</li>
                <li>วินิจฉัยเบื้องต้น: {patient.diagnosis.preliminary_diagnosis || '-'}</li>
                <li>แผนการรักษา: {patient.diagnosis.treatment_plan || '-'}</li>
                <li>การนัดหมาย: {formatDate(patient.diagnosis.appointment)}</li>
                <li>แพทย์ผู้ตรวจ: {patient.diagnosis.doctor_name || '-'}</li>
                <li>วันที่บันทึก: {formatDate(patient.diagnosis.created_at)}</li>
              </ul>
            ) : (
              <p className="text-gray-700">ยังไม่มีข้อมูลการวินิจฉัย</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}