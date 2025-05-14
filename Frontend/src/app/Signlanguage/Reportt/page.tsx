'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import Swal from 'sweetalert2';

// Textarea Component
const Textarea = ({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    className={`w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-inner text-gray-800 text-sm placeholder-gray-400 ${className}`}
    {...props}
  />
);

// Select Component
const Select = ({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className={`w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-inner text-gray-800 text-sm ${className}`}
    {...props}
  >
    {children}
  </select>
);

const ReportIssuePage = () => {
  const router = useRouter();
  const [report, setReport] = useState({
    fullname: '',
    role: '',
    department: '',
    issueDescription: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('กรุณาล็อกอินเพื่อดำเนินการต่อ');
          setLoading(false);
          return;
        }

        const response = await fetch('http://localhost:5000/api/profile', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          setError(`ไม่สามารถดึงข้อมูลโปรไฟล์ได้: ${response.status} - ${errorText}`);
          throw new Error(`ไม่สามารถดึงข้อมูลโปรไฟล์ได้: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        // ตรวจสอบว่าเป็นข้อมูลของหมอหรือพยาบาล
        if (data.doctor) {
          setReport({
            fullname: data.doctor.fullname || 'ผู้ใช้งาน',
            role: 'หมอ',  // เปลี่ยนตรงนี้เป็น "หมอ"
            department: data.doctor.department || 'ไม่มีข้อมูลแผนก',
            issueDescription: '',
          });
        } else if (data.nurse) {
          setReport({
            fullname: data.nurse.fullname || 'ผู้ใช้งาน',
            role: 'พยาบาล',  // เปลี่ยนตรงนี้เป็น "พยาบาล"
            department: data.nurse.department || 'ไม่มีข้อมูลแผนก',
            issueDescription: '',
          });
        } else {
          setError('ไม่พบข้อมูลผู้ใช้งาน');
        }

      } catch (err) {
        setError('เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setReport({
      ...report,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setReport({
      ...report,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('กรุณาล็อกอินเพื่อดำเนินการต่อ');
        return;
      }

      const response = await fetch('http://localhost:5000/api/reports', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setError(`ไม่สามารถส่งรายงานได้: ${errorText}`);
        return;
      }

      Swal.fire({
        icon: 'success',
        title: 'ส่งรายงานสำเร็จ',
        text: 'รายงานของคุณถูกส่งเรียบร้อยแล้ว!',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#3085d6',
        background: '#f4f6fc',
        showCloseButton: true,
      });

      // รีเซ็ตแค่รายละเอียดปัญหาหลังจากส่งรายงาน
      setReport((prevReport) => ({
        ...prevReport,
        issueDescription: '', 
      }));

    } catch (err) {
      setError('เกิดข้อผิดพลาดในการส่งรายงาน');
      // ใช้ SweetAlert2 สำหรับแสดงข้อความผิดพลาด
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถส่งรายงานได้ กรุณาลองใหม่อีกครั้ง',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#d33',
        background: '#f8d7da',
        showCloseButton: true,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-100">
        <p className="text-blue-600 text-lg font-medium animate-pulse">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-100">
        <p className="text-red-600 text-lg font-medium bg-white px-6 py-4 rounded-xl shadow">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-start bg-gradient-to-br from-white to-blue-100 px-4 pt-32 pb-12">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-3xl border border-blue-100">
        <h1 className="text-4xl font-bold text-blue-800 mb-10 text-center">📋 รายงานปัญหา</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">👤 ชื่อของคุณ</label>
            <Input
              type="text"
              name="fullname"
              value={report.fullname}
              readOnly
              className="bg-transparent border-none text-gray-800 cursor-default font-medium"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">🎓 บทบาท</label>
            <Input
              type="text"
              name="role"
              value={report.role}
              readOnly
              className="bg-transparent border-none text-gray-800 cursor-default font-medium"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">🏥 แผนก</label>
            <Input
              type="text"
              name="department"
              value={report.department}
              readOnly
              className="bg-transparent border-none text-gray-800 cursor-default font-medium"
            />
          </div>

          {/* Issue Description */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">📝 รายละเอียดปัญหา</label>
            <Textarea
              name="issueDescription"
              value={report.issueDescription}
              onChange={handleChange}
              placeholder="กรุณากรอกรายละเอียดปัญหาที่พบ"
              rows={6}
              required
              className="resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-300"
            >
              ส่งรายงาน
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIssuePage;
