import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

import Topbar                   from "../shared/ui/Topbar";
import EmployeeOverview         from "../features/overview/EmployeeOverview";
import PayslipsTab              from "../features/payroll/PayrollTab";
import EmployeeLeavesTab        from "../features/leaves/EmployeeLeavesTab";
import TasksTab                 from "../features/tasks/TasksTab";
import EmployeeAnnouncementsTab from "../features/announcements/EmployeeAnnouncementsTab";
import EmployeeNotificationsTab from "../features/notifications/EmployeeNotificationsTab";
import EmployeeProfilePage      from "../features/profile/EmployeeProfilePage";
import TrainingTab              from "../features/training/TrainingTab";
import { fetchUser }            from "../shared/api/usersApi";
import { apiGet }               from "../shared/api/apiClient";
import { GridIcon, LogoutIcon } from "../shared/icons/icons";
import { NotificationsProvider } from "../shared/hooks/useNotifications";

const NAV = [
  { id: "overview",      path: "overview",      label: "My Dashboard"  },
  { id: "payslips",      path: "payslips",      label: "Payslips"      },
  { id: "leaves",        path: "leaves",        label: "My Leaves"     },
  { id: "tasks",         path: "tasks",         label: "My Tasks"      },
  { id: "announcements", path: "announcements", label: "Announcements" },
  { id: "notifications", path: "notifications", label: "Notifications" },
  { id: "training",      path: "training",      label: "Training"      },
  { id: "profile",       path: "profile",       label: "My Profile"    },
];

export default function EmployeeDashboard({ onLogout }) {
  const user     = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();
  const location = useLocation();

  const isImpersonating = !!localStorage.getItem("adminSession");

  const [myProfile, setMyProfile] = useState(null);
  const [notifs,    setNotifs]    = useState([]);

  useEffect(() => {
    apiGet("/notifications")
      .then(data => setNotifs(Array.isArray(data) ? data : []))
      .catch(() => setNotifs([]));
  }, []);

  const currentPath = location.pathname.replace("/employee/", "").replace("/employee", "") || "overview";
  const activeLabel = myProfile
    ? "My Profile"
    : NAV.find(n => n.path === currentPath)?.label || "My Dashboard";

  const goTo = (path) => {
    setMyProfile(null);
    navigate(`/employee/${path}`);
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

  const handleProfileSave = (updated) => {
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem("user", JSON.stringify({
      ...stored,
      name:     updated.name,
      email:    updated.email,
      initials: `${updated.name.split(" ")[0]?.[0] || ""}${updated.name.split(" ")[1]?.[0] || ""}`.toUpperCase(),
      image:    updated.image,
    }));
    setMyProfile(null);
    navigate("/employee/overview");
  };

  return (
    <>
      {/* Impersonation banner — db-root se bahar */}
      {isImpersonating && (
        <div style={{
          background: "#7c3aed", color: "#fff",
          padding: "8px 20px", fontSize: 12.5, fontWeight: 600,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", zIndex: 200, flexShrink: 0,
        }}>
          <span>👤 Admin Impersonation Mode — viewing as <strong>{user.name}</strong></span>
          <button
            onClick={onLogout}
            style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            ✕ Exit & Return to Admin
          </button>
        </div>
      )}

      <NotificationsProvider>
      <div className="db-root" style={{ flex: 1, minHeight: isImpersonating ? "calc(100vh - 37px)" : "100vh" }}>
        <aside className="db-sidebar">
          <div className="db-sidebar-top">
            <div className="brand-row" style={{ marginBottom: "1.75rem" }}>
              <div className="logo-box"><GridIcon /></div>
              <span className="brand-name" style={{ fontSize: 17 }}>ManagePortal</span>
            </div>
            <div className="db-role-pill db-role-emp">Employee</div>
            <nav className="db-nav">
              {NAV.map(n => (
                <button
                  key={n.id}
                  className={`db-nav-item${currentPath === n.path && !myProfile ? " db-nav-active" : ""}`}
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
            initials={user.initials || "EM"}
            role={user.role === "admin" ? "Admin" : "Employee"}
            name={user.name || "User"}
            email={user.email || ""}
            onLogout={onLogout}
            notifData={notifs}
            onViewAll={() => goTo("notifications")}
            onMyProfile={handleMyProfile}
          />
          <div className="db-content">
            {myProfile ? (
              <EmployeeProfilePage
                employee={myProfile}
                readOnly={false}
                onBack={() => setMyProfile(null)}
                onSave={handleProfileSave}
              />
            ) : (
              <Routes>
                <Route index element={<Navigate to="overview" replace />} />
                <Route path="overview"      element={<EmployeeOverview onNavigate={(p) => navigate(`/employee/${p}`)} />} />
                <Route path="payslips"      element={<PayslipsTab mode="employee" />} />
                <Route path="leaves"        element={<EmployeeLeavesTab />} />
                <Route path="tasks"         element={<TasksTab />} />
                <Route path="announcements" element={<EmployeeAnnouncementsTab />} />
                <Route path="notifications" element={<EmployeeNotificationsTab notifs={notifs} />} />
                <Route path="training"      element={<TrainingTab mode="employee" />} />
                <Route path="profile"       element={
                  <EmployeeProfilePage
                    employee={{ isAdmin: false, id: user.id, name: user.name, email: user.email, role: user.role, image: user.image }}
                    readOnly={false}
                    onBack={() => navigate("/employee/overview")}
                    onSave={handleProfileSave}
                  />
                } />
                <Route path="*" element={<Navigate to="overview" replace />} />
              </Routes>
            )}
          </div>
        </div>
      </div>
      </NotificationsProvider>
    </>
  );
}