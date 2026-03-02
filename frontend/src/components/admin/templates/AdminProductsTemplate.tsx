import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaClipboardList,
  FaStore,
  FaTable,
  FaUserCircle,
} from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { apiUrl } from "../../../lib/api";

interface AdminProduct {
  id: number;
  category_id: number;
  category: string;
  name: string;
  description: string;
  price: number;
  image: string;
  is_available: boolean;
  created_at: string;
}

export const AdminProductsTemplate: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const token = localStorage.getItem("token") || "";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl("/api/admin/products"), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        navigate("/login");
        return;
      }

      if (!res.ok) throw new Error("Gagal ambil produk admin");
      const data: AdminProduct[] = await res.json();
      setProducts(data);
    } catch (e) {
      console.error(e);
      setErrorMessage("Tidak bisa mengambil data produk.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchProducts();
  }, [navigate]);

  const filtered = useMemo(() => {
    const key = search.toLowerCase().trim();
    return products.filter((p) => {
      const bySearch =
        p.name.toLowerCase().includes(key) ||
        (p.description || "").toLowerCase().includes(key);
      const byStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && p.is_available) ||
        (statusFilter === "inactive" && !p.is_available);
      return bySearch && byStatus;
    });
  }, [products, search, statusFilter]);

  const onDelete = async (id: number) => {
    if (!confirm("Hapus produk ini?")) return;
    await fetch(apiUrl(`/api/admin/products/${id}`), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchProducts();
  };

  const statusColor = (isAvailable: boolean) => {
    if (isAvailable === true) return "p-2 bg-green-500 rounded-full text-white";
    if (isAvailable === false) return "p-2 bg-red-500 rounded-full text-white";
    return "p-2 bg-gray-500 rounded-full text-white";
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
              className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-left font-medium bg-[#b153d7]"
              onClick={() => navigate("/admin-products")}
            >
              <FaStore />
              Kelola Produk
            </button>
            <button
              className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-left font-medium hover:bg-[#2838b5]"
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
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold">Manajemen Produk</h1>
              <p className="text-2xl mt-2">
                Kelola Menu, harga, dan Ketersediaan
              </p>
            </div>

            <div className="mt-15 grid gap-3 md:grid-cols-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk..."
                className="rounded bg-white px-3 py-2 text-black"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded bg-white px-3 py-2 text-black"
              >
                <option value="all">Status: Semua</option>
                <option value="active">Status: Aktif</option>
                <option value="inactive">Status: Nonaktif</option>
              </select>
              <div className="flex justify-end">
                <button
                  onClick={() => navigate("/admin-products/create")}
                  className="rounded bg-[#b153d7] px-3 py-2 cursor-pointer hover:bg-[#9c48bd] "
                >
                  + Tambah Produk
                </button>
              </div>
            </div>

            {loading ? <p className="mt-6">Loading...</p> : null}
            {errorMessage ? (
              <p className="mt-6 text-red-200">{errorMessage}</p>
            ) : null}

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {filtered.map((p) => (
                <div key={p.id} className="rounded-lg bg-white p-3 text-black">
                  <img
                    src={
                      p.image ||
                      "https://via.placeholder.com/300x180?text=No+Image"
                    }
                    alt={p.name}
                    className="h-36 w-full rounded object-cover"
                  />
                  <p className="mt-2 font-semibold">{p.name}</p>
                  <p className="text-sm text-gray-600">{p.description}</p>
                  <div className="flex justify-between items-center">
                    <p className="mt-2 text-sm">
                      Rp. {p.price.toLocaleString("id-ID")}
                    </p>
                    <p
                      className={`mt-1 text-xs ${statusColor(p.is_available)}`}
                    >
                      Status: {p.is_available ? "Tersedia" : "Tidak Tersedia"}
                    </p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => navigate(`/admin-products/edit/${p.id}`)}
                      className="rounded bg-blue-500 px-3 py-1 text-white cursor-pointer hover:bg-blue-600"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => onDelete(p.id)}
                      className="rounded bg-red-500 px-3 py-1 text-white cursor-pointer hover:bg-red-600"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
