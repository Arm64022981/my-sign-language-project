'use client';

import { Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllPatients, deletePatient } from '@/app/lib/patients';
import Swal from 'sweetalert2';

interface Patient {
  id: number;
  name: string;
  id_card: string;
  gender: string;
  age: number;
  height: number;
  weight: number;
  nationality: string;
}

export default function PatientPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const data = await getAllPatients();
        const formattedData = data.map((patient: any) => ({
          ...patient,
          id_card: patient.id_card || '',
          height: patient.height ? parseFloat(patient.height) : 0,
          weight: patient.weight ? parseFloat(patient.weight) : 0,
          nationality: patient.nationality || 'ไม่ระบุ',
        }));
        setPatients(formattedData);
        setError(null);
      } catch (error: any) {
        setError(error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      // ใช้ SweetAlert2 แสดงข้อความยืนยันการลบ
      const result = await Swal.fire({
        title: 'ยืนยันการลบผู้ป่วย',
        text: `คุณแน่ใจหรือไม่ว่าต้องการลบผู้ป่วยรหัส ${id}? การกระทำนี้ไม่สามารถย้อนกลับได้`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ลบ',
        cancelButtonText: 'ยกเลิก',
      });

      if (result.isConfirmed) {
        await deletePatient(id.toString());
        setPatients((prev) => prev.filter((p) => p.id !== id));
        Swal.fire('ลบสำเร็จ!', 'ผู้ป่วยถูกลบออกจากระบบแล้ว', 'success');
      }
    } catch (error: any) {
      setError(error.message || 'ไม่สามารถลบผู้ป่วยได้');
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.id.toString().includes(searchTerm) ||
      patient.id_card.includes(searchTerm) ||
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.gender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.age.toString().includes(searchTerm) ||
      patient.nationality.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = genderFilter ? patient.gender === genderFilter : true;
    const matchesAge = ageFilter
      ? patient.age >= parseInt(ageFilter) && patient.age < parseInt(ageFilter) + 10
      : true;
    return matchesSearch && matchesGender && matchesAge;
  });

  if (loading) return <div className="p-8 text-gray-600 text-center">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
          รายละเอียดผู้ป่วย
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-center mb-8">
          <input
            type="text"
            placeholder="ค้นหาผู้ป่วย..."
            className="w-full max-w-lg p-3 rounded-lg bg-white text-gray-700 border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex space-x-4 mb-8">
          <select
            className="p-3 rounded-lg bg-white text-gray-700 border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
          >
            <option value="">กรองตามเพศ</option>
            <option value="Male">ชาย</option>
            <option value="Female">หญิง</option>
          </select>
          <select
            className="p-3 rounded-lg bg-white text-gray-700 border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
          >
            <option value="">กรองตามอายุ</option>
            <option value="20">อายุ 20-30</option>
            <option value="30">อายุ 30-40</option>
            <option value="40">อายุ 40-50</option>
          </select>
        </div>

        <div className="shadow-xl rounded-lg overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-gray-700">
              <thead>
                <tr className="bg-blue-800 text-white">
                  <th className="p-4 text-left font-semibold">รหัสผู้ป่วย</th>
                  <th className="p-4 text-left font-semibold">ชื่อ-นามสกุล</th>
                  <th className="p-4 text-left font-semibold">เพศ</th>
                  <th className="p-4 text-left font-semibold">อายุ</th>
                  <th className="p-4 text-left font-semibold">สัญชาติ</th>
                  <th className="p-4 text-left font-semibold">ส่วนสูง (ซม.)</th>
                  <th className="p-4 text-left font-semibold">น้ำหนัก (กก.)</th>
                  <th className="p-4 text-left font-semibold">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient, index) => (
                  <tr
                    key={patient.id}
                    className={`border-b border-gray-200 transition-colors duration-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-indigo-50`}
                  >
                    <td className="p-4 font-medium">{patient.id}</td>
                    <td className="p-4 text-blue-600 hover:underline">
                      <Link href={`/Signlanguage/PatientDetails?id_card=${patient.id_card}`}>
                        {patient.name}
                      </Link>
                    </td>
                    <td className="p-4">{patient.gender === 'Male' ? 'ชาย' : 'หญิง'}</td>
                    <td className="p-4">{patient.age}</td>
                    <td className="p-4">{patient.nationality}</td>
                    <td className="p-4">{patient.height ? patient.height.toFixed(0) : '-'}</td>
                    <td className="p-4">{patient.weight ? patient.weight.toFixed(0) : '-'}</td>
                    <td className="p-4 flex space-x-2">
                      <button
                        onClick={() => handleDelete(patient.id)}
                        className="p-2 rounded-full text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors duration-200"
                        title="ลบผู้ป่วย"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
