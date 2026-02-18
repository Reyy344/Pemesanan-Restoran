import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogoutButton } from "../molecules/LogoutButton";
import { TableLayout } from "../organisms/TableLayout";

interface TableBooking {
  orderId: number;
  userId: number;
  customerName: string;
  guestCount: number;
  status: string;
  createdAt: string;
}

interface TableItem {
  id: number;
  number: number;
  capacity: number;
  status: "available" | "occupied";
  currentBooking?: TableBooking;
}

export const TableTemplate: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const currentUsername = localStorage.getItem("username") || "";
  const cartKey = `cart_${currentUsername}`;

  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const bookedByCurrentUser = useMemo(
    () =>
      tables.find(
        (table) =>
          table.status === "occupied" &&
          table.currentBooking?.customerName === currentUsername,
      ),
    [tables, currentUsername],
  );

  const getCartItems = () => {
    const raw = localStorage.getItem(cartKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as Array<{ id: number; qty?: number }>;
      return parsed
        .filter((item) => item.id > 0 && (item.qty || 1) > 0)
        .map((item) => ({
          product_id: item.id,
          quantity: item.qty || 1,
        }));
    } catch {
      return [];
    }
  };

  const fetchTables = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8080/api/tables");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal ambil data meja");
      }

      setTables(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal load data meja";
      setError(message);
    } finally {
      setLoading(false);
    }
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
    fetchTables();
  }, [token, navigate]);

  const handleBook = async (table: TableItem) => {
    if (!token) {
      navigate("/login");
      return;
    }

    const cartItems = getCartItems();
    if (cartItems.length === 0) {
      alert("Keranjang Anda kosong, isi dulu ya.");
      return;
    }

    const input = window.prompt("Jumlah orang (1-12):", "1");
    if (input === null) {
      return;
    }

    const guestCount = Number(input);
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 12) {
      alert("Jumlah orang harus angka 1 sampai 12.");
      return;
    }

    setSubmittingId(table.id);
    try {
      const response = await fetch(
        "http://localhost:8080/api/orders/checkout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            meja_id: table.id,
            jumlah_orang: guestCount,
            items: cartItems,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Checkout gagal");
      }

      localStorage.removeItem(cartKey);
      navigate("/payment", {
        state: {
          orderCode: data.order_code,
          orderId: data.order_id,
          totalPrice: data.total_price,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Checkout gagal";
      alert(message);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleCancelBooking = async (table: TableItem) => {
    if (!token) {
      navigate("/login");
      return;
    }

    const isMine = table.currentBooking?.customerName === currentUsername;
    if (!isMine) {
      return;
    }

    const wantCancel = window.confirm(`Batalin booking ${table.number}?`);
    if (!wantCancel) {
      return;
    }

    setSubmittingId(table.id);
    try {
      const response = await fetch(
        `http://localhost:8080/api/tables/${table.id}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal batalin booking");
      }

      alert("Booking berhasil dibatalkan.");
      await fetchTables();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal batalin booking";
      alert(message);
    } finally {
      setSubmittingId(null);
    }
  };

  const getCardClasses = (table: TableItem) => {
    const bookedBy = table.currentBooking?.customerName || "";
    if (table.status === "occupied" && bookedBy === currentUsername) {
      return "bg-green-600 hover:bg-green-500";
    }
    if (table.status === "occupied") {
      return "bg-green-700 opacity-90 cursor-not-allowed";
    }
    return "bg-[#8A78D8] hover:bg-[#9988de] cursor-pointer";
  };

  const getStatusText = (table: TableItem) => {
    if (table.status === "available") {
      return "Belum Di Booking";
    }

    if (table.currentBooking?.customerName === currentUsername) {
      return "Sudah Di Booking (Anda)";
    }

    return `Sudah Di Booking (${table.currentBooking?.customerName || "-"})`;
  };

  const hasBookedTable = Boolean(bookedByCurrentUser);

  return (
    <TableLayout>
      <nav className="bg-[#0E21A0] flex w-full p-5 justify-between fixed top-0 z-50">
        <div className="flex items-center">
          <a className="text-white font-bold text-xl" href="/dashboard">
            Rean Restaurant
          </a>
        </div>
        <LogoutButton onLogout={handleLogout} />
      </nav>

      <div className="min-h-screen bg-gradient-to-b from-[#5234B8] to-[#4729AF] pt-28 px-6">
        <h1 className="text-white text-4xl font-bold text-center">
          Pilih Meja Anda!
        </h1>

        <p className="text-center text-white/90 mt-3 mb-8">
          {hasBookedTable
            ? `Booking Anda: Meja ${bookedByCurrentUser?.number}. Klik lagi kalau mau batalin.`
            : "Klik meja kosong buat booking."}
        </p>

        {loading ? (
          <p className="text-center text-white">Loading meja...</p>
        ) : error ? (
          <div className="text-center">
            <p className="text-red-200 mb-4">{error}</p>
            <button
              type="button"
              onClick={fetchTables}
              className="bg-[#0E21A0] text-white px-5 py-2 rounded-lg"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <div className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6 pb-10">
            {tables.map((table) => {
              const isMine =
                table.status === "occupied" &&
                table.currentBooking?.customerName === currentUsername;
              const isOtherBooked =
                table.status === "occupied" &&
                table.currentBooking?.customerName !== currentUsername;
              const guestCount = table.currentBooking?.guestCount || 0;

              return (
                <button
                  key={table.id}
                  type="button"
                  onClick={() =>
                    isMine ? handleCancelBooking(table) : handleBook(table)
                  }
                  disabled={isOtherBooked || submittingId === table.id}
                  className={`h-44 rounded-3xl text-white transition-colors duration-200 shadow-lg ${getCardClasses(table)}`}
                >
                  <div className="text-4xl font-bold leading-none">
                    Meja {table.number}
                  </div>
                  <div className="text-2xl mt-3">{guestCount} Orang</div>
                  <div className="text-lg mt-2">{getStatusText(table)}</div>
                  {isMine && (
                    <p className="text-sm mt-1 opacity-90">
                      Klik buat batalin booking
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </TableLayout>
  );
};
