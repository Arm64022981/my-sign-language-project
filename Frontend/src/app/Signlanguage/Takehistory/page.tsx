'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import history from '@/public/history.jpg';

// Input Component
const Input = ({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={`w-full p-1 border border-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm text-black text-sm ${className}`}
    {...props}
  />
);

// Checkbox Component
const Checkbox = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
  <label className='flex items-center space-x-2 text-black text-sm'>
    <input
      type='checkbox'
      checked={checked}
      onChange={onChange}
      className='w-4 h-4 text-blue-500 rounded focus:ring-blue-500'
    />
    <span>{label}</span>
  </label>
);

// Select Component
const Select = ({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className={`w-full p-1 border border-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm text-black text-sm ${className}`}
    {...props}
  >
    {children}
  </select>
);

// Button Component
const Button = ({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={`px-3 py-1 text-sm text-white rounded-md shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all ${className}`}
    {...props}
  >
    {children}
  </button>
);

// Form Component
type PatientForm = {
  name: string;
  age: number;
  weight: number;
  height: number;
  symptoms: string;
  allergy: 'แพ้' | 'ไม่แพ้' | '';
  allergyDetails?: string;
  admissionDate: string;
  chronicDiseases?: string;
  medications?: string;
  surgeryHistory?: string;
  emergencyContact?: string;
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  gender?: 'ชาย' | 'หญิง' | 'อื่น ๆ';
};

export default function PatientHistoryForm() {
  const { register, handleSubmit, control, reset, setValue } = useForm<PatientForm>({
    defaultValues: {
      name: '',
      age: 30,
      weight: 0,
      height: 0,
      symptoms: '',
      allergy: '',
      allergyDetails: '',
      admissionDate: format(new Date(), 'yyyy-MM-dd'),
      chronicDiseases: '',
      medications: '',
      surgeryHistory: '',
      emergencyContact: '',
      bloodType: undefined,
      gender: undefined,
    },
  });

  const router = useRouter();
  const [allergyValue, setAllergyValue] = useState<'แพ้' | 'ไม่แพ้' | ''>('');
  const [showAllergyDetails, setShowAllergyDetails] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let mediaStream: MediaStream;

    if (isCameraOn) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          mediaStream = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((error) => {
          console.error('Error accessing webcam:', error);
          alert('ไม่สามารถเปิดกล้องได้');
          setIsCameraOn(false);
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraOn]);

  const toggleCamera = () => {
    setIsCameraOn((prevState) => !prevState);
  };

  const onSubmit = async (data: PatientForm) => {
    console.log('ข้อมูลผู้ป่วย:', data);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000); // ซ่อนหลัง 3 วินาที
        reset();
      } else {
        alert(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
  };

  const handleAllergyChange = (value: 'แพ้' | 'ไม่แพ้') => {
    setAllergyValue(value);
    setValue('allergy', value);
    if (value === 'แพ้') {
      setShowAllergyDetails(true);
    } else {
      setShowAllergyDetails(false);
      setValue('allergyDetails', '');
    }
  };

  return (
    <div
      className='min-h-screen flex items-start justify-center px-4 py-40'
      style={{
        backgroundImage: `url(${history.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className='flex w-full max-w-6xl gap-4'>
        {/* กล่องซ้าย */}
        <div className='w-9/15 bg-white/80 backdrop-blur-lg rounded-lg shadow-lg p-4 max-h-[85vh] overflow-y-auto relative'>
          {/* ปุ่มกล้อง */}
          <button
            onClick={toggleCamera}
            className='absolute top-4 right-4 text-gray-700 hover:text-blue-600 z-10'
          >
            {isCameraOn ? 'ปิดกล้อง' : 'เปิดกล้อง'}
          </button>

          <h2 className='text-lg font-semibold mb-3 text-black border-b border-gray-300 pb-1'>
            ซักประวัติผู้ป่วย
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className='text-sm'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <div className='flex items-center space-x-2'>
                <label className='font-medium text-black w-24'>ชื่อ-นามสกุล</label>
                <Input {...register('name')} placeholder='กรอกชื่อ-นามสกุล' />
              </div>

              <div className='flex items-center space-x-2'>
                <label className='font-medium text-black w-24'>อายุ</label>
                <Controller
                  name='age'
                  control={control}
                  render={({ field }) => (
                    <Select {...field} onChange={(e) => field.onChange(parseInt(e.target.value))}>
                      {[...Array(100).keys()].map((n) => (
                        <option key={n} value={n + 1}>
                          {n + 1} ปี
                        </option>
                      ))}
                    </Select>
                  )}
                />
              </div>

              <div className='flex items-center space-x-2'>
                <label className='font-medium text-black w-24'>น้ำหนัก</label>
                <div className='flex items-center w-full'>
                  <Input type='number' {...register('weight', { valueAsNumber: true })} placeholder='กก.' />
                  <span className='p-1 bg-gray-200 border border-gray-400 rounded-md text-black'>กก.</span>
                </div>
              </div>

              <div className='flex items-center space-x-2'>
                <label className='font-medium text-black w-24'>ส่วนสูง</label>
                <div className='flex items-center w-full'>
                  <Input type='number' {...register('height', { valueAsNumber: true })} placeholder='ซม.' />
                  <span className='p-1 bg-gray-200 border border-gray-400 rounded-md text-black'>ซม.</span>
                </div>
              </div>

              <div className='flex items-center space-x-2'>
                <label className='font-medium text-black w-24'>ลักษณะอาการ</label>
                <Input {...register('symptoms')} placeholder='ระบุอาการที่พบ' />
              </div>

              <div className='flex items-center space-x-2'>
                <label className='font-medium text-black w-24'>อาการแพ้</label>
                <div className='flex space-x-4'>
                  <Checkbox
                    checked={allergyValue === 'แพ้'}
                    onChange={() => handleAllergyChange('แพ้')}
                    label='แพ้'
                  />
                  <Checkbox
                    checked={allergyValue === 'ไม่แพ้'}
                    onChange={() => handleAllergyChange('ไม่แพ้')}
                    label='ไม่แพ้'
                  />
                </div>
              </div>

              {showAllergyDetails && (
                <div className='flex items-center space-x-2'>
                  <label className='font-medium text-black w-24'>ประเภทสิ่งที่แพ้</label>
                  <Input {...register('allergyDetails')} placeholder='กรอกสิ่งที่แพ้' />
                </div>
              )}

              <div className='flex items-center space-x-2'>
                <label className='font-medium text-black w-24'>วันเข้ารับการรักษา</label>
                <Input
                  type='text'
                  {...register('admissionDate')}
                  readOnly
                  className='bg-gray-200 cursor-not-allowed w-32'
                />
              </div>

              <div className='flex items-center space-x-2'>
                <label className='font-medium text-black w-24'>โรคประจำตัว</label>
                <Input {...register('chronicDiseases')} placeholder='ระบุโรคประจำตัว' />
              </div>

              <div className='flex items-center space-x-2'>
                <label className='font-medium text-black w-24'>ยาที่ใช้อยู่</label>
                <Input {...register('medications')} placeholder='ระบุยา' />
              </div>

              <div className='flex items-center space-x-2'>
                <label className='font-medium text-black w-24'>ประวัติการผ่าตัด</label>
                <Input {...register('surgeryHistory')} placeholder='ระบุประวัติผ่าตัด' />
              </div>

              <div className='flex items-center space-x-2'>
                <label className='font-medium text-black w-24'>เบอร์โทรฉุกเฉิน</label>
                <Input {...register('emergencyContact')} placeholder='เบอร์โทร' />
              </div>

              <div className='flex items-center space-x-2'>
                <label className='font-medium text-black w-24'>กรุ๊ปเลือด</label>
                <Select {...register('bloodType')}>
                  <option value=''>เลือกรูปแบบเลือด</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </div>

              <div className='flex items-center space-x-2'>
                <label className='font-medium text-black w-24'>เพศ</label>
                <Select {...register('gender')}>
                  <option value=''>เลือกเพศ</option>
                  {['ชาย', 'หญิง', 'อื่น ๆ'].map((gender) => (
                    <option key={gender} value={gender}>
                      {gender}
                    </option>
                  ))}
                </Select>
              </div>

              <div className='mt-4'>
                <Button type='submit' className='bg-blue-600 hover:bg-blue-700'>
                  บันทึกข้อมูล
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* กล่องขวา (กล้องเว็บแคม) */}
        <div className='w-9/15 bg-white/50 backdrop-blur-sm rounded-lg shadow-lg p-4 max-h-[85vh] overflow-y-auto'>
          <div className='w-full h-full flex justify-center items-center bg-gray-200 rounded-md relative'>
            {isCameraOn ? (
              <video
                ref={videoRef}
                autoPlay
                className='absolute inset-0 w-full h-full object-cover rounded-md'
              />
            ) : (
              <p className='text-center text-gray-700'>กล้องปิด</p>
            )}
          </div>
        </div>
      </div>

      {/* ป๊อปอัพแจ้งเตือนบันทึกสำเร็จ */}
      {showSuccess && (
        <div className='fixed inset-0 flex items-center justify-center z-50 animate-[fade-in_0.3s_ease-out,scale-in_0.3s_ease-out]'>
          <div className='bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 max-w-sm'>
            <div className='bg-green-100 rounded-full p-1 animate-[scale-in_0.3s_ease-out]'>
              <svg
                className='w-6 h-6 text-green-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M5 13l4 4L19 7'
                />
              </svg>
            </div>
            <span className='text-base font-medium'>บันทึกสำเร็จ</span>
          </div>
        </div>
      )}
    </div>
  );
}