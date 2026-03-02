import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LoginPage } from "./components/pages/LoginPage";
import { RegisterPage } from "./components/pages/RegisterPage";
import { DashboardPage } from "./components/pages/DashboardPage";
import { AdminPage } from "./components/admin/pages/AdminPage";
import ErrorPage from "./error";
import { CartTemplate } from "./components/templates/CartTemplate";
import { TablePage } from "./components/pages/TablePage";
import { PaymentPage } from "./components/pages/PaymentPage";
import { PaymentResultPage } from "./components/pages/PaymentResultPage";
import { AdminProductsPage } from "./components/admin/pages/AdminProductsPage";
import { AdminProductCreatePage } from "./components/admin/pages/AdminProductCreatePage";
import { AdminProductEditPage } from "./components/admin/pages/AdminProductEditPage";
import { AdminTablesPage } from "./components/admin/pages/AdminTablesPage";
import { AdminTableEditPage } from "./components/admin/pages/AdminTableEditPage";
import { AdminTableDeletePage } from "./components/admin/pages/AdminTableDeletePage";
import { AdminTransactionPage } from "./components/admin/pages/AdminTransactionPage";
import { AdminAccountPage } from "./components/admin/pages/AdminAccountPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage />}
          errorElement={<ErrorPage />}
        />
        <Route
          path="/register"
          element={<RegisterPage />}
          errorElement={<ErrorPage />}
        />
        <Route
          path="/dashboard"
          element={<DashboardPage />}
          errorElement={<ErrorPage />}
        />
        <Route
          path="/admin-dashboard"
          element={<AdminPage />}
          errorElement={<ErrorPage />}
        />
        <Route
          path="/admin-products"
          element={<AdminProductsPage />}
          errorElement={<ErrorPage />}
        />
        <Route
          path="/admin-products/create"
          element={<AdminProductCreatePage />}
          errorElement={<ErrorPage />}
        />
        <Route
          path="/admin-products/edit/:id"
          element={<AdminProductEditPage />}
          errorElement={<ErrorPage />}
        />
        <Route
          path="/admin-tables"
          element={<AdminTablesPage />}
          errorElement={<ErrorPage />}
        />
        <Route
          path="/admin-tables/edit/:id"
          element={<AdminTableEditPage />}
          errorElement={<ErrorPage />}
        />
        <Route
          path="/admin-tables/delete/:id"
          element={<AdminTableDeletePage />}
          errorElement={<ErrorPage />}
        />

        <Route
          path="/admin-transactions"
          element={<AdminTransactionPage />}
          errorElement={<ErrorPage />}
        />
        <Route
          path="/admin-account"
          element={<AdminAccountPage />}
          errorElement={<ErrorPage />}
        />
        <Route
          path="/cart"
          element={<CartTemplate />}
          errorElement={<ErrorPage />}
        />
        <Route
          path="/choose-table"
          element={<TablePage />}
          errorElement={<ErrorPage />}
        />
        <Route
          path="/payment"
          element={<PaymentPage />}
          errorElement={<ErrorPage />}
        />
        <Route
          path="/payment/result"
          element={<PaymentResultPage />}
          errorElement={<ErrorPage />}
        />
        <Route path="/" element={<LoginPage />} errorElement={<ErrorPage />} />
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </Router>
  );
}

export default App;
