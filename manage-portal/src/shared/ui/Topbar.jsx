import { useState, useEffect } from "react";
import {
  BellIcon, IconUser, IconSettings, IconLock, IconLogout,
  LeaveIcon, MegaphoneIcon, PayrollIcon, TaskIcon, AlertIcon,
} from "../icons/icons";
import ChangePasswordModal from "./ChangePasswordModal";
import { useNotifications } from "../hooks/useNotifications";

const ICON_CLS = {
  leave:    "tp-icon-leave",
  announce: "tp-icon-announce",
  payroll:  "tp-icon-payroll",
  task:     "tp-icon-task",
  system:   "tp-icon-system",
};

const NOTIF_ICONS = {
  leave:    LeaveIcon,
  announce: MegaphoneIcon,
  payroll:  PayrollIcon,
  task:     TaskIcon,
  system:   AlertIcon,
};

export default function Topbar({ pageTitle, initials, role, name, email, onLogout, onViewAll, onMyProfile }) {
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);

  const { notifs, handleMarkRead, handleMarkAll } = useNotifications();

  const unread  = notifs.filter(n => n.unread).length;
  const preview = notifs.slice(0, 3);

  useEffect(() => {
    const close = () => { setNotifOpen(false); setProfileOpen(false); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  return (
    <header className="db-topbar" style={{ position: "relative" }}>
      <div>
        <h2 className="db-page-title">{pageTitle}</h2>
        {pageTitle === "Overview" && (
          <p className="db-page-sub">Welcome back, {name}</p>
        )}
      </div>

      <div className="db-topbar-right">

        {/* Bell */}
        <button
          className="db-icon-btn"
          aria-label="Notifications"
          onClick={e => { e.stopPropagation(); setNotifOpen(o => !o); setProfileOpen(false); }}
        >
          <BellIcon />
          {unread > 0 && <span className="db-notif-dot" />}
        </button>

        {/* Notification panel */}
        {notifOpen && (
          <div className="tp-panel tp-notif-panel" onClick={e => e.stopPropagation()}>
            <div className="tp-panel-header">
              <span className="tp-panel-title">
                Notifications
                {unread > 0 && <span className="tp-unread-badge">{unread}</span>}
              </span>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {unread > 0 && (
                  <button className="tp-mark-all" onClick={handleMarkAll}>
                    Mark all read
                  </button>
                )}
                <button className="tp-close" onClick={() => setNotifOpen(false)}>✕</button>
              </div>
            </div>

            <div className="tp-notif-list">
              {preview.length === 0 && (
                <div style={{ padding: "1.5rem", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                  No notifications
                </div>
              )}
              {preview.map((n) => {
                const Icon = NOTIF_ICONS[n.type] || AlertIcon;
                return (
                  <div
                    key={n._id}
                    className={`tp-notif-item${n.unread ? " unread" : ""}`}
                    onClick={() => handleMarkRead(n._id)}
                  >
                    <div className={`tp-notif-icon ${ICON_CLS[n.type] || "tp-icon-system"}`}>
                      <Icon />
                    </div>
                    <div className="tp-notif-body">
                      <div className="tp-notif-title">{n.title}</div>
                      <div className="tp-notif-sub">{n.sub}</div>
                      <div className="tp-notif-time">{n.time}</div>
                    </div>
                    {n.unread && <div className="tp-notif-dot-unread" />}
                  </div>
                );
              })}
            </div>

            <div className="tp-panel-footer">
              <button onClick={() => { setNotifOpen(false); onViewAll?.(); }}>
                View all notifications ({notifs.length})
              </button>
            </div>
          </div>
        )}

        {/* Avatar */}
        <div
          className="db-avatar"
          role="button"
          tabIndex={0}
          style={{ cursor: "pointer" }}
          onClick={e => { e.stopPropagation(); setProfileOpen(o => !o); setNotifOpen(false); }}
          onKeyDown={e => e.key === "Enter" && setProfileOpen(o => !o)}
        >
          {initials}
        </div>

        {/* Profile panel */}
        {profileOpen && (
          <div className="tp-panel tp-profile-panel" onClick={e => e.stopPropagation()}>
            <div className="tp-profile-hero">
              <div className="tp-profile-avatar">{initials}</div>
              <div className="tp-profile-name">{name}</div>
              <div className={`tp-profile-role ${role === "Admin" ? "tp-role-admin" : "tp-role-emp"}`}>{role}</div>
              <div className="tp-profile-email">{email}</div>
            </div>
            <div className="tp-profile-menu">
              <button className="tp-menu-item" onClick={() => { setProfileOpen(false); onMyProfile?.(); }}>
                <IconUser /><span>My Profile</span>
              </button>
              <button className="tp-menu-item">
                <IconSettings /><span>Account Settings</span>
              </button>
              <button className="tp-menu-item" onClick={() => { setProfileOpen(false); setChangePwOpen(true); }}>
                <IconLock /><span>Change Password</span>
              </button>
              <div className="tp-menu-divider" />
              <button className="tp-menu-item tp-danger" onClick={onLogout}>
                <IconLogout /><span>Log out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {changePwOpen && <ChangePasswordModal onClose={() => setChangePwOpen(false)} />}
    </header>
  );
}