'use client';

import { Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllPatients, deletePatient } from '@/app/lib/patients';

interface Patient {
  id: number;
  name: string;
  gender: string;
  age: number;
  height: string;
  weight: string;
}

export default function PatientPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // ดึงข้อมูลผู้ป่วยจาก API
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await getAllPatients();
        const formattedData = data.map((patient: any) => ({
          ...patient,
          height: parseFloat(patient.height),
          weight: parseFloat(patient.weight),
        }));
        setPatients(formattedData);
        setError(null);
      } catch (error: any) {
        setError(error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
      }
    };

    fetchPatients();
  }, []);

  // เปิดป๊อปอัพยืนยันการลบ
  const openDeleteModal = (id: number) => {
    setPatientToDelete(id);
    setShowModal(true);
  };

  // จัดการการลบผู้ป่วย
  const handleDelete = async () => {
    if (!patientToDelete) return;

    try {
      await deletePatient(patientToDelete);
      setPatients((prev) => prev.filter((p) => p.id !== patientToDelete));
      setShowModal(false);
      setPatientToDelete(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000); // ซ่อนหลัง 3 วินาที
    } catch (error: any) {
      setError(error.message || 'ไม่สามารถลบผู้ป่วยได้');
      setShowModal(false);
    }
  };

  // ปิดป๊อปอัพโดยไม่ลบ
  const closeModal = () => {
    setShowModal(false);
    setPatientToDelete(null);
  };

  // กรองข้อมูลผู้ป่วยตามคำค้นหา
  const filteredPatients = patients.filter(
    (patient) =>
      patient.id.toString().includes(searchTerm) ||
      patient.name.includes(searchTerm) ||
      patient.gender.includes(searchTerm) ||
      patient.age.toString().includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
          รายละเอียดผู้ป่วย
        </h1>

        {/* แสดงข้อความข้อผิดพลาด */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {/* ช่องค้นหาผู้ป่วย */}
        <div className="flex justify-center mb-8">
          <input
            type="text"
            placeholder="ค้นหาผู้ป่วย..."
            className="w-full max-w-lg p-3 rounded-lg bg-white text-gray-700 border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* กรองข้อมูลผู้ป่วย */}
        <div className="flex space-x-4 mb-8">
          <select
            className="p-3 rounded-lg bg-white text-gray-700 border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
            onChange={(e) => setSearchTerm(e.target.value)}
          >
            <option value="">กรองตามเพศ</option>
            <option value="Male">ชาย</option>
            <option value="Female">หญิง</option>
          </select>
          <select
            className="p-3 rounded-lg bg-white text-gray-700 border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
            onChange={(e) => setSearchTerm(e.target.value)}
          >
            <option value="">กรองตามอายุ</option>
            <option value="20">อายุ 20-30</option>
            <option value="30">อายุ 30-40</option>
          </select>
        </div>

        {/* ตารางแสดงข้อมูลผู้ป่วย */}
        <div className="shadow-xl rounded-lg overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-gray-700">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white">
                  <th className="p-4 text-left font-semibold">รหัสผู้ป่วย</th>
                  <th className="p-4 text-left font-semibold">ชื่อ-นามสกุล</th>
                  <th className="p-4 text-left font-semibold">เพศ</th>
                  <th className="p-4 text-left font-semibold">อายุ</th>
                  <th className="p-4 text-left font-semibold">ส่วนสูง (ซม.)</th>
                  <th className="p-4 text-left font-semibold">น้ำหนัก (กก.)</th>
                  <th className="p-4 text-left font-semibold">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient, index) => (
                  <tr
                    key={patient.id}
                    className={`border-b border-gray-200 transition-colors duration-200 ${
                      index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    } hover:bg-indigo-50`}
                  >
                    <td className="p-4 font-medium">{patient.id}</td>
                    <td className="p-4 text-blue-600 hover:underline">
                      <Link href={`/Signlanguage/PatientDetails?id=${patient.id}`}>
                        {patient.name}
                      </Link>
                    </td>
                    <td className="p-4">{patient.gender}</td>
                    <td className="p-4">{patient.age}</td>
                    <td className="p-4">{patient.height} ซม.</td>
                    <td className="p-4">{patient.weight} กก.</td>
                    <td className="p-4">
                      <button
                        onClick={() => openDeleteModal(patient.id)}
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

        {/* ป๊อปอัพยืนยันการลบ */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                ยืนยันการลบผู้ป่วย
              </h2>
              <p className="text-gray-600 mb-6">
                คุณแน่ใจหรือไม่ว่าต้องการลบผู้ป่วยรหัส {patientToDelete}? การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                >
                  ลบ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ป๊อปอัพแจ้งเตือนลบสำเร็จ */}
        {showSuccess && (
          <div className="fixed inset-0 flex items-center justify-center z-50 animate-[fade-in_0.3s_ease-out,scale-in_0.3s_ease-out]">
            <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 max-w-sm">
              <div className="bg-green-100 rounded-full p-1 animate-[scale-in_0.3s_ease-out]">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className="text-base font-medium">ลบสำเร็จ</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
