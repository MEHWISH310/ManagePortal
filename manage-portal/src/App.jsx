import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import LoginPage         from "./pages/LoginPage";
import AdminDashboard    from "./pages/AdminDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import "./styles/style.css";

function isTokenValid() {
  const token = localStorage.getItem("token");
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now     = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      return false;
    }
    return true;
  } catch {
    return !!token;
  }
}

function ProtectedRoute({ children, allowedRole }) {
  const role  = localStorage.getItem("role");
  const valid = isTokenValid();
  if (!valid || !role) return <Navigate to="/login" replace />;
  if (allowedRole && role !== allowedRole)
    return <Navigate to={role === "admin" ? "/admin" : "/employee"} replace />;
  return children;
}

function AppRoutes() {
  const [role, setRole] = useState(() => {
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
    // Impersonation mein tha — admin session restore karo
    const adminSession = localStorage.getItem("adminSession");
    if (adminSession) {
      const admin = JSON.parse(adminSession);
      localStorage.setItem("token", admin.token);
      localStorage.setItem("user",  JSON.stringify(admin.user));
      localStorage.setItem("role",  "admin");
      localStorage.removeItem("adminSession");
      setRole("admin");
      navigate("/admin/employees");
      return;
    }
    setRole(null);
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleImpersonate = (data) => {
    // Admin session save karo
    localStorage.setItem("adminSession", JSON.stringify({
      token: localStorage.getItem("token"),
      user:  JSON.parse(localStorage.getItem("user") || "{}"),
    }));
    localStorage.setItem("token", data.token);
    localStorage.setItem("user",  JSON.stringify(data.user));
    localStorage.setItem("role",  "employee");
    setRole("employee");
    navigate("/employee/overview");
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={
        role && isTokenValid()
          ? <Navigate to={role === "admin" ? "/admin" : "/employee"} replace />
          : <LoginPage onLogin={handleLogin} />
      } />
      <Route path="/admin/*" element={
        <ProtectedRoute allowedRole="admin">
          <AdminDashboard onLogout={handleLogout} onImpersonate={handleImpersonate} />
        </ProtectedRoute>
      } />
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