import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LoginPage } from "./components/pages/LoginPage";
import { RegisterPage } from "./components/pages/RegisterPage";
import { DashboardPage } from "./components/pages/DashboardPage";
import { AdminPage } from "./components/pages/AdminPage";
import ErrorPage from "./error";
import { CartTemplate } from "./components/templates/CartTemplate";

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
          path="/cart"
          element={<CartTemplate />}
          errorElement={<ErrorPage />}
        />
        <Route path="/" element={<LoginPage />} errorElement={<ErrorPage />} />
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </Router>
  );
}

export default App;
