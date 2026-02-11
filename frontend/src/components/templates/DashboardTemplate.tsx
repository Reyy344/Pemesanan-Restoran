import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "../organisms/DashboardLayout";
import { LogoutButton } from "../molecules/LogoutButton";
import { FaShoppingCart } from "react-icons/fa";
import { FaSearch } from "react-icons/fa";

// Define the Product type
interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
}

export const DashboardTemplate: React.FC = () => {
  const navigate = useNavigate();

  const [cartCount] = useState(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    return cart.length;
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }

    // Fetch products from backend
    fetchProducts();

    // Get username from localStorage
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, [navigate]);

  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleAddToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    cart.push(product);
    localStorage.setItem("cart", JSON.stringify(cart));

    // Update cart count
    const newCartCount = cart.length;
    // You might want to update the cartCount state here if needed
    console.log(`Added ${product.name} to cart. Total items: ${newCartCount}`);
  };

  const filteredProducts = products.filter((product) => {
    const matchSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchCategory = category
      ? (product.category || "").toLowerCase() === category.toLowerCase()
      : true;

    return matchSearch && matchCategory;
  });

  return (
    <DashboardLayout>
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

      {/* HOMEPAGE */}
      <div className="flex flex-col ml-15 mt-30">
        <h2 className="font-medium text-white text-3xl">
          Selamat Datang, {username}!
        </h2>

        <form action="">
          <div className="flex items-center gap-3 mt-5">
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white w-70 px-5 py-3 rounded"
            />

            <button className="bg-[#B153D7] rounded px-4 py-3 cursor-pointer hover:bg-[#9847b8]">
              <FaSearch className="text-xl" />
            </button>
          </div>

          <div className="flex items-center gap-3 mt-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-white px-4 py-3 rounded w-70 outline-none"
            >
              <option value="">Semua Kategori</option>
              <option value="Makanan">Makanan</option>
              <option value="Minuman">Minuman</option>
            </select>

            <button
              type="button"
              className="bg-[#B153D7] rounded px-4 py-3 cursor-pointer hover:bg-[#9847b8] font-semibold"
            >
              FILTER!
            </button>
          </div>
        </form>

        {/* MENU PRODUK */}
        <div className="flex-col">
          <h2 className="mt-10 font-semibold text-white text-2xl">
            Menu disini ada:
          </h2>

          {/* LOADING */}
          {loading ? (
            <p className="text-white">Loading products...</p>
          ) : (
            <div className="flex gap-3 mt-3">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="w-60 bg-white rounded-xl shadow-md border-2 border-blue-400 overflow-hidden"
                >
                  {/* Gambar */}
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-36 object-cover"
                  />

                  {/* Isi */}
                  <div className="p-3">
                    <h3 className="font-semibold text-lg">{product.name}</h3>

                    <div className="flex justify-between items-center mt-2">
                      <p className="text-gray-500 text-sm">
                        Harga : Rp {product.price.toLocaleString()}
                      </p>

                      <button
                        className="bg-[#0E21A0] text-white px-4 py-1.5 rounded-md text-sm hover:bg-blue-800"
                        onClick={() => handleAddToCart(product)}
                      >
                        Pesan
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* AKHIR DARI MENU PRODUK */}
      </div>

      <footer className="bg-[#3B2A8F] text-white mt-20">
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
    </DashboardLayout>
  );
};
