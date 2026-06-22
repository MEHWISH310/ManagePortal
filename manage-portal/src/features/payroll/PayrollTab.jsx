import { useState, useEffect } from "react";
import StatCard      from "../../shared/ui/StatCard";
import SectionHeader from "../../shared/ui/SectionHeader";
import Avatar        from "../../shared/ui/Avatar";
import { formatSalary } from "../../shared/utils/formatSalary";
import { fetchPayroll, updatePayrollStatus } from "../../shared/api/payrollApi";
import { MY_PAYSLIPS } from "../../shared/data/chartData.jsx";
import Spinner from "../../shared/ui/Spinner";

const WalletIcon  = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 3H8L6 7h12z"/><circle cx="17" cy="14" r="1"/></svg>);
const CalIcon     = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const PeopleIcon  = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const AlertIcon   = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);

const STATUS_STYLE = {
  Paid:      { bg: "#f0fdf4", color: "#15803d" },
  Pending:   { bg: "#fef9ec", color: "#b45309" },
  "On Hold": { bg: "#fef2f2", color: "#b91c1c" },
};

function AdminPayroll() {
  const [payroll,  setPayroll]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    fetchPayroll()
      .then(data => setPayroll(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id, payrollStatus) => {
    try {
      await updatePayrollStatus(id, payrollStatus);
      setPayroll(prev => prev.map(e => e._id === id ? { ...e, payrollStatus } : e));
    } catch (err) {
      console.error("Payroll status update failed:", err.message);
    }
  };

  if (loading) return <Spinner text="Loading payslips..." />;
  if (error)   return <div style={{ padding: "2rem", color: "#dc2626" }}>Error: {error}</div>;

  const totalDisbursed = payroll.reduce((sum, e) => sum + (e.salary || 0), 0);
  const paid           = payroll.filter(e => e.payrollStatus === "Paid").length;
  const pending        = payroll.filter(e => e.payrollStatus === "Pending").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
        <StatCard label="Total Disbursed"  value={formatSalary(totalDisbursed)} delta="+3.2% vs Apr" up={true}  Icon={WalletIcon} accentBg="#eff6ff" accentColor="#2563eb" />
        <StatCard label="Pending Payslips" value={pending}                       delta="Check statuses" up={null} Icon={AlertIcon}  accentBg="#fef9ec" accentColor="#d97706" />
        <StatCard label="Employees Paid"   value={`${paid} / ${payroll.length}`} delta={`${pending} pending`} up={null} Icon={PeopleIcon} accentBg="#f0fdf4" accentColor="#16a34a" />
      </div>

      <div className="db-card">
        <SectionHeader title="Payroll — Current Month" />
        <div className="db-table-wrap">
          <table className="db-table">
            <thead>
              <tr><th>Employee</th><th>Dept</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net Pay</th><th>Status</th></tr>
            </thead>
            <tbody>
              {payroll.map(e => {
                const s = STATUS_STYLE[e.payrollStatus] || STATUS_STYLE.Pending;
                return (
                  <tr key={e._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <Avatar initials={e.avatar} size={28} />
                        <span className="db-td-bold">{e.name}</span>
                      </div>
                    </td>
                    <td style={{ color: "#64748b" }}>{e.dept}</td>
                    <td>{formatSalary(e.salary)}</td>
                    <td style={{ color: "#16a34a", fontWeight: 600 }}>{formatSalary(e.allow)}</td>
                    <td style={{ color: "#dc2626", fontWeight: 600 }}>-{formatSalary(e.ded)}</td>
                    <td className="db-td-bold">{formatSalary(e.net)}</td>
                    <td>
                      <select
                        value={e.payrollStatus}
                        onChange={ev => handleStatusChange(e._id, ev.target.value)}
                        onClick={ev => ev.stopPropagation()}
                        style={{
                          fontSize: 12, fontWeight: 600, padding: "2px 20px 2px 8px",
                          borderRadius: 20, border: "1.5px solid transparent",
                          cursor: "pointer", outline: "none", fontFamily: "inherit",
                          backgroundColor: s.bg, color: s.color,
                          appearance: "none",
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='5' viewBox='0 0 8 5' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L4 4L7 1' stroke='%2364748b' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                          backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center",
                        }}
                      >
                        <option>Paid</option>
                        <option>Pending</option>
                        <option>On Hold</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EmployeePayslips() {
  const [payroll,  setPayroll]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    fetchPayroll()
      .then(data => setPayroll(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner text="Loading payslips..." />;
  if (error)   return <div style={{ padding: "2rem", color: "#dc2626" }}>Error: {error}</div>;

  const me = payroll[0];
  if (!me) return <div style={{ padding: "2rem", color: "#94a3b8" }}>No payslip data found.</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
        <StatCard label="Net Pay"      value={formatSalary(me.net)}    sub="Current month"             Icon={WalletIcon} accentBg="#f0fdf4" accentColor="#16a34a" />
        <StatCard label="Basic Salary" value={formatSalary(me.salary)} sub="Base pay"                  Icon={WalletIcon} accentBg="#eff6ff" accentColor="#2563eb" />
        <StatCard label="Deductions"   value={formatSalary(me.ded)}    sub="PF + Tax"                  Icon={CalIcon}    accentBg="#fef9ec" accentColor="#d97706" />
      </div>
      <div className="db-card">
        <SectionHeader title="My Payslip" />
        <div className="db-table-wrap">
          <table className="db-table">
            <thead>
              <tr><th>Basic Pay</th><th>Allowances</th><th>Deductions</th><th>Net Pay</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>{formatSalary(me.salary)}</td>
                <td style={{ color: "#16a34a", fontWeight: 600 }}>{formatSalary(me.allow)}</td>
                <td style={{ color: "#dc2626", fontWeight: 600 }}>-{formatSalary(me.ded)}</td>
                <td className="db-td-bold">{formatSalary(me.net)}</td>
                <td>
                  {(() => {
                    const s = STATUS_STYLE[me.payrollStatus] || STATUS_STYLE.Pending;
                    return (
                      <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:12, fontWeight:600, padding:"3px 9px", borderRadius:20, background:s.bg, color:s.color }}>
                        {me.payrollStatus}
                      </span>
                    );
                  })()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function PayrollTab({ mode }) {
  if (mode === "employee") return <EmployeePayslips />;
  return <AdminPayroll />;
}