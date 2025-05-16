'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';

interface Diagnosis {
  id: number;
  main_symptom: string;
  preliminary_diagnosis: string;
  treatment_plan: string;
  appointment?: string;
  doctor_name: string;
  created_at: string;
}

interface Patient {
  id: number;
  id_card: string;
  name: string;
  age: number;
  weight?: number;
  height?: number;
  symptoms?: string;
  allergy?: string;
  allergy_drug?: string;
  allergy_food?: string;
  admission_date?: string;
  chronic_diseases?: string;
  medications?: string;
  surgery_history?: string;
  emergency_contact?: string;
  blood_type?: string;
  gender?: string;
  nurse_name?: string;
  nationality?: string;
  diagnosis?: Diagnosis[];
}

interface DiagnosisForm {
  mainSymptom: string;
  preliminaryDiagnosis: string;
  treatmentPlan: string;
  appointment: string;
  doctorName: string;
}

const Button = ({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={`px-4 py-2 text-sm font-medium text-white rounded-md shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Input = ({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={`w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm text-sm text-black placeholder-gray-600 ${className}`}
    {...props}
  />
);

export default function DoctorDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'diagnosed'>('all');
  const [formMessage, setFormMessage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm<DiagnosisForm>({
    defaultValues: {
      mainSymptom: '',
      preliminaryDiagnosis: '',
      treatmentPlan: '',
      appointment: '',
      doctorName: '',
    },
  });

  // ตรวจสอบ token และ redirect ถ้าไม่มี
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
    }
  }, []);

  // ดึงรายชื่อผู้ป่วยทั้งหมด
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('http://127.0.0.1:5000/api/patients', {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `ไม่สามารถดึงข้อมูลผู้ป่วยได้ (สถานะ: ${response.status})`);
        }

        const data = await response.json();
        console.log('fetchPatients response:', data);

        const mappedPatients: Patient[] = data.map((item: any) => ({
          id: item.id || 0,
          id_card: item.id_card || '',
          name: item.name || 'ไม่ระบุ',
          age: item.age || 0,
          weight: item.weight ? parseFloat(item.weight) : undefined,
          height: item.height ? parseFloat(item.height) : undefined,
          symptoms: item.symptoms || '',
          allergy: item.allergy || '',
          allergy_drug: item.allergy_drug || '',
          allergy_food: item.allergy_food || '',
          admission_date: item.admission_date || '',
          chronic_diseases: item.chronic_diseases || '',
          medications: item.medications || '',
          surgery_history: item.surgery_history || '',
          emergency_contact: item.emergency_contact || '',
          blood_type: item.blood_type || '',
          gender: item.gender || '',
          nurse_name: item.nurse_name || '',
          nationality: item.nationality || 'ไม่ระบุ',
          diagnosis: item.diagnosis || [],
        }));
        setPatients(mappedPatients);
      } catch (error: any) {
        console.error('fetchPatients error:', error);
        setError(error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ป่วย');
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  // ดึงข้อมูลผู้ป่วยตาม id_card
  const fetchPatientById = async (id_card: string) => {
    try {
      setDetailLoading(true);
      setDetailError(null);
      if (!id_card) {
        throw new Error('รหัสบัตรประชาชนไม่ถูกต้องหรือไม่พบ');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        throw new Error('ไม่พบ JWT token กรุณา login อีกครั้ง');
      }

      const response = await fetch(`http://127.0.0.1:5000/api/patients/${id_card}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          throw new Error('เซสชันหมดอายุ กรุณา login ใหม่');
        }
        throw new Error(
          errorData.message || `ไม่สามารถดึงข้อมูลผู้ป่วยได้ (สถานะ: ${response.status})`
        );
      }

      const data = await response.json();
      console.log('fetchPatientById response:', data);

      const patientData = Array.isArray(data) ? data[0] : data;

      const mappedPatient: Patient = {
        id: patientData.id ? parseInt(patientData.id) : 0,
        id_card: patientData.id_card || '',
        name: patientData.name || 'ไม่ระบุ',
        age: patientData.age ? parseInt(patientData.age) : 0,
        weight: patientData.weight ? parseFloat(patientData.weight) : undefined,
        height: patientData.height ? parseFloat(patientData.height) : undefined,
        symptoms: patientData.symptoms || '',
        allergy: patientData.allergy ? String(patientData.allergy) : '',
        allergy_drug: patientData.allergy_drug || '',
        allergy_food: patientData.allergy_food || '',
        admission_date: patientData.admission_date || '',
        chronic_diseases: patientData.chronic_diseases || '',
        medications: patientData.medications || '',
        surgery_history: patientData.surgery_history || '',
        emergency_contact: patientData.emergency_contact || '',
        blood_type: patientData.blood_type || '',
        gender: patientData.gender || '',
        nurse_name: patientData.nurse_name || '',
        nationality: patientData.nationality || 'ไม่ระบุ',
        diagnosis: patientData.diagnosis || [],
      };
      setSelectedPatient(mappedPatient);
    } catch (error: any) {
      console.error('fetchPatientById error:', error);
      setDetailError(error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ป่วย');
    } finally {
      setDetailLoading(false);
    }
  };

  // บันทึกการวินิจฉัย
  const onSubmitDiagnosis = async (data: DiagnosisForm) => {
    if (!selectedPatient) {
      setFormMessage('กรุณาเลือกผู้ป่วยก่อนบันทึกการวินิจฉัย');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        throw new Error('ไม่พบ JWT token กรุณา login อีกครั้ง');
      }

      const response = await fetch('http://127.0.0.1:5000/api/diagnosis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: selectedPatient.id_card,
          mainSymptom: data.mainSymptom,
          preliminaryDiagnosis: data.preliminaryDiagnosis,
          treatmentPlan: data.treatmentPlan,
          appointment: data.appointment || null,
          doctorName: data.doctorName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `ไม่สามารถบันทึกการวินิจฉัยได้ (สถานะ: ${response.status})`);
      }

      await Swal.fire({
        icon: 'success',
        title: 'สำเร็จ!',
        text: 'บันทึกการวินิจฉัยสำเร็จ',
        showConfirmButton: false,
        timer: 1500,
      });
      setFormMessage('บันทึกการวินิจฉัยสำเร็จ!');
      reset();
      await fetchPatientById(selectedPatient.id_card);
      setTimeout(() => {
        setFormMessage('');
      }, 3000);
    } catch (error: any) {
      console.error('onSubmitDiagnosis error:', error);
      setFormMessage(error.message || 'เกิดข้อผิดพลาดในการบันทึกการวินิจฉัย');
    }
  };

  // กรองผู้ป่วยตามการค้นหาและสถานะ
  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.age.toString().includes(searchQuery);
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'pending' && (!patient.diagnosis || patient.diagnosis.length === 0)) ||
      (filterStatus === 'diagnosed' && patient.diagnosis && patient.diagnosis.length > 0);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600 text-lg">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 px-6 pt-24">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg shadow-md">
            <span className="font-medium">ข้อผิดพลาด:</span> {error}
          </div>
        )}
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-800">จัดการข้อมูลผู้ป่วยและบันทึกการวินิจฉัย</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="ค้นหาผู้ป่วยด้วยชื่อหรืออายุ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="p-2 border border-gray-300 rounded-md bg-white text-sm text-black focus:ring-2 focus:ring-blue-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'pending' | 'diagnosed')}
          >
            <option value="all">ทั้งหมด</option>
            <option value="pending">รอวินิจฉัย</option>
            <option value="diagnosed">วินิจฉัยแล้ว</option>
          </select>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-600">
            ไม่พบผู้ป่วยที่ตรงกับเงื่อนไข
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <table className="w-full text-sm text-left">
              <thead className="bg-blue-100 text-black">
                <tr>
                  <th className="p-4">ชื่อ-นามสกุล</th>
                  <th className="p-4">อายุ</th>
                  <th className="p-4">เพศ</th>
                  <th className="p-4">สัญชาติ</th>
                  <th className="p-4">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    className={`border-b hover:bg-blue-50 ${
                      patient.id_card ? 'cursor-pointer' : 'cursor-not-allowed'
                    }`}
                    onClick={() => patient.id_card && fetchPatientById(patient.id_card)}
                    title={patient.id_card ? '' : 'ไม่มีรหัสบัตรประชาชน'}
                  >
                    <td className="p-4 text-black">{patient.name}</td>
                    <td className="p-4 text-black">{patient.age} ปี</td>
                    <td className="p-4 text-black">{patient.gender || '-'}</td>
                    <td className="p-4 text-black">{patient.nationality || '-'}</td>
                    <td className="p-4 text-black">
                      <span
                        className={`px-2 py-1 rounded-full text-xs text-black ${
                          patient.diagnosis && patient.diagnosis.length > 0
                            ? 'bg-green-100'
                            : 'bg-yellow-100'
                        }`}
                      >
                        {patient.diagnosis && patient.diagnosis.length > 0
                          ? 'วินิจฉัยแล้ว'
                          : 'รอวินิจฉัย'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {detailError && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg shadow-md">
            <span className="font-medium">ข้อผิดพลาด:</span> {detailError}
          </div>
        )}
        {detailLoading && (
          <div className="flex justify-center items-center bg-white rounded-lg shadow-md p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">กำลังโหลดรายละเอียดผู้ป่วย...</span>
          </div>
        )}
        {selectedPatient && !detailLoading && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                รายละเอียดผู้ป่วย: {selectedPatient.name}
              </h2>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">ข้อมูลส่วนตัว</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">รหัสบัตรประชาชน:</span>{' '}
                    {selectedPatient.id_card || '-'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">ชื่อ-นามสกุล:</span> {selectedPatient.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">อายุ:</span> {selectedPatient.age} ปี
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">เพศ:</span> {selectedPatient.gender || '-'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">สัญชาติ:</span> {selectedPatient.nationality}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">น้ำหนัก:</span>{' '}
                    {selectedPatient.weight ? `${selectedPatient.weight} กก.` : '-'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">ส่วนสูง:</span>{' '}
                    {selectedPatient.height ? `${selectedPatient.height} ซม.` : '-'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">กรุ๊ปเลือด:</span>{' '}
                    {selectedPatient.blood_type || '-'}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">ข้อมูลทางการแพทย์</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">อาการ:</span> {selectedPatient.symptoms || '-'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">วันที่เข้ารักษา:</span>{' '}
                    {selectedPatient.admission_date || '-'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">การแพ้:</span> {selectedPatient.allergy || '-'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">แพ้ยา:</span>{' '}
                    {selectedPatient.allergy_drug || '-'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">แพ้อาหาร:</span>{' '}
                    {selectedPatient.allergy_food || '-'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">โรคประจำตัว:</span>{' '}
                    {selectedPatient.chronic_diseases || '-'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">ยาที่ใช้:</span>{' '}
                    {selectedPatient.medications || '-'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">ประวัติการผ่าตัด:</span>{' '}
                    {selectedPatient.surgery_history || '-'}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">ข้อมูลติดต่อและการดูแล</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">ผู้ติดต่อฉุกเฉิน:</span>{' '}
                    {selectedPatient.emergency_contact || '-'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">พยาบาลผู้ดูแล:</span>{' '}
                    {selectedPatient.nurse_name || '-'}
                  </p>
                </div>
              </div>

              {selectedPatient.diagnosis && selectedPatient.diagnosis.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">ประวัติการวินิจฉัย</h3>
                  <div className="space-y-4">
                    {selectedPatient.diagnosis.map((diag) => (
                      <div key={diag.id} className="border-l-4 border-blue-500 pl-4">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">อาการสำคัญ:</span> {diag.main_symptom}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">วินิจฉัยเบื้องต้น:</span>{' '}
                          {diag.preliminary_diagnosis}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">แผนการรักษา:</span> {diag.treatment_plan}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">นัดหมาย:</span>{' '}
                          {diag.appointment || '-'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">แพทย์ผู้ตรวจ:</span> {diag.doctor_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">วันที่บันทึก:</span> {diag.created_at}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmitDiagnosis)} className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">บันทึกการวินิจฉัย</h3>
              {formMessage && (
                <p
                  className={`text-sm mb-4 ${
                    formMessage.includes('สำเร็จ') ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formMessage}
                </p>
              )}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อ-นามสกุลผู้ป่วย
                    </label>
                    <p className="text-sm text-gray-600">{selectedPatient.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">อายุ</label>
                    <p className="text-sm text-gray-600">{selectedPatient.age} ปี</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">อาการสำคัญ</label>
                  <Input {...register('mainSymptom')} placeholder="ระบุอาการสำคัญ" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วินิจฉัยเบื้องต้น
                  </label>
                  <Input
                    {...register('preliminaryDiagnosis')}
                    placeholder="ระบุการวินิจฉัยเบื้องต้น"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    แผนการรักษา / ยาที่สั่ง
                  </label>
                  <Input
                    {...register('treatmentPlan')}
                    placeholder="ระบุแผนการรักษาและยาที่สั่ง"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    การนัดหมาย / คำแนะนำเพิ่มเติม
                  </label>
                  <Input
                    {...register('appointment')}
                    placeholder="ระบุการนัดหมายหรือคำแนะนำ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อแพทย์ผู้ตรวจ
                  </label>
                  <Input {...register('doctorName')} placeholder="ระบุชื่อแพทย์" />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    บันทึกการวินิจฉัย
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}