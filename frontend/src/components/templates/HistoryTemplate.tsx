import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaShoppingCart, FaHistory } from "react-icons/fa";
import { QRCodeSVG } from "qrcode.react";
import { HistoryLayout } from "../organisms/HistoryLayout";
import { LogoutButton } from "../molecules/LogoutButton";
import { apiUrl } from "../../lib/api";

interface OrderHistoryItem {
  order_id: number;
  order_code: string;
  meja_number: number;
  total_price: number;
  status: "pending" | "process" | "paid" | "failed" | "done";
  payment_method: string;
  item_count: number;
  created_at: string;
}

interface OrderDetailItem {
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
  image: string;
}

interface OrderDetailResponse {
  order_id: number;
  order_code: string;
  total_price: number;
  items: OrderDetailItem[];
}

export const HistoryTemplate: React.FC = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "guest";
  const cartKey = `cart_${username}`;
  const token = localStorage.getItem("token");

  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<OrderHistoryItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderHistoryItem | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrderDetailResponse | null>(null);
  const [loadingModalDetail, setLoadingModalDetail] = useState(false);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem(cartKey) || "[]");
    setCartCount(cart.length);
  }, [cartKey]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(apiUrl("/api/orders/history"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = (await res.json()) as OrderHistoryItem[] | { error?: string };
        if (!res.ok) {
          throw new Error((data as { error?: string }).error || "Gagal ambil history");
        }

        setHistory(data as OrderHistoryItem[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal ambil history");
      } finally {
        setLoading(false);
      }
    };

    void fetchHistory();
  }, [navigate, token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const handleOpenPaidDetail = async (item: OrderHistoryItem) => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (item.status !== "paid" && item.status !== "done") {
      return;
    }

    setSelectedOrder(item);
    setSelectedOrderDetail(null);
    setLoadingModalDetail(true);
    setModalError("");

    try {
      const res = await fetch(apiUrl(`/api/orders/${item.order_id}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await res.json()) as OrderDetailResponse | { error?: string };
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Gagal ambil detail order");
      }

      setSelectedOrderDetail(data as OrderDetailResponse);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Gagal ambil detail order");
    } finally {
      setLoadingModalDetail(false);
    }
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setSelectedOrderDetail(null);
    setLoadingModalDetail(false);
    setModalError("");
  };

  const statusBadge = (status: OrderHistoryItem["status"]) => {
    if (status === "paid" || status === "done") {
      return "bg-green-100 text-green-700";
    }
    if (status === "failed") {
      return "bg-red-100 text-red-700";
    }
    if (status === "process") {
      return "bg-blue-100 text-blue-700";
    }
    return "bg-yellow-100 text-yellow-700";
  };

  const statusLabel = (status: OrderHistoryItem["status"]) => {
    if (status === "paid") return "Paid";
    if (status === "done") return "Done";
    if (status === "failed") return "Failed";
    if (status === "process") return "Process";
    return "Pending";
  };

  const sortedHistory = useMemo(
    () =>
      [...history].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [history],
  );

  return (
    <HistoryLayout>
      <nav className="bg-[#0E21A0] flex w-full p-5 justify-between fixed top-0 z-50">
        <div className="flex items-center">
          <a className="text-white font-bold text-xl" href="/dashboard">
            Rean Restaurant
          </a>
        </div>
        <div className="flex gap-5 items-center">
          <FaHistory
            className="text-yellow-300 text-2xl cursor-pointer"
            onClick={() => navigate("/history")}
            title="HistoryPage"
          />
          <div className="relative cursor-pointer" onClick={() => navigate("/cart")}>
            <FaShoppingCart className="text-white text-2xl" title="CartPage" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}
          </div>
          <LogoutButton onLogout={handleLogout} />
        </div>
      </nav>

      <div className="min-h-screen bg-gradient-to-b from-[#5234B8] to-[#4729AF] pt-28 px-4 pb-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-5">
            <h1 className="text-white font-bold text-3xl">Riwayat Pesanan</h1>
            <p className="text-white/80 mt-1 text-sm">Semua transaksi kamu tampil di sini.</p>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-6 text-gray-700">Memuat history...</div>
          ) : error ? (
            <div className="bg-white rounded-2xl p-6 text-red-600">{error}</div>
          ) : sortedHistory.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-gray-700">
              Belum ada riwayat pesanan.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedHistory.map((item) => (
                <div
                  key={item.order_id}
                  className="bg-white rounded-2xl shadow-md border border-[#DAD7F8] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-500">Order Code</p>
                      <p className="font-bold text-[#1B2DAE] tracking-wide">{item.order_code}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        statusBadge(item.status)
                      } ${item.status === "paid" || item.status === "done" ? "cursor-pointer" : ""}`}
                      onClick={() => void handleOpenPaidDetail(item)}
                      title={
                        item.status === "paid" || item.status === "done"
                          ? "Klik untuk lihat detail + QR"
                          : ""
                      }
                    >
                      {statusLabel(item.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-sm text-gray-700">
                    <div>
                      <p className="text-gray-500">Tanggal</p>
                      <p className="font-semibold">
                        {new Date(item.created_at).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Meja</p>
                      <p className="font-semibold">
                        {item.meja_number > 0 ? `Meja ${item.meja_number}` : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Item</p>
                      <p className="font-semibold">{item.item_count} item</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Metode Bayar</p>
                      <p className="font-semibold">
                        {item.payment_method ? item.payment_method : "-"}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-black">
                      Rp {item.total_price.toLocaleString("id-ID")}
                    </p>
                  </div>

                  {(item.status === "paid" || item.status === "done") && (
                    <p className="mt-3 text-xs text-[#1B2DAE] font-semibold">
                      Klik badge status untuk lihat QR pembayaran
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <button
              type="button"
              className="px-6 py-2.5 rounded-xl bg-[#1B2DAE] text-white font-semibold"
              onClick={() => navigate("/dashboard")}
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[70] bg-black/45 flex items-center justify-center p-4">
          <div className="bg-[#E7E7E7] border-4 border-[#5333B7] rounded-3xl w-full max-w-xl p-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-green-600">Pembayaran Berhasil</h2>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-gray-300 text-black text-sm"
                onClick={closeModal}
              >
                Tutup
              </button>
            </div>

            <div className="mt-5 space-y-1.5 text-[#374151] text-base sm:text-lg">
              <div className="flex justify-between gap-3">
                <span>Order ID:</span>
                <span className="text-right">{selectedOrder.order_id}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Order Code:</span>
                <span className="text-right break-all">{selectedOrder.order_code}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Payment Method:</span>
                <span className="text-right">{selectedOrder.payment_method || "-"}</span>
              </div>
            </div>

            {loadingModalDetail ? (
              <p className="mt-6 text-gray-600">Memuat detail pesanan...</p>
            ) : modalError ? (
              <p className="mt-6 text-red-600">{modalError}</p>
            ) : (
              <>
                <div className="mt-5 bg-[#D3D3D3] rounded-2xl p-3 max-h-[280px] overflow-y-auto">
                  <div className="space-y-2.5">
                    {selectedOrderDetail?.items.map((detailItem, index) => (
                      <div
                        key={`${detailItem.product_name}-${index}`}
                        className="bg-white rounded-xl px-3 py-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={detailItem.image}
                            alt={detailItem.product_name}
                            className="w-16 h-11 rounded-lg object-cover"
                          />
                          <div className="text-black font-semibold truncate text-sm sm:text-base">
                            {detailItem.product_name}
                          </div>
                        </div>
                        <div className="font-bold text-black whitespace-nowrap text-sm sm:text-base">
                          Rp. {detailItem.subtotal.toLocaleString("id-ID")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-500 mt-5 pt-4 flex justify-between items-center">
                  <span className="text-2xl font-bold text-black">TOTAL</span>
                  <span className="text-2xl font-bold text-black">
                    Rp. {selectedOrderDetail?.total_price.toLocaleString("id-ID")}
                  </span>
                </div>

                {selectedOrderDetail && (
                  <div className="mt-8 flex flex-col items-center p-4 bg-white rounded-2xl shadow-inner">
                    <p className="text-gray-500 text-sm mb-3 font-semibold">
                      Tunjukkan QR ini ke Kasir
                    </p>

                    <QRCodeSVG
                      value={selectedOrderDetail.order_code}
                      size={180}
                      level={"H"}
                      includeMargin={true}
                    />

                    <p className="mt-2 text-[#0E21A0] font-bold tracking-widest">
                      {selectedOrderDetail.order_code}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </HistoryLayout>
  );
};
