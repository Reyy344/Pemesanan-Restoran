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

export const AdminTableDeleteTemplate: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const token = localStorage.getItem("token") || "";
  const [table, setTable] = useState<AdminTable | null>(null);
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
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal ambil data meja");
        setTable(data);
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

  const handleDelete = async () => {
    if (!id) return;
    const ok = window.confirm("Yakin mau hapus meja ini?");
    if (!ok) return;

    try {
      setSubmitting(true);
      setErrorMessage("");
      const res = await fetch(apiUrl(`/api/admin/tables/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus meja");
      navigate("/admin-tables");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Gagal menghapus meja");
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
            <h1 className="text-3xl font-bold">Hapus Meja</h1>
            <p className="mt-2 text-xl">Konfirmasi penghapusan meja</p>

            {loading ? <p className="mt-6">Loading data meja...</p> : null}
            {errorMessage ? (
              <p className="mt-6 text-red-200">{errorMessage}</p>
            ) : null}

            {!loading && table ? (
              <div className="mt-8 max-w-xl rounded-xl bg-white p-6 text-black">
                <p className="text-lg">
                  Meja <span className="font-bold">{table.number}</span> (
                  kapasitas {table.capacity} orang)
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Kalau meja ini punya booking aktif atau punya riwayat order,
                  API akan menolak hapus.
                </p>

                <div className="mt-6 flex gap-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleDelete}
                    className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-70"
                  >
                    Ya, Hapus Meja
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/admin-tables")}
                    className="rounded bg-gray-300 px-4 py-2 text-black hover:bg-gray-400"
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
};
