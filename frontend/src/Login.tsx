import React, { useState } from "react";
import axios from "axios";
import "./index.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  //   const [loading, setLoading] = useState(true);
  //   const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:8080/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);

      alert("Login Berhasil!");

      window.location.href = "/dashboard";
    } catch {
      alert("Email / Password salah");
    }
  };

  //   if (loading)
  //     return (
  //       <div className="container">
  //         <p>Loading...</p>
  //       </div>
  //     );
  //   if (error)
  //     return (
  //       <div className="container">
  //         <p style={{ color: "red" }}>Error: {error}</p>
  //       </div>
  //     );

  return (
    <div className="min-h-screen flex items-center justify-center bg-#4D2FB2">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-md w-[350px]"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Login Sekarang</h2>
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

        <button className="w-full bg-#0E21A0 text-white p-3 rounded-lg font-semibold hover:bg-blue-600 transition">
          Login
        </button>

        <p className="text-sm text-center mt-4">
          Belum punya akun?{" "}
          <a href="/register" className="text-blue-700 font-semibold">
            Daftar Disini!
          </a>
        </p>
      </form>
    </div>
  );
}
