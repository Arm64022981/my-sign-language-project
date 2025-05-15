'use client';

import {
  User,
  Calendar,
  Stethoscope,
  Phone,
  FileText,
  Edit2,
} from 'lucide-react';
import Link from 'next/link';

export default function PatientDetailsCard({ patient }: { patient: any }) {
  // ฟังก์ชันช่วยจัดการวันที่ให้อยู่ในรูปแบบที่อ่านง่าย
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  // ฟังก์ชัน parse allergy_details
  const parseAllergyDetails = (allergyDetails: string | null) => {
    try {
      if (!allergyDetails) return { drug: '-', food: '-' };
      const parsed = JSON.parse(allergyDetails);
      return {
        drug: parsed.drug || '-',
        food: parsed.food || '-',
      };
    } catch {
      return { drug: '-', food: '-' };
    }
  };

  // ตรวจสอบว่า patient มีข้อมูลหรือไม่
  const hasPatientData = patient && Object.keys(patient).length > 0;

  // จัดการรหัสบัตรประชาชน
  const idCardValue = patient?.id_card || '-';

  // Parse allergy_details
  const allergyDetails = parseAllergyDetails(patient?.allergy_details);

  // ดีบักข้อมูล patient
  console.log('Patient data:', patient);
  console.log('Value of patient.id:', patient?.id);
  console.log('Value of patient.id_card:', patient?.id_card);
  console.log('Value of patient.diagnosis.patient_id:', patient?.diagnosis?.patient_id);
  console.log('Allergy details:', allergyDetails);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">
            รายละเอียดผู้ป่วย: {hasPatientData ? patient.name || 'ไม่ระบุ' : 'ไม่ระบุ'}
          </h1>
          {hasPatientData && idCardValue && idCardValue !== '-' && (
            <Link
              href={`/Signlanguage/PatientHistoryForm?id_card=${idCardValue}&edit=true`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors duration-200"
              title="แก้ไขข้อมูลผู้ป่วย"
            >
              <Edit2 size={20} />
              แก้ไขข้อมูล
            </Link>
          )}
        </div>

        {!hasPatientData ? (
          <div className="p-6 bg-white rounded-lg shadow-md text-center text-gray-600">
            ไม่พบข้อมูลผู้ป่วย
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ข้อมูลส่วนตัว */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <User className="w-6 h-6 text-blue-500 mr-2" />
                ข้อมูลส่วนตัว
              </h2>
              {idCardValue === '-' && (
                <div className="mb-4 p-3 bg-yellow-100 rounded-md text-yellow-800 text-sm">
                  <p>Debug: ไม่พบรหัสบัตรประชาชนในข้อมูล</p>
                  <p>ฟิลด์ที่มี: {patient ? Object.keys(patient).join(', ') : 'ไม่มีข้อมูล'}</p>
                </div>
              )}
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <FileText className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="font-medium">รหัสบัตรประชาชน:</span> {idCardValue}
                </li>
                <li>
                  <span className="font-medium">เพศ:</span> {patient.gender || '-'}
                </li>
                <li>
                  <span className="font-medium">อายุ:</span> {patient.age ? `${patient.age} ปี` : '-'}
                </li>
                <li>
                  <span className="font-medium">น้ำหนัก:</span> {patient.weight ? `${patient.weight} กก.` : '-'}
                </li>
                <li>
                  <span className="font-medium">ส่วนสูง:</span> {patient.height ? `${patient.height} ซม.` : '-'}
                </li>
                <li>
                  <span className="font-medium">กรุ๊ปเลือด:</span> {patient.blood_type || '-'}
                </li>
                <li>
                  <span className="font-medium">สัญชาติ:</span> {patient.nationality || '-'}
                </li>
                <li className="flex items-center">
                  <Phone className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="font-medium">เบอร์ฉุกเฉิน:</span> {patient.emergency_contact || '-'}
                </li>
                <li>
                  <span className="font-medium">ผู้บันทึกข้อมูล:</span> {patient.nurse_name || '-'}
                </li>
              </ul>
            </div>

            {/* ข้อมูลการแอดมิท */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Calendar className="w-6 h-6 text-blue-500 mr-2" />
                ข้อมูลการแอดมิท
              </h2>
              <ul className="space-y-3 text-gray-700">
                <li>
                  <span className="font-medium">วันที่เข้าโรงพยาบาล:</span> {formatDate(patient.admission_date)}
                </li>
              </ul>
            </div>

            {/* ข้อมูลสุขภาพ */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Stethoscope className="w-6 h-6 text-blue-500 mr-2" />
                ข้อมูลสุขภาพ
              </h2>
              <ul className="space-y-3 text-gray-700">
                <li>
                  <span className="font-medium">อาการ:</span> {patient.symptoms || '-'}
                </li>
                <li>
                  <span className="font-medium">แพ้ยา:</span> {patient.allergy ? 'แพ้' : 'ไม่แพ้'}
                </li>
                {patient.allergy && (
                  <>
                    <li>
                      <span className="font-medium">แพ้ยา:</span> {allergyDetails.drug}
                    </li>
                    <li>
                      <span className="font-medium">แพ้อาหาร:</span> {allergyDetails.food}
                    </li>
                  </>
                )}
                <li>
                  <span className="font-medium">โรคประจำตัว:</span> {patient.chronic_diseases || '-'}
                </li>
                <li>
                  <span className="font-medium">ยาที่ใช้:</span> {patient.medications || '-'}
                </li>
                <li>
                  <span className="font-medium">ประวัติการผ่าตัด:</span> {patient.surgery_history || '-'}
                </li>
              </ul>
            </div>

            {/* ข้อมูลการวินิจฉัย */}
            <div className="bg-white p-6 rounded-lg shadow-md md:col-span-3">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <FileText className="w-6 h-6 text-blue-500 mr-2" />
                ข้อมูลการวินิจฉัย
              </h2>
              {patient.diagnosis ? (
                <ul className="space-y-3 text-gray-700">
                  <li>
                    <span className="font-medium">รหัสบัตรประชาชนผู้ป่วย:</span> {patient.diagnosis.patient_id || '-'}
                  </li>
                  <li>
                    <span className="font-medium">อาการสำคัญ:</span> {patient.diagnosis.main_symptom || '-'}
                  </li>
                  <li>
                    <span className="font-medium">วินิจฉัยเบื้องต้น:</span> {patient.diagnosis.preliminary_diagnosis || '-'}
                  </li>
                  <li>
                    <span className="font-medium">แผนการรักษา:</span> {patient.diagnosis.treatment_plan || '-'}
                  </li>
                  <li>
                    <span className="font-medium">การนัดหมาย:</span> {formatDate(patient.diagnosis.appointment)}
                  </li>
                  <li>
                    <span className="font-medium">แพทย์ผู้ตรวจ:</span> {patient.diagnosis.doctor_name || '-'}
                  </li>
                  <li>
                    <span className="font-medium">วันที่บันทึก:</span> {formatDate(patient.diagnosis.created_at)}
                  </li>
                </ul>
              ) : (
                <p className="text-gray-700">ยังไม่มีข้อมูลการวินิจฉัย</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}