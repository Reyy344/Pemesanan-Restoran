import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaShoppingCart } from "react-icons/fa";
import { LogoutButton } from "../molecules/LogoutButton";
import { CartLayout } from "../organisms/CartLayout";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  qty?: number;
}

interface CartItem extends Product {
  qty: number;
}

export const CartTemplate: React.FC = () => {
  const navigate = useNavigate();
  const currentUsername = localStorage.getItem("username") || "guest";
  const cartKey = `cart_${currentUsername}`;

  // Menghitung jumlah Badge Cart
  const [cartCount, setCartCount] = useState(() => {
    const cart = JSON.parse(localStorage.getItem(cartKey) || "[]");
    return cart.length;
  });

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const cart = JSON.parse(localStorage.getItem(cartKey) || "[]");

    return cart.map((item: Product) => ({
      ...item,
      qty: item.qty || 1,
    }));
  });

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );
  const token = localStorage.getItem("token");

  if (!token) {
    navigate("/login");
    return null;
  }

  const handleChooseTable = () => {
    // Navigate to table selection page
    navigate("/choose-table");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const updateQty = (id: number, type: "inc" | "dec") => {
    let updated = cartItems.map((item) => {
      if (item.id === id) {
        if (type === "inc") {
          return { ...item, qty: item.qty + 1 };
        }

        if (type === "dec") {
          return { ...item, qty: item.qty - 1 };
        }
      }
      return item;
    });

    // Hapus item yang qty nya 0
    updated = updated.filter((item) => item.qty > 0);

    setCartItems(updated);
    setCartCount(updated.length);
    localStorage.setItem(cartKey, JSON.stringify(updated));
  };

  return (
    <CartLayout>
      {/* NAVBAR */}
      <nav className="bg-[#0E21A0] flex w-full p-5 justify-between fixed">
        <div className="flex items-center">
          <a className="text-white font-bold text-xl" href="/Dashboard">
            Rean Restaurant
          </a>
        </div>
        <div className="flex gap-5 items-center">
          <div
            className="relative cursor-pointer"
            onClick={() => navigate("/cart")}
          >
            <FaShoppingCart className="text-white text-2xl" />

            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}
          </div>
          <LogoutButton onLogout={handleLogout} />
        </div>
      </nav>

      <div className="min-h-screen bg-gradient-to-b pt-24 px-10">
        <h1 className="text-white text-3xl font-bold my-8">Keranjang Anda</h1>

        <div className="flex gap-8">
          {/* LEFT - CART ITEMS */}
          <div className="flex-1 bg-[#2e1f8f] rounded-3xl p-8">
            <div className="space-y-6">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-gray-200 rounded-xl p-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />

                    <div>
                      <h3 className="font-bold text-lg">{item.name}</h3>
                      <p className="text-gray-700 text-sm">
                        Harga: Rp {item.price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Quantity Control */}
                  <div className="flex items-center gap-2">
                    {/* Kiri (Kurang) */}
                    <button
                      onClick={() => updateQty(item.id, "dec")}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold cursor-pointer"
                    >
                      -
                    </button>

                    <input
                      type="number"
                      value={item.qty}
                      min={0}
                      onChange={(e) => {
                        const value = Number(e.target.value);

                        const updated = cartItems
                          .map((it) =>
                            it.id === item.id ? { ...it, qty: value } : it,
                          )
                          .filter((it) => it.qty > 0);

                        setCartItems(updated);
                        setCartCount(updated.length);
                        localStorage.setItem(cartKey, JSON.stringify(updated));
                      }}
                      className="w-16 text-center bg-white rounded-lg py-2"
                    />

                    {/* Kanan (Tambah) */}
                    <button
                      onClick={() => updateQty(item.id, "inc")}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT - SUMMARY */}
          <div className="w-80 bg-gradient-to-b from-[#7a3eb1] to-[#5b2fa3] rounded-2xl p-6 text-white shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Ringkasan Pemesanan</h2>

            <div className="space-y-4">
              <h3 className="font-semibold text-white mb-2">Isi Pesanan:</h3>
              <div className="bg-white p-3 rounded">
                {cartItems.length === 0 ? (
                  <p className="text-gray-500">Tidak ada pesanan</p>
                ) : (
                  <ul className="space-y-2 text-black">
                    {" "}
                    {cartItems.map((item) => (
                      <li
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {item.qty > 1
                            ? `${item.name} (${item.qty}x)`
                            : item.name}
                        </span>
                        <span>
                          Rp {(item.price * item.qty).toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-white">
                    {" "}
                    Rp {totalPrice.toLocaleString()}{" "}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <button
                onClick={handleChooseTable}
                className="w-full mt-6 bg-[#0E21A0] hover:bg-blue-900 py-3 rounded-lg font-semibold"
              >
                Pilih Meja
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-[#3B2A8F] text-white">
        <div className="max-w-6xl mx-auto px-10 py-10 grid grid-cols-3 gap-10">
          {/* Kiri */}
          <div>
            <h2 className="text-xl font-semibold mb-3">Rean Restaurant</h2>
            <p className="text-sm leading-relaxed text-gray-200">
              Rean Restaurant adalah sebuah restoran dengan makanan siap saji
              dan sehat. Dengan memudahkan dalam hal pemesanan.
            </p>
          </div>

          {/* Tengah */}
          <div>
            <h2 className="text-xl font-semibold mb-3">Tentang kami</h2>
            <ul className="text-sm space-y-2 text-gray-200">
              <li className="cursor-pointer hover:underline">Tentang Kami</li>
              <li className="cursor-pointer hover:underline">
                Syarat & Ketentuan
              </li>
            </ul>
          </div>

          {/* Kanan */}
          <div>
            <h2 className="text-xl font-semibold mb-3">Kontak Kami</h2>
            <ul className="text-sm space-y-2 text-gray-200">
              <li>support@reanresto.com</li>
              <li>(021) 857-1557</li>
            </ul>
          </div>
        </div>

        {/* Garis */}
        <div className="border-t border-white/30 mx-10"></div>

        {/* Copyright */}
        <div className="text-center py-5 text-sm text-gray-200">
          © 2026 Rean Restaurant. All Rights Reserved.
        </div>
      </footer>
    </CartLayout>
  );
};
