import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./Login.tsx";
import Register from "./Register.tsx";
import ErrorPage from "./error.tsx";
import Dashbord from "./Dashboard.tsx";
import AdminDashboard from "./AdminPage/Admin.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <h1>Hai</h1>,
    errorElement: <ErrorPage />,
  },
  {
    path: "/login",
    element: <Login />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/register",
    element: <Register />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/dashboard",
    element: <Dashbord />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/admin-dashboard",
    element: <AdminDashboard />,
    errorElement: <ErrorPage />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
