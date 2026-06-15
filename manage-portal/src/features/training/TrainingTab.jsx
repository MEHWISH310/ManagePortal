import { useState, useEffect } from "react";
import { fetchTrainings, createTraining, deleteTraining, createOrder, verifyPayment, fetchMyPayments } from "../../shared/api/trainingApi";
import SectionHeader from "../../shared/ui/SectionHeader";
import Spinner       from "../../shared/ui/Spinner";

export default function TrainingTab({ mode = "employee" }) {
  const isAdmin = mode === "admin";
  const user    = JSON.parse(localStorage.getItem("user") || "{}");

  const [trainings,  setTrainings]  = useState([]);
  const [myPayments, setMyPayments] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [payingId,   setPayingId]   = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  const [adding,     setAdding]     = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [form,       setForm]       = useState({ title: "", description: "", date: "", duration: "", price: "" });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [t, p] = await Promise.all([
        fetchTrainings(),
        isAdmin ? Promise.resolve([]) : fetchMyPayments(),
      ]);
      setTrainings(t);
      setMyPayments(p);
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
        prefill: {
          name:  user.name  || "",
          email: user.email || "",
        },
        theme: { color: "#2563eb" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
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
    if (!window.confirm("Delete this training?")) return;
    await deleteTraining(id);
    setTrainings(prev => prev.filter(t => t._id !== id));
  };

  if (loading) return <Spinner text="Loading trainings..." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {successMsg && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", borderRadius: 9, padding: "10px 16px", fontSize: 13, fontWeight: 500 }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Admin — Add Training form */}
      {isAdmin && (
        <div className="db-card">
          <SectionHeader
            title="Manage Trainings"
            action={showForm ? "Cancel" : "+ Add Training"}
            onAction={() => setShowForm(f => !f)}
          />
          {showForm && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
              <input
                className="field-input" style={{ paddingLeft: 12 }}
                placeholder="Training title *"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
              <input
                className="field-input" style={{ paddingLeft: 12 }}
                placeholder="Duration (e.g. 2 hours)"
                value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
              />
              <input
                className="field-input" style={{ paddingLeft: 12 }}
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              />
              <input
                className="field-input" style={{ paddingLeft: 12 }}
                type="number"
                placeholder="Price (₹) *"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              />
              <input
                className="field-input" style={{ paddingLeft: 12, gridColumn: "1/-1" }}
                placeholder="Description (optional)"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
              <div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "flex-end" }}>
                <button
                  className="submit-btn"
                  style={{ width: "auto", padding: "0 20px", height: 38, marginTop: 0 }}
                  onClick={handleAdd}
                  disabled={adding}
                >
                  {adding ? "Adding..." : "Add Training"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Training Cards */}
      <div className="db-card">
        <SectionHeader
          title={isAdmin ? "All Trainings" : "Available Trainings"}
          count={trainings.length}
        />

        {trainings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: 13 }}>
            {isAdmin ? "No trainings added yet. Click + Add Training to get started." : "No trainings scheduled yet."}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem" }}>
            {trainings.map(t => {
              const paid = !isAdmin && isPaid(t._id);
              return (
                <div
                  key={t._id}
                  style={{
                    border: `1px solid ${paid ? "#bbf7d0" : "#f1f5f9"}`,
                    borderRadius: 12,
                    padding: "1rem 1.1rem",
                    background: paid ? "#f0fdf4" : "#fafafa",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {paid && (
                    <span style={{
                      position: "absolute", top: 10, right: 10,
                      fontSize: 10, fontWeight: 700,
                      background: "#16a34a", color: "#fff",
                      padding: "2px 8px", borderRadius: 20,
                    }}>ENROLLED</span>
                  )}

                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", paddingRight: paid ? 70 : 0 }}>
                    {t.title}
                  </div>

                  {t.description && (
                    <div style={{ fontSize: 12.5, color: "#64748b" }}>{t.description}</div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>📅 {t.date}</span>
                    {t.duration && <span style={{ fontSize: 12, color: "#64748b" }}>⏱ {t.duration}</span>}
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#2563eb", marginTop: 4 }}>₹{t.price}</span>
                  </div>

                  <div style={{ marginTop: "auto", paddingTop: 10 }}>
                    {isAdmin ? (
                      <button
                        onClick={() => handleDelete(t._id)}
                        style={{
                          fontSize: 12, fontWeight: 600, color: "#dc2626",
                          background: "#fef2f2", border: "none", borderRadius: 7,
                          padding: "5px 12px", cursor: "pointer", fontFamily: "inherit",
                        }}
                      >
                        Delete
                      </button>
                    ) : paid ? (
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#16a34a" }}>✓ Payment done — You are enrolled</div>
                    ) : (
                      <button
                        onClick={() => handlePay(t)}
                        disabled={payingId === t._id}
                        style={{
                          fontSize: 12, fontWeight: 600, color: "#fff",
                          background: "#2563eb", border: "none", borderRadius: 7,
                          padding: "7px 16px", cursor: payingId === t._id ? "not-allowed" : "pointer",
                          fontFamily: "inherit", opacity: payingId === t._id ? 0.7 : 1,
                          width: "100%",
                        }}
                      >
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

      {/* Employee — My Enrollments */}
      {!isAdmin && myPayments.filter(p => p.status === "paid").length > 0 && (
        <div className="db-card">
          <SectionHeader title="My Enrollments" count={myPayments.filter(p => p.status === "paid").length} />
          <div className="db-table-wrap">
            <table className="db-table">
              <thead>
                <tr>
                  <th>Training</th>
                  <th>Date</th>
                  <th>Amount Paid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myPayments.filter(p => p.status === "paid").map(p => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 600 }}>{p.trainingId?.title || "—"}</td>
                    <td>{p.trainingId?.date || "—"}</td>
                    <td>₹{p.trainingId?.price || p.amount}</td>
                    <td>
                      <span style={{ fontSize: 11, fontWeight: 700, background: "#f0fdf4", color: "#16a34a", padding: "2px 8px", borderRadius: 20 }}>
                        Enrolled
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}