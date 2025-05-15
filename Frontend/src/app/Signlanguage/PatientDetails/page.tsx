'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import PatientDetailsCard from './PatientDetailsCard';

export default function PatientDetailsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id_card = searchParams.get('id_card') || '';
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!id_card) {
        setError('ไม่พบรหัสบัตรประชาชนใน URL');
        setLoading(false);
        return;
      }

      if (!id_card.match(/^\d{13}$/)) {
        setError('รหัสบัตรประชาชนไม่ถูกต้อง ต้องเป็นเลข 13 หลัก');
        setLoading(false);
        return;
      }

      try {
        let token = localStorage.getItem('token');
        if (!token) {
          token = await refreshToken();
          if (!token) {
            throw new Error('กรุณาล็อกอินใหม่');
          }
        }

        const response = await fetch(`http://localhost:5000/api/patients/${id_card}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || errorData.error || 'โหลดข้อมูลผู้ป่วยไม่สำเร็จ';
          if (response.status === 401) {
            throw new Error('การยืนยันตัวตนล้มเหลว กรุณาล็อกอินใหม่');
          } else if (response.status === 404) {
            throw new Error('ไม่พบผู้ป่วยที่มีรหัสบัตรประชาชนนี้');
          }
          throw new Error(`[${response.status}] ${errorMessage}`);
        }

        const data = await response.json();
        setPatient(data);
        setError(null);
      } catch (error) {
        console.error('เกิดข้อผิดพลาด:', error);
        const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
        setError(errorMessage);
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: errorMessage,
          showConfirmButton: true,
        });
        if (errorMessage.includes('การยืนยันตัวตนล้มเหลว')) {
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    const refreshToken = async () => {
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) return null;

        const response = await fetch('http://localhost:5000/api/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        const data = await response.json();
        if (response.ok) {
          localStorage.setItem('token', data.access_token);
          return data.access_token;
        }
        return null;
      } catch {
        return null;
      }
    };

    fetchPatientData();
  }, [id_card, router]);

  if (loading) return <div className="p-8 text-lg">กำลังโหลดข้อมูลผู้ป่วย...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!patient) return <div className="p-8 text-red-500">ไม่พบข้อมูลผู้ป่วย</div>;

  return <PatientDetailsCard patient={patient} />;
}