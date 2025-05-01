import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "outline" | "filled" | "secondary";  
  size?: "sm" | "md" | "lg"; // เพิ่ม size
}

export const Button: React.FC<ButtonProps> = ({ variant = "filled", size = "md", children, ...props }) => {
  const variantClasses = {
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white",
    filled: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-600 text-white hover:bg-gray-700",
  };

  // กำหนดขนาดให้กับปุ่ม
  const sizeClasses = {
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={`rounded-md ${variantClasses[variant]} ${sizeClasses[size]}`}
      {...props}
    >
      {children}
    </button>
  );
};
