import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "../organisms/DashboardLayout";
import { LogoutButton } from "../molecules/LogoutButton";
import { FaShoppingCart } from "react-icons/fa";

export const DashboardTemplate: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <DashboardLayout>
      <nav className="bg-[#0E21A0] flex w-full p-5 justify-between">
        <div className="flex items-center">
          <a className="text-white font-bold text-xl" href="/Dashboard">
            Rean Restaurant
          </a>
        </div>
        <div className="flex gap-5">
          <div className="flex items-center">
            <FaShoppingCart className=" text-white text-2xl cursor-pointer" />
          </div>
          <LogoutButton onLogout={handleLogout} />
        </div>
      </nav>
    </DashboardLayout>
  );
};
