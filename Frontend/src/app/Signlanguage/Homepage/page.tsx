"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import history from "@/public/history.png";
import checkup from "@/public/checkup.png";
import report from "@/public/report.png";
import download from "@/public/download.jpeg";

const HomePage = () => {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <section
      className="min-h-screen flex justify-center items-center pt-24 pb-12 bg-gradient-to-br from-blue-50 via-white to-blue-100"
      style={{ position: "relative", overflow: "hidden" }}
    >
      {/* รูปแบบพื้นหลังที่มีลวดลายทางการแพทย์ */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230066cc' fill-opacity='0.4'%3E%3Cpath d='M36 34c0-2.21-1.79-4-4-4s-4 1.79-4 4 1.79 4 4 4 4-1.79 4-4zm0-28c0-2.21-1.79-4-4-4s-4 1.79-4 4 1.79 4 4 4 4-1.79 4-4zm-12 14c0-2.21-1.79-4-4-4s-4 1.79-4 4 1.79 4 4 4 4-1.79 4-4zm24 14c0-2.21-1.79-4-4-4s-4 1.79-4 4 1.79 4 4 4 4-1.79 4-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* เนื้อหาหลัก */}
      <div className="container mx-auto flex flex-col lg:flex-row justify-between items-center gap-12 relative z-10 px-6">
        {/* ส่วนข้อความ (ด้านซ้าย) */}
        <div className="text-left max-w-xl transition-opacity duration-700 ease-out opacity-100">
          <h1 className="text-4xl lg:text-6xl font-extrabold text-blue-900 uppercase tracking-tight leading-tight">
            Sign Language Detection and Medical History Tool for Deaf Patients
          </h1>
          <p className="mt-6 text-lg text-gray-700 leading-relaxed">
            A web application designed to help doctors and nurses communicate effectively with patients who are deaf or hard of hearing. By using real-time sign language detection and an easy-to-use medical history interface, the system reduces communication barriers and supports more accurate, accessible care—without the need for an interpreter.
          </p>
        </div>

        {/* ส่วนการ์ด */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {[
            { src: history, alt: "ประวัติผู้ป่วย", label: "Patient History", path: "/Signlanguage/Patient" },
            { src: checkup, alt: "การตรวจสุขภาพ", label: "Medical Checkup", path: "/Signlanguage/Takehistory" },
            { src: report, alt: "รายงาน", label: "Reports", path: "/Signlanguage/Reportt" },
            { src: download, alt: "การวินิจฉัย", label: "Diagnosis", path: "/Signlanguage/Diagnose" },
          ].map((card, index) => (
            <button
              key={index}
              className="w-56 h-64 bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-500 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-300 group"
              onClick={() => handleNavigate(card.path)}
            >
              <div className="relative h-3/4 bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
                <Image
                  src={card.src}
                  alt={card.alt}
                  width={100}
                  height={100}
                  className="object-contain transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="h-1/4 flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                <p className="text-sm font-semibold tracking-wide transition-transform duration-300 group-hover:scale-105">
                  {card.label}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomePage;
