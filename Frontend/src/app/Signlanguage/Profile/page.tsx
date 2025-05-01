"use client";

import React, { useEffect, useState } from "react";
import {
  FaIdBadge,
  FaBuilding,
  FaUser,
  FaVenusMars,
  FaBirthdayCake,
  FaPhone,
  FaEnvelope,
} from "react-icons/fa";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [initialFormData, setInitialFormData] = useState<any>({});
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("กรุณาล็อกอินก่อน");
        router.push("/login");
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("ไม่สามารถดึงข้อมูลโปรไฟล์ได้");
        }

        const data = await response.json();
        const profile = data?.doctor ?? data?.nurse ?? data?.user_data ?? {};
        setUserProfile(data);
        setFormData(profile);
        setInitialFormData(profile);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchProfile();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("กรุณาล็อกอินก่อน");
      router.push("/login");
      return;
    }

    setLoading(true);

    const fieldsToUpdate = ["fullname", "gender", "birthdate", "contact_number", "email"];
    const updatedData: any = {};
    for (const field of fieldsToUpdate) {
      updatedData[field] = formData[field];
    }

    try {
      const response = await fetch("http://localhost:5000/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error("ไม่สามารถอัปเดตข้อมูลโปรไฟล์ได้");
      }

      const data = await response.json();
      const updatedProfile = data?.doctor ?? data?.nurse ?? data?.user_data ?? {};
      setUserProfile(data);
      setFormData(updatedProfile);
      setInitialFormData(updatedProfile);
      setEditing(false);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setEditing(false);
  };

  const displayValue = (value: any): string => {
    return value !== undefined && value !== null && value !== "" ? value : "ยังไม่มีข้อมูล";
  };

  const profileData =
    userProfile?.doctor ?? userProfile?.nurse ?? userProfile?.user_data ?? null;

  if (error) {
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  }

  if (!userProfile) {
    return <div className="text-center mt-10">กำลังโหลดข้อมูล...</div>;
  }

  if (!profileData) {
    return (
      <div className="text-red-600 text-center mt-10">
        ไม่พบข้อมูลผู้ใช้งานในระบบ
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 p-4">
      <div className="max-w-2xl w-full bg-white p-10 rounded-2xl shadow-2xl">
        <h1 className="text-3xl font-bold mb-8 text-blue-800 text-center">
          ข้อมูลส่วนตัว
        </h1>
        <div className="space-y-6">
          <ProfileItem icon={<FaIdBadge />} label="รหัสผู้ใช้" value={displayValue(profileData.user_id)} />
          <ProfileItem icon={<FaBuilding />} label="รหัสแผนก" value={displayValue(profileData.department_id)} />

          <ProfileItem
            icon={<FaUser />}
            label="ชื่อ-นามสกุล"
            value={
              editing ? (
                <input
                  type="text"
                  name="fullname"
                  value={formData.fullname || ""}
                  onChange={handleChange}
                  className="p-2 border rounded"
                />
              ) : (
                displayValue(profileData.fullname)
              )
            }
          />

          <ProfileItem
            icon={<FaVenusMars />}
            label="เพศ"
            value={
              editing ? (
                <select
                  name="gender"
                  value={formData.gender || ""}
                  onChange={handleChange}
                  className="p-2 border rounded"
                >
                  <option value="">เลือกเพศ</option>
                  <option value="male">ชาย</option>
                  <option value="female">หญิง</option>
                  <option value="other">อื่น ๆ</option>
                </select>
              ) : (
                displayValue(
                  profileData.gender === "male"
                    ? "ชาย"
                    : profileData.gender === "female"
                    ? "หญิง"
                    : "อื่น ๆ"
                )
              )
            }
          />

          <ProfileItem
            icon={<FaBirthdayCake />}
            label="วันเกิด"
            value={
              editing ? (
                <input
                  type="date"
                  name="birthdate"
                  value={formData.birthdate || ""}
                  onChange={handleChange}
                  className="p-2 border rounded"
                />
              ) : (
                displayValue(profileData.birthdate)
              )
            }
          />

          <ProfileItem
            icon={<FaPhone />}
            label="เบอร์โทร"
            value={
              editing ? (
                <input
                  type="tel"
                  name="contact_number"
                  value={formData.contact_number || ""}
                  onChange={handleChange}
                  className="p-2 border rounded"
                />
              ) : (
                displayValue(profileData.contact_number)
              )
            }
          />

          <ProfileItem
            icon={<FaEnvelope />}
            label="อีเมล"
            value={
              editing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  className="p-2 border rounded"
                />
              ) : (
                displayValue(profileData.email)
              )
            }
          />
        </div>

        <div className="mt-6 text-center space-x-4">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-blue-500 text-white px-6 py-2 rounded-full disabled:opacity-50"
              >
                {loading ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-400 text-white px-6 py-2 rounded-full"
              >
                ยกเลิก
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="bg-yellow-500 text-white px-6 py-2 rounded-full"
            >
              แก้ไข
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center border-b pb-3">
      <div className="flex items-center gap-2 text-gray-600 font-semibold">
        {icon}
        {label}
      </div>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}
