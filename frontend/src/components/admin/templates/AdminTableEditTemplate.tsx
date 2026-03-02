import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaClipboardList,
  FaStore,
  FaTable,
  FaUserCircle,
} from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { apiUrl } from "../../../lib/api";

interface AdminTable {
  id: number;
  number: number;
  capacity: number;
  status: "available" | "occupied";
}

export const AdminTableEditTemplate: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const token = localStorage.getItem("token") || "";
  const [number, setNumber] = useState(0);
  const [capacity, setCapacity] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  useEffect(() => {
    const load = async () => {
      if (!token) {
        navigate("/login");
        return;
      }
      if (!id) {
        setErrorMessage("ID meja tidak valid.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(apiUrl(`/api/admin/tables/${id}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: AdminTable | { error?: string } = await res.json();
        if (!res.ok) {
          throw new Error(
            "error" in data ? data.error || "Gagal ambil data meja" : "Error",
          );
        }
        setNumber((data as AdminTable).number);
        setCapacity((data as AdminTable).capacity);
      } catch (e) {
        setErrorMessage(
          e instanceof Error ? e.message : "Gagal mengambil data meja",
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, navigate, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!Number.isInteger(number) || !Number.isInteger(capacity)) {
      setErrorMessage("Nomor meja dan kapasitas harus angka bulat.");
      return;
    }
    if (number <= 0 || capacity <= 0) {
      setErrorMessage("Nomor meja dan kapasitas harus lebih dari 0.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");
      const res = await fetch(apiUrl(`/api/admin/tables/${id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ number, capacity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal update meja");
      navigate("/admin-tables");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Gagal update meja");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#4d2fb2] text-white">
      <div className="flex w-full">
        <aside className="min-h-[calc(100vh-224px)] w-[260px] bg-[#071A97] p-6">
          <h2 className="text-xl font-semibold">Rean Restaurant</h2>

          <div className="mt-8 space-y-3">
            <button
              className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-left font-medium hover:bg-[#2838b5]"
              onClick={() => navigate("/admin-dashboard")}
            >
              <MdDashboard />
              Dashboard
            </button>
            <button
              className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-left font-medium hover:bg-[#2838b5]"
              onClick={() => navigate("/admin-products")}
            >
              <FaStore />
              Kelola Produk
            </button>
            <button
              className="flex w-full items-center gap-3 rounded-md bg-[#b153d7] px-4 py-3 text-left font-medium"
              onClick={() => navigate("/admin-tables")}
            >
              <FaTable />
              Kelola Meja
            </button>
            <button
              className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-left font-medium hover:bg-[#2838b5]"
              onClick={() => navigate("/admin-transactions")}
            >
              <FaClipboardList />
              Transaksi
            </button>
            <button
              className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-left font-medium hover:bg-[#2838b5]"
              onClick={() => navigate("/admin-account")}
            >
              <FaUserCircle />
              Kelola Akun
            </button>
          </div>
        </aside>

        <main className="flex-1">
          <div className="flex items-center justify-end bg-[#0E21A0] px-8 py-4">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md bg-red-500 px-5 py-2 text-sm font-semibold hover:bg-red-600"
            >
              Logout
            </button>
          </div>

          <div className="p-8">
            <h1 className="text-3xl font-bold">Edit Meja</h1>
            <p className="mt-2 text-xl">Ubah nomor meja dan kapasitas</p>

            {loading ? <p className="mt-6">Loading data meja...</p> : null}
            {errorMessage ? (
              <p className="mt-6 text-red-200">{errorMessage}</p>
            ) : null}

            {!loading ? (
              <form
                onSubmit={handleSubmit}
                className="mt-8 max-w-xl rounded-xl bg-white p-6 text-black"
              >
                <label className="mb-2 block text-sm font-semibold">
                  Nomor Meja
                </label>
                <input
                  type="number"
                  min={1}
                  value={number}
                  onChange={(e) => setNumber(Number(e.target.value))}
                  className="mb-4 w-full rounded border px-3 py-2"
                />

                <label className="mb-2 block text-sm font-semibold">
                  Kapasitas
                </label>
                <input
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="mb-6 w-full rounded border px-3 py-2"
                />

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-70"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/admin-tables")}
                    className="rounded bg-gray-300 px-4 py-2 text-black hover:bg-gray-400"
                  >
                    Batal
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </main>
      </div>
      <footer className="mt-8 bg-[#3B2A8F] text-white">
        <div className="grid w-full gap-10 px-10 py-10 md:grid-cols-3">
          <div>
            <h2 className="text-2xl font-semibold">Rean Restaurant</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/85">
              Rean Restaurant adalah sebuah restoran dengan makanan siap saji
              dan sehat. Dengan memudahkan dalam hal pemesanan.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Tentang kami</h2>
            <ul className="mt-3 space-y-2 text-sm text-white/85">
              <li>Tentang Kami</li>
              <li>Syarat & Ketentuan</li>
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Kontak Kami</h2>
            <ul className="mt-3 space-y-2 text-sm text-white/85">
              <li>support@reanresto.com</li>
              <li>(021) 857-1557</li>
            </ul>
          </div>
        </div>

        <div className="mx-10 border-t border-white/30" />
        <p className="py-6 text-center text-sm">
          © 2026 Rean Restaurant. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
};
