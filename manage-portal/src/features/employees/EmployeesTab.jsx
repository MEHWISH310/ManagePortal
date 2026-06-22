import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import Avatar        from "../../shared/ui/Avatar";
import SectionHeader from "../../shared/ui/SectionHeader";
import { formatSalary } from "../../shared/utils/formatSalary";
import { TrashIcon }    from "../../shared/icons/icons";
import AddEmployeeModal    from "./AddEmployeeModel";
import DeleteConfirmModal  from "./DeleteConfirmModel";
import EmployeeDetailModal from "./EmployeeDetailModal";
import { impersonateUser } from "../../shared/api/authApi";

ModuleRegistry.registerModules([AllCommunityModule]);

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);

const ExportIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const ImportIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const GridViewIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);

const TableViewIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

// CHANGED: Restore icon for deleted employees
const RestoreIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
  </svg>
);

const DEPTS    = ["Engineering", "HR", "Finance", "Design", "Sales", "Product Management", "Marketing", "Operations", "General"];
const STATUSES = ["Active", "On Leave", "Inactive"];
const ROLES    = ["admin", "moderator", "employee"];

function exportCSV(data) {
  const headers = ["Name", "Email", "Phone", "Department", "Job Title", "Role", "Status", "Net Pay (INR)"];
  const rows = data.map(e => [e.name, e.email, e.phone || "", e.dept, e.jobTitle || "", e.role, e.status, e.salary ?? ""]);
  const csv = [headers, ...rows].map(row => row.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "employees.csv"; a.click();
  URL.revokeObjectURL(url);
}

function exportExcel(data) {
  const headers = ["Name", "Email", "Phone", "Department", "Job Title", "Role", "Status", "Net Pay"];
  const rows = data.map(e => [e.name, e.email, e.phone || "", e.dept, e.jobTitle || "", e.role, e.status, e.salary ? formatSalary(e.salary) : "—"]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Employees");
  XLSX.writeFile(wb, "employees.xlsx");
}

function exportPDF(data) {
  const headers = ["Name", "Email", "Department", "Job Title", "Status", "Net Pay"];
  const rows = data.map(e => [e.name, e.email, e.dept, e.jobTitle || e.role, e.status, e.salary ? formatSalary(e.salary) : "—"]);
  const html = `
    <html><head><title>Employees</title><style>
      body { font-family: 'Segoe UI', sans-serif; padding: 24px; color: #0f172a; }
      h2 { font-size: 20px; margin-bottom: 16px; color: #2563eb; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { background: #2563eb; color: #fff; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; }
      td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
      tr:nth-child(even) td { background: #f8fafc; }
    </style></head><body>
    <h2>Employee Report</h2>
    <p style="font-size:12px;color:#64748b;margin-bottom:14px;">Total: ${data.length} employees · Exported ${new Date().toLocaleDateString("en-IN")}</p>
    <table>
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map(v => `<td>${v}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
    </body></html>`;
  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 400);
}

function ExportDropdown({ data }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const options = [
    { label: "Export as CSV",   color: "#16a34a", action: () => { exportCSV(data);   setOpen(false); } },
    { label: "Export as Excel", color: "#2563eb", action: () => { exportExcel(data); setOpen(false); } },
    { label: "Export as PDF",   color: "#dc2626", action: () => { exportPDF(data);   setOpen(false); } },
  ];
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 12.5, fontWeight: 600, color: "#334155", cursor: "pointer", fontFamily: "inherit" }}
        onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
        <ExportIcon /> Export
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1L5 5L9 1"/></svg>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.10)", zIndex: 100, minWidth: 170, overflow: "hidden" }}>
          {options.map(o => (
            <button key={o.label} onClick={o.action}
              style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 14px", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 500, color: "#334155", textAlign: "left" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: o.color, flexShrink: 0 }} />{o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// CHANGED: DeletedEmployeesSection — dropdown section for deleted employees (card view)
function DeletedEmployeesSection({ deletedEmployees, onRestore }) {
  const [open, setOpen] = useState(false);

  if (deletedEmployees.length === 0) return null;

  return (
    <div style={{ marginTop: "1rem", border: "1px solid #fee2e2", borderRadius: 12, overflow: "hidden" }}>
      {/* Header — click to toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", background: "#fef2f2", border: "none", cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#dc2626" }}>
            Deleted Employees
          </span>
          {/* Count badge */}
          <span style={{
            fontSize: 11, fontWeight: 700, background: "#dc2626", color: "#fff",
            padding: "2px 8px", borderRadius: 20, minWidth: 22, textAlign: "center",
          }}>
            {deletedEmployees.length}
          </span>
        </div>
        <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>
          {open ? "▲ Hide" : "▼ Show"}
        </span>
      </button>

      {/* Dropdown content */}
      {open && (
        <div style={{ padding: "12px 16px 16px", background: "#fff" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem" }}>
            {deletedEmployees.map(e => (
              <div key={e.id}
                style={{
                  border: "1px solid #fee2e2", borderRadius: 12, padding: "1rem 1.1rem",
                  background: "#fff5f5", position: "relative", opacity: 0.85,
                }}
              >
                {/* Deleted badge */}
                <span style={{
                  position: "absolute", top: 8, left: 10, fontSize: 10, fontWeight: 700,
                  background: "#fee2e2", color: "#dc2626", padding: "2px 7px", borderRadius: 20,
                }}>
                  Deleted
                </span>

                {/* Restore button */}
                {onRestore && (
                  <button
                    onClick={() => onRestore(e.id)}
                    title="Restore employee"
                    style={{
                      position: "absolute", top: 8, right: 8,
                      display: "flex", alignItems: "center", gap: 4,
                      fontSize: 11, fontWeight: 600, color: "#16a34a",
                      background: "#f0fdf4", border: "1px solid #bbf7d0",
                      borderRadius: 7, padding: "4px 9px", cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={ev => { ev.currentTarget.style.background = "#dcfce7"; }}
                    onMouseLeave={ev => { ev.currentTarget.style.background = "#f0fdf4"; }}
                  >
                    <RestoreIcon /> Restore
                  </button>
                )}

                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 28, marginBottom: 10 }}>
                  <Avatar initials={e.avatar} size={36} style={{ opacity: 0.6 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#64748b", marginBottom: 1, textDecoration: "line-through" }}>{e.name}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{e.jobTitle || e.role}</div>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #fee2e2", paddingTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
                  <div>
                    <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>Dept</div>
                    <div style={{ fontSize: 12.5, color: "#94a3b8", marginTop: 1 }}>{e.dept}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>Email</div>
                    <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.email}</div>
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>Net pay</div>
                    <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 700, marginTop: 1 }}>{e.salary ? formatSalary(e.salary) : "—"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// CHANGED: prop `deletedEmployees` aur `onRestore` add kiye
export default function EmployeesTab({ employees, deletedEmployees = [], onAdd, onDelete, onEdit, onStatusChange, onRestore, currentUserId, onImport, onImpersonate }) {
  const [showAddModal,  setShowAddModal]  = useState(false);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [selectedEmp,   setSelectedEmp]   = useState(null);
  const [search,        setSearch]        = useState("");
  const [deptFilter,    setDeptFilter]    = useState("");
  const [statusFilter,  setStatusFilter]  = useState("");
  const [roleFilter,    setRoleFilter]    = useState("");
  const [impersonating, setImpersonating] = useState(null);
  const [viewMode,      setViewMode]      = useState("card");
  const gridRef = useRef();

  const filtered = useMemo(() => employees.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.name?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.dept?.toLowerCase().includes(q) || e.jobTitle?.toLowerCase().includes(q);
    const matchDept   = !deptFilter   || deptFilter   === "All" || e.dept?.toLowerCase()   === deptFilter.toLowerCase();
    const matchStatus = !statusFilter || statusFilter === "All" || e.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchRole   = !roleFilter   || roleFilter   === "All" || e.role?.toLowerCase()   === roleFilter.toLowerCase();
    return matchSearch && matchDept && matchStatus && matchRole;
  }), [employees, search, deptFilter, statusFilter, roleFilter]);

  const hasFilters = search || deptFilter || statusFilter || roleFilter;
  const clearFilters = () => { setSearch(""); setDeptFilter(""); setStatusFilter(""); setRoleFilter(""); };

  // CHANGED: combined rows for Grid view — active employees + deleted employees, flagged
  const gridRowData = useMemo(() => [
    ...employees.map(e => ({ ...e, isDeleted: false })),
    ...deletedEmployees.map(e => ({ ...e, isDeleted: true })),
  ], [employees, deletedEmployees]);

  const handleImpersonate = async (emp) => {
    setImpersonating(emp.id);
    try {
      const data = await impersonateUser(emp.id);
      onImpersonate(data);
    } catch {
      alert("Failed to impersonate. Please try again.");
    } finally {
      setImpersonating(null);
    }
  };

  const columnDefs = useMemo(() => [
    {
      headerName: "Employee",
      field: "name",
      minWidth: 180,
      pinned: "left",
      filter: "agTextColumnFilter",
      floatingFilter: true,
      cellRenderer: (params) => {
        const e = params.data;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8, height: "100%", opacity: e.isDeleted ? 0.55 : 1 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "#2563eb", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {e.avatar}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", lineHeight: 1.3, textDecoration: e.isDeleted ? "line-through" : "none" }}>{e.name}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{e.jobTitle || e.role}</div>
            </div>
          </div>
        );
      },
    },
    {
      headerName: "Email",
      field: "email",
      minWidth: 200,
      filter: "agTextColumnFilter",
      floatingFilter: true,
    },
    {
      headerName: "Phone",
      field: "phone",
      minWidth: 150,
      filter: "agTextColumnFilter",
      floatingFilter: true,
    },
    {
      headerName: "Department",
      field: "dept",
      minWidth: 150,
      filter: "agTextColumnFilter",
      floatingFilter: true,
    },
    {
      headerName: "Job Title",
      field: "jobTitle",
      minWidth: 160,
      filter: "agTextColumnFilter",
      floatingFilter: true,
    },
    {
      headerName: "Role",
      field: "role",
      minWidth: 120,
      filter: "agTextColumnFilter",
      floatingFilter: true,
      cellRenderer: (params) => (
        <span style={{
          fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
          background: params.value === "admin" ? "#eff6ff" : params.value === "moderator" ? "#fdf4ff" : "#f1f5f9",
          color: params.value === "admin" ? "#2563eb" : params.value === "moderator" ? "#9333ea" : "#475569",
        }}>
          {params.value}
        </span>
      ),
    },
    {
      headerName: "Status",
      field: "status",
      minWidth: 150,
      filter: "agTextColumnFilter",
      floatingFilter: true,
      cellRenderer: (params) => {
        const e = params.data;
        const isSelf = e.id === currentUserId;
        return (
          <select
            value={e.status}
            onChange={ev => { ev.stopPropagation(); if (!isSelf && !e.isDeleted) onStatusChange?.(e.id, ev.target.value); }}
            onClick={ev => ev.stopPropagation()}
            disabled={isSelf || e.isDeleted}
            style={{
              fontSize: 11, fontWeight: 600, padding: "2px 18px 2px 7px",
              borderRadius: 20, border: "1.5px solid transparent",
              cursor: (isSelf || e.isDeleted) ? "not-allowed" : "pointer",
              outline: "none", fontFamily: "inherit",
              opacity: e.isDeleted ? 0.55 : 1,
              backgroundColor: e.status === "Active" ? "#f0fdf4" : e.status === "On Leave" ? "#fef9ec" : "#fef2f2",
              color: e.status === "Active" ? "#15803d" : e.status === "On Leave" ? "#b45309" : "#b91c1c",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='5' viewBox='0 0 8 5' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L4 4L7 1' stroke='%2364748b' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat", backgroundPosition: "right 5px center",
            }}
          >
            <option>Active</option>
            <option>On Leave</option>
            <option>Inactive</option>
          </select>
        );
      },
    },
    {
      headerName: "Net Pay",
      field: "salary",
      minWidth: 130,
      filter: "agNumberColumnFilter",
      floatingFilter: true,
      sortable: true,
      valueFormatter: (params) => params.value ? formatSalary(params.value) : "—",
    },
    // CHANGED: new "Deleted" status column
    {
      headerName: "Deleted",
      field: "isDeleted",
      minWidth: 110,
      maxWidth: 110,
      sortable: true,
      filter: false,
      floatingFilter: false,
      cellRenderer: (params) => (
        params.value
          ? <span style={{ fontSize: 11, fontWeight: 700, background: "#fee2e2", color: "#dc2626", padding: "2px 9px", borderRadius: 20 }}>Deleted</span>
          : <span style={{ fontSize: 11, fontWeight: 600, background: "#f0fdf4", color: "#15803d", padding: "2px 9px", borderRadius: 20 }}>Active</span>
      ),
    },
    {
      headerName: "Actions",
      minWidth: 110,
      maxWidth: 110,
      sortable: false,
      filter: false,
      floatingFilter: false,
      pinned: "right",
      cellRenderer: (params) => {
        const e = params.data;
        const isSelf = e.id === currentUserId;

        // CHANGED: deleted rows just show a Restore button
        if (e.isDeleted) {
          return (
            <button onClick={() => onRestore?.(e.id)} title="Restore employee"
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 7, padding: "4px 9px", cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={ev => { ev.currentTarget.style.background = "#dcfce7"; }}
              onMouseLeave={ev => { ev.currentTarget.style.background = "#f0fdf4"; }}>
              <RestoreIcon /> Restore
            </button>
          );
        }

        if (isSelf) return <span style={{ fontSize: 10, fontWeight: 600, color: "#2563eb", background: "#eff6ff", padding: "2px 7px", borderRadius: 20 }}>You</span>;
        return (
          <div style={{ display: "flex", gap: 4, alignItems: "center", height: "100%" }}>
            <button onClick={() => onEdit?.(e)} title="Edit"
              style={{ width: 26, height: 26, borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1" }}
              onMouseEnter={ev => { ev.currentTarget.style.background = "#eff6ff"; ev.currentTarget.style.color = "#2563eb"; }}
              onMouseLeave={ev => { ev.currentTarget.style.background = "transparent"; ev.currentTarget.style.color = "#cbd5e1"; }}>
              <EditIcon />
            </button>
            <button onClick={() => handleImpersonate(e)} disabled={impersonating === e.id} title="Login as"
              style={{ width: 26, height: 26, borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1", fontSize: 13 }}
              onMouseEnter={ev => { ev.currentTarget.style.background = "#fdf4ff"; ev.currentTarget.style.color = "#9333ea"; }}
              onMouseLeave={ev => { ev.currentTarget.style.background = "transparent"; ev.currentTarget.style.color = "#cbd5e1"; }}>
              {impersonating === e.id ? "…" : "👤"}
            </button>
            <button onClick={() => setDeleteTarget(e)} title="Remove"
              style={{ width: 26, height: 26, borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1" }}
              onMouseEnter={ev => { ev.currentTarget.style.background = "#fef2f2"; ev.currentTarget.style.color = "#dc2626"; }}
              onMouseLeave={ev => { ev.currentTarget.style.background = "transparent"; ev.currentTarget.style.color = "#cbd5e1"; }}>
              <TrashIcon />
            </button>
          </div>
        );
      },
    },
  ], [currentUserId, impersonating, onEdit, onStatusChange, onRestore]);

  const defaultColDef = useMemo(() => ({
    sortable:        true,
    resizable:       true,
    suppressMovable: false,
  }), []);

  const onRowClicked = useCallback((params) => {
    if (params.event.target.closest("button") || params.event.target.closest("select")) return;
    if (params.data?.isDeleted) return; // CHANGED: don't open detail modal for deleted rows
    setSelectedEmp(params.data);
  }, []);

  const ARROW = `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;
  const getSelectStyle = (value) => ({
    padding: "7px 28px 7px 10px", border: `1.5px solid ${value ? "#2563eb" : "#e2e8f0"}`, borderRadius: 8,
    fontSize: 12.5, fontFamily: "inherit", color: "#334155",
    backgroundColor: value ? "#fff" : "#f8fafc", outline: "none", cursor: "pointer",
    appearance: "none", backgroundImage: ARROW, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
  });

  return (
    <>
      <div className="db-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <SectionHeader
            title="All employees"
            count={filtered.length !== employees.length ? `${filtered.length} of ${employees.length}` : employees.length}
            action="+ Add employee"
            onAction={() => setShowAddModal(true)}
            extra={
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ display: "flex", border: "1.5px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                  <button onClick={() => setViewMode("card")}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 11px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, background: viewMode === "card" ? "#2563eb" : "#f8fafc", color: viewMode === "card" ? "#fff" : "#64748b" }}>
                    <GridViewIcon /> Cards
                  </button>
                  <button onClick={() => setViewMode("grid")}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 11px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, background: viewMode === "grid" ? "#2563eb" : "#f8fafc", color: viewMode === "grid" ? "#fff" : "#64748b" }}>
                    <TableViewIcon /> Grid
                  </button>
                </div>

                {viewMode === "grid" && (
                  <button
                    onClick={() => gridRef.current?.api?.exportDataAsCsv({ fileName: "employees_grid.csv" })}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 12.5, fontWeight: 600, color: "#334155", cursor: "pointer", fontFamily: "inherit" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                    <ExportIcon /> Grid CSV
                  </button>
                )}

                <button onClick={onImport}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 12.5, fontWeight: 600, color: "#334155", cursor: "pointer", fontFamily: "inherit" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                  <ImportIcon /> Import Excel
                </button>
                <ExportDropdown data={filtered} />
              </div>
            }
          />
        </div>

        {/* Filter bar — card view only */}
        {viewMode === "card" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: "1 1 180px", minWidth: 160 }}>
              <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex" }}><SearchIcon /></span>
              <input type="text" placeholder="Search name, email, dept…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: "100%", padding: "7px 10px 7px 30px", border: `1.5px solid ${search ? "#2563eb" : "#e2e8f0"}`, borderRadius: 8, fontSize: 12.5, fontFamily: "inherit", color: "#334155", backgroundColor: search ? "#fff" : "#f8fafc", outline: "none" }}
                onFocus={e => { e.target.style.borderColor = "#2563eb"; e.target.style.backgroundColor = "#fff"; }}
                onBlur={e => { if (!search) { e.target.style.borderColor = "#e2e8f0"; e.target.style.backgroundColor = "#f8fafc"; } }}
              />
            </div>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={getSelectStyle(deptFilter)}>
              <option value="">-- Department --</option>
              <option value="All">All</option>
              {DEPTS.map(d => <option key={d}>{d}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={getSelectStyle(statusFilter)}>
              <option value="">-- Status --</option>
              <option value="All">All</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={getSelectStyle(roleFilter)}>
              <option value="">-- Role --</option>
              <option value="All">All</option>
              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
            {hasFilters && (
              <button onClick={clearFilters} style={{ fontSize: 12, fontWeight: 600, color: "#64748b", background: "#f1f5f9", border: "none", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                ✕ Clear
              </button>
            )}
          </div>
        )}

        {/* ── CARD VIEW ── */}
        {viewMode === "card" && (
          filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8", fontSize: 13 }}>
              {hasFilters ? "No employees match your filters." : "No employees yet."}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem" }}>
              {filtered.map(e => {
                const isSelf = e.id === currentUserId;
                return (
                  <div key={e.id} onClick={() => setSelectedEmp(e)}
                    style={{ border: "1px solid #f1f5f9", borderRadius: 12, padding: "1rem 1.1rem", background: "#fafafa", position: "relative", cursor: "pointer", transition: "box-shadow 0.15s, border-color 0.15s" }}
                    onMouseEnter={ev => { ev.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; ev.currentTarget.style.borderColor = "#e2e8f0"; }}
                    onMouseLeave={ev => { ev.currentTarget.style.boxShadow = "none"; ev.currentTarget.style.borderColor = "#f1f5f9"; }}
                  >
                    <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }} onClick={ev => ev.stopPropagation()}>
                      {isSelf ? (
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#2563eb", background: "#eff6ff", padding: "2px 7px", borderRadius: 20 }}>You</span>
                      ) : (
                        <>
                          <button onClick={() => onEdit?.(e)} title="Edit"
                            style={{ width: 26, height: 26, borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1" }}
                            onMouseEnter={ev => { ev.currentTarget.style.background = "#eff6ff"; ev.currentTarget.style.color = "#2563eb"; }}
                            onMouseLeave={ev => { ev.currentTarget.style.background = "transparent"; ev.currentTarget.style.color = "#cbd5e1"; }}>
                            <EditIcon />
                          </button>
                          <button onClick={() => handleImpersonate(e)} disabled={impersonating === e.id} title="Login as"
                            style={{ width: 26, height: 26, borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1", fontSize: 13 }}
                            onMouseEnter={ev => { ev.currentTarget.style.background = "#fdf4ff"; ev.currentTarget.style.color = "#9333ea"; }}
                            onMouseLeave={ev => { ev.currentTarget.style.background = "transparent"; ev.currentTarget.style.color = "#cbd5e1"; }}>
                            {impersonating === e.id ? "…" : "👤"}
                          </button>
                          <button onClick={() => setDeleteTarget(e)} title="Remove"
                            style={{ width: 26, height: 26, borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1" }}
                            onMouseEnter={ev => { ev.currentTarget.style.background = "#fef2f2"; ev.currentTarget.style.color = "#dc2626"; }}
                            onMouseLeave={ev => { ev.currentTarget.style.background = "transparent"; ev.currentTarget.style.color = "#cbd5e1"; }}>
                            <TrashIcon />
                          </button>
                        </>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10, paddingRight: 90 }}>
                      <Avatar initials={e.avatar} size={38} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", marginBottom: 1 }}>{e.name}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{e.jobTitle || e.role}</div>
                      </div>
                      <select value={e.status}
                        onChange={ev => { ev.stopPropagation(); if (!isSelf) onStatusChange?.(e.id, ev.target.value); }}
                        onClick={ev => ev.stopPropagation()} disabled={isSelf}
                        style={{ fontSize: 12, fontWeight: 600, padding: "2px 20px 2px 8px", borderRadius: 20, border: "1.5px solid transparent", cursor: isSelf ? "not-allowed" : "pointer", outline: "none", fontFamily: "inherit", opacity: isSelf ? 0.6 : 1, backgroundColor: e.status === "Active" ? "#f0fdf4" : e.status === "On Leave" ? "#fef9ec" : "#fef2f2", color: e.status === "Active" ? "#15803d" : e.status === "On Leave" ? "#b45309" : "#b91c1c", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='5' viewBox='0 0 8 5' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L4 4L7 1' stroke='%2364748b' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center" }}>
                        <option>Active</option>
                        <option>On Leave</option>
                        <option>Inactive</option>
                      </select>
                    </div>
                    <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
                      <div>
                        <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>Dept</div>
                        <div style={{ fontSize: 12.5, color: "#334155", marginTop: 1 }}>{e.dept}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>Email</div>
                        <div style={{ fontSize: 11.5, color: "#334155", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.email}</div>
                      </div>
                      <div style={{ gridColumn: "1/-1" }}>
                        <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>Net pay</div>
                        <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 700, marginTop: 1 }}>{e.salary ? formatSalary(e.salary) : "—"}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── AG GRID VIEW ── */}
        {viewMode === "grid" && (
          <div className="ag-theme-quartz" style={{ height: 600, width: "100%" }}>
            <AgGridReact
              ref={gridRef}
              rowData={gridRowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              onRowClicked={onRowClicked}
              rowSelection="multiple"
              suppressRowClickSelection={true}
              pagination={true}
              paginationPageSize={15}
              paginationPageSizeSelector={[10, 15, 20, 50]}
              animateRows={true}
              rowHeight={52}
              headerHeight={44}
              floatingFiltersHeight={40}
              enableCellTextSelection={true}
              getRowId={(params) => params.data.id}
            />
          </div>
        )}

        {/* Deleted Employees Section — both views, below the table/cards */}
        {viewMode === "card" && (
        <DeletedEmployeesSection
          deletedEmployees={deletedEmployees}
          onRestore={onRestore}
        />
        )}
      </div>

      {showAddModal && <AddEmployeeModal onClose={() => setShowAddModal(false)} onAdd={onAdd} />}
      {deleteTarget && <DeleteConfirmModal employee={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { onDelete(deleteTarget.id); setDeleteTarget(null); }} />}
      {selectedEmp  && <EmployeeDetailModal employee={selectedEmp} onClose={() => setSelectedEmp(null)} />}
    </>
  );
}