import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { formatSalary } from "../../shared/utils/formatSalary";

const ExportIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

function exportEmpCSV(e) {
  const rows = [
    ["Field", "Value"],
    ["Name",          e.name        || ""],
    ["Email",         e.email       || ""],
    ["Phone",         e.phone       || ""],
    ["Username",      e.username    || ""],
    ["Gender",        e.gender      || ""],
    ["Date of Birth", e.birthDate   || ""],
    ["Age",           e.age         || ""],
    ["Blood Group",   e.bloodGroup  || ""],
    ["Role",          e.role        || ""],
    ["Department",    e.dept        || ""],
    ["Job Title",     e.jobTitle    || ""],
    ["Company",       e.company     || ""],
    ["University",    e.university  || ""],
    ["Status",        e.status      || ""],
    ["Net Pay",       e.salary ? formatSalary(e.salary) : ""],
    ["Street",        e.address?.address || ""],
    ["City",          e.address?.city    || ""],
    ["State",         e.address?.state   || ""],
    ["Country",       e.address?.country || ""],
  ];
  const csv = rows
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `${e.name?.replace(/\s+/g, "_") || "employee"}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function exportEmpExcel(e) {
  const rows = [
    ["Field", "Value"],
    ["Name",          e.name        || ""],
    ["Email",         e.email       || ""],
    ["Phone",         e.phone       || ""],
    ["Username",      e.username    || ""],
    ["Gender",        e.gender      || ""],
    ["Date of Birth", e.birthDate   || ""],
    ["Age",           e.age ? `${e.age} years` : ""],
    ["Blood Group",   e.bloodGroup  || ""],
    ["Role",          e.role        || ""],
    ["Department",    e.dept        || ""],
    ["Job Title",     e.jobTitle    || ""],
    ["Company",       e.company     || ""],
    ["University",    e.university  || ""],
    ["Status",        e.status      || ""],
    ["Net Pay",       e.salary ? formatSalary(e.salary) : ""],
    ["Street",        e.address?.address || ""],
    ["City",          e.address?.city    || ""],
    ["State",         e.address?.state   || ""],
    ["Country",       e.address?.country || ""],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 20 }, { wch: 40 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Employee");
  XLSX.writeFile(wb, `${e.name?.replace(/\s+/g, "_") || "employee"}.xlsx`);
}

async function exportEmpPDF(e) {
  const initials = e.avatar || (e.name ? e.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "E");

  let imgHtml = `<div class="avatar">${initials}</div>`;
  if (e.image) {
    try {
      const res    = await fetch(e.image);
      const blob   = await res.blob();
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      imgHtml = `<img src="${base64}" style="width:64px;height:64px;border-radius:12px;object-fit:cover;flex-shrink:0;border:2px solid #e2e8f0;" />`;
    } catch {
      // keep initials fallback
    }
  }

  const sections = [
    {
      title: "Personal Information",
      rows: [
        ["Name",          e.name        || "—"],
        ["Email",         e.email       || "—"],
        ["Phone",         e.phone       || "—"],
        ["Username",      e.username ? `@${e.username}` : "—"],
        ["Gender",        e.gender      || "—"],
        ["Date of Birth", e.birthDate   || "—"],
        ["Age",           e.age ? `${e.age} years` : "—"],
        ["Blood Group",   e.bloodGroup  || "—"],
      ],
    },
    {
      title: "Work Information",
      rows: [
        ["Role",        e.role       || "—"],
        ["Department",  e.dept       || "—"],
        ["Job Title",   e.jobTitle   || "—"],
        ["Company",     e.company    || "—"],
        ["University",  e.university || "—"],
        ["Status",      e.status     || "—"],
        ["Net Pay",     e.salary ? formatSalary(e.salary) : "—"],
      ],
    },
    {
      title: "Address",
      rows: [
        ["Street",  e.address?.address || "—"],
        ["City",    e.address?.city    || "—"],
        ["State",   e.address?.state   || "—"],
        ["Country", e.address?.country || "—"],
      ],
    },
  ];

  const sectionsHtml = sections.map(s => `
    <div class="section">
      <div class="section-title">${s.title}</div>
      <table>
        ${s.rows.map(([label, val]) => `
          <tr>
            <td class="label-cell">${label}</td>
            <td class="value-cell">${val}</td>
          </tr>
        `).join("")}
      </table>
    </div>
  `).join("");

  const html = `
    <html><head><title>${e.name || "Employee"}</title><style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Segoe UI', sans-serif; padding: 32px; color: #0f172a; background: #fff; }
      .header { display: flex; align-items: center; gap: 20px; padding-bottom: 20px; border-bottom: 2px solid #2563eb; margin-bottom: 24px; }
      .avatar { width: 64px; height: 64px; border-radius: 12px; background: #2563eb; color: #fff; font-size: 22px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .header-info h1 { font-size: 20px; font-weight: 700; color: #0f172a; }
      .header-info p  { font-size: 13px; color: #64748b; margin-top: 3px; }
      .role-badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 2px 10px; border-radius: 20px; background: #eff6ff; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 5px; }
      .section { margin-bottom: 22px; }
      .section-title { font-size: 11px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 0.6px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; margin-bottom: 10px; }
      table { width: 100%; border-collapse: collapse; }
      .label-cell { font-size: 12px; font-weight: 600; color: #64748b; padding: 7px 16px 7px 0; width: 160px; vertical-align: top; }
      .value-cell { font-size: 13px; color: #0f172a; padding: 7px 0; vertical-align: top; }
      tr { border-bottom: 1px solid #f1f5f9; }
      tr:last-child { border-bottom: none; }
      .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: right; }
    </style></head><body>
    <div class="header">
      ${imgHtml}
      <div class="header-info">
        <h1>${e.name || "—"}</h1>
        <p>${e.email || "—"}</p>
        <span class="role-badge">${e.role || "employee"}</span>
      </div>
    </div>
    ${sectionsHtml}
    <div class="footer">Generated by ManagePortal · ${new Date().toLocaleDateString("en-IN")}</div>
    </body></html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 600);
}

function ExportDropdown({ employee }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const options = [
    { label: "Export as CSV",   color: "#16a34a", action: () => { exportEmpCSV(employee);                                  setOpen(false); } },
    { label: "Export as Excel", color: "#2563eb", action: () => { exportEmpExcel(employee);                                setOpen(false); } },
    { label: "Export as PDF",   color: "#dc2626", action: () => { exportEmpPDF(employee).finally(() => setOpen(false)); }               },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: 8,
          border: "1.5px solid #e2e8f0", background: "#f8fafc",
          fontSize: 12, fontWeight: 600, color: "#334155",
          cursor: "pointer", fontFamily: "inherit",
          transition: "background 0.15s, border-color 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
      >
        <ExportIcon /> Export
        <svg width="9" height="5" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 1L5 5L9 1"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.10)", zIndex: 3000,
          minWidth: 170, overflow: "hidden",
        }}>
          {options.map(o => (
            <button
              key={o.label}
              onClick={o.action}
              style={{
                display: "flex", alignItems: "center", gap: 9,
                width: "100%", padding: "10px 14px", border: "none",
                background: "none", cursor: "pointer", fontFamily: "inherit",
                fontSize: 13, fontWeight: 500, color: "#334155", textAlign: "left",
                transition: "background 0.12s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: o.color, flexShrink: 0 }} />
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 500 }}>{value}</div>
    </div>
  );
}

export default function EmployeeDetailModal({ employee, onClose }) {
  if (!employee) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 2000, overflowY: "auto", padding: "40px 16px" }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", width: 480, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 12px 40px rgba(0,0,0,0.15)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Employee Details</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ExportDropdown employee={employee} />
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#94a3b8", lineHeight: 1 }}>✕</button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", flex: 1 }}>

          {/* Hero */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 20px 20px", borderBottom: "1px solid #f1f5f9", background: "#fafafa" }}>
            {employee.image ? (
              <img
                src={employee.image}
                alt={employee.name}
                style={{ width: 72, height: 72, borderRadius: 16, objectFit: "cover", marginBottom: 12, border: "2px solid #e2e8f0" }}
              />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: 16, background: "#2563eb", color: "#fff", fontSize: 22, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                {employee.avatar}
              </div>
            )}
            <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{employee.name}</div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 5, padding: "2px 10px", borderRadius: 20, background: employee.role === "admin" ? "#eff6ff" : "#f0fdf4", color: employee.role === "admin" ? "#2563eb" : "#16a34a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {employee.role}
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>{employee.email}</div>
          </div>

          <div style={{ padding: "20px" }}>

            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>Personal Info</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px", marginBottom: 20 }}>
              <InfoRow label="Username"      value={employee.username ? `@${employee.username}` : null} />
              <InfoRow label="Phone"         value={employee.phone} />
              <InfoRow label="Date of Birth" value={employee.birthDate} />
              <InfoRow label="Age"           value={employee.age ? `${employee.age} years` : null} />
              <InfoRow label="Gender"        value={employee.gender} />
              <InfoRow label="Blood Group"   value={employee.bloodGroup} />
            </div>

            <div style={{ height: 1, background: "#f1f5f9", marginBottom: 16 }} />

            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>Work</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px", marginBottom: 20 }}>
              <InfoRow label="Company"    value={employee.company} />
              <InfoRow label="Department" value={employee.dept} />
              <InfoRow label="Title"      value={employee.jobTitle} />
              <InfoRow label="University" value={employee.university} />
            </div>

            <div style={{ height: 1, background: "#f1f5f9", marginBottom: 16 }} />

            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>Address</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
              <InfoRow label="Street"  value={employee.address?.address} />
              <InfoRow label="City"    value={employee.address?.city} />
              <InfoRow label="State"   value={employee.address?.state} />
              <InfoRow label="Country" value={employee.address?.country} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}