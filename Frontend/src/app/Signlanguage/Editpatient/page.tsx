'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Noto_Serif_Thai } from 'next/font/google';

const notoSerifThai = Noto_Serif_Thai({ subsets: ['thai'], weight: ['400', '700'] });

interface Patient {
  id_card: string;
  name: string;
  gender: string;
  age: number;
  nationality: string;
  height: number;
  weight: number;
}

export default function EditPatientPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idCard = searchParams.get('id_card');
  const [form, setForm] = useState({
    name: '',
    gender: '',
    age: '',
    nationality: '',
    height: '',
    weight: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchPatient = async () => {
      if (!idCard) {
        setError('ไม่พบรหัสผู้ป่วย');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/patients/${idCard}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          throw new Error('ไม่สามารถดึงข้อมูลผู้ป่วยได้');
        }

        const data: Patient = await res.json();
        setForm({
          name: data.name || '',
          gender: data.gender || '',
          age: data.age ? data.age.toString() : '',
          nationality: data.nationality || '',
          height: data.height ? data.height.toString() : '',
          weight: data.weight ? data.weight.toString() : '',
        });
        setError(null);
      } catch (error: any) {
        setError(error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [idCard]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // ตรวจสอบความถูกต้องของข้อมูล
    if (!form.name || !form.gender || !form.age || !form.nationality) {
      setError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    const age = parseInt(form.age);
    const height = parseFloat(form.height);
    const weight = parseFloat(form.weight);

    if (isNaN(age) || age < 0) {
      setError('กรุณากรอกอายุที่ถูกต้อง');
      return;
    }
    if (form.height && (isNaN(height) || height < 0)) {
      setError('กรุณากรอกส่วนสูงที่ถูกต้อง');
      return;
    }
    if (form.weight && (isNaN(weight) || weight < 0)) {
      setError('กรุณากรอกน้ำหนักที่ถูกต้อง');
      return;
    }

    try {
      const res = await fetch(`/api/patients/${idCard}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          gender: form.gender,
          age: age,
          nationality: form.nationality,
          height: height || 0,
          weight: weight || 0,
        }),
      });

      if (!res.ok) {
        throw new Error('ไม่สามารถอัปเดตข้อมูลได้');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/Signlanguage/PatientList');
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    }
  };

  const handleCancel = () => {
    router.push('/Signlanguage/PatientList');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-600 text-lg">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-8 ${notoSerifThai.className}`}
    >
      <div className="max-w-xl mx-auto bg-white shadow-xl rounded-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
          แก้ไขข้อมูลผู้ป่วย
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg flex items-center space-x-2">
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
            <span>บันทึกข้อมูลสำเร็จ!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              ชื่อ-นามสกุล <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="ชื่อ-นามสกุล"
              className="w-full p-3 rounded-lg bg-gray-50 text-gray-700 border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              เพศ <span className="text-red-500">*</span>
            </label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-gray-50 text-gray-700 border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
              required
            >
              <option value="">เลือกเพศ</option>
              <option value="Male">ชาย</option>
              <option value="Female">หญิง</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              อายุ (ปี) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="age"
              value={form.age}
              onChange={handleChange}
              placeholder="อายุ"
              className="w-full p-3 rounded-lg bg-gray-50 text-gray-700 border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
              required
              min="0"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              สัญชาติ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nationality"
              value={form.nationality}
              onChange={handleChange}
              placeholder="สัญชาติ"
              className="w-full p-3 rounded-lg bg-gray-50 text-gray-700 bg-gray-50 border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              ส่วนสูง (ซม.)
            </label>
            <input
              type="number"
              name="height"
              value={form.height}
              onChange={handleChange}
              placeholder="ส่วนสูง (ซม.)"
              className="w-full p-3 rounded-lg bg-gray-50 text-gray-700 border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
              min="0"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              น้ำหนัก (กก.)
            </label>
            <input
              type="number"
              name="weight"
              value={form.weight}
              onChange={handleChange}
              placeholder="น้ำหนัก (กก.)"
              className="w-full p-3 rounded-lg bg-gray-50 text-gray-700 border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
              min="0"
              step="0.1"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
