"use client";

import { useRef, useState } from "react";

const WebcamComponent = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);

  const startCamera = async () => {
    try {
      const streamData = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(streamData);
      if (videoRef.current) {
        videoRef.current.srcObject = streamData;
      }
      setIsCameraOn(true);
    } catch (error) {
      console.error("Error accessing webcam:", error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraOn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex flex-col items-center justify-start pt-24 p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <h2 className="text-3xl font-bold text-gray-800 text-center">
          <span className="inline-block mr-2">📷</span> กล้องเว็บแคม
        </h2>

        <div className="relative overflow-hidden rounded-xl border-4 border-gray-200 shadow-md mt-13">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-[640px] h-[480px] object-cover bg-black"
          />
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isCameraOn ? 'opacity-0' : 'opacity-100'}`}>
            <div className="bg-gray-800 bg-opacity-75 p-4 rounded-lg text-white text-center">
              <p className="text-lg">กด "เปิดกล้อง" เพื่อเริ่มใช้งาน</p>
            </div>
          </div>
        </div>


        <div className="mt-8 flex justify-center">
          {isCameraOn ? (
            <button
              onClick={stopCamera}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-lg 
              shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200"
            >
              ปิดกล้อง
            </button>
          ) : (
            <button
              onClick={startCamera}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg 
              shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200"
            >
              เปิดกล้อง
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebcamComponent;
