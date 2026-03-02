import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaClipboardList,
  FaEllipsisV,
  FaStore,
  FaTable,
  FaUserCircle,
} from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { apiUrl } from "../../../lib/api";

interface AdminTableBooking {
  orderId: number;
  userId: number;
  customerName: string;
  guestCount: number;
  status: "pending" | "process" | "paid";
  createdAt: string;
  totalItems: number;
  totalPrice: number;
}

interface AdminTable {
  id: number;
  number: number;
  capacity: number;
  status: "available" | "occupied";
  currentBooking?: AdminTableBooking;
}

interface AdminOrderItem {
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface AdminOrderDetail {
  order_id: number;
  order_code: string;
  meja_id: number;
  meja_number: number;
  customer_name: string;
  jumlah_orang: number;
  status: string;
  total_price: number;
  items: AdminOrderItem[];
}

type TableStatus = "available" | "reserved" | "occupied";
type LogicalStatus = "all" | TableStatus;

const toLogicalStatus = (table: AdminTable): TableStatus => {
  if (table.status === "available") return "available";
  if (table.currentBooking?.status === "pending") return "reserved";
  return "occupied";
};

const statusBadgeClass = (status: LogicalStatus) => {
  if (status === "available") return "bg-green-500 text-white";
  if (status === "reserved") return "bg-yellow-500 text-white";
  if (status === "occupied") return "bg-red-500 text-white";
  return "bg-gray-500 text-white";
};

const statusLabel = (status: LogicalStatus) => {
  if (status === "available") return "Available";
  if (status === "reserved") return "Reserved";
  if (status === "occupied") return "Occupied";
  return "Semua";
};

export const AdminTablesTemplate: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token") || "";
  const [tables, setTables] = useState<AdminTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<LogicalStatus>("all");
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [selectedTable, setSelectedTable] = useState<AdminTable | null>(null);
  const [orderDetail, setOrderDetail] = useState<AdminOrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const fetchTables = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const res = await fetch(apiUrl("/api/admin/tables"), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        navigate("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal ambil data meja");
      setTables(data);
      return data as AdminTable[];
    } catch (e) {
      setErrorMessage(
        e instanceof Error ? e.message : "Gagal mengambil data meja",
      );
    } finally {
      setLoading(false);
    }
    return null;
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchTables();
  }, [navigate, token]);

  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      if (statusFilter === "all") return true;
      return toLogicalStatus(table) === statusFilter;
    });
  }, [tables, statusFilter]);

  const statusCount = useMemo(() => {
    return tables.reduce(
      (acc, table) => {
        const state = toLogicalStatus(table);
        acc[state] += 1;
        return acc;
      },
      { available: 0, reserved: 0, occupied: 0 } as Record<TableStatus, number>,
    );
  }, [tables]);

  const closeDetailPopup = () => {
    setSelectedTable(null);
    setOrderDetail(null);
    setDetailError("");
  };

  const openDetailPopup = async (table: AdminTable) => {
    setSelectedTable(table);
    setOrderDetail(null);
    setDetailError("");

    if (!table.currentBooking?.orderId) return;

    try {
      setDetailLoading(true);
      const res = await fetch(
        apiUrl(`/api/admin/orders/${table.currentBooking.orderId}`),
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal ambil detail order");
      setOrderDetail(data);
    } catch (e) {
      setDetailError(
        e instanceof Error ? e.message : "Gagal mengambil detail order",
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const callTableAction = async (tableID: number, endpoint: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(apiUrl(endpoint), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Aksi gagal");

      const refreshedTables = await fetchTables();
      if (!refreshedTables) {
        closeDetailPopup();
        return;
      }
      const latestTable =
        refreshedTables.find((item) => item.id === tableID) || null;
      setSelectedTable(latestTable);
      if (!latestTable?.currentBooking) {
        setOrderDetail(null);
      } else {
        await openDetailPopup(latestTable);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Aksi gagal");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddTable = async () => {
    const numberInput = window.prompt("Nomor meja:", "");
    if (numberInput === null) return;
    const capacityInput = window.prompt("Kapasitas meja:", "4");
    if (capacityInput === null) return;

    const number = Number(numberInput);
    const capacity = Number(capacityInput);
    if (!Number.isInteger(number) || !Number.isInteger(capacity)) {
      alert("Nomor meja dan kapasitas harus angka bulat.");
      return;
    }
    if (number <= 0 || capacity <= 0) {
      alert("Nomor meja dan kapasitas harus lebih dari 0.");
      return;
    }

    try {
      const res = await fetch(apiUrl("/api/admin/tables"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ number, capacity }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal tambah meja");
      await fetchTables();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal tambah meja");
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
            <h1 className="text-3xl font-bold">Pengelolaan Meja</h1>
            <p className="mt-2 text-xl">
              Ringkasan peta lantai restoran dan status meja
            </p>

            <div className="mt-6 flex flex-col gap-3 rounded-lg bg-[#5f40c9] p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`rounded-full px-3 py-1 text-sm ${
                    statusFilter === "all"
                      ? "bg-white text-[#3c2b8a]"
                      : "bg-white/20 text-white"
                  }`}
                >
                  Semua ({tables.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("available")}
                  className={`rounded-full px-3 py-1 text-sm ${
                    statusFilter === "available"
                      ? "bg-white text-[#3c2b8a]"
                      : "bg-white/20 text-white"
                  }`}
                >
                  Available ({statusCount.available})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("reserved")}
                  className={`rounded-full px-3 py-1 text-sm ${
                    statusFilter === "reserved"
                      ? "bg-white text-[#3c2b8a]"
                      : "bg-white/20 text-white"
                  }`}
                >
                  Reserved ({statusCount.reserved})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("occupied")}
                  className={`rounded-full px-3 py-1 text-sm ${
                    statusFilter === "occupied"
                      ? "bg-white text-[#3c2b8a]"
                      : "bg-white/20 text-white"
                  }`}
                >
                  Occupied ({statusCount.occupied})
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddTable}
                className="rounded-lg bg-[#0E21A0] px-4 py-2 font-semibold hover:bg-blue-900"
              >
                + Add Table
              </button>
            </div>

            {loading ? <p className="mt-6">Loading meja...</p> : null}
            {errorMessage ? (
              <p className="mt-6 text-red-200">{errorMessage}</p>
            ) : null}

            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredTables.map((table) => {
                const logicalStatus = toLogicalStatus(table);

                return (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => openDetailPopup(table)}
                    className="group relative rounded-xl bg-[#7f63cf] p-4 text-left shadow-lg transition hover:bg-[#8a6fd8]"
                  >
                    <div className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId((prev) =>
                            prev === table.id ? null : table.id,
                          );
                        }}
                        className="rounded px-2 py-1 text-white/85 hover:bg-white/20"
                      >
                        <FaEllipsisV />
                      </button>

                      {menuOpenId === table.id ? (
                        <div
                          className="absolute right-0 z-10 mt-1 w-28 rounded bg-white p-1 text-black shadow-xl"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/admin-tables/edit/${table.id}`)
                            }
                            className="w-full rounded px-2 py-1 text-left text-sm hover:bg-gray-100"
                          >
                            Edit Meja
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/admin-tables/delete/${table.id}`)
                            }
                            className="w-full rounded px-2 py-1 text-left text-sm text-red-600 hover:bg-red-50"
                          >
                            Hapus Meja
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <div
                      className={`inline-block rounded-full px-2 py-1 text-[11px] font-semibold ${statusBadgeClass(logicalStatus)}`}
                    >
                      {statusLabel(logicalStatus)}
                    </div>

                    <h3 className="mt-6 text-3xl font-bold">
                      Meja {table.number}
                    </h3>
                    <p className="mt-1 text-base">
                      {table.currentBooking?.guestCount || 0} Orang{" "}
                      {table.currentBooking
                        ? `(${table.currentBooking.customerName})`
                        : ""}
                    </p>

                    <div className="mt-6 border-t border-white/25 pt-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Jumlah Order:</span>
                        <span>
                          {table.currentBooking?.totalItems
                            ? table.currentBooking.totalItems
                            : "-"}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <span>Total:</span>
                        <span>
                          Rp{" "}
                          {(
                            table.currentBooking?.totalPrice || 0
                          ).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {selectedTable ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          onClick={closeDetailPopup}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white p-6 text-black"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Detail Meja</p>
                <h2 className="text-2xl font-bold">
                  Meja {selectedTable.number}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDetailPopup}
                className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
              >
                Tutup
              </button>
            </div>

            {!selectedTable.currentBooking ? (
              <div className="mt-6 rounded-lg bg-gray-100 p-4">
                Meja ini belum ada booking aktif.
              </div>
            ) : detailLoading ? (
              <p className="mt-6">Loading detail order...</p>
            ) : detailError ? (
              <p className="mt-6 text-red-600">{detailError}</p>
            ) : orderDetail ? (
              <div className="mt-6 space-y-4">
                <div className="grid gap-2 rounded-lg bg-gray-100 p-4 text-sm md:grid-cols-2">
                  <p>
                    <span className="font-semibold">Customer:</span>{" "}
                    {orderDetail.customer_name}
                  </p>
                  <p>
                    <span className="font-semibold">Jumlah Orang:</span>{" "}
                    {orderDetail.jumlah_orang}
                  </p>
                  <p>
                    <span className="font-semibold">Order Code:</span>{" "}
                    {orderDetail.order_code}
                  </p>
                  <p>
                    <span className="font-semibold">Status:</span>{" "}
                    {orderDetail.status}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200">
                  <div className="border-b bg-gray-50 px-4 py-2 font-semibold">
                    Item Pesanan
                  </div>
                  <div className="max-h-56 overflow-auto">
                    {orderDetail.items.map((item, idx) => (
                      <div
                        key={`${item.product_name}-${idx}`}
                        className="flex items-center justify-between border-b px-4 py-2 text-sm last:border-b-0"
                      >
                        <span>
                          {item.product_name} ({item.quantity}x)
                        </span>
                        <span>Rp {item.subtotal.toLocaleString("id-ID")}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between border-t bg-gray-50 px-4 py-3 font-semibold">
                    <span>Total</span>
                    <span>
                      Rp {orderDetail.total_price.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedTable.currentBooking.status === "pending" ? (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() =>
                        callTableAction(
                          selectedTable.id,
                          `/api/admin/tables/${selectedTable.id}/approve`,
                        )
                      }
                      className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-70"
                    >
                      Setujui Meja
                    </button>
                  ) : null}

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() =>
                      callTableAction(
                        selectedTable.id,
                        `/api/admin/tables/${selectedTable.id}/complete`,
                      )
                    }
                    className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-70"
                  >
                    Selesaikan Pesanan
                  </button>
                </div>
              </div>
            ) : null}
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
        <p className="py-6 text-center text-sm">
          © 2026 Rean Restaurant. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
};
