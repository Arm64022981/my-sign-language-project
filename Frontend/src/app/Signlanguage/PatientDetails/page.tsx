"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PatientDetailsCard from "./PatientDetailsCard";

export default function PatientDetailsPage() {
  const searchParams = useSearchParams();
  const id_card = searchParams.get("id_card"); // เปลี่ยนจาก id เป็น id_card

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // เพิ่ม state สำหรับ error

  useEffect(() => {
    if (id_card) {
      fetch(`http://localhost:5000/api/patients/${id_card}`)
        .then((res) => {
          if (!res.ok) throw new Error("โหลดข้อมูลผู้ป่วยไม่สำเร็จ");
          return res.json();
        })
        .then((data) => {
          setPatient(data);
          setError(null);
        })
        .catch((error) => {
          console.error("เกิดข้อผิดพลาด:", error);
          setError(error.message);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setError("ไม่พบรหัสบัตรประชาชน");
      setLoading(false);
    }
  }, [id_card]);

  if (loading) return <div className="p-8 text-lg">กำลังโหลดข้อมูลผู้ป่วย...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!patient) return <div className="p-8 text-red-500">ไม่พบข้อมูลผู้ป่วย</div>;

  return <PatientDetailsCard patient={patient} />;
}