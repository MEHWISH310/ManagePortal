import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Spinner from "../shared/ui/Spinner";
import ImportEmployeesPage from "../features/employees/ImportEmployeesPage";

import Topbar                from "../shared/ui/Topbar";
import AdminOverview         from "../features/overview/AdminOverview";
import EmployeesTab          from "../features/employees/EmployeesTab";
import PayrollTab            from "../features/payroll/PayrollTab";
import AdminLeavesTab        from "../features/leaves/AdminLeavesTab";
import AdminAnnouncementsTab from "../features/announcements/AdminAnnouncementsTab";
import ReportsTab            from "../features/reports/ReportsTab";
import AdminNotificationsTab from "../features/notifications/AdminNotificationsTab";
import EmployeeProfilePage   from "../features/profile/EmployeeProfilePage";
import TrainingTab           from "../features/training/TrainingTab";
import { useEmployees }      from "../shared/hooks/useEmployees";
import { fetchUser }         from "../shared/api/usersApi";
import { apiGet }            from "../shared/api/apiClient";
import { GridIcon, LogoutIcon } from "../shared/icons/icons";

const NAV = [
  { id: "overview",      path: "overview",      label: "Overview"       },
  { id: "employees",     path: "employees",     label: "Employees"      },
  { id: "payroll",       path: "payroll",       label: "Payroll"        },
  { id: "leaves",        path: "leaves",        label: "Leave Requests" },
  { id: "announcements", path: "announcements", label: "Announcements"  },
  { id: "reports",       path: "reports",       label: "Reports"        },
  { id: "notifications", path: "notifications", label: "Notifications"  },
  { id: "training",      path: "training",      label: "Training"       },
];

export default function AdminDashboard({ onLogout, onImpersonate }) {
  const user     = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();
  const location = useLocation();

  const [showImport,   setShowImport]   = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [myProfile,    setMyProfile]    = useState(null);
  const [notifs,       setNotifs]       = useState([]);

  const { employees, loading, error, handleAdd, handleDelete, handleUpdate } = useEmployees();

  useEffect(() => {
    apiGet("/notifications")
      .then(data => setNotifs(Array.isArray(data) ? data : []))
      .catch(() => setNotifs([]));
  }, []);

  const currentPath = location.pathname.replace("/admin/", "").replace("/admin", "") || "overview";
  const activeLabel = editEmployee
    ? "Edit Employee Details"
    : myProfile
    ? "My Profile"
    : NAV.find(n => n.path === currentPath)?.label || "Overview";

  const goTo = (path) => {
    setEditEmployee(null);
    setMyProfile(null);
    navigate(`/admin/${path}`);
  };

  const handleMyProfile = async () => {
    if (!user.id) return;
    try {
      const data = await fetchUser(user.id);
      setMyProfile({
        isAdmin:    false,
        id:         data._id || data.id,
        name:       `${data.firstName} ${data.lastName}`,
        email:      data.email,
        phone:      data.phone,
        username:   data.username,
        age:        data.age,
        gender:     data.gender,
        bloodGroup: data.bloodGroup,
        image:      data.image,
        role:       data.role,
        dept:       data.dept       || "General",
        jobTitle:   data.jobTitle   || "",
        company:    data.company    || "",
        university: data.university || "",
        address:    data.address,
        status:     data.status     || "Active",
        avatar:     `${data.firstName[0]}${data.lastName[0]}`.toUpperCase(),
      });
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  const handleMyProfileSave = (updated) => {
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem("user", JSON.stringify({
      ...stored,
      name:     updated.name,
      email:    updated.email,
      initials: `${updated.name.split(" ")[0]?.[0] || ""}${updated.name.split(" ")[1]?.[0] || ""}`.toUpperCase(),
      image:    updated.image,
    }));
    setMyProfile(null);
  };

  const renderOverlay = () => {
    if (myProfile) return (
      <EmployeeProfilePage
        employee={myProfile}
        readOnly={false}
        onBack={() => setMyProfile(null)}
        onSave={handleMyProfileSave}
      />
    );
    if (editEmployee) return (
      <EmployeeProfilePage
        employee={editEmployee}
        readOnly={false}
        onBack={() => setEditEmployee(null)}
        onSave={(updated) => { handleUpdate(updated); setEditEmployee(null); }}
      />
    );
    return null;
  };

  return (
    <div className="db-root">
      <aside className="db-sidebar">
        <div className="db-sidebar-top">
          <div className="brand-row" style={{ marginBottom: "1.75rem" }}>
            <div className="logo-box"><GridIcon /></div>
            <span className="brand-name" style={{ fontSize: 17 }}>ManagePortal</span>
          </div>
          <div className="db-role-pill db-role-admin">Admin</div>
          <nav className="db-nav">
            {NAV.map(n => (
              <button
                key={n.id}
                className={`db-nav-item${currentPath === n.path && !editEmployee && !myProfile ? " db-nav-active" : ""}`}
                onClick={() => goTo(n.path)}
              >
                <span className="db-nav-label">{n.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <button className="db-logout" onClick={onLogout}>
          <LogoutIcon /><span>Log out</span>
        </button>
      </aside>

      <div className="db-main">
        <Topbar
          pageTitle={activeLabel}
          initials={user.initials || "AD"}
          role={user.role === "admin" ? "Admin" : "Employee"}
          name={user.name || "User"}
          email={user.email || ""}
          onLogout={onLogout}
          notifData={notifs}
          onViewAll={() => goTo("notifications")}
          onMyProfile={handleMyProfile}
        />
        <div className="db-content">
          {(myProfile || editEmployee) ? renderOverlay() : (
            <Routes>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={
                loading ? <Spinner /> :
                error   ? <div className="db-error">Error: {error}</div> :
                <AdminOverview employees={employees} onNavigate={(page) => goTo(page)} />
              } />
              <Route
                path="employees"
                element={
                  loading ? <Spinner text="Loading employees..." /> :
                  error   ? <div className="db-error">Error: {error}</div> :
                  showImport ? (
                    <ImportEmployeesPage
                      onBack={() => setShowImport(false)}
                      onImport={(emps) => {
                        emps.forEach(emp => handleAdd(emp));
                        setShowImport(false);
                      }}
                    />
                  ) : (
                    <EmployeesTab
                      employees={employees}
                      onAdd={handleAdd}
                      onDelete={handleDelete}
                      onEdit={(e) => setEditEmployee({ ...e, isAdmin: true })}
                      onStatusChange={(id, status) => handleUpdate({ ...employees.find(e => e.id === id), status })}
                      currentUserId={user.id}
                      onImport={() => setShowImport(true)}
                      onImpersonate={onImpersonate}
                    />
                )
                }
              />
              <Route
                path="payroll"
                element={
                  loading ? <Spinner text="Loading payroll..." /> :
                  error   ? <div className="db-error">Error: {error}</div> :
                  <PayrollTab employees={employees} />
                }
              />
              <Route path="leaves"        element={<AdminLeavesTab />} />
              <Route path="announcements" element={<AdminAnnouncementsTab />} />
              <Route path="reports"       element={<ReportsTab />} />
              <Route path="notifications" element={<AdminNotificationsTab notifs={notifs} />} />
              <Route path="training"      element={<TrainingTab mode="admin" />} />
              <Route path="*"             element={<Navigate to="overview" replace />} />
            </Routes>
          )}
        </div>
      </div>
    </div>
  );
}