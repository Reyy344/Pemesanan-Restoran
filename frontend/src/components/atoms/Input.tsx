import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa6";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  className,
  type,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";

  return (
    <div className="flex flex-col">
      {label && (
        <label className="mb-1 text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          type={isPassword && showPassword ? "text" : type}
          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isPassword ? "pr-10" : ""
          } ${className}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-10 -translate-y-1/2 text-gray-500 cursor-pointer"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        )}
      </div>
    </div>
  );
};
