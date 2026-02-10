// import { useState, useEffect } from "react";
// import "./App.css";
// import "./index.css";

// interface Product {
//   id: number;
//   name: string;
//   price: number;
// }

// function App() {
//   const [products, setProducts] = useState<Product[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchProducts = async () => {
//       try {
//         const response = await fetch("http://localhost:8080/api/products");
//         if (!response.ok) {
//           throw new Error(`HTTP error! status: ${response.status}`);
//         }
//         const data = await response.json();
//         setProducts(data || []);
//         setLoading(false);
//       } catch (error) {
//         setError(error instanceof Error ? error.message : "Gagal fetch data");
//         setLoading(false);
//       }
//     };

//     fetchProducts();
//   }, []);

//   if (loading)
//     return (
//       <div className="container">
//         <p>Loading...</p>
//       </div>
//     );
//   if (error)
//     return (
//       <div className="container">
//         <p style={{ color: "red" }}>Error: {error}</p>
//       </div>
//     );

//   return (
//     <>
//       <div className=""></div>
//     </>
//   );
// }

// export default App;

// import Login from "./Login";
// import Dashboard from "./Dashboard";

// export default function App() {
//   const token = localStorage.getItem("token");

//   if (!token) {
//     return <Login />;
//   }

//   return <Dashboard />;
// }
