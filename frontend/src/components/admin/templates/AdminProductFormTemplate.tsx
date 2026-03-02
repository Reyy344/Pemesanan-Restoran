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

type FormMode = "create" | "edit";

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

interface Category {
  id: number;
  name: string;
}

interface AdminProductFormTemplateProps {
  mode: FormMode;
}

export const AdminProductFormTemplate: React.FC<
  AdminProductFormTemplateProps
> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const token = localStorage.getItem("token") || "";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [image, setImage] = useState("");
  const [categoryId, setCategoryId] = useState<number>(0);
  const [isAvailable, setIsAvailable] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const catRes = await fetch(apiUrl("/api/admin/categories"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (catRes.status === 401 || catRes.status === 403) {
          navigate("/login");
          return;
        }
        if (!catRes.ok) throw new Error("Gagal mengambil kategori");
        const categoriesData: Category[] = await catRes.json();
        setCategories(categoriesData);
        if (categoriesData.length > 0) {
          setCategoryId(categoriesData[0].id);
        }

        if (mode === "edit") {
          const productId = Number(id);
          if (!productId) throw new Error("ID produk tidak valid");

          const productRes = await fetch(
            apiUrl(`/api/admin/products/${productId}`),
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (!productRes.ok) throw new Error("Gagal mengambil detail produk");
          const product: AdminProduct = await productRes.json();

          setName(product.name);
          setDescription(product.description || "");
          setPrice(product.price);
          setImage(product.image || "");
          setCategoryId(product.category_id);
          setIsAvailable(product.is_available);
        }
      } catch (error) {
        console.error(error);
        setErrorMessage("Tidak bisa memuat data form produk.");
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [id, mode, navigate, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Nama produk wajib diisi.");
      return;
    }
    if (categoryId <= 0) {
      setErrorMessage("Kategori wajib dipilih.");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setErrorMessage("Harga harus lebih dari 0.");
      return;
    }

    const payload = {
      category_id: categoryId,
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      image: image.trim(),
      is_available: isAvailable,
    };

    const isEdit = mode === "edit";
    const endpoint = isEdit
      ? apiUrl(`/api/admin/products/${id}`)
      : apiUrl("/api/admin/products");
    const method = isEdit ? "PUT" : "POST";

    try {
      setSubmitting(true);
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401 || response.status === 403) {
        navigate("/login");
        return;
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Gagal menyimpan produk.");
      }

      navigate("/admin-products");
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Terjadi error saat menyimpan produk.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#4d2fb2] text-white ">
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
              className="flex w-full items-center gap-3 rounded-md bg-[#b153d7] px-4 py-3 text-left font-medium"
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
            <h1 className="text-3xl font-bold">
              {mode === "edit" ? "Edit Produk" : "Tambah Produk"}
            </h1>
            <p className="mt-1 text-lg text-white/90">
              {mode === "edit"
                ? "Update detail produk yang sudah ada."
                : "Tambahkan menu baru untuk restoran."}
            </p>

            {loading ? (
              <p className="mt-8">Memuat data form...</p>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-8 max-w-2xl rounded-xl bg-[#311990] p-6"
              >
                <div className="grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-sm">Nama Produk</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded bg-white px-3 py-2 text-black"
                      placeholder="Contoh: Nasi Goreng Spesial"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm">Deskripsi</span>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-24 rounded bg-white px-3 py-2 text-black"
                      placeholder="Deskripsi singkat produk"
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm">Harga</span>
                      <input
                        type="number"
                        min={1}
                        value={price || ""}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="rounded bg-white px-3 py-2 text-black"
                        placeholder="12000"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm">Kategori</span>
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(Number(e.target.value))}
                        className="rounded bg-white px-3 py-2 text-black"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="grid gap-2">
                    <span className="text-sm">URL Gambar</span>
                    <input
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      className="rounded bg-white px-3 py-2 text-black"
                      placeholder="https://..."
                    />
                  </label>

                  <label className="mt-1 inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isAvailable}
                      onChange={(e) => setIsAvailable(e.target.checked)}
                    />
                    <span className="text-sm">Produk tersedia</span>
                  </label>

                  {errorMessage ? (
                    <p className="rounded bg-red-500/20 px-3 py-2 text-sm text-red-100">
                      {errorMessage}
                    </p>
                  ) : null}

                  <div className="mt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => navigate("/admin-products")}
                      className="rounded bg-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/30"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded bg-[#b153d7] px-4 py-2 text-sm font-semibold hover:bg-[#9c48bd] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {submitting
                        ? "Menyimpan..."
                        : mode === "edit"
                          ? "Update Produk"
                          : "Simpan Produk"}
                    </button>
                  </div>
                </div>
              </form>
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
