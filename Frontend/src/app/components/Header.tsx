"use client";

import { useRouter } from "next/navigation";
import { FaUser } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { useState, useEffect } from "react";

const Header = () => {
    const [user, setUser] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const loggedInUser = localStorage.getItem('name'); 
        if (loggedInUser) {
            setUser(loggedInUser);
        }
    }, []);

    const handleNavigate = (path: string) => {
        router.push(path);
    };

    return (
        <header className="bg-blue-800 text-white py-4 px-6 shadow-xl drop-shadow-lg fixed top-0 left-0 w-full z-50 transition-all duration-300">
            <div className="container mx-auto flex justify-between items-center">
                <button
                    onClick={() => handleNavigate("/Signlanguage/Homepage")}
                    className="text-3xl font-extrabold tracking-tight cursor-pointer hover:text-blue-300 transition-all duration-300"
                >
                    MediSing
                </button>

                {/* Navigation */}
                <nav>
                    <ul className="flex space-x-8">
                        <li>
                            <button
                                onClick={() => handleNavigate("/Signlanguage/Profile")}
                                className="relative flex items-center text-lg font-medium hover:text-blue-300 transition-all duration-300 group"
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex justify-center items-center shadow-md">
                                    <FaUser className="text-xl text-white" />
                                </div>
                                {user && <span className="ml-2">{user}</span>}
                                <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-blue-300 group-hover:w-full transition-all duration-300"></span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => {
                                    localStorage.removeItem("name"); 
                                    setUser(null);
                                    handleNavigate("/Signlanguage/Login"); 
                                }}
                                className="relative flex items-center text-lg font-medium hover:text-blue-300 transition-all duration-300 group"
                            >
                                <span>ออกจากระบบ</span>
                                <FiLogOut className="text-xl ml-2" />
                                <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-blue-300 group-hover:w-full transition-all duration-300"></span>
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Header;
