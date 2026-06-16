import { useState, useEffect } from "react";
import {
  fetchTrainings, createTraining, deleteTraining,
  createOrder, verifyPayment, fetchMyPayments,
  fetchAllPayments, fetchEnrolled
} from "../../shared/api/trainingApi";
import SectionHeader from "../../shared/ui/SectionHeader";
import Spinner       from "../../shared/ui/Spinner";
import Avatar        from "../../shared/ui/Avatar";

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

function TestCardsInfo() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 14px" }}>
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: "#2563eb" }}>💳 Test Card Details — Click to expand</span>
        <span style={{ fontSize: 12, color: "#2563eb" }}>{open ? "▲ Hide" : "▼ Show"}</span>
      </div>
      {open && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 11.5, color: "#64748b" }}>
            Use any random CVV and any future expiry date. On the mock bank page, click <b>Success</b> to complete payment.
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Indian Cards</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ background: "#dbeafe" }}>
                <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600 }}>Network</th>
                <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600 }}>Card Number</th>
              </tr></thead>
              <tbody>{INDIAN_CARDS.map((c, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                  <td style={{ padding: "5px 10px" }}>{c.network}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "monospace", letterSpacing: 1 }}>{c.number}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>International Cards</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ background: "#dbeafe" }}>
                <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600 }}>Network</th>
                <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600 }}>Card Number</th>
              </tr></thead>
              <tbody>{INTL_CARDS.map((c, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                  <td style={{ padding: "5px 10px" }}>{c.network}</td>
                  <td style={{ padding: "5px 10px", fontFamily: "monospace", letterSpacing: 1 }}>{c.number}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function EnrolledModal({ training, onClose }) {
  const [enrolled, setEnrolled] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetchEnrolled(training._id)
      .then(setEnrolled)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [training._id]);

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", width: 540, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
        onClick={e => e.stopPropagation()}
      >
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
                <Avatar initials={`${p.userId?.firstName?.[0] || ""}${p.userId?.lastName?.[0] || ""}`} size={34} />
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isPaid = (trainingId) =>
    myPayments.some(p => p.trainingId?._id === trainingId && p.status === "paid");

  const handlePay = async (training) => {
    setPayingId(training._id);
    try {
      const order = await createOrder({ trainingId: training._id });
      const options = {
        key:         order.keyId,
        amount:      order.amount,
        currency:    order.currency,
        name:        "ManagePortal",
        description: training.title,
        order_id:    order.orderId,
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
          } catch {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: { name: user.name || "", email: user.email || "" },
        theme:   { color: "#2563eb" },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      alert("Failed to initiate payment. Please try again.");
    } finally {
      setPayingId(null);
    }
  };

  const handleAdd = async () => {
    if (!form.title || !form.date || !form.price) return;
    setAdding(true);
    try {
      const t = await createTraining({ ...form, price: Number(form.price) });
      setTrainings(prev => [t, ...prev]);
      setForm({ title: "", description: "", date: "", duration: "", price: "" });
      setShowForm(false);
    } catch {
      alert("Failed to create training.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this training?")) return;
    await deleteTraining(id);
    setTrainings(prev => prev.filter(t => t._id !== id));
  };

  const statusBadge = (status) => {
    const map = {
      paid:    { bg: "#f0fdf4", color: "#16a34a", label: "Paid"    },
      created: { bg: "#fef9ec", color: "#b45309", label: "Pending" },
      failed:  { bg: "#fef2f2", color: "#dc2626", label: "Failed"  },
    };
    const s = map[status] || map.created;
    return <span style={{ fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, padding: "2px 8px", borderRadius: 20 }}>{s.label}</span>;
  };

  if (loading) return <Spinner text="Loading..." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {enrolledModal && <EnrolledModal training={enrolledModal} onClose={() => setEnrolledModal(null)} />}

      {successMsg && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", borderRadius: 9, padding: "10px 16px", fontSize: 13, fontWeight: 500 }}>
          ✓ {successMsg}
        </div>
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
            />

            {/* Add form inside same card */}
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
                {isAdmin ? "No trainings added yet. Click + Add Training to get started." : "No trainings scheduled yet."}
              </div>
            ) : isAdmin ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem" }}>
                {trainings.map(t => (
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
                      <button
                        onClick={() => setEnrolledModal(t)}
                        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "#2563eb", background: "#eff6ff", border: "none", borderRadius: 7, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit" }}
                      >
                        👥 {enrolledCounts[t._id] || 0} Enrolled
                      </button>
                      <button
                        onClick={() => handleDelete(t._id)}
                        style={{ fontSize: 12, fontWeight: 600, color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem" }}>
                {trainings.map(t => {
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
          />
          {isAdmin ? (
            allPayments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: 13 }}>No transactions yet.</div>
            ) : (
              <div className="db-table-wrap">
                <table className="db-table">
                  <thead><tr>
                    <th>Employee</th><th>Email</th><th>Department</th>
                    <th>Training</th><th>Training Date</th>
                    <th>Amount</th><th>Payment ID</th><th>Date</th><th>Status</th>
                  </tr></thead>
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
                        <td style={{ fontSize: 12 }}>{new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
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
                  <thead><tr>
                    <th>Training</th><th>Training Date</th><th>Duration</th>
                    <th>Amount</th><th>Payment ID</th><th>Order ID</th><th>Date</th><th>Status</th>
                  </tr></thead>
                  <tbody>
                    {myPayments.map(p => (
                      <tr key={p._id}>
                        <td style={{ fontWeight: 600 }}>{p.trainingId?.title || "—"}</td>
                        <td>{p.trainingId?.date || "—"}</td>
                        <td>{p.trainingId?.duration || "—"}</td>
                        <td style={{ fontWeight: 700, color: "#2563eb" }}>₹{p.amount}</td>
                        <td style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{p.razorpayPaymentId || "—"}</td>
                        <td style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{p.razorpayOrderId || "—"}</td>
                        <td style={{ fontSize: 12 }}>{new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
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