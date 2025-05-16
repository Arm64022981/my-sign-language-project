'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import Takeahistory from '@/public/Takeahistory.jpg';
import Swal from 'sweetalert2';

// อินเตอร์เฟซและฟังก์ชันสำหรับการตรวจจับภาษามือ
interface Prediction {
  label: string;
  confidence: number;
  bbox: number[];
}

const labelTranslationsSL: { [key: string]: string } = {
  hello: 'สวัสดี',
  thankyou: 'ขอบคุณ',
  AIDS: 'เอดส์',
  'Abdominal pain': 'ปวดท้อง',
  Abortion: 'การแท้งบุตร',
  'Allergic reactions': 'ปฏิกิริยาภูมิแพ้',
  'Allergic rhinitis': 'โรคจมูกอักเสบจากภูมิแพ้',
  Allergy: 'อาการภูมิแพ้',
  Anus: 'ทวารหนัก',
  'Arm Pain': 'ปวดแขน',
  Asthma: 'โรคหอบหืด',
  Astigmatism: 'ภาวะสายตาสั้น',
  Blister: 'แผลพอง',
  Bloating: 'อาการท้องอืด',
  'Blurred Vision': 'มองเห็นไม่ชัด',
  Blurry: 'มองเบลอ',
  'Body soreness': 'อาการปวดร่างกาย',
  'Burning eyes': 'ตาแสบ',
  'Burning stomach pain': 'อาการปวดท้องแสบร้อน',
  'Chest tightness': 'อาการแน่นหน้าอก',
  'Common Cold': 'โรคหวัด',
  Constipation: 'ท้องผูก',
  Cough: 'อาการไอ',
  'Dental Filling': 'ฟันอุด',
  Diarrhea: 'ท้องเสีย',
  Dizzy: 'เวียนศีรษะ',
  'Drug allergy': 'อาการแพ้ยา',
  Dysphagia: 'กลืนลำบาก',
  'Easily fatigued': 'อาการเหนื่อยง่าย',
  Enceinte: 'ตั้งครรภ์',
  Epilepsy: 'โรคลมชัก',
  'Eye redness': 'อาการตาแดง',
  Fasting: 'การอดอาหาร',
  Fever: 'ไข้',
  'Food Allergy': 'อาการแพ้อาหาร',
  'Food intolerance': 'อาการไม่ย่อยอาหาร',
  Headache: 'อาการปวดหัว',
  'High fever': 'ไข้สูง',
  'Hot and cold sensation': 'อาการร้อนหนาวสลับ',
  Hypertension: 'ความดันโลหิตสูง',
  Hyporexia: 'อาการเบื่ออาหาร',
  Insomnia: 'อาการนอนไม่หลับ',
  Itching: 'อาการคัน',
  'Jaw Pain': 'อาการปวดขากรรไกร',
  Lightheadedness: 'มึนงง',
  Mucus: 'เสมหะ',
  'Muscle cramp': 'ตะคริวกล้ามเนื้อ',
  Nausea: 'อาการคลื่นไส้',
  Numbness: 'อาการชาที่ร่างกาย',
  Pain: 'อาการเจ็บปวด',
  Palpitations: 'อาการหัวใจเต้นเร็ว',
  Shivering: 'อาการสั่น',
  Sick: 'ป่วย',
  Sneezing: 'อาการจาม',
  'Stinging nose': 'อาการคันจมูก',
  Stomach: 'กระเพาะอาหาร',
  Stress: 'ความเครียด',
  Swelling: 'อาการบวม',
  'Urinary Bladder': 'กระเพาะปัสสาวะ',
  Vomiting: 'อาการอาเจียน',
  'Watery eyes': 'อาการตาแฉะ',
  'gradual vision loss': 'การสูญเสียการมองเห็นอย่างค่อยเป็นค่อยไป',
};

const labelTranslationsTH: { [key: string]: string } = {
  history1: 'อาการทางประวัติ 1',
  history2: 'อาการทางประวัติ 2',
  Address: 'ที่อยู่',
  Age: 'อายุ',
  'Blood pressure': 'ความดันโลหิต',
  'Body Mass Index': 'ดัชนีมวลกาย',
  'Body temperature': 'อุณหภูมิร่างกาย',
  'Breathing rate': 'อัตราการหายใจ',
  'Current weight': 'น้ำหนักปัจจุบัน',
  'Date of Birth': 'วันเดือนปีเกิด',
  Dizzy: 'เวียนศีรษะ',
  Email: 'อีเมล',
  'Factors that improve or reduce symptoms': 'ปัจจัยที่ทำให้อาการดีขึ้นหรือแย่ลง',
  'Family history': 'ประวัติครอบครัว',
  'Full Name': 'ชื่อ-นามสกุล',
  Gender: 'เพศ',
  'Have you been sick for a long time': 'ป่วยมานานหรือไม่',
  'Heart rate': 'อัตราการเต้นของหัวใจ',
  Height: 'ส่วนสูง',
  'History of drug allergy': 'ประวัติการแพ้ยา',
  'How often do you take medication': 'ความถี่ในการใช้ยา',
  Hurt: 'อาการเจ็บปวด',
  'Level 1-10': 'ระดับความเจ็บปวด (1–10)',
  'Previous Weight': 'น้ำหนักก่อนหน้า',
  'Respiratory rate': 'อัตราการหายใจ',
  'Sign Language Interpreter': 'ล่ามภาษามือ',
  'Since birth accident or illness': 'ประวัติอุบัติเหตุหรือโรคตั้งแต่เกิด',
  'Smoking and Alcohol History': 'ประวัติการสูบบุหรี่และการดื่มแอลกอฮอล์',
  'Telephone Number': 'หมายเลขโทรศัพท์',
  Text: 'ข้อความ',
  Tinnitus: 'อาการหูอื้อ',
  Todaysillness: 'อาการเจ็บป่วยวันนี้',
  'Underlying disease': 'โรคประจำตัว',
  'Waist circumference': 'รอบเอว',
  'What is the drug name': 'ชื่อยาคืออะไร',
  'What medications are you currently taking': 'ยาที่ใช้อยู่ในปัจจุบัน',
  'When did the hearing loss begin': 'การสูญเสียการได้ยินเริ่มเมื่อใด',
};

const getLabelTranslations = (model: string) => {
  return model === 'TH' ? labelTranslationsTH : labelTranslationsSL;
};

const getRandomColor = () => {
  const r = Math.floor(Math.random() * 156) + 100;
  const g = Math.floor(Math.random() * 156) + 100;
  const b = Math.floor(Math.random() * 156) + 100;
  return `rgb(${r}, ${g}, ${b})`;
};

// คอมโพเนนต์ UI
const Input = ({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={`w-full p-1 border border-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm text-black text-sm ${className}`}
    {...props}
  />
);

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

const Select = ({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className={`w-full p-1 border border-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm text-black text-sm ${className}`}
    {...props}
  >
    {children}
  </select>
);

const Button = ({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={`px-3 py-1 text-sm text-white rounded-md shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all ${className}`}
    {...props}
  >
    {children}
  </button>
);

const SignLanguagePopup = ({ isOpen, onClose, onVideoSelect }: { isOpen: boolean; onClose: () => void; onVideoSelect: (url: string) => void }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');

  const videoCategories: { [key: string]: { [key: string]: { [key: string]: string } | string } } = {
    'ซักประวัติ': {
      'ข้อมูลทั่วไป': {
        'เจ็บ?': '/question/ข้อมูลทั่วไปเกี่ยวกับอาการผู้ป่วย/เจ็บ/hurt01.MOV',
        'เวียนหัว?': '/question/ข้อมูลทั่วไปเกี่ยวกับอาการผู้ป่วย/ป่วยนานหรือยัง/Haveyoubeensickforaongtime01.MOV',
        'ป่วยนานหรือยัง?': '/question/ข้อมูลทั่วไปเกี่ยวกับอาการผู้ป่วย/ป่วยหนักแค่ไหน/Howeriouslyillareyou01.MOV',
        'ป่วยหนักแค่ไหน?': '/question/ข้อมูลทั่วไปเกี่ยวกับอาการผู้ป่วย/ปัจจัยที่ทำให้อาการดีขึ้นหรือลดลง/Factorsthatimproveorreducesymptoms01.MOV',
        'ปัจจัยที่ทำให้อาการดีขึ้นหรือลดลง?': '/ข้อมูลทั่วไปเกี่ยวกับอาการผู้ป่วย/ระดับ/Lv1_10_01.MOV',
        'ระดับ 1-10?': '/question/ข้อมูลทั่วไปเกี่ยวกับอาการผู้ป่วย/เวียนหัว/dizzy01.MOV',
        'หูอื้อ?': '/question/ข้อมูลทั่วไปเกี่ยวกับอาการผู้ป่วย/หูอื้อ/Tinnitus_01.MOV',
        'อาการป่วยวันนี้?': '/question/ข้อมูลทั่วไปเกี่ยวกับอาการผู้ป่วย/อาการป่วยวันนี้/Todays_illness01.MOV',
        'อาการป่วยอื่นๆ?': '/question/ข้อมูลทั่วไปเกี่ยวกับอาการผู้ป่วย/อาการป่วยอื่นๆ/Other_illnesses01.MOV',
      },
      'ค่าท่าทางสุขภาพเบื้องต้น': {
        'ความดันโลหิต?': '/question/ค่าท่าทางสุขภาพเบื้องต้น/ความดันโลหิต/bloodpressure01.MOV',
        'อัตราการเต้นของหัวใจ?': '/question/ค่าท่าทางสุขภาพเบื้องต้น/อัตราการเต้นของหัวใจ/heartrate01.MOV',
        'อัตราการหายใจ?': '/question/ค่าท่าทางสุขภาพเบื้องต้น/อัตราการหายใจ/breathingrate01.MOV',
        'อุณหภูมิร่างกาย?': '/question/ค่าท่าทางสุขภาพเบื้องต้น/อุณหภูมิร่างกาย/bodytemperature01.MOV',
      },
    },
    'อาการ': {
      'ปวดหัว': '/symptoms/Headache/IMG_4443.MOV',
      'กินไม่ได้': '/symptoms/Cantswallow/IMG_4406.MOV',
      'กระเพาะอาหาร': '/symptoms/Stomachproblems/IMG_3545.MOV',
      'ปวดขมับ': '/symptoms/Armpain/IMG_3505.MOV',
      'การอุดตัน': '/symptoms/Dentalfillings/IMG_3469.Mov',
      'อาการแพ้': '/symptoms/allergy.mp4',
      'ภูมิแพ้': '/symptoms/allergic_pushp.mp4',
      'ตามัว': '/symptoms/blurred_vision.mp4',
      'เบื่ออาหาร': '/symptoms/loss_of_appetite.mp4',
      'กินอาหารเหล่านี้ไม่ได้': '/symptoms/food_intolerance.mp4',
      'แผลพุพอง': '/symptoms/blisters.mp4',
      'ตาแพ้': '/symptoms/eye_allergy.mp4',
      'แผลริมฝีปาก': '/symptoms/lip_sores.mp4',
      'ท้องผูก': '/symptoms/constipation.mp4',
      'ตำแหน่ง': '/symptoms/location.mp4',
      'เหงื่อไม่หยุด': '/symptoms/excessive_sweating.mp4',
      'แน่นหน้าอก': '/symptoms/chest_tightness.mp4',
      'เย็นเท้า': '/symptoms/cold_feet.mp4',
      'ตาแดง': '/symptoms/red_eyes.mp4',
      'มองไม่เห็น': '/symptoms/vision_loss.mp4',
      'ติดเชื้อ': '/symptoms/infection.mp4',
      'ไอ': '/symptoms/cough.mp4',
      'อาเจียน': '/symptoms/vomiting.mp4',
      'มีแผล': '/symptoms/wounds.mp4',
      'หน้ามืด': '/symptoms/dizziness.mp4',
      'เย็นเหงื่อ': '/symptoms/cold_sweat.mp4',
      'แขนชา': '/symptoms/arm_numbness.mp4',
      'เหนื่อยง่าย': '/symptoms/easily_fatigued.mp4',
      'โคลงเคลง หน้าเวียน': '/symptoms/vertigo.mp4',
      'ท้องอืด': '/symptoms/bloating.mp4',
      'รู้สึกเบื่ออาหาร': '/symptoms/appetite_loss.mp4',
      'จมูก': '/symptoms/nose_issues.mp4',
      'เป็นไข้อ่อนเพลีย': '/symptoms/fever_fatigue.mp4',
      'หัวใจอ่อนแรง': '/symptoms/weak_heart.mp4',
      'แสบท้อง': '/symptoms/stomach_burning.mp4',
      'ตัดสิน': '/symptoms/decision_making.mp4',
      'ได้กลิ่น': '/symptoms/smell.mp4',
      'ออเจ้า': '/symptoms/nausea.mp4',
      'เส้นเลือด': '/symptoms/blood_vessels.mp4',
      'ปวดแน่นท้อง': '/symptoms/abdominal_tightness.mp4',
      'กระเพาะปัสสาวะ': '/symptoms/bladder.mp4',
      'ท้องเสีย': '/symptoms/diarrhea.mp4',
      'เหนื่อย': '/symptoms/fatigue.mp4',
      'ขาอ่อนแรง': '/symptoms/weak_legs.mp4',
      'ร้อนๆ': '/symptoms/hot_flashes.mp4',
      'คลื่นไส้': '/symptoms/nausea_general.mp4',
      'ผิวหนัง': '/symptoms/skin_issues.mp4',
      'เครื่องมือ': '/symptoms/medical_tools.mp4',
      'บวม': '/symptoms/swelling.mp4',
      'สายตาเอียง': '/symptoms/astigmatism.mp4',
      'ปวดขา': '/symptoms/leg_pain.mp4',
      'การรับร่างกาย': '/symptoms/body_sensation.mp4',
      'ต้น': '/symptoms/origin.mp4',
      'ถ่ายเป็นเมือก': '/symptoms/mucous_stool.mp4',
      'แพ้อากาศ': '/symptoms/weather_allergy.mp4',
      'ตาแฉะ': '/symptoms/watery_eyes.mp4',
      'ป่วย': '/symptoms/illness.mp4',
      'ท้อง': '/symptoms/abdomen.mp4',
      'เมื่อย': '/symptoms/muscle_fatigue.mp4',
      'หาวรัวๆ': '/symptoms/excessive_yawning.mp4',
      'หนาวๆ ร้อนๆ': '/symptoms/chills_hot.mp4',
      'ความดันโลหิตสูง': '/symptoms/high_blood_pressure.mp4',
    },
  };

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(event.target.value);
    setSelectedSubCategory('');
  };

  const handleSubCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubCategory(event.target.value);
  };

  const handleQuestionSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedQuestion = event.target.value;
    if (
      selectedCategory &&
      selectedSubCategory &&
      selectedQuestion &&
      typeof videoCategories[selectedCategory] === 'object' &&
      typeof (videoCategories[selectedCategory] as { [key: string]: { [key: string]: string } })[selectedSubCategory] === 'object' &&
      (videoCategories[selectedCategory] as { [key: string]: { [key: string]: string } })[selectedSubCategory][selectedQuestion]
    ) {
      onVideoSelect((videoCategories[selectedCategory] as { [key: string]: { [key: string]: string } })[selectedSubCategory][selectedQuestion]);
    } else if (
      selectedCategory &&
      selectedQuestion &&
      typeof videoCategories[selectedCategory] === 'object' &&
      (videoCategories[selectedCategory] as { [key: string]: string })[selectedQuestion]
    ) {
      onVideoSelect((videoCategories[selectedCategory] as { [key: string]: string })[selectedQuestion]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 flex items-center justify-center z-50 bg-black/60 transition-opacity duration-300'>
      <div className='bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg transform transition-all duration-300 scale-100 animate-[fade-in_0.3s_ease-out]'>
        <div className='flex justify-between items-center mb-6'>
          <h3 className='text-xl font-semibold text-gray-800 flex items-center'>
            <svg className='w-6 h-6 text-purple-600 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
            เลือกคำถามภาษามือ
          </h3>
          <button onClick={onClose} className='text-gray-500 hover:text-gray-700 transition-colors'>
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>เลือกหัวข้อ</label>
            <Select onChange={handleCategoryChange} className='w-full p-2 border-2 border-purple-300 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors'>
              <option value=''>เลือกหัวข้อ</option>
              {Object.keys(videoCategories).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </div>
          {selectedCategory === 'ซักประวัติ' && (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>เลือกหมวดหมู่</label>
              <Select onChange={handleSubCategoryChange} className='w-full p-2 border-2 border-purple-300 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors'>
                <option value=''>เลือกหมวดหมู่</option>
                {Object.keys(videoCategories['ซักประวัติ']).map((subCategory) => (
                  <option key={subCategory} value={subCategory}>
                    {subCategory}
                  </option>
                ))}
              </Select>
            </div>
          )}
          {(selectedCategory === 'ซักประวัติ' && selectedSubCategory) || selectedCategory === 'อาการ' ? (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>เลือกคำถาม</label>
              <Select onChange={handleQuestionSelect} className='w-full p-2 border-2 border-purple-300 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors'>
                <option value=''>เลือกคำถาม</option>
                {selectedCategory === 'ซักประวัติ' && selectedSubCategory
                  ? Object.keys((videoCategories['ซักประวัติ'] as { [key: string]: { [key: string]: string } })[selectedSubCategory]).map((question) => (
                    <option key={question} value={question}>
                      {question}
                    </option>
                  ))
                  : selectedCategory === 'อาการ'
                    ? Object.keys(videoCategories['อาการ'] as { [key: string]: string }).map((question) => (
                      <option key={question} value={question}>
                        {question}
                      </option>
                    ))
                    : null}
              </Select>
            </div>
          ) : null}
        </div>
        <div className='mt-6 flex justify-end'>
          <Button
            onClick={onClose}
            className='bg-gray-500 hover:bg-gray-600 px-4 py-2'
          >
            ยกเลิก
          </Button>
        </div>
      </div>
    </div>
  );
};

const NurseInfo = ({ nurseName }: { nurseName: string }) => (
  <div className='mb-4 p-3 bg-blue-100 rounded-md shadow-sm'>
    <p className='text-sm font-medium text-black'>
      <span className='text-blue-600'>ผู้บันทึกข้อมูล:</span> {nurseName}
    </p>
  </div>
);

type PatientForm = {
  id_card: string;
  name: string;
  age: number;
  weight: number;
  height: number;
  symptoms: string;
  allergy: 'แพ้' | 'ไม่แพ้' | '';
  allergy_drug?: string;
  allergy_food?: string;
  admissionDate: string;
  chronicDiseases?: string;
  medications?: string;
  surgeryHistory?: string;
  emergencyContact?: string;
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  gender?: 'ชาย' | 'หญิง' | 'อื่น ๆ';
  nurseName: string;
  nationality: string;
};

export default function PatientHistoryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id_card = searchParams.get('id_card') || '';
  const isEditMode = searchParams.get('edit') === 'true';

  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useForm<PatientForm>({
    defaultValues: {
      id_card: id_card,
      name: '',
      age: 0,
      weight: 0,
      height: 0,
      symptoms: '',
      allergy: '',
      allergy_drug: '',
      allergy_food: '',
      admissionDate: format(new Date(), 'yyyy-MM-dd'),
      chronicDiseases: '',
      medications: '',
      surgeryHistory: '',
      emergencyContact: '',
      bloodType: undefined,
      gender: undefined,
      nurseName: '',
      nationality: '',
    },
  });

  const [allergyValue, setAllergyValue] = useState<'แพ้' | 'ไม่แพ้' | ''>('');
  const [showAllergyDetails, setShowAllergyDetails] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
  const [isSignLanguagePopupOpen, setIsSignLanguagePopupOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [nurseName, setNurseName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // สถานะสำหรับการตรวจจับภาษามือ
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [allLabels, setAllLabels] = useState<{ [label: string]: number }>({});
  const [labelColors, setLabelColors] = useState<{ [key: string]: string }>({});
  const [model, setModel] = useState<'SL' | 'TH'>('SL');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 5;

  // ดึงข้อมูลโปรไฟล์
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token')?.trim();
        if (!token) {
          setNurseName('ไม่ระบุชื่อ');
          setValue('nurseName', 'ไม่ระบุชื่อ');
          await Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'กรุณาล็อกอินเพื่อเข้าถึงหน้านี้',
            showConfirmButton: true,
          });
          router.push('/login');
          return;
        }

        let response = await fetch('http://localhost:5000/api/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          const newToken = await refreshToken();
          if (!newToken) {
            await Swal.fire({
              icon: 'error',
              title: 'เซสชันหมดอายุ',
              text: 'กรุณาล็อกอินใหม่',
              showConfirmButton: true,
            });
            router.push('/login');
            return;
          }

          response = await fetch('http://localhost:5000/api/profile', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newToken}`,
            },
          });
        }

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'ไม่สามารถดึงข้อมูลโปรไฟล์ได้');
        }

        const profile = data.nurse || data.doctor || data.user_data || data;
        const fullname = profile.fullname || profile.name || 'ไม่ระบุชื่อ';
        setNurseName(fullname);
        setValue('nurseName', fullname);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setNurseName('ไม่ระบุชื่อ');
        setValue('nurseName', 'ไม่ระบุชื่อ');
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: `ไม่สามารถดึงข้อมูลโปรไฟล์ได้: ${error instanceof Error ? error.message : 'Unknown error'}`,
          showConfirmButton: true,
        });
        router.push('/login');
      }
    };

    const refreshToken = async () => {
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          return null;
        }

        const response = await fetch('http://localhost:5000/api/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        const data = await response.json();
        if (response.ok) {
          localStorage.setItem('token', data.access_token);
          return data.access_token;
        } else {
          throw new Error(data.error || 'Failed to refresh token');
        }
      } catch (error) {
        console.error('Error refreshing token:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        return null;
      }
    };

    fetchProfile();
  }, [setValue, router]);

  // ดึงข้อมูลผู้ป่วยเมื่ออยู่ในโหมดแก้ไข
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!isEditMode || !id_card) return;

      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('ไม่พบ token การล็อกอิน');
        }

        const response = await fetch(`http://localhost:5000/api/patients/${id_card}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('ไม่สามารถดึงข้อมูลผู้ป่วยได้');
        }

        const data = await response.json();

        // เติมข้อมูลลงในฟอร์ม
        setValue('id_card', data.id_card?.toString() || id_card);
        setValue('name', data.name?.trim() || '');
        setValue('age', data.age || 0);
        setValue('weight', data.weight || 0);
        setValue('height', data.height || 0);
        setValue('symptoms', data.symptoms?.trim() || '');
        setValue('allergy', data.allergy ? 'แพ้' : 'ไม่แพ้');
        setValue('allergy_drug', data.allergy_drug?.trim() || '');
        setValue('allergy_food', data.allergy_food?.trim() || '');
        setValue('admissionDate', data.admission_date ? format(new Date(data.admission_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
        setValue('chronicDiseases', data.chronic_diseases?.trim() || '');
        setValue('medications', data.medications?.trim() || '');
        setValue('surgeryHistory', data.surgery_history?.trim() || '');
        setValue('emergencyContact', data.emergency_contact?.trim() || '');
        setValue('bloodType', data.blood_type || undefined);
        setValue('gender', data.gender || undefined);
        setValue('nationality', data.nationality?.trim() || '');
        setAllergyValue(data.allergy ? 'แพ้' : 'ไม่แพ้');
        setShowAllergyDetails(data.allergy);
        setError(null);
      } catch (error) {
        console.error('Error fetching patient data:', error);
        setError(`เกิดข้อผิดพลาดในการดึงข้อมูลผู้ป่วย: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [id_card, isEditMode, setValue]);

  // จัดการกล้องและ WebSocket สำหรับการตรวจจับภาษามือ
  useEffect(() => {
    let isMounted = true;

    const connectWebSocket = () => {
      const ws = new WebSocket('wss://3b0b-202-80-249-225.ngrok-free.app/ws/predict/');
      socketRef.current = ws;

      ws.onopen = () => {
        setErrorMessage(null);
        reconnectAttemptsRef.current = 0;
        if (isMounted) {
          intervalRef.current = setInterval(() => sendFrameToServer(model), 200);
        }
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);
          if (Array.isArray(data)) {
            updateLabels(data);
            drawPredictions(data);
          } else if (data.error) {
            setErrorMessage(`ข้อผิดพลาดจากเซิร์ฟเวอร์: ${data.error}`);
          }
        } catch {
          setErrorMessage('ข้อผิดพลาดในการประมวลผลข้อมูลจากเซิร์ฟเวอร์');
        }
      };

      ws.onclose = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (isMounted && isCameraOn && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          setErrorMessage(`เชื่อมต่อใหม่ ${reconnectAttemptsRef.current}/${maxReconnectAttempts}...`);
          setTimeout(() => {
            if (isMounted && isCameraOn) connectWebSocket();
          }, 5000);
        } else if (isMounted) {
          setErrorMessage('ไม่สามารถเชื่อมต่อ WebSocket ได้');
        }
      };

      ws.onerror = () => {
        if (isMounted) setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ WebSocket');
      };
    };

    const startCameraAndSocket = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (isMounted && videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
        connectWebSocket();
      } catch {
        if (isMounted) {
          setErrorMessage('ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาต');
          setIsCameraOn(false);
        }
      }
    };

    const stopCameraAndSocket = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (socketRef.current) socketRef.current.close();
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      clearCanvas();
      setAllLabels({});
      setLabelColors({});
      setErrorMessage(null);
      reconnectAttemptsRef.current = 0;
    };

    const sendFrameToServer = (selectedModel: 'SL' | 'TH') => {
      const video = videoRef.current;
      const socket = socketRef.current;
      const canvas = canvasRef.current;
      if (!video || !socket || !canvas || socket.readyState !== WebSocket.OPEN) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg', 0.7);

      socket.send(JSON.stringify({ model: selectedModel, image: imageData }));
    };

    const clearCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const context = canvas.getContext('2d');
        if (context) context.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    const updateLabels = (predictions: Prediction[]) => {
      setLabelColors((prev) => {
        const updated = { ...prev };
        predictions.forEach((pred) => {
          if (!updated[pred.label]) updated[pred.label] = getRandomColor();
        });
        return updated;
      });

      setAllLabels((prev) => {
        const updated = { ...prev };
        predictions.forEach((pred) => {
          updated[pred.label] = pred.confidence;
        });
        return updated;
      });
    };

    const drawPredictions = (predictions: Prediction[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.font = 'bold 16px sans-serif';
      context.lineWidth = 3;

      predictions.forEach((prediction) => {
        const color = labelColors[prediction.label] || getRandomColor();
        const [x1, y1, x2, y2] = prediction.bbox;

        context.strokeStyle = color;
        context.strokeRect(x1, y1, x2 - x1, y2 - y1);

        const labelText = `${getLabelTranslations(model)[prediction.label] || prediction.label}: ${(prediction.confidence * 100).toFixed(1)}%`;
        const textWidth = context.measureText(labelText).width;
        const textHeight = 16;
        const textX = x1 + 5;
        const textY = y1 > 20 ? y1 - 5 : y1 + 20;

        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(textX - 2, textY - textHeight, textWidth + 4, textHeight + 4);

        context.fillStyle = color;
        context.fillText(labelText, textX, textY);
      });
    };

    if (isCameraOn) startCameraAndSocket();
    else stopCameraAndSocket();

    return () => {
      isMounted = false;
      stopCameraAndSocket();
      if (selectedVideo) {
        URL.revokeObjectURL(selectedVideo);
      }
    };
  }, [isCameraOn, model, selectedVideo]);

  const toggleCamera = () => {
    setIsCameraOn((prevState) => !prevState);
  };

  // การส่งข้อมูล
  const onSubmitHandler = async (data: PatientForm) => {
    try {
      // ตรวจสอบฟิลด์ที่จำเป็น
      if (!data.name.trim()) {
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'กรุณากรอกชื่อ-นามสกุล',
          showConfirmButton: true,
        });
        return;
      }
      if (data.age <= 0) {
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'กรุณาเลือกอายุที่ถูกต้อง',
          showConfirmButton: true,
        });
        return;
      }
      if (data.allergy === '') {
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'กรุณาเลือกสถานะอาการแพ้ (แพ้/ไม่แพ้)',
          showConfirmButton: true,
        });
        return;
      }
      if (data.allergy === 'แพ้' && !data.allergy_drug?.trim() && !data.allergy_food?.trim()) {
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'กรุณาระบุแพ้ยาหรือแพ้อาหารอย่างน้อยหนึ่งรายการเมื่อเลือกแพ้',
          showConfirmButton: true,
        });
        return;
      }

      // สร้าง payload โดยส่ง allergy_drug และ allergy_food แยกกัน
      const payload = {
        id_card: data.id_card,
        name: data.name.trim(),
        age: data.age,
        weight: data.weight || 0,
        height: data.height || 0,
        symptoms: data.symptoms?.trim() || '',
        allergy: data.allergy === 'แพ้',
        allergy_drug: data.allergy_drug?.trim() || '',
        allergy_food: data.allergy_food?.trim() || '',
        admission_date: data.admissionDate,
        chronic_diseases: data.chronicDiseases?.trim() || '',
        medications: data.medications?.trim() || '',
        surgery_history: data.surgeryHistory?.trim() || '',
        emergency_contact: data.emergencyContact?.trim() || '',
        blood_type: data.bloodType || '',
        gender: data.gender || '',
        nurse_name: data.nurseName.trim(),
        nationality: data.nationality?.trim() || '',
      };

      const token = localStorage.getItem('token');
      if (!token) {
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่พบ token การล็อกอิน กรุณาล็อกอินใหม่',
          showConfirmButton: true,
        });
        router.push('/login');
        return;
      }

      const url = isEditMode
        ? `http://localhost:5000/api/patients/${data.id_card}`
        : 'http://localhost:5000/api/patients';
      const method = isEditMode ? 'PUT' : 'POST';

      console.log('Sending request:', { url, method, payload });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      let result;
      try {
        result = await response.json();
        console.log('API Response:', result);
      } catch (error) {
        console.error('Failed to parse response as JSON:', error);
        throw new Error(`เซิร์ฟเวอร์ส่ง response ที่ไม่ใช่ JSON (รหัส: ${response.status})`);
      }

      if (response.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'สำเร็จ!',
          text: isEditMode ? 'อัปเดตข้อมูลสำเร็จ' : 'บันทึกข้อมูลสำเร็จ',
          showConfirmButton: false,
          timer: 1500,
        });
        reset();
        setAllergyValue('');
        setShowAllergyDetails(false);
        router.push('/Signlanguage/Patient');
      } else {
        let errorMessage = result.message || result.error || `ไม่สามารถ${isEditMode ? 'อัปเดต' : 'บันทึก'}ข้อมูลได้`;
        if (response.status === 400) {
          errorMessage = result.error || 'ข้อมูลที่ส่งไม่ถูกต้อง กรุณาตรวจสอบข้อมูล';
        } else if (response.status === 401) {
          errorMessage = 'การยืนยันตัวตนล้มเหลว กรุณาล็อกอินใหม่';
          router.push('/login');
        } else if (response.status === 404) {
          errorMessage = 'ไม่พบผู้ป่วยที่มีเลขบัตรประชาชนนี้';
        } else if (response.status === 405) {
          errorMessage = 'เซิร์ฟเวอร์ไม่รองรับการอัปเดตข้อมูลในขณะนี้';
        } else if (response.status === 500) {
          errorMessage = result.error || 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์ กรุณาลองใหม่ภายหลัง';
        }
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: `${errorMessage} (รหัส: ${response.status})`,
          showConfirmButton: true,
        });
      }
    } catch (error) {
      console.error('Submit Error:', error);
      await Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: `ไม่สามารถ${isEditMode ? 'อัปเดต' : 'บันทึก'}ข้อมูลได้: ${error instanceof Error ? error.message : 'Unknown error'}`,
        showConfirmButton: true,
      });
    }
  };

  const handleAllergyChange = (value: 'แพ้' | 'ไม่แพ้') => {
    setAllergyValue(value);
    setValue('allergy', value);
    if (value === 'แพ้') {
      setShowAllergyDetails(true);
    } else {
      setShowAllergyDetails(false);
      setValue('allergy_drug', '');
      setValue('allergy_food', '');
    }
  };

  const openSignLanguagePopup = () => {
    setIsSignLanguagePopupOpen(true);
  };

  const closeSignLanguagePopup = () => {
    setIsSignLanguagePopupOpen(false);
    if (selectedVideo) {
      URL.revokeObjectURL(selectedVideo);
      setSelectedVideo(null);
    }
  };

  const handleVideoSelect = (videoURL: string) => {
    setSelectedVideo(videoURL);
  };

  if (loading) return <div className="p-8 text-lg">กำลังโหลดข้อมูลผู้ป่วย...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div
      className='min-h-screen flex items-start justify-center px-4 py-40'
      style={{
        backgroundImage: `url(${Takeahistory.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className='flex w-full max-w-6xl gap-4'>
        {/* ฟอร์มซักประวัติ */}
        <div className='w-9/15 bg-white/80 backdrop-blur-lg rounded-lg shadow-lg p-4 max-h-[85vh] overflow-y-auto relative'>
          <button
            onClick={toggleCamera}
            className='absolute top-4 right-4 text-gray-700 hover:text-blue-600 z-10'
          >
            {isCameraOn ? 'ปิดกล้อง' : 'เปิดกล้อง'}
          </button>

          <h2 className='text-lg font-semibold mb-3 text-black border-b border-gray-300 pb-1'>
            {isEditMode ? 'แก้ไขประวัติผู้ป่วย' : 'ซักประวัติผู้ป่วย'}
          </h2>

          <NurseInfo nurseName={nurseName} />

          <form onSubmit={handleSubmit(onSubmitHandler)} className='text-sm'>
            <input type='hidden' {...register('nurseName')} />
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <div className='flex items-center space-x-2'>
                <label className='font-medium text-black w-24'>บัตรประชาชน</label>
                <div className='w-full'>
                  <Input
                    {...register('id_card', {
                      required: 'กรุณากรอกเลขบัตรประชาชน',
                      pattern: {
                        value: /^\d{13}$/,
                        message: 'เลขบัตรประชาชนต้องมี 13 หลัก',
                      },
                    })}
                    placeholder='กรอกเลขบัตรประชาชน'
                    readOnly={isEditMode}
                    className={isEditMode ? 'bg-gray-200 cursor-not-allowed' : ''}
                  />
                  {errors.id_card && (
                    <p className='text-red-500 text-xs mt-1'>{errors.id_card.message}</p>
                  )}
                </div>
              </div>

              <div className='flex items-center space-x-2'>
                <label className='font-medium text-black w-24'>ชื่อ-นามสกุล</label>
                <div className='w-full'>
                  <Input
                    {...register('name', {
                      required: 'กรุณากรอกชื่อ-นามสกุล',
                      validate: (value) => value.trim() !== '' || 'ชื่อ-นามสกุลต้องไม่ว่าง',
                    })}
                    placeholder='กรอกชื่อ-นามสกุล'
                  />
                  {errors.name && (
                    <p className='text-red-500 text-xs mt-1'>{errors.name.message}</p>
                  )}
                </div>
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

              <div className='flex items-center space-x-2'>
                <label className='font-medium text-black w-24'>อายุ</label>
                <Controller
                  name='age'
                  control={control}
                  rules={{
                    validate: (value) => value > 0 || 'กรุณาเลือกอายุที่ถูกต้อง',
                  }}
                  render={({ field }) => (
                    <Select {...field} onChange={(e) => field.onChange(parseInt(e.target.value))}>
                      <option value={0}>เลือกอายุ</option>
                      {[...Array(100).keys()].map((n) => (
                        <option key={n} value={n + 1}>
                          {n + 1} ปี
                        </option>
                      ))}
                    </Select>
                  )}
                />
                {errors.age && (
                  <p className='text-red-500 text-xs mt-1'>{errors.age.message}</p>
                )}
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
                <label className='font-medium text-black w-24'>สัญชาติ</label>
                <Input {...register('nationality')} placeholder='กรอกสัญชาติ' />
              </div>

              <div className='flex items-center space-x-2'>
                <label className='font-medium text-black w-24'>เบอร์ติดต่อ</label>
                <Input {...register('emergencyContact')} placeholder='เบอร์โทร' />
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
                <>
                  <div className='flex items-center space-x-2'>
                    <label className='font-medium text-black w-24'>แพ้ยา</label>
                    <Input
                      {...register('allergy_drug')}
                      placeholder='ระบุยาที่แพ้'
                    />
                  </div>
                  <div className='flex items-center space-x-2'>
                    <label className='font-medium text-black w-24'>แพ้อาหาร</label>
                    <Input
                      {...register('allergy_food')}
                      placeholder='ระบุอาหารที่แพ้'
                    />
                  </div>
                </>
              )}

              <div className='flex items-center space-x-2'>
                <label className='font-medium text-black w-24'>ยาที่ใช้อยู่</label>
                <Input {...register('medications')} placeholder='ระบุยา' />
              </div>

              <div className='flex items-center space-x-2'>
                <label className='font-medium text-black w-24'>โรคประจำตัว</label>
                <Input {...register('chronicDiseases')} placeholder='ระบุโรคประจำตัว' />
              </div>

              <div className='flex items-center space-x-2'>
                <label className='font-medium text-black w-24'>ประวัติการผ่าตัด</label>
                <Input {...register('surgeryHistory')} placeholder='ระบุประวัติผ่าตัด' />
              </div>

              <div className='flex items-center space-x-2'>
                <label className='font-medium text-black w-24'>วันเข้ารับการรักษา</label>
                <Input
                  type='text'
                  {...register('admissionDate')}
                  readOnly
                  className='bg-gray-200 cursor-not-allowed w-32'
                />
              </div>

              <div className='mt-4'>
                <Button type='submit' className='bg-blue-600 hover:bg-blue-700'>
                  {isEditMode ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูล'}
                </Button>
                <Button
                  type='button'
                  className='ml-2 bg-purple-600 hover:bg-purple-700'
                  onClick={openSignLanguagePopup}
                >
                  ภาษามือ
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* ส่วนกล้องด้านขวา */}
        <div className='w-9/15 bg-white/50 backdrop-blur-sm rounded-lg shadow-lg p-4 max-h-[85vh] overflow-y-auto'>
          <div className='space-y-4'>
            {/* การแจ้งเตือนข้อผิดพลาด */}
            {errorMessage && (
              <div className='p-3 bg-red-100 text-red-700 rounded-md flex justify-between items-center'>
                <span>{errorMessage}</span>
                <button
                  className='text-blue-600 underline text-sm'
                  onClick={() => {
                    setIsCameraOn(false);
                    setTimeout(() => setIsCameraOn(true), 100);
                  }}
                >
                  ลองใหม่
                </button>
              </div>
            )}

            {/* ส่วนควบคุมกล้องและโหมด */}
            <div className='flex items-center justify-between bg-gray-50 p-3 rounded-md'>
              <span className='text-sm font-medium text-gray-700'>ตรวจจับภาษามือ</span>
              <div className='flex items-center gap-2'>
                <label className='text-sm font-medium text-gray-700'>โหมด:</label>
                <Select
                  value={model}
                  onChange={(e) => setModel(e.target.value as 'SL' | 'TH')}
                  className='w-32'
                >
                  <option value='SL'>ภาษามือ</option>
                  <option value='TH'>ซักประวัติ</option>
                </Select>
              </div>
            </div>

            {/* ส่วนแสดงวิดีโอและ canvas */}
            <div className='relative rounded-md overflow-hidden border border-gray-300 shadow-md'>
              {isCameraOn ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className='w-full h-auto bg-black'
                  />
                  <canvas
                    ref={canvasRef}
                    className='absolute top-0 left-0 w-full h-full pointer-events-none'
                  />
                </>
              ) : (
                <div className='w-full h-64 flex justify-center items-center bg-gray-200 rounded-md'>
                  <p className='text-center text-gray-700'>กล้องปิด</p>
                </div>
              )}
            </div>

            {/* ตารางแสดงผลการตรวจจับ */}
            {isCameraOn && Object.keys(allLabels).length > 0 && (
              <div className='bg-gray-50 p-3 rounded-md border border-gray-200'>
                <h3 className='text-sm font-semibold text-gray-700 mb-2'>ผลการตรวจจับ:</h3>
                <table className='w-full text-sm text-left text-gray-700'>
                  <thead className='text-xs text-gray-500 uppercase bg-gray-200'>
                    <tr>
                      <th className='px-3 py-2'>คำแปล</th>
                      <th className='px-3 py-2'>ความมั่นใจ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(allLabels)
                      .sort(([, confidenceA], [, confidenceB]) => confidenceB - confidenceA)
                      .map(([label, confidence], index) => (
                        <tr
                          key={label}
                          className='border-b'
                          style={index === 0 ? { backgroundColor: `${labelColors[label]}20` } : {}}
                        >
                          <td
                            className='px-3 py-2'
                            style={{ color: labelColors[label] }}
                          >
                            {getLabelTranslations(model)[label] || label}
                          </td>
                          <td className='px-3 py-2'>{(confidence * 100).toFixed(2)}%</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popup ภาษามือ */}
      <SignLanguagePopup
        isOpen={isSignLanguagePopupOpen}
        onClose={closeSignLanguagePopup}
        onVideoSelect={handleVideoSelect}
      />

      {/* แสดงวิดีโอภาษามือ */}
      {selectedVideo && (
        <div className='fixed inset-0 flex items-center justify-center z-50 bg-black/50'>
          <div className='bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-lg font-semibold text-black'>วิดีโอภาษามือ</h3>
              <button onClick={closeSignLanguagePopup} className='text-gray-600 hover:text-gray-800'>
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>
            <video
              src={selectedVideo}
              controls
              autoPlay
              className='w-full h-auto rounded-md'
            />
          </div>
        </div>
      )}
    </div>
  );
}