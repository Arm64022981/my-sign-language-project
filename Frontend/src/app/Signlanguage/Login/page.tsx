"use client";

import React, { useState, FormEvent } from "react";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.access_token);
        router.push("/Signlanguage/Homepage");
      } else {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background: "linear-gradient(45deg, #ffffff 50%, #1e40af 50%)",
      }}
    >
      {/* Left box */}
      <div className="hidden md:flex relative w-1/2 max-w-md h-[450px] rounded-2xl p-12 text-white shadow-lg overflow-hidden bg-gradient-to-r from-blue-800 to-blue-900">
        {/* Circles container */}
        <div className="absolute w-96 h-96">
          <div className="absolute rounded-full bg-blue-900 w-64 h-64 -left-16 top-16 opacity-80"></div>
          <div className="absolute rounded-full bg-blue-800 w-48 h-48 -left-4 top-28 opacity-90"></div>
          <div className="absolute rounded-full bg-blue-700 w-36 h-36 left-12 top-40 opacity-100"></div>
        </div>

        {/* Centered Text content */}
        <div className="relative z-10 flex flex-col justify-center items-start h-full text-left px-8">
          <h2 className="font-extrabold text-4xl mb-4 tracking-wider">WELCOME</h2>
          <p className="text-lg font-semibold">
            Sign Language Translation & Medical History System
          </p>
          <p className="text-sm leading-relaxed max-w-xs mt-2 opacity-80">
            Break communication barriers between healthcare professionals and hearing-impaired patients. Our system provides real-time sign language translation and efficient medical history recording to support doctors and nurses in delivering inclusive care.
          </p>
        </div>

      </div>

      {/* Right box */}
      <div className="w-1/2 max-w-md h-[450px] bg-white rounded-tl-3xl rounded-br-3xl p-10 shadow-lg flex flex-col justify-center">
        <h2 className="text-2xl font-semibold mb-8 text-gray-900">Sign in</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              User Name
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full rounded-md border border-gray-300 bg-gray-100 py-3 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
              <User className="absolute left-3 top-3 text-gray-400" size={20} />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full rounded-md border border-gray-300 bg-gray-100 py-3 pl-10 pr-10 text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-blue-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 transition duration-200"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
