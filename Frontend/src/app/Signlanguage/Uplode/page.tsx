// "use client";

// import { useState, useRef } from "react";
// import { FaVideo, FaUpload } from "react-icons/fa";

// const VideoUploadComponent = () => {
//   const [videoFile, setVideoFile] = useState<File | null>(null);
//   const [videoTitle, setVideoTitle] = useState("");
//   const [videoDescription, setVideoDescription] = useState("");
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       setVideoFile(file);
//     }
//   };

//   const handleUpload = () => {
//     if (!videoFile || !videoTitle || !videoDescription) {
//       alert("กรุณากรอกข้อมูลให้ครบถ้วน");
//       return;
//     }

//     console.log("Uploading video:", {
//       file: videoFile,
//       title: videoTitle,
//       description: videoDescription,
//     });

//     alert("อัปโหลดวิดีโอสำเร็จ!");

//     // รีเซ็ตฟอร์ม
//     setVideoFile(null);
//     setVideoTitle("");
//     setVideoDescription("");

//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-6">
//       <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
//         <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center">
//           <FaVideo className="mr-2 text-blue-500" /> อัปโหลดวิดีโอภาษามือ
//         </h2>

//         <div
//           className="border-4 border-dashed border-gray-300 rounded-xl p-6 mb-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors duration-200"
//           onClick={() => fileInputRef.current?.click()}
//         >
//           <input
//             type="file"
//             accept="video/*"
//             ref={fileInputRef}
//             onChange={handleFileChange}
//             className="hidden"
//           />
//           {videoFile ? (
//             <p className="text-gray-700 font-medium">{videoFile.name}</p>
//           ) : (
//             <>
//               <div className="bg-blue-500 text-white rounded-full p-3 mb-2">
//                 <FaUpload size={24} />
//               </div>
//               <p className="text-gray-500">คลิกเพื่อเลือกวิดีโอ</p>
//             </>
//           )}
//         </div>

//         <div className="mb-4">
//           <label className="block text-gray-700 font-medium mb-2">ชื่อวิดีโอ</label>
//           <input
//             type="text"
//             value={videoTitle}
//             onChange={(e) => setVideoTitle(e.target.value)}
//             placeholder="เช่น การทักทายในภาษามือ"
//             className="text-black w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
//           />
//         </div>

//         <div className="mb-6">
//           <label className="block text-gray-700 font-medium mb-2">คำอธิบายวิดีโอ</label>
//           <textarea
//             value={videoDescription}
//             onChange={(e) => setVideoDescription(e.target.value)}
//             placeholder="อธิบายเกี่ยวกับวิดีโอนี้"
//             className="text-black w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 h-32 resize-none"
//           />
//         </div>

//         <button
//           onClick={handleUpload}
//           className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center"
//         >
//           <FaUpload className="mr-2" /> อัปโหลด
//         </button>
//       </div>
//     </div>
//   );
// };

// export default VideoUploadComponent;
