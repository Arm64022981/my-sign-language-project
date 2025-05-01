"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const ReportIssuePage = () => {
  const [report, setReport] = useState({
    name: "",
    role: "หมอ", // ค่าเริ่มต้นที่แสดงใน dropdown
    issueDescription: "",
  });

  const [userData, setUserData] = useState({
    name: "",
    role: "หมอ",
  });

  // ดึงข้อมูลจาก localStorage เมื่อหน้าโหลด
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userType = localStorage.getItem("user_type");

    if (token && userType) {
      // สมมติว่ามีชื่อผู้ใช้ที่ดึงจาก API หรือจากข้อมูลที่ล็อกอิน
      setUserData({
        name: "ผู้ใช้งาน", // ใช้ข้อมูลชื่อจริงจากระบบที่ดึงมา
        role: userType === "1" ? "หมอ" : "พยาบาล", // สมมติว่า user_type 1 = หมอ และ 2 = พยาบาล
      });
      setReport({
        name: "ผู้ใช้งาน", // ค่าเริ่มต้นชื่อผู้ใช้
        role: userType === "1" ? "หมอ" : "พยาบาล", // แสดงบทบาทตาม user_type
        issueDescription: "",
      });
    }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Report Submitted:", report);
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-gray-100">
      <div className="bg-white p-8 shadow-lg rounded-lg w-full max-w-3xl">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6 text-center">รายงานปัญหา</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">ชื่อของคุณ</label>
            <input
              type="text"
              name="name"
              value={report.name}
              onChange={handleChange}
              className="mt-2 p-2 w-full border border-gray-300 rounded-md text-black"
              placeholder="กรอกชื่อ"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">บทบาท</label>
            <select
              name="role"
              value={report.role}
              onChange={handleSelectChange}
              className="mt-2 p-2 w-full border border-gray-300 rounded-md text-black"
            >
              <option value="หมอ">หมอ</option>
              <option value="พยาบาล">พยาบาล</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700">รายละเอียดปัญหา</label>
            <textarea
              name="issueDescription"
              value={report.issueDescription}
              onChange={handleChange}
              className="mt-2 p-2 w-full border border-gray-300 rounded-md text-black"
              placeholder="กรอกรายละเอียดปัญหาที่พบ"
              rows={4}
              required
            />
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-blue-500 text-white py-2 px-6 rounded hover:bg-blue-600"
            >
              ส่งรายงาน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIssuePage;
