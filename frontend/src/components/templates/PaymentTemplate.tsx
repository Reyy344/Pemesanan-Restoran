import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PaymentLayout } from "../organisms/PaymentLayout";
import { LogoutButton } from "../molecules/LogoutButton";

interface LocationState {
  orderId?: number;
  orderCode?: string;
  totalPrice?: number;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
  image: string;
}

interface OrderDetail {
  order_id: number;
  order_code: string;
  meja_id: number;
  meja_number: number;
  customer_name: string;
  jumlah_orang: number;
  total_price: number;
  items: OrderItem[];
}

export const PaymentTemplate: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;
  const token = localStorage.getItem("token");

  const handlePay = async () => {
    try {
      if (!orderDetail?.order_id) {
        alert("Order ID tidak ditemukan bang.");
        return;
      }

      if (!window.snap) {
        alert("Snap Midtrans belum ke-load");
        return;
      }

      const response = await fetch(
        "http://localhost:8080/api/payments/snap-token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ order_id: orderDetail?.order_id }),
        },
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Gagal create token nih!");
      if (!data.token) throw new Error("Snap token kosong dari backend");

      window.snap.pay(data.token, {
        onSuccess: () => alert("Pembayaran sukses"),
        onPending: () => alert("Menunggu pembayaran"),
        onError: () => alert("Pembayaran gagal"),
        onClose: () => alert("Popup ditutup"),
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi error");
    }
  };

  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentGroup, setPaymentGroup] = useState("ewallet");
  const [selectedMethod, setSelectedMethod] = useState("");

  const paymentMethods: Record<string, string[]> = {
    ewallet: ["QRIS", "Gopay", "OVO", "ShopeePay"],
    bank: ["BCA", "BRI", "BNI", "Mandiri"],
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (!state.orderId) {
      navigate("/dashboard");
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `http://localhost:8080/api/orders/${state.orderId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Gagal ambil data pesanan bang!");
        }

        setOrderDetail(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi error deh");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [navigate, state.orderId, token]);

  return (
    <PaymentLayout>
      {/* NAVBAR */}
      <nav className="bg-[#0E21A0] flex w-full p-5 justify-between fixed top-0 z-50">
        <div className="flex items-center">
          <a className="text-white font-bold text-xl" href="/dashboard">
            Rean Restaurant
          </a>
        </div>
        <LogoutButton onLogout={handleLogout} />
      </nav>
      {/* END OF NAVBAR */}

      <div className="min-h-screen bg-gradient-to-b pt-24 px-10">
        <h1 className="text-white text-3xl font-bold my-8">
          Metode Pembayaran
        </h1>

        {loading ? (
          <p className="text-white">Loading bentar buat detail pesanannya...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : orderDetail ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* RIGHT */}
              <div className="lg:col-span-2 bg-[#341b8f] rounded-3xl p-4 max-h-[340px] overflow-y-auto">
                <div className="space-y-3">
                  {orderDetail.items.map((item, index) => (
                    <div
                      key={`&{item.product_name}-${index}`}
                      className="bg-gray-200 rounded-xl p-3 flex items-center gap-3"
                    >
                      <img
                        src={item.image}
                        alt={item.product_name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="text-black">
                        <p className="font-semibold">{item.product_name}</p>
                        <p className="text-xs">
                          {item.quantity}x - Rp {item.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* END OF RIGHT */}

              {/* RIGHT */}
              <div className="bg-[#7A3EB1] rounded-3xl p-5 text-white h-fit">
                <h2 className="text-2xl font-semibold mb-3">
                  Keterangan Pesanan
                </h2>
                <p className="mb-1">
                  Meja No :{" "}
                  <span className="font-semibold">
                    Meja {orderDetail.meja_number}
                  </span>
                </p>
                <p className="mb-3">Isi Pesanan :</p>

                <div className="bg-white rounded-lg p-3 text-black text-sm space-y-1">
                  {orderDetail.items.map((item, index) => (
                    <div
                      key={`${item.product_name}-summary-${index}`}
                      className="flex justify-between"
                    >
                      <span>{item.product_name}</span>
                      <span>{item.subtotal.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/40 mt-4 pt-3 flex justify-between text-2xl font-bold">
                  <span>TOTAL</span>
                  <span>{orderDetail.total_price.toLocaleString()}</span>
                </div>
              </div>
              {/* END OF RIGHT */}
            </div>

            <div className="mt-8 bg-[#311b8d] rounded-2xl p-5 text-white">
              <h3 className="text-3xl font-semibold mb-4">Opsi Pembayaran</h3>

              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => {
                    setPaymentGroup("ewallet");
                    setSelectedMethod("");
                  }}
                  className={`px-4 py-2 rounded-lg ${paymentGroup === "ewallet" ? "bg-white text-[#311b8d]" : "bg-[#4d2fb2]"}`}
                >
                  E-Wallet
                </button>
                <button
                  onClick={() => {
                    setPaymentGroup("bank");
                    setSelectedMethod("");
                  }}
                  className={`px-4 py-2 rounded-lg ${paymentGroup === "bank" ? "bg-white text-[#311b8d]" : "bg-[#4d2fb2]"}`}
                >
                  Bank
                </button>
              </div>

              <div className="h-px bg-white/50 mb-4" />

              <div className="flex flex-wrap gap-3">
                {paymentMethods[paymentGroup].map((method) => (
                  <button
                    key={method}
                    onClick={() => setSelectedMethod(method)}
                    className={`px-5 py-3 rounded-xl font-semibold ${
                      selectedMethod === method
                        ? "bg-white text-[#311b8d]"
                        : "bg-white/20"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                disabled={!selectedMethod}
                onClick={handlePay}
                className="bg-[#0E21A0] disabled:bg-[#0E21A0]/50 text-white px-12 py-4 rounded-xl text-2xl font-semibold cursor-pointer"
              >
                Bayar
              </button>
            </div>
          </>
        ) : null}
      </div>
    </PaymentLayout>
  );
};
