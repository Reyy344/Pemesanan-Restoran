import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "../organisms/AuthLayout";
import { AuthForm } from "../molecules/AuthForm";
import { Input } from "../atoms/Input";
import { Link } from "../atoms/Link";

export const RegisterTemplate: React.FC = () => {
  const [email, setEmail] = useState("");
  const [name, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:8080/register", {
        email,
        name,
        password,
      });
      alert("Register Berhasil");
      navigate("/login");
    } catch {
      alert("Registrasi gagal!");
    }
  };

  return (
    <AuthLayout>
      <AuthForm
        title="Register Sekarang"
        buttonText="Register"
        onSubmit={handleRegister}
      >
        <Input
          type="text"
          placeholder="Username"
          value={name}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-4"
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-4"
        />
        <p className="text-sm text-center mt-4">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-blue-700 font-semibold">
            Login Disini!
          </Link>
        </p>
      </AuthForm>
    </AuthLayout>
  );
};
