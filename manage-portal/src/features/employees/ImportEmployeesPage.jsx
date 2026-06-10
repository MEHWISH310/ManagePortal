import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import SectionHeader from "../../shared/ui/SectionHeader";

const UploadIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

function parseRows(rows) {
  return rows.map((row, i) => ({
    _rowIndex:  i + 2,
    firstName:  row["firstName"]  || "",
    lastName:   row["lastName"]   || "",
    name:       `${row["firstName"] || ""} ${row["lastName"] || ""}`.trim(),
    email:      row["email"]      || "",
    password:   row["password"]   || "Employee@123",
    phone:      row["phone"]      || "",
    username:   row["username"]   || "",
    gender:     row["gender"]     || "",
    bloodGroup: row["bloodGroup"] || "",
    role:       row["role"]       || "employee",
    jobTitle:   row["jobTitle"]   || "",
    dept:       row["dept"]       || "",
    company:    row["company"]    || "",
    university: row["university"] || "",
    status:     row["status"]     || "Active",
    salary:     row["salary"] ? Number(row["salary"]) || 0 : 0,
    address: {
      street:  row["street"]  || "",
      city:    row["city"]    || "",
      state:   row["state"]   || "",
      country: row["country"] || "",
    },
    avatar: row["firstName"]
      ? `${row["firstName"][0] || ""}${row["lastName"]?.[0] || ""}`.toUpperCase()
      : "??",
    image: null,
  })).filter(r => r.name.trim() !== "");
}

const STATUS_STYLE = {
  Active:     { bg: "#f0fdf4", color: "#15803d" },
  "On Leave": { bg: "#fef9ec", color: "#b45309" },
  Inactive:   { bg: "#fef2f2", color: "#b91c1c" },
};

export default function ImportEmployeesPage({ onImport, onBack }) {
  const [file,     setFile]     = useState(null);
  const [preview,  setPreview]  = useState([]);
  const [errors,   setErrors]   = useState([]);
  const [dragging, setDragging] = useState(false);
  const [imported, setImported] = useState(false);
  const inputRef = useRef();

  const processFile = (f) => {
    if (!f) return;
    setFile(f);
    setImported(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb     = XLSX.read(e.target.result, { type: "binary" });
        const ws     = wb.Sheets[wb.SheetNames[0]];
        const json   = XLSX.utils.sheet_to_json(ws);
        const parsed = parseRows(json);
        const errs = [];
parsed.forEach(r => {
  if (!r.firstName) errs.push(`Row ${r._rowIndex}: firstName is missing`);
  if (!r.email)     errs.push(`Row ${r._rowIndex}: email is missing`);
});
        setErrors(errs);
        setPreview(parsed);
      } catch {
        setErrors(["Could not read file. Make sure it's a valid .xlsx or .xls file."]);
        setPreview([]);
      }
    };
    reader.readAsBinaryString(f);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const handleConfirmImport = () => {
    if (errors.length > 0 || preview.length === 0) return;
    onImport?.(preview);
    setImported(true);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={onBack}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 12.5, fontWeight: 600, color: "#334155", cursor: "pointer", fontFamily: "inherit" }}
          >
            ← Back
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Import Employees</span>
        </div>
      </div>

      {/* Upload zone */}
      <div
        className="db-card"
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "#2563eb" : file ? "#16a34a" : "#cbd5e1"}`,
          background: dragging ? "#eff6ff" : file ? "#f0fdf4" : "#fafafa",
          borderRadius: 14, padding: "2.5rem 2rem",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
          cursor: "pointer", transition: "all 0.2s",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: "none" }}
          onChange={e => processFile(e.target.files[0])}
        />
        <div style={{ color: file ? "#16a34a" : "#94a3b8" }}>
          <UploadIcon />
        </div>
        {file ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>{file.name}</div>
            <div style={{ fontSize: 12.5, color: "#64748b" }}>{preview.length} employees found — click to replace file</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>Drop your Excel file here</div>
            <div style={{ fontSize: 12.5, color: "#94a3b8" }}>or click to browse · .xlsx and .xls supported</div>
          </>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#dc2626", marginBottom: 6 }}>⚠ {errors.length} issue{errors.length > 1 ? "s" : ""} found — fix before importing</div>
          {errors.map((err, i) => (
            <div key={i} style={{ fontSize: 12, color: "#b91c1c", marginTop: 3 }}>• {err}</div>
          ))}
        </div>
      )}

      {/* Success */}
      {imported && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#15803d" }}>
          ✓ {preview.length} employees imported successfully!
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <div className="db-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <SectionHeader title="Preview" count={`${preview.length} employees`} />
            <button
              onClick={handleConfirmImport}
              disabled={errors.length > 0 || imported}
              style={{
                padding: "8px 20px", borderRadius: 8, border: "none",
                background: errors.length > 0 || imported ? "#e2e8f0" : "#2563eb",
                color: errors.length > 0 || imported ? "#94a3b8" : "#fff",
                fontSize: 13, fontWeight: 600,
                cursor: errors.length > 0 || imported ? "not-allowed" : "pointer",
                fontFamily: "inherit", transition: "background 0.15s",
              }}
            >
              {imported ? "✓ Imported" : `Import ${preview.length} Employees`}
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="db-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Gender</th>
                  <th>Blood Group</th>
                  <th>Department</th>
                  <th>Job Title</th>
                  <th>Company</th>
                  <th>University</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Net Pay</th>
                  <th>Street</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Country</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((emp, i) => {
                  const ss = STATUS_STYLE[emp.status] || STATUS_STYLE["Active"];
                  return (
                    <tr key={i}>
                      <td style={{ color: "#94a3b8", fontSize: 12 }}>{i + 1}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: "#2563eb", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {emp.avatar}
                          </div>
                          <span style={{ fontWeight: 600, color: "#0f172a" }}>{emp.name}</span>
                        </div>
                      </td>
                      <td style={{ color: "#64748b", fontSize: 12 }}>{emp.email}</td>
                      <td>{emp.phone || "—"}</td>
                      <td style={{ textTransform: "capitalize" }}>{emp.gender || "—"}</td>
                      <td>{emp.bloodGroup || "—"}</td>
                      <td>{emp.dept || "—"}</td>
                      <td>{emp.jobTitle || "—"}</td>
                      <td style={{ fontSize: 12, color: "#64748b" }}>{emp.company || "—"}</td>
                      <td style={{ fontSize: 12, color: "#64748b" }}>{emp.university || "—"}</td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "#f1f5f9", color: "#475569", textTransform: "capitalize" }}>
                          {emp.role}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: ss.bg, color: ss.color }}>
                          {emp.status}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{emp.salary ? `₹${Number(emp.salary).toLocaleString("en-IN")}` : "—"}</td>
                      <td style={{ fontSize: 12, color: "#64748b" }}>{emp.address?.address || "—"}</td>
                      <td>{emp.address?.city || "—"}</td>
                      <td>{emp.address?.state || "—"}</td>
                      <td>{emp.address?.country || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}