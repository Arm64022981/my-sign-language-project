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
import Swal from "sweetalert2";

export default function ProfilePage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    fullname: "",
    gender: "",
    birthdate: "",
    contact_number: "",
    email: "",
    department: "",
  });
  const [initialFormData, setInitialFormData] = useState<any>({});
  const [editing, setEditing] = useState(false);
  const [addingData, setAddingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const departmentNameDoctor: { [key: number]: string } = {
    1: "อายุรกรรม",
    2: "กุมารเวช",
  };

  const departmentNameNurse: { [key: number]: string } = {
    1: "ผู้ป่วยใน",
    2: "ผู้ป่วยนอก",
  };

  const mapGenderToEnglish = (gender: string) => {
    switch (gender) {
      case "ชาย":
        return "Male";
      case "หญิง":
        return "Female";
      case "อื่นๆ":
        return "Other";
      default:
        return gender;
    }
  };

  const mapGenderToThai = (gender: string) => {
    switch (gender) {
      case "Male":
        return "ชาย";
      case "Female":
        return "หญิง";
      case "Other":
        return "อื่นๆ";
      default:
        return gender;
    }
  };

  const mapRoleToThai = (role: string) => {
    switch (role) {
      case "doctor":
        return "หมอ";
      case "nurse":
        return "พยาบาล";
      default:
        return role;
    }
  };

  const formatDateToThai = (date: string): string => {
    const dateObj = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    const formattedDate = dateObj.toLocaleDateString("th-TH", options);
    return formattedDate;
  };

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
        profile.gender = mapGenderToThai(profile.gender);
        setUserProfile(data);
        setFormData(profile);
        setInitialFormData(profile);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchProfile();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (addingData) {
      if (!formData.gender) {
        setError("กรุณาเลือกเพศ");
        return false;
      }
      if (!formData.birthdate) {
        setError("กรุณากรอกวันเกิด");
        return false;
      }
      if (!formData.contact_number || !/^\d{10}$/.test(formData.contact_number)) {
        setError("กรุณากรอกเบอร์โทรให้ครบ 10 หลัก");
        return false;
      }
    } else if (editing) {
      if (!formData.fullname) {
        setError("กรุณากรอกชื่อ-นามสกุล");
        return false;
      }
      if (!formData.email) {
        setError("กรุณากรอกอีเมล");
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const token = localStorage.getItem("token");

    if (!token) {
      setError("กรุณาล็อกอินก่อน");
      router.push("/login");
      return;
    }

    setLoading(true);

    const fieldsToUpdate = addingData
      ? ["gender", "birthdate", "contact_number"]
      : ["fullname", "gender", "birthdate", "contact_number", "email"];
    const updatedData: any = {};
    for (const field of fieldsToUpdate) {
      if (field === "gender") {
        updatedData[field] = mapGenderToEnglish(formData[field]);
      } else {
        updatedData[field] = formData[field];
      }
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
        const errorData = await response.json();
        throw new Error(errorData.message || "ไม่สามารถอัปเดตข้อมูลโปรไฟล์ได้");
      }

      const data = await response.json();
      const updatedProfile = data?.doctor ?? data?.nurse ?? data?.user_data ?? {};
      updatedProfile.gender = mapGenderToThai(updatedProfile.gender);
      setUserProfile(data);
      setFormData(updatedProfile);
      setInitialFormData(updatedProfile);
      setEditing(false);
      setAddingData(false);
      setError(null);

      Swal.fire({
        title: "สำเร็จ!",
        text: "บันทึกข้อมูลสำเร็จ",
        icon: "success",
        confirmButtonText: "ตกลง",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setEditing(false);
    setAddingData(false);
    setError(null);
  };

  const displayValue = (value: any): string => {
    return value !== undefined && value !== null && value !== ""
      ? value
      : "ยังไม่มีข้อมูล";
  };

  const profileData =
    userProfile?.doctor ?? userProfile?.nurse ?? userProfile?.user_data ?? null;

  if (error && !userProfile) {
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
        {error && (
          <div className="text-red-500 text-center mb-4">{error}</div>
        )}
        <div className="space-y-6">
          <ProfileItem
            icon={<FaUser />}
            label="ชื่อ-นามสกุล"
            value={
              editing && !addingData ? (
                <input
                  type="text"
                  name="fullname"
                  value={formData.fullname || ""}
                  onChange={handleChange}
                  className="p-2 border rounded w-full"
                  placeholder="กรอกชื่อ-นามสกุล"
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
              editing || addingData ? (
                <select
                  name="gender"
                  value={formData.gender || ""}
                  onChange={handleChange}
                  className="p-2 border rounded w-full"
                >
                  <option value="">เลือกเพศ</option>
                  <option value="ชาย">ชาย</option>
                  <option value="หญิง">หญิง</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              ) : (
                displayValue(profileData.gender)
              )
            }
          />

          <ProfileItem
            icon={<FaBirthdayCake />}
            label="วันเกิด"
            value={
              editing || addingData ? (
                <input
                  type="date"
                  name="birthdate"
                  value={formData.birthdate || ""}
                  onChange={handleChange}
                  className="p-2 border rounded w-full"
                  placeholder="เลือกวันเกิด"
                />
              ) : (
                formatDateToThai(profileData.birthdate)
              )
            }
          />

          <ProfileItem
            icon={<FaPhone />}
            label="เบอร์โทร"
            value={
              editing || addingData ? (
                <input
                  type="tel"
                  name="contact_number"
                  value={formData.contact_number || ""}
                  onChange={handleChange}
                  className="p-2 border rounded w-full"
                  placeholder="กรอกเบอร์โทร 10 หลัก"
                  maxLength={10}
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
              editing && !addingData ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  className="p-2 border rounded w-full bg-gray-100"
                  disabled
                />
              ) : (
                displayValue(profileData.email)
              )
            }
          />

          <ProfileItem
            icon={<FaBuilding />}
            label="แผนก"
            value={displayValue(profileData.department)}
          />

          <ProfileItem
            icon={<FaIdBadge />}
            label="บทบาท"
            value={mapRoleToThai(profileData.role)}
          />
        </div>

        <div className="mt-6 text-center space-x-4">
          {editing || addingData ? (
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
            <>
              <button
                onClick={() => setEditing(true)}
                className="bg-yellow-500 text-white px-6 py-2 rounded-full"
              >
                แก้ไข
              </button>
              <button
                onClick={() => setAddingData(true)}
                className="bg-green-500 text-white px-6 py-2 rounded-full"
              >
                เพิ่มข้อมูล
              </button>
            </>
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
      <div className="text-gray-800">{value}</div>
    </div>
  );
}
