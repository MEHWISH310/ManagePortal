import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import LoginPage         from "./pages/LoginPage";
import AdminDashboard    from "./pages/AdminDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import "./styles/style.css";

// ── JWT helper — check token exists and not expired ──
function isTokenValid() {
  const token = localStorage.getItem("token");
  if (!token) return false;

  // DummyJSON JWT — decode payload (middle part)
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now     = Math.floor(Date.now() / 1000);
    // exp field mein expiry time hoti hai
    if (payload.exp && payload.exp < now) {
      // Token expired — clear storage
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      return false;
    }
    return true;
  } catch {
    // Firebase token ya invalid token — just check existence
    return !!token;
  }
}

// ── Protected Route component ──
function ProtectedRoute({ children, allowedRole }) {
  const role  = localStorage.getItem("role");
  const valid = isTokenValid();

  if (!valid || !role) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    // Wrong role — redirect to correct dashboard
    return <Navigate to={role === "admin" ? "/admin" : "/employee"} replace />;
  }

  return children;
}

function AppRoutes() {
  const [role, setRole] = useState(() => {
    // On load — validate token, if expired clear everything
    if (!isTokenValid()) {
      localStorage.removeItem("role");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    }
    return localStorage.getItem("role") || null;
  });

  const navigate = useNavigate();

  const handleLogin = (r) => {
    setRole(r);
    localStorage.setItem("role", r);
    navigate(r === "admin" ? "/admin" : "/employee");
  };

  const handleLogout = () => {
    setRole(null);
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Login — agar already logged in toh redirect */}
      <Route path="/login" element={
        role && isTokenValid()
          ? <Navigate to={role === "admin" ? "/admin" : "/employee"} replace />
          : <LoginPage onLogin={handleLogin} />
      } />

      {/* Admin — only admin role allowed */}
      <Route path="/admin/*" element={
        <ProtectedRoute allowedRole="admin">
          <AdminDashboard onLogout={handleLogout} />
        </ProtectedRoute>
      } />

      {/* Employee — only employee role allowed */}
      <Route path="/employee/*" element={
        <ProtectedRoute allowedRole="employee">
          <EmployeeDashboard onLogout={handleLogout} />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}