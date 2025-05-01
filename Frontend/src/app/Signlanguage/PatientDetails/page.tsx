"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PatientDetailsCard from "./PatientDetailsCard"; 

export default function PatientDetailsPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetch(`http://localhost:5000/api/patients/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error("โหลดข้อมูลผู้ป่วยไม่สำเร็จ");
          return res.json();
        })
        .then((data) => {
          setPatient(data);
        })
        .catch((error) => {
          console.error("เกิดข้อผิดพลาด:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) return <div className="p-8 text-lg">กำลังโหลดข้อมูลผู้ป่วย...</div>;

  if (!patient) return <div className="p-8 text-red-500">ไม่พบข้อมูลผู้ป่วย</div>;

  return <PatientDetailsCard patient={patient} />;
}
