import { useState } from "react";
import axios from "axios";
import "./index.css";
import { Link } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [name, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:8080/register", {
        email,
        name,
        password,
      });
      alert("Register Berhasil");

      window.location.href = "./Login.tsx";
    } catch {
      alert("Registrasi gagal!");
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#4D2FB2]">
      <form
        onSubmit={handleRegister}
        className="bg-white p-8 rounded-2xl shadow-md w-87.5"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">
          Register Sekarang
        </h2>
        <input
          type="text"
          placeholder="Username"
          className="w-full mb-4 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full bg-[#0E21A0] text-white p-3 rounded-lg font-semibold hover:bg-blue-600 transition cursor-pointer">
          Register
        </button>

        <p className="text-sm text-center mt-4">
          Sudah punya akun?{" "}
          <Link
            to="/login"
            className="text-blue-700 font-semibold cursor-pointer"
          >
            Login Disini!
          </Link>
        </p>
      </form>
    </div>
  );
}
