import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PaymentLayout } from "../organisms/PaymentLayout";
import { LogoutButton } from "../molecules/LogoutButton";
import { apiUrl } from "../../lib/api";

interface PaymentResultState {
  orderId?: number;
  orderCode?: string;
  snapStatus?: "success" | "pending" | "error";
  transactionId?: string;
  paymentType?: string;
}

interface OrderStatusResponse {
  status: "pending" | "paid" | "failed" | "process" | "done";
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

type DisplayStatus = "pending" | "paid" | "failed";
type ErrorResponse = { error?: string };

const getErrorMessage = (data: unknown): string | undefined => {
  if (typeof data === "object" && data !== null && "error" in data) {
    const err = (data as ErrorResponse).error;
    return typeof err === "string" ? err : undefined;
  }
  return undefined;
};

export const PaymentResultTemplate: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const state = (location.state || {}) as PaymentResultState;

  const [orderId, setOrderId] = useState<number | null>(state.orderId || null);
  const [orderDetail, setOrderDetail] = useState<OrderDetailResponse | null>(
    null,
  );
  const [status, setStatus] = useState<DisplayStatus>(() => {
    if (state.snapStatus === "success") {
      return "paid";
    }
    if (state.snapStatus === "error") {
      return "failed";
    }
    return "pending";
  });
  const [error, setError] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const fetchStatus = useCallback(async (currentOrderId: number) => {
    if (!token) {
      return;
    }

    setIsCheckingStatus(true);
    try {
      const response = await fetch(
        apiUrl(`/api/orders/${currentOrderId}/status`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = (await response.json()) as OrderStatusResponse | ErrorResponse;
      if (!response.ok) {
        throw new Error(getErrorMessage(data) || "Gagal cek status pembayaran");
      }

      const incomingStatus = (data as OrderStatusResponse).status;
      if (incomingStatus === "paid" || incomingStatus === "done") {
        setStatus("paid");
        stopPolling();
        return;
      }

      if (incomingStatus === "failed") {
        setStatus("failed");
        stopPolling();
        return;
      }

      setStatus("pending");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal cek status");
    } finally {
      setIsCheckingStatus(false);
    }
  }, [stopPolling, token]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const loadOrderDetail = async () => {
      setLoadingDetail(true);
      setError("");

      try {
        let endpoint = "";
        if (orderId) {
          endpoint = apiUrl(`/api/orders/${orderId}`);
        } else if (state.orderCode) {
          endpoint = apiUrl(
            `/api/orders/by-code/${encodeURIComponent(state.orderCode)}`,
          );
        } else {
          throw new Error(
            "Order tidak ditemukan. Ulangi pembayaran dari halaman payment.",
          );
        }

        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = (await response.json()) as
          | OrderDetailResponse
          | ErrorResponse;
        if (!response.ok) {
          throw new Error(getErrorMessage(data) || "Gagal ambil detail order");
        }

        const detail = data as OrderDetailResponse;
        setOrderDetail(detail);
        if (!orderId) {
          setOrderId(detail.order_id);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal ambil detail order",
        );
      } finally {
        setLoadingDetail(false);
      }
    };

    void loadOrderDetail();
  }, [navigate, orderId, state.orderCode, token]);

  useEffect(() => {
    if (!orderId || !token) {
      return;
    }

    void fetchStatus(orderId);
    intervalRef.current = window.setInterval(() => {
      void fetchStatus(orderId);
    }, 2000);
    timeoutRef.current = window.setTimeout(() => {
      stopPolling();
    }, 120000);

    return () => {
      stopPolling();
    };
  }, [fetchStatus, orderId, stopPolling, token]);

  const statusColor = useMemo(() => {
    if (status === "paid") {
      return "text-green-600";
    }
    if (status === "failed") {
      return "text-red-600";
    }
    return "text-yellow-600";
  }, [status]);

  const statusTitle = useMemo(() => {
    if (status === "paid") {
      return "Pembayaran Berhasil";
    }
    if (status === "failed") {
      return "Pembayaran Gagal";
    }
    return "Pembayaran Diproses";
  }, [status]);

  const statusIcon = useMemo(() => {
    if (status === "paid") {
      return { bg: "bg-green-600", label: "✓" };
    }
    if (status === "failed") {
      return { bg: "bg-red-600", label: "✕" };
    }
    return { bg: "bg-yellow-500", label: "!" };
  }, [status]);

  return (
    <PaymentLayout>
      <nav className="bg-[#0E21A0] flex w-full p-5 justify-between fixed top-0 z-50">
        <div className="flex items-center">
          <a className="text-white font-bold text-xl" href="/dashboard">
            Rean Restaurant
          </a>
        </div>
        <LogoutButton
          onLogout={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("username");
            navigate("/login");
          }}
        />
      </nav>

      <div className="min-h-screen bg-gradient-to-b from-[#5234B8] to-[#4729AF] pt-24 px-4 pb-8 flex items-start justify-center">
        <div className="bg-[#E7E7E7] border-4 border-[#5333B7] rounded-3xl w-full max-w-xl p-5 shadow-xl">
          <div className="flex flex-col items-center">
            <div
              className={`${statusIcon.bg} w-14 h-14 rounded-full flex items-center justify-center text-white text-3xl leading-none`}
            >
              {statusIcon.label}
            </div>
            <h1 className={`mt-3 text-2xl font-bold ${statusColor}`}>
              {statusTitle}
            </h1>
          </div>

          <div className="mt-5 space-y-1.5 text-[#374151] text-base sm:text-lg">
            <div className="flex justify-between gap-3">
              <span>Order ID:</span>
              <span className="text-right">{orderId || "-"}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Order Code:</span>
              <span className="text-right break-all">
                {orderDetail?.order_code || state.orderCode || "-"}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Transaction ID:</span>
              <span className="text-right break-all">
                {state.transactionId || "-"}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Payment Method:</span>
              <span className="text-right">{state.paymentType || "-"}</span>
            </div>
          </div>

          {loadingDetail ? (
            <p className="mt-6 text-gray-600">Memuat detail pesanan...</p>
          ) : error ? (
            <p className="mt-6 text-red-600">{error}</p>
          ) : (
            <>
              <div className="mt-5 bg-[#D3D3D3] rounded-2xl p-3 max-h-[280px] overflow-y-auto">
                <div className="space-y-2.5">
                  {orderDetail?.items.map((item, index) => (
                    <div
                      key={`${item.product_name}-${index}`}
                      className="bg-white rounded-xl px-3 py-2.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.image}
                          alt={item.product_name}
                          className="w-16 h-11 rounded-lg object-cover"
                        />
                        <div className="text-black font-semibold truncate text-sm sm:text-base">
                          {item.product_name}
                        </div>
                      </div>
                      <div className="font-bold text-black whitespace-nowrap text-sm sm:text-base">
                        Rp. {item.subtotal.toLocaleString("id-ID")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-500 mt-5 pt-4 flex justify-between items-center">
                <span className="text-2xl font-bold text-black">TOTAL</span>
                <span className="text-2xl font-bold text-black">
                  Rp. {orderDetail?.total_price.toLocaleString("id-ID")}
                </span>
              </div>
            </>
          )}

          {status === "pending" && (
            <p className="mt-4 text-base text-gray-600">
              Status pembayaran sedang dicek otomatis.
            </p>
          )}

          {isCheckingStatus && (
            <p className="mt-2 text-base text-gray-600">
              Memproses status terbaru...
            </p>
          )}

          <div className="mt-6 flex justify-center gap-3">
            {status !== "paid" && (
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-gray-300 text-black text-sm"
                onClick={() => {
                  if (orderId) {
                    void fetchStatus(orderId);
                  }
                }}
              >
                Cek Lagi
              </button>
            )}
            <button
              type="button"
              className="px-7 py-2.5 rounded-2xl bg-[#1B2DAE] text-white text-base sm:text-lg cursor-pointer"
              onClick={() => navigate("/dashboard")}
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>
    </PaymentLayout>
  );
};
