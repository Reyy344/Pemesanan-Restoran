import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "../organisms/AdminLayout";
import { LogoutButton } from "../molecules/LogoutButton";

export const AdminTemplate: React.FC = () => {
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
    <AdminLayout>
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <LogoutButton onLogout={handleLogout} />
    </AdminLayout>
  );
};
