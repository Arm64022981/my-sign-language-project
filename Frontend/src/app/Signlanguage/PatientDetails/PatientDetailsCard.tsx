"use client";

import {
  User,
  Calendar,
  Stethoscope,
  Phone,
  UploadCloud,
} from "lucide-react";
import { useRef, useState } from "react";

export default function PatientDetailsCard({ patient }: { patient: any }) {
  const [imageUrl, setImageUrl] = useState(patient?.image_url || '/default-avatar.png'); // Placeholder for default image
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`http://localhost:5000/api/patients/${patient.id}/upload-image`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("อัปโหลดรูปไม่สำเร็จ");

      const data = await res.json();
      setImageUrl(data.image_url); // อัปเดต URL รูปใหม่
    } catch (error) {
      console.error("เกิดข้อผิดพลาดระหว่างอัปโหลดรูป:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-8 mt-8">
      <div className="flex items-center gap-6 mb-8">
        <div className="relative">
          <img
            src={imageUrl} // แสดงภาพจาก URL ที่ได้รับ
            alt={`รูปของ ${patient.name}`}
            className="w-24 h-24 rounded-full object-cover border border-gray-300 shadow"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow hover:bg-gray-100"
            title="เปลี่ยนรูปโปรไฟล์"
          >
            <UploadCloud className="w-5 h-5 text-blue-500" />
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            hidden
          />
        </div>

        <h1 className="text-3xl font-bold text-gray-800">
          รายละเอียดผู้ป่วย: {patient?.name}
        </h1>
      </div>

      <div className="flex items-start gap-8">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ข้อมูลส่วนตัว */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <User className="w-6 h-6 text-blue-500 mr-2" />
              ข้อมูลส่วนตัว
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li>เพศ: {patient?.gender}</li>
              <li>อายุ: {patient?.age} ปี</li>
              <li>น้ำหนัก: {patient?.weight} กก.</li>
              <li>ส่วนสูง: {patient?.height} ซม.</li>
              <li>กรุ๊ปเลือด: {patient?.blood_type}</li>
              <li>
                <Phone className="w-4 h-4 text-blue-500 inline mr-1" />
                เบอร์ฉุกเฉิน: {patient?.emergency_contact}
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
              <li>วันที่เข้าโรงพยาบาล: {patient?.admission_date}</li>
            </ul>
          </div>

          {/* ข้อมูลสุขภาพ */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Stethoscope className="w-6 h-6 text-blue-500 mr-2" />
              ข้อมูลสุขภาพ
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li>อาการ: {patient?.symptoms}</li>
              <li>แพ้ยา: {patient?.allergy}</li>
              <li>ประเภทสิ่งที่แพ้: {patient?.allergy_type}</li> 
              <li>โรคประจำตัว: {patient?.chronic_diseases}</li>
              <li>ยาที่ใช้: {patient?.medications}</li>
              <li>ประวัติการผ่าตัด: {patient?.surgery_history}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
