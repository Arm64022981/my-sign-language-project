"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import history from "@/public/history.png";
import checkup from "@/public/checkup.png";
import report from "@/public/report.png";
import download from "@/public/download.jpeg";
import bg from "@/public/bg.jpg";

const HomePage = () => {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <section
      className="min-h-screen flex justify-center items-center pt-24 pb-12"
      style={{
        backgroundImage: `url(${bg.src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
      }}
    >

      {/* เนื้อหาหลัก */}
      <div className="container mx-auto flex flex-col lg:flex-row justify-between items-center gap-8 relative z-10 px-4">
        {/* ส่วนข้อความ (ด้านซ้าย) */}
        <div className="text-left max-w-lg">
          <h1 className="text-4xl lg:text-5xl font-bold text-white uppercase tracking-wide leading-tight">
            Artificial Intelligence Supporting Sign Language Translator
          </h1>
          <p className="mt-4 text-lg text-white opacity-90">
            We enable hearing impaired and deaf individuals who have difficulty in understanding what they read or are illiterate to access information, services and video content with the ai powered sign language, which is their mother tongue.
          </p>
        </div>

        {/* ส่วนการ์ด */}
        <div className="flex flex-row gap-3 justify-center">
          {[
            { src: history, alt: "ประวัติผู้ป่วย", label: "ประวัติผู้ป่วย", path: "/Signlanguage/Patient" },
            { src: checkup, alt: "รายการซักประวัติ", label: "รายการซักประวัติ", path: "/Signlanguage/Takehistory" },
            { src: report, alt: "รายงาน", label: "รายงาน", path: "/Signlanguage/Reportt" },
            { src: download, alt: "วินิฉัย", label: "วินิฉัย", path: "/Signlanguage/Diagnose" },
          ].map((card, index) => (
            <button
              key={index}
              className="w-44 h-52 bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-500 hover:scale-105 hover:shadow-2xl group"
              onClick={() => handleNavigate(card.path)}
            >
              <div className="relative h-3/4 bg-gradient-to-b from-gray-100 to-white flex items-center justify-center">
                <Image
                  src={card.src}
                  alt={card.alt}
                  width={80} 
                  height={80}
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="h-1/4 flex items-center justify-center bg-gradient-to-r from-gray-300 to-gray-500 text-white">
                <p className="text-sm font-semibold tracking-wide group-hover:scale-105 transition-transform duration-300">
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