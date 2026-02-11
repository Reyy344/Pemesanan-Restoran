import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "../organisms/AuthLayout";
import { AuthForm } from "../molecules/AuthForm";
import { Input } from "../atoms/Input";
import { Link } from "../atoms/Link";

export const LoginTemplate: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:8080/login", {
        email,
        password,
      });

      console.log("INI RESPONSE:", res.data);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.username);

      if (res.data.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch {
      alert("Email / Password salah");
    }
  };

  return (
    <AuthLayout>
      <AuthForm
        title="Login Rean Restoran"
        buttonText="Login"
        onSubmit={handleLogin}
      >
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-4"
        />
        <p className="text-sm text-center mt-4">
          Belum punya akun?{" "}
          <Link to="/register" className="text-blue-700 font-semibold">
            Daftar Disini!
          </Link>
        </p>
      </AuthForm>
    </AuthLayout>
  );
};
