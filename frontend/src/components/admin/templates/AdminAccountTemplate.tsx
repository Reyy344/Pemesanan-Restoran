import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaClipboardList,
  FaEye,
  FaStore,
  FaTable,
  FaUserCircle,
} from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { apiUrl } from "../../../lib/api";

interface AdminAccount {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
}

interface AdminAccountsResponse {
  accounts: AdminAccount[];
}

export const AdminAccountTemplate: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [selectedAccount, setSelectedAccount] = useState<AdminAccount | null>(
    null,
  );
  const [actionLoading, setActionLoading] = useState(false);

  const token = localStorage.getItem("token") || "";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const response = await fetch(apiUrl("/api/admin/accounts"), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        navigate("/login");
        return;
      }

      if (response.status === 403) {
        setErrorMessage("Akses hanya untuk admin.");
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Gagal mengambil data akun.");
      }

      const data: AdminAccountsResponse = await response.json();
      setAccounts(data.accounts);
    } catch (error) {
      console.error(error);
      setErrorMessage("Tidak bisa mengambil data akun dari server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchAccounts();
  }, [navigate, token]);

  const filteredAccounts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return accounts.filter((item) => {
      const byRole = roleFilter === "all" || item.role === roleFilter;
      const bySearch =
        keyword === "" ||
        item.email.toLowerCase().includes(keyword) ||
        item.name.toLowerCase().includes(keyword) ||
        String(item.id).includes(keyword);
      return byRole && bySearch;
    });
  }, [accounts, roleFilter, search]);

  const accountSummary = useMemo(() => {
    return accounts.reduce(
      (acc, item) => {
        if (item.role === "admin") acc.admin += 1;
        if (item.role === "user") acc.user += 1;
        return acc;
      },
      { admin: 0, user: 0 },
    );
  }, [accounts]);

  const closeActionModal = () => {
    if (actionLoading) return;
    setSelectedAccount(null);
  };

  const changeRole = async (
    account: AdminAccount,
    nextRole: "admin" | "user",
  ) => {
    try {
      setActionLoading(true);
      const response = await fetch(apiUrl(`/api/admin/accounts/${account.id}/role`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: nextRole }),
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        navigate("/login");
        return;
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Gagal mengubah role akun.");
      }

      setAccounts((prev) =>
        prev.map((item) =>
          item.id === account.id ? { ...item, role: nextRole } : item,
        ),
      );
      setSelectedAccount((prev) =>
        prev && prev.id === account.id ? { ...prev, role: nextRole } : prev,
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal mengubah role akun.");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteAccount = async (account: AdminAccount) => {
    const ok = window.confirm(
      `Yakin mau hapus akun ${account.email}? Aksi ini tidak bisa dibatalkan.`,
    );
    if (!ok) return;

    try {
      setActionLoading(true);
      const response = await fetch(apiUrl(`/api/admin/accounts/${account.id}`), {
        method: "DELETE",
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

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Gagal menghapus akun.");
      }

      setAccounts((prev) => prev.filter((item) => item.id !== account.id));
      setSelectedAccount(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal menghapus akun.");
    } finally {
      setActionLoading(false);
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
              className="flex w-full items-center gap-3 rounded-md bg-[#b153d7] px-4 py-3 text-left font-medium"
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
            <h1 className="text-3xl font-bold">Kelola Akun</h1>
            <p className="mt-2 text-xl">Manajemen role akun admin dan user</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-[#311990] p-5">
                <p className="text-xs text-white/80">Total Akun</p>
                <p className="mt-2 text-2xl font-bold">{accounts.length}</p>
              </div>
              <div className="rounded-xl bg-[#311990] p-5">
                <p className="text-xs text-white/80">Admin</p>
                <p className="mt-2 text-2xl font-bold">{accountSummary.admin}</p>
              </div>
              <div className="rounded-xl bg-[#311990] p-5">
                <p className="text-xs text-white/80">User</p>
                <p className="mt-2 text-2xl font-bold">{accountSummary.user}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as "all" | "admin" | "user")}
                className="rounded-md border border-[#1022a4] bg-white px-3 py-2 text-[#1022a4]"
              >
                <option value="all">Role: Semua</option>
                <option value="admin">Role: Admin</option>
                <option value="user">Role: User</option>
              </select>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari ID, nama, atau email"
                className="md:col-span-2 rounded-md border border-[#1022a4] bg-white px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            {loading ? (
              <p className="mt-8 text-white/90">Memuat data akun...</p>
            ) : errorMessage ? (
              <p className="mt-8 rounded-md bg-red-500/20 px-4 py-3 text-red-100">
                {errorMessage}
              </p>
            ) : (
              <div className="mt-6 rounded-xl bg-white p-3 text-black">
                <div className="max-h-[420px] overflow-y-auto">
                  <table className="w-full min-w-[720px] border-collapse">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-black/30 text-left text-sm">
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Nama</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAccounts.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-10 text-center text-gray-500"
                          >
                            Belum ada akun sesuai filter.
                          </td>
                        </tr>
                      ) : (
                        filteredAccounts.map((item) => {
                          return (
                            <tr key={item.id} className="border-b border-black/10 text-sm">
                              <td className="px-4 py-3">{item.id}</td>
                              <td className="px-4 py-3">{item.name || "-"}</td>
                              <td className="px-4 py-3">{item.email}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                    item.role === "admin"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {item.role}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() => setSelectedAccount(item)}
                                  className="rounded bg-[#4d2fb2] p-2 text-white hover:bg-[#3d2490]"
                                  aria-label={`Lihat aksi akun ${item.email}`}
                                >
                                  <FaEye />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {selectedAccount ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          onClick={closeActionModal}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 text-black"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Aksi Akun</p>
                <h2 className="text-xl font-bold">
                  {selectedAccount.name || selectedAccount.email}
                </h2>
                <p className="mt-1 text-sm text-gray-600">{selectedAccount.email}</p>
              </div>
              <button
                type="button"
                onClick={closeActionModal}
                disabled={actionLoading}
                className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300 disabled:opacity-70"
              >
                Tutup
              </button>
            </div>

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() =>
                  changeRole(
                    selectedAccount,
                    selectedAccount.role === "admin" ? "user" : "admin",
                  )
                }
                className="rounded bg-[#4d2fb2] px-4 py-2 text-white hover:bg-[#3d2490] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {actionLoading
                  ? "Memproses..."
                  : selectedAccount.role === "admin"
                    ? "Ganti jadi User"
                    : "Ganti jadi Admin"}
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={() => deleteAccount(selectedAccount)}
                className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {actionLoading ? "Memproses..." : "Hapus Akun"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
        <p className="py-6 text-center text-sm">© 2026 Rean Restaurant. All Rights Reserved.</p>
      </footer>
    </div>
  );
};
