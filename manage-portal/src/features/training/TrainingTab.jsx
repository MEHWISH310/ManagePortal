import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  fetchTrainings, createTraining, updateTraining, deleteTraining,
  createOrder, verifyPayment, fetchMyPayments,
  fetchAllPayments, fetchEnrolled
} from "../../shared/api/trainingApi";
import SectionHeader from "../../shared/ui/SectionHeader";
import Spinner       from "../../shared/ui/Spinner";
import Avatar        from "../../shared/ui/Avatar";
import { apiPost } from "../../shared/api/apiClient";

const INDIAN_CARDS = [
  { network: "Visa",       number: "4100 2800 0000 1007" },
  { network: "Mastercard", number: "5500 6700 0000 1002" },
  { network: "RuPay",      number: "6527 6589 0000 1005" },
  { network: "Diners",     number: "3608 280009 1007"    },
  { network: "Amex",       number: "3402 560004 01007"   },
];
const INTL_CARDS = [
  { network: "Mastercard", number: "5555 5555 5555 4444" },
  { network: "Mastercard", number: "5105 1051 0510 5100" },
  { network: "Mastercard", number: "5104 0600 0000 0008" },
  { network: "Visa",       number: "4012 8888 8888 1881" },
];

// ── CHANGED: formatDateTime — date + time dono show karo ────────
function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const date = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${date}, ${time}`;
}

// ── Export helpers ──────────────────────────────────────────────
function exportTrainingsCSV(data) {
  const headers = ["Title", "Description", "Date", "Duration", "Price (₹)"];
  const rows    = data.map(t => [t.title, t.description || "", t.date, t.duration || "", t.price]);
  const csv     = [headers, ...rows].map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  download("\uFEFF" + csv, "trainings.csv", "text/csv;charset=utf-8;");
}

function exportTrainingsExcel(data) {
  const headers = ["Title", "Description", "Date", "Duration", "Price (₹)"];
  const rows    = data.map(t => [t.title, t.description || "", t.date, t.duration || "", t.price]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Trainings");
  XLSX.writeFile(wb, "trainings.xlsx");
}

function exportTrainingsPDF(data) {
  const html = `<html><head><title>Trainings</title><style>
    body{font-family:'Segoe UI',sans-serif;padding:24px;color:#0f172a}
    h2{font-size:20px;margin-bottom:16px;color:#2563eb}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{background:#2563eb;color:#fff;padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.4px}
    td{padding:8px 10px;border-bottom:1px solid #f1f5f9}
    tr:nth-child(even) td{background:#f8fafc}
  </style></head><body>
  <h2>Training List</h2>
  <p style="font-size:12px;color:#64748b;margin-bottom:14px">Total: ${data.length} trainings · Exported ${new Date().toLocaleDateString("en-IN")}</p>
  <table><thead><tr>${["Title","Description","Date","Duration","Price (₹)"].map(h=>`<th>${h}</th>`).join("")}</tr></thead>
  <tbody>${data.map(t=>`<tr><td>${t.title}</td><td>${t.description||"—"}</td><td>${t.date}</td><td>${t.duration||"—"}</td><td>₹${t.price}</td></tr>`).join("")}</tbody>
  </table></body></html>`;
  printHTML(html);
}

// ── CHANGED: exportTxnCSV — "Date & Time" column use karo ──────
function exportTxnCSV(data, isAdmin) {
  const headers = isAdmin
    ? ["Employee","Email","Department","Training","Training Date","Amount (₹)","Payment ID","Date & Time","Status"]
    : ["Training","Training Date","Duration","Amount (₹)","Payment ID","Order ID","Date & Time","Status"];
  const rows = isAdmin
    ? data.map(p => [`${p.userId?.firstName||""} ${p.userId?.lastName||""}`, p.userId?.email||"", p.userId?.dept||"", p.trainingId?.title||"", p.trainingId?.date||"", p.amount, p.razorpayPaymentId||"", formatDateTime(p.createdAt), p.status])
    : data.map(p => [p.trainingId?.title||"", p.trainingId?.date||"", p.trainingId?.duration||"", p.amount, p.razorpayPaymentId||"", p.razorpayOrderId||"", formatDateTime(p.createdAt), p.status]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  download("\uFEFF" + csv, "transactions.csv", "text/csv;charset=utf-8;");
}

// ── CHANGED: exportTxnExcel — "Date & Time" column use karo ────
function exportTxnExcel(data, isAdmin) {
  const headers = isAdmin
    ? ["Employee","Email","Department","Training","Training Date","Amount (₹)","Payment ID","Date & Time","Status"]
    : ["Training","Training Date","Duration","Amount (₹)","Payment ID","Order ID","Date & Time","Status"];
  const rows = isAdmin
    ? data.map(p => [`${p.userId?.firstName||""} ${p.userId?.lastName||""}`, p.userId?.email||"", p.userId?.dept||"", p.trainingId?.title||"", p.trainingId?.date||"", p.amount, p.razorpayPaymentId||"", formatDateTime(p.createdAt), p.status])
    : data.map(p => [p.trainingId?.title||"", p.trainingId?.date||"", p.trainingId?.duration||"", p.amount, p.razorpayPaymentId||"", p.razorpayOrderId||"", formatDateTime(p.createdAt), p.status]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Transactions");
  XLSX.writeFile(wb, "transactions.xlsx");
}

// ── CHANGED: exportTxnPDF — "Date & Time" column use karo ──────
function exportTxnPDF(data, isAdmin) {
  const headers = isAdmin
    ? ["Employee","Email","Dept","Training","Tr. Date","Amount","Payment ID","Date & Time","Status"]
    : ["Training","Tr. Date","Duration","Amount","Payment ID","Order ID","Date & Time","Status"];
  const rows = isAdmin
    ? data.map(p => [`${p.userId?.firstName||""} ${p.userId?.lastName||""}`, p.userId?.email||"", p.userId?.dept||"", p.trainingId?.title||"", p.trainingId?.date||"", `₹${p.amount}`, p.razorpayPaymentId||"—", formatDateTime(p.createdAt), p.status])
    : data.map(p => [p.trainingId?.title||"", p.trainingId?.date||"", p.trainingId?.duration||"—", `₹${p.amount}`, p.razorpayPaymentId||"—", p.razorpayOrderId||"—", formatDateTime(p.createdAt), p.status]);
  const html = `<html><head><title>Transactions</title><style>
    body{font-family:'Segoe UI',sans-serif;padding:24px;color:#0f172a}
    h2{font-size:20px;margin-bottom:16px;color:#2563eb}
    table{width:100%;border-collapse:collapse;font-size:11px}
    th{background:#2563eb;color:#fff;padding:6px 8px;text-align:left;font-size:10px;text-transform:uppercase}
    td{padding:6px 8px;border-bottom:1px solid #f1f5f9}
    tr:nth-child(even) td{background:#f8fafc}
  </style></head><body>
  <h2>Transaction Report</h2>
  <p style="font-size:12px;color:#64748b;margin-bottom:14px">Total: ${data.length} · Exported ${new Date().toLocaleDateString("en-IN")}</p>
  <table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead>
  <tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${v}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></body></html>`;
  printHTML(html);
}

function download(content, filename, type) {
  const blob = new Blob([content], { type });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function printHTML(html) {
  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 400);
}

// ── Export Dropdown ─────────────────────────────────────────────
function ExportDropdown({ onCSV, onExcel, onPDF }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 12.5, fontWeight: 600, color: "#334155", cursor: "pointer", fontFamily: "inherit" }}
        onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
      >
        ↓ Export
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1L5 5L9 1"/></svg>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.10)", zIndex: 100, minWidth: 160, overflow: "hidden" }}>
          {[
            { label: "Export as CSV",   color: "#16a34a", fn: () => { onCSV();   setOpen(false); } },
            { label: "Export as Excel", color: "#2563eb", fn: () => { onExcel(); setOpen(false); } },
            { label: "Export as PDF",   color: "#dc2626", fn: () => { onPDF();   setOpen(false); } },
          ].map(o => (
            <button key={o.label} onClick={o.fn}
              style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "10px 14px", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 500, color: "#334155", textAlign: "left" }}
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

// ── Test Cards ──────────────────────────────────────────────────
function TestCardsInfo() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#2563eb" }}>💳 Test Card Details — Click to expand</span>
        <span style={{ fontSize: 12, color: "#2563eb" }}>{open ? "▲ Hide" : "▼ Show"}</span>
      </div>
      {open && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 11.5, color: "#64748b" }}>Use any random CVV and any future expiry date. On the mock bank page, click <b>Success</b> to complete payment.</div>
          {[{ title: "Indian Cards", cards: INDIAN_CARDS }, { title: "International Cards", cards: INTL_CARDS }].map(({ title, cards }) => (
            <div key={title}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{title}</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead><tr style={{ background: "#dbeafe" }}>
                  <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600 }}>Network</th>
                  <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600 }}>Card Number</th>
                </tr></thead>
                <tbody>{cards.map((c, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                    <td style={{ padding: "5px 10px" }}>{c.network}</td>
                    <td style={{ padding: "5px 10px", fontFamily: "monospace", letterSpacing: 1 }}>{c.number}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Enrolled Modal ──────────────────────────────────────────────
function EnrolledModal({ training, onClose }) {
  const [enrolled, setEnrolled] = useState([]);
  const [loading,  setLoading]  = useState(true);
  useEffect(() => {
    fetchEnrolled(training._id).then(setEnrolled).catch(console.error).finally(() => setLoading(false));
  }, [training._id]);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", width: 540, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{training.title}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Enrolled Employees</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>✕</button>
        </div>
        {loading ? <Spinner text="Loading..." /> : enrolled.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: 13 }}>No employees enrolled yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {enrolled.map((p, i) => (
              <div key={p._id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "#f8fafc", borderRadius: 10, border: "1px solid #f1f5f9" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#2563eb", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                <Avatar initials={`${p.userId?.firstName?.[0]||""}${p.userId?.lastName?.[0]||""}`} size={34} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{p.userId?.firstName} {p.userId?.lastName}</div>
                  <div style={{ fontSize: 11.5, color: "#64748b" }}>{p.userId?.email} · {p.userId?.dept}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>₹{training.price}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Edit Modal ──────────────────────────────────────────────────
function EditModal({ training, onClose, onSave }) {
  const [form,   setForm]   = useState({ title: training.title, description: training.description || "", date: training.date, duration: training.duration || "", price: training.price });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title || !form.date || !form.price) return;
    setSaving(true);
    try {
      const updated = await updateTraining(training._id, { ...form, price: Number(form.price) });
      onSave(updated);
      onClose();
    } catch {
      alert("Failed to update training.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", width: 500, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Edit Training</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>✕</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input className="field-input" style={{ paddingLeft: 12 }} placeholder="Training title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <input className="field-input" style={{ paddingLeft: 12 }} placeholder="Duration (e.g. 2 hours)" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
          <input className="field-input" style={{ paddingLeft: 12 }} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <input className="field-input" style={{ paddingLeft: 12 }} type="number" placeholder="Price (₹) *" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
          <input className="field-input" style={{ paddingLeft: 12, gridColumn: "1/-1" }} placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "none", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────
export default function TrainingTab({ mode = "employee" }) {
  const isAdmin = mode === "admin";
  const user    = JSON.parse(localStorage.getItem("user") || "{}");

  const [trainings,      setTrainings]      = useState([]);
  const [myPayments,     setMyPayments]     = useState([]);
  const [allPayments,    setAllPayments]    = useState([]);
  const [enrolledCounts, setEnrolledCounts] = useState({});
  const [loading,        setLoading]        = useState(true);
  const [payingId,       setPayingId]       = useState(null);
  const [showForm,       setShowForm]       = useState(false);
  const [adding,         setAdding]         = useState(false);
  const [successMsg,     setSuccessMsg]     = useState("");
  const [activeTab,      setActiveTab]      = useState("trainings");
  const [enrolledModal,  setEnrolledModal]  = useState(null);
  const [editModal,      setEditModal]      = useState(null);
  const [form,           setForm]           = useState({ title: "", description: "", date: "", duration: "", price: "" });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [t, p] = await Promise.all([
        fetchTrainings(),
        isAdmin ? fetchAllPayments() : fetchMyPayments(),
      ]);
      setTrainings(t);
      if (isAdmin) {
        setAllPayments(p);
        const counts = {};
        p.filter(pay => pay.status === "paid").forEach(pay => {
          const tid = pay.trainingId?._id;
          if (tid) counts[tid] = (counts[tid] || 0) + 1;
        });
        setEnrolledCounts(counts);
      } else {
        setMyPayments(p);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const isPaid = (tid) => myPayments.some(p => p.trainingId?._id === tid && p.status === "paid");

  // Split trainings into upcoming and past based on date
  const today = new Date().toISOString().slice(0, 10);
  const upcomingTrainings = trainings.filter(t => t.date >= today);
  const pastTrainings     = trainings.filter(t => t.date < today);

  const handlePay = async (training) => {
    setPayingId(training._id);
    try {
      const order = await createOrder({ trainingId: training._id });
      const options = {
        key: order.keyId, amount: order.amount, currency: order.currency,
        name: "ManagePortal", description: training.title, order_id: order.orderId,
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setSuccessMsg(`Payment successful for "${training.title}"!`);
            await loadData();
            setTimeout(() => setSuccessMsg(""), 4000);
          } catch { alert("Payment verification failed."); }
        },
        prefill: { name: user.name || "", email: user.email || "" },
        theme:   { color: "#2563eb" },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", async (response) => {
        try {
          await apiPost("/payment/mark-failed", {
            razorpayOrderId: response.error.metadata.order_id,
            reason:          response.error.description,
          });
          await loadData();
        } catch (err) {
          console.error("Failed to mark payment:", err);
        }
      });

      rzp.open();
    } catch { alert("Failed to initiate payment."); }
    finally { setPayingId(null); }
  };

  const handleAdd = async () => {
    if (!form.title || !form.date || !form.price) return;
    setAdding(true);
    try {
      const t = await createTraining({ ...form, price: Number(form.price) });
      setTrainings(prev => [t, ...prev]);
      setForm({ title: "", description: "", date: "", duration: "", price: "" });
      setShowForm(false);
    } catch { alert("Failed to create training."); }
    finally { setAdding(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this training?")) return;
    await deleteTraining(id);
    setTrainings(prev => prev.filter(t => t._id !== id));
  };

  const handleEditSave = (updated) => {
    setTrainings(prev => prev.map(t => t._id === updated._id ? updated : t));
  };

  const statusBadge = (status) => {
    const map = { paid: { bg: "#f0fdf4", color: "#16a34a", label: "Paid" }, created: { bg: "#fef9ec", color: "#b45309", label: "Pending" }, failed: { bg: "#fef2f2", color: "#dc2626", label: "Failed" } };
    const s = map[status] || map.created;
    return <span style={{ fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, padding: "2px 8px", borderRadius: 20 }}>{s.label}</span>;
  };

  if (loading) return <Spinner text="Loading..." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {enrolledModal && <EnrolledModal training={enrolledModal} onClose={() => setEnrolledModal(null)} />}
      {editModal && <EditModal training={editModal} onClose={() => setEditModal(null)} onSave={handleEditSave} />}

      {successMsg && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", borderRadius: 9, padding: "10px 16px", fontSize: 13, fontWeight: 500 }}>✓ {successMsg}</div>
      )}

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 6 }}>
        {["trainings", "transactions"].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ fontSize: 13, fontWeight: 600, padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontFamily: "inherit", background: activeTab === t ? "#2563eb" : "#f1f5f9", color: activeTab === t ? "#fff" : "#64748b" }}>
            {t === "trainings" ? "Trainings" : "Transactions"}
          </button>
        ))}
      </div>

      {/* ── TRAININGS TAB ── */}
      {activeTab === "trainings" && (
        <>
          {!isAdmin && <TestCardsInfo />}
          <div className="db-card">
            <SectionHeader
              title={isAdmin ? "All Trainings" : "Available Trainings"}
              count={trainings.length}
              action={isAdmin ? (showForm ? "Cancel" : "+ Add Training") : undefined}
              onAction={isAdmin ? () => setShowForm(f => !f) : undefined}
              extra={isAdmin && trainings.length > 0 ? (
                <ExportDropdown
                  onCSV={()   => exportTrainingsCSV(trainings)}
                  onExcel={() => exportTrainingsExcel(trainings)}
                  onPDF={()   => exportTrainingsPDF(trainings)}
                />
              ) : undefined}
            />

            {isAdmin && showForm && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #f1f5f9" }}>
                <input className="field-input" style={{ paddingLeft: 12 }} placeholder="Training title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                <input className="field-input" style={{ paddingLeft: 12 }} placeholder="Duration (e.g. 2 hours)" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
                <input className="field-input" style={{ paddingLeft: 12 }} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                <input className="field-input" style={{ paddingLeft: 12 }} type="number" placeholder="Price (₹) *" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                <input className="field-input" style={{ paddingLeft: 12, gridColumn: "1/-1" }} placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                <div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "flex-end" }}>
                  <button className="submit-btn" style={{ width: "auto", padding: "0 20px", height: 38, marginTop: 0 }} onClick={handleAdd} disabled={adding}>
                    {adding ? "Adding..." : "Add Training"}
                  </button>
                </div>
              </div>
            )}

            {trainings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: 13 }}>
                {isAdmin ? "No trainings added yet." : "No trainings scheduled yet."}
              </div>
            ) : isAdmin ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Upcoming trainings */}
                {upcomingTrainings.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#2563eb", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                      Upcoming <span style={{ background: "#eff6ff", color: "#2563eb", fontSize: 11, padding: "1px 8px", borderRadius: 20 }}>{upcomingTrainings.length}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem" }}>
                      {upcomingTrainings.map(t => (
                        <div key={t._id} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: "1.1rem 1.2rem", background: "#fff", display: "flex", flexDirection: "column", gap: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{t.title}</div>
                            <span style={{ fontSize: 15, fontWeight: 800, color: "#2563eb", whiteSpace: "nowrap" }}>₹{t.price}</span>
                          </div>
                          {t.description && <div style={{ fontSize: 12.5, color: "#64748b" }}>{t.description}</div>}
                          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, color: "#64748b" }}>📅 {t.date}</span>
                            {t.duration && <span style={{ fontSize: 12, color: "#64748b" }}>⏱ {t.duration}</span>}
                          </div>
                          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <button onClick={() => setEnrolledModal(t)}
                              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "#2563eb", background: "#eff6ff", border: "none", borderRadius: 7, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                              👥 {enrolledCounts[t._id] || 0} Enrolled
                            </button>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => setEditModal(t)}
                                style={{ fontSize: 12, fontWeight: 600, color: "#2563eb", background: "#eff6ff", border: "none", borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                                Edit
                              </button>
                              <button onClick={() => handleDelete(t._id)}
                                style={{ fontSize: 12, fontWeight: 600, color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Past trainings — no edit/remove */}
                {pastTrainings.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                      Past Trainings <span style={{ background: "#f1f5f9", color: "#64748b", fontSize: 11, padding: "1px 8px", borderRadius: 20 }}>{pastTrainings.length}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem" }}>
                      {pastTrainings.map(t => (
                        <div key={t._id} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: "1.1rem 1.2rem", background: "#f8fafc", display: "flex", flexDirection: "column", gap: 8, opacity: 0.85 }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#64748b" }}>{t.title}</div>
                            <span style={{ fontSize: 15, fontWeight: 800, color: "#94a3b8", whiteSpace: "nowrap" }}>₹{t.price}</span>
                          </div>
                          {t.description && <div style={{ fontSize: 12.5, color: "#94a3b8" }}>{t.description}</div>}
                          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, color: "#94a3b8" }}>📅 {t.date}</span>
                            {t.duration && <span style={{ fontSize: 12, color: "#94a3b8" }}>⏱ {t.duration}</span>}
                          </div>
                          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <button onClick={() => setEnrolledModal(t)}
                              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "#64748b", background: "#f1f5f9", border: "none", borderRadius: 7, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                              👥 {enrolledCounts[t._id] || 0} Enrolled
                            </button>
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", background: "#f1f5f9", padding: "4px 10px", borderRadius: 7 }}>
                              Completed
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {upcomingTrainings.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#2563eb", marginBottom: 10 }}>📅 Upcoming Trainings</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem" }}>
                {upcomingTrainings.map(t => {
                  const paid = isPaid(t._id);
                  return (
                    <div key={t._id} style={{ border: `1px solid ${paid ? "#bbf7d0" : "#f1f5f9"}`, borderRadius: 12, padding: "1rem 1.1rem", background: paid ? "#f0fdf4" : "#fafafa", position: "relative", display: "flex", flexDirection: "column", gap: 6 }}>
                      {paid && <span style={{ position: "absolute", top: 10, right: 10, fontSize: 10, fontWeight: 700, background: "#16a34a", color: "#fff", padding: "2px 8px", borderRadius: 20 }}>ENROLLED</span>}
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", paddingRight: paid ? 70 : 0 }}>{t.title}</div>
                      {t.description && <div style={{ fontSize: 12.5, color: "#64748b" }}>{t.description}</div>}
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 4 }}>
                        <span style={{ fontSize: 12, color: "#64748b" }}>📅 {t.date}</span>
                        {t.duration && <span style={{ fontSize: 12, color: "#64748b" }}>⏱ {t.duration}</span>}
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#2563eb", marginTop: 4 }}>₹{t.price}</span>
                      </div>
                      <div style={{ marginTop: "auto", paddingTop: 10 }}>
                        {paid ? (
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#16a34a" }}>✓ Payment done — You are enrolled</div>
                        ) : (
                          <button onClick={() => handlePay(t)} disabled={payingId === t._id}
                            style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: "#2563eb", border: "none", borderRadius: 7, padding: "7px 16px", cursor: payingId === t._id ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: payingId === t._id ? 0.7 : 1, width: "100%" }}>
                            {payingId === t._id ? "Processing..." : `Pay & Enroll  ₹${t.price}`}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                    </div>
                  </div>
                )}
                {/* Past trainings — employee view */}
                {pastTrainings.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>✅ Past Trainings</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem" }}>
                      {pastTrainings.map(t => {
                        const paid = isPaid(t._id);
                        return (
                          <div key={t._id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: "1rem 1.1rem", background: "#f8fafc", opacity: 0.8, display: "flex", flexDirection: "column", gap: 6 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#64748b" }}>{t.title}</div>
                            {t.description && <div style={{ fontSize: 12.5, color: "#94a3b8" }}>{t.description}</div>}
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                              <span style={{ fontSize: 12, color: "#94a3b8" }}>📅 {t.date}</span>
                              {t.duration && <span style={{ fontSize: 12, color: "#94a3b8" }}>⏱ {t.duration}</span>}
                              <span style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8" }}>₹{t.price}</span>
                            </div>
                            <div style={{ marginTop: "auto", paddingTop: 8 }}>
                              {paid
                                ? <div style={{ fontSize: 12, fontWeight: 600, color: "#16a34a" }}>✓ You were enrolled</div>
                                : <div style={{ fontSize: 12, color: "#94a3b8" }}>Training completed</div>
                              }
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TRANSACTIONS TAB ── */}
      {activeTab === "transactions" && (
        <div className="db-card">
          <SectionHeader
            title={isAdmin ? "All Transactions" : "My Transactions"}
            count={isAdmin ? allPayments.length : myPayments.length}
            extra={
              <ExportDropdown
                onCSV={()   => exportTxnCSV(isAdmin ? allPayments : myPayments, isAdmin)}
                onExcel={() => exportTxnExcel(isAdmin ? allPayments : myPayments, isAdmin)}
                onPDF={()   => exportTxnPDF(isAdmin ? allPayments : myPayments, isAdmin)}
              />
            }
          />
          {isAdmin ? (
            allPayments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: 13 }}>No transactions yet.</div>
            ) : (
              <div className="db-table-wrap">
                <table className="db-table">
                  {/* CHANGED: "Date" → "Date & Time" */}
                  <thead><tr><th>Employee</th><th>Email</th><th>Department</th><th>Training</th><th>Training Date</th><th>Amount</th><th>Payment ID</th><th>Date &amp; Time</th><th>Status</th></tr></thead>
                  <tbody>
                    {allPayments.map(p => (
                      <tr key={p._id}>
                        <td style={{ fontWeight: 600 }}>{p.userId ? `${p.userId.firstName} ${p.userId.lastName}` : "—"}</td>
                        <td style={{ fontSize: 12, color: "#64748b" }}>{p.userId?.email || "—"}</td>
                        <td>{p.userId?.dept || "—"}</td>
                        <td style={{ fontWeight: 600 }}>{p.trainingId?.title || "—"}</td>
                        <td>{p.trainingId?.date || "—"}</td>
                        <td style={{ fontWeight: 700, color: "#2563eb" }}>₹{p.amount}</td>
                        <td style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{p.razorpayPaymentId || "—"}</td>
                        {/* CHANGED: date + time dono show karo */}
                        <td style={{ fontSize: 12 }}>
                          <div>{new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                            {new Date(p.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                          </div>
                        </td>
                        <td>{statusBadge(p.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            myPayments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: 13 }}>No transactions yet.</div>
            ) : (
              <div className="db-table-wrap">
                <table className="db-table">
                  {/* CHANGED: "Date" → "Date & Time" */}
                  <thead><tr><th>Training</th><th>Training Date</th><th>Duration</th><th>Amount</th><th>Payment ID</th><th>Order ID</th><th>Date &amp; Time</th><th>Status</th></tr></thead>
                  <tbody>
                    {myPayments.map(p => (
                      <tr key={p._id}>
                        <td style={{ fontWeight: 600 }}>{p.trainingId?.title || "—"}</td>
                        <td>{p.trainingId?.date || "—"}</td>
                        <td>{p.trainingId?.duration || "—"}</td>
                        <td style={{ fontWeight: 700, color: "#2563eb" }}>₹{p.amount}</td>
                        <td style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{p.razorpayPaymentId || "—"}</td>
                        <td style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{p.razorpayOrderId || "—"}</td>
                        {/* CHANGED: date + time dono show karo */}
                        <td style={{ fontSize: 12 }}>
                          <div>{new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                            {new Date(p.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                          </div>
                        </td>
                        <td>{statusBadge(p.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}