import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaClipboardList,
  FaStore,
  FaTable,
  FaUserCircle,
} from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { apiUrl } from "../../../lib/api";

interface AdminSummary {
  totalRevenue: number;
  totalOrders: number;
  availableTables: number;
  occupiedTables: number;
}

interface AdminTransaction {
  orderId: number;
  customerName: string;
  totalProduct: number;
  totalPrice: number;
  date: string;
  status: string;
}

interface AdminDashboardResponse {
  summary: AdminSummary;
  transactions: AdminTransaction[];
}

export const AdminTemplate: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("Admin");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [summary, setSummary] = useState<AdminSummary>({
    totalRevenue: 0,
    totalOrders: 0,
    availableTables: 0,
    occupiedTables: 0,
  });
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortNewest, setSortNewest] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const storedUsername = localStorage.getItem("username");
    if (storedUsername) setUsername(storedUsername);

    const fetchAdminDashboard = async () => {
      try {
        const response = await fetch(apiUrl("/api/admin/dashboard"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("username");
          navigate("/login");
          return;
        }

        if (response.status === 403) {
          setErrorMessage("Akses hanya untuk admin.");
          setLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error("Gagal mengambil data dashboard admin.");
        }

        const data: AdminDashboardResponse = await response.json();
        setSummary(data.summary);
        setTransactions(data.transactions);
      } catch (error) {
        console.error(error);
        setErrorMessage("Tidak bisa mengambil data admin dari server.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminDashboard();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const filteredTransactions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const byFilter = transactions.filter((item) => {
      if (statusFilter === "all") return true;
      return item.status.toLowerCase() === statusFilter;
    });

    const bySearch = byFilter.filter((item) => {
      if (!keyword) return true;
      return (
        item.customerName.toLowerCase().includes(keyword) ||
        String(item.orderId).includes(keyword)
      );
    });

    return [...bySearch].sort((a, b) => {
      if (sortNewest) return b.orderId - a.orderId;
      return a.orderId - b.orderId;
    });
  }, [search, sortNewest, statusFilter, transactions]);

  const statusLabel = (status: string): string => {
    const map: Record<string, string> = {
      paid: "Paid",
      pending: "Pending",
      process: "Process",
      done: "Done",
      failed: "Failed",
    };
    return map[status.toLowerCase()] || status;
  };

  return (
    <div className="min-h-screen bg-[#4d2fb2] text-white">
      <div className="flex w-full">
        <aside className="min-h-[calc(100vh-224px)] w-[260px] bg-[#071A97] p-6">
          <h2 className="text-xl font-semibold">Rean Restaurant</h2>

          <div className="mt-8 space-y-3">
            <button
              className="flex w-full items-center gap-3 rounded-md bg-[#b153d7] px-4 py-3 text-left font-medium"
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
            <h1 className="text-3xl font-bold">Selamat Datang, {username}</h1>

            {loading ? (
              <p className="mt-8 text-white/90">Memuat data admin...</p>
            ) : errorMessage ? (
              <p className="mt-8 rounded-md bg-red-500/20 px-4 py-3 text-red-100">
                {errorMessage}
              </p>
            ) : (
              <>
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl bg-[#311990] p-5">
                    <p className="text-xs text-white/80">Total Pendapatan</p>
                    <p className="mt-2 text-2xl font-bold">
                      Rp. {summary.totalRevenue.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#311990] p-5">
                    <p className="text-xs text-white/80">Total Order</p>
                    <p className="mt-2 text-2xl font-bold">
                      {summary.totalOrders}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#311990] p-5">
                    <p className="text-xs text-white/80">Meja Tersedia</p>
                    <p className="mt-2 text-2xl font-bold">
                      {summary.availableTables}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#311990] p-5">
                    <p className="text-xs text-white/80">Meja Terpakai</p>
                    <p className="mt-2 text-2xl font-bold">
                      {summary.occupiedTables}
                    </p>
                  </div>
                </div>

                <h2 className="mt-8 text-2xl font-semibold">
                  {filteredTransactions.length} Transaksi Sedang Berlangsung!
                </h2>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-md border border-[#1022a4] bg-white px-3 py-2 text-[#1022a4]"
                  >
                    <option value="all">Status: Semua Termasuk</option>
                    <option value="paid">Status: Paid</option>
                    <option value="pending">Status: Pending</option>
                    <option value="process">Status: Process</option>
                    <option value="done">Status: Done</option>
                    <option value="failed">Status: Failed</option>
                  </select>

                  <select
                    value={sortNewest ? "newest" : "oldest"}
                    onChange={(e) => setSortNewest(e.target.value === "newest")}
                    className="rounded-md border border-[#1022a4] bg-white px-3 py-2 text-[#1022a4]"
                  >
                    <option value="newest">Filter: Transaksi Terbaru</option>
                    <option value="oldest">Filter: Transaksi Terlama</option>
                  </select>

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari ID transaksi atau pembeli"
                    className="rounded-md border border-[#1022a4] bg-white px-3 py-2 text-black placeholder:text-gray-500"
                  />
                </div>

                <div className="mt-4 rounded-xl bg-white p-3 text-black">
                  <div className="max-h-[360px] overflow-y-auto">
                    <table className="w-full min-w-[720px] border-collapse">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b border-black/30 text-left text-sm">
                          <th className="px-4 py-3">OrderID</th>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Total Product</th>
                          <th className="px-4 py-3">Total Price</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-10 text-center text-gray-500"
                            >
                              Belum ada transaksi sesuai filter.
                            </td>
                          </tr>
                        ) : (
                          filteredTransactions.map((item) => (
                            <tr
                              key={item.orderId}
                              className="border-b border-black/10 text-sm"
                            >
                              <td className="px-4 py-3">{item.orderId}</td>
                              <td className="px-4 py-3">{item.customerName}</td>
                              <td className="px-4 py-3">
                                {item.totalProduct} Product
                              </td>
                              <td className="px-4 py-3">
                                Rp. {item.totalPrice.toLocaleString("id-ID")}
                              </td>
                              <td className="px-4 py-3">{item.date}</td>
                              <td className="px-4 py-3">
                                {statusLabel(item.status)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
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
