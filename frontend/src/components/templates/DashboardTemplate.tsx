import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "../organisms/DashboardLayout";
import { LogoutButton } from "../molecules/LogoutButton";

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
      <h1 className="text-3xl font-bold">User Dashboard</h1>
      <LogoutButton onLogout={handleLogout} />
    </DashboardLayout>
  );
};
