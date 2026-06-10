import { useState } from "react";

const DEPARTMENTS  = ["Engineering", "HR", "Finance", "Design", "Sales", "Product Management", "Marketing", "Operations", "General"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const STATUSES     = ["Active", "On Leave", "Inactive"];

const EMPTY_FORM = {
  fname: "", lname: "", email: "", phone: "", username: "",
  dept: "Engineering", role: "", salary: "", status: "Active", gender: "male", bloodGroup: "A+",
  company: "", university: "",
  street: "", city: "", state: "", country: "",
};

const fieldStyle = {
  padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0",
  background: "#fff", fontSize: 13, color: "#0f172a",
  fontFamily: "inherit", outline: "none", width: "100%",
  transition: "border-color 0.15s",
};

const labelStyle = {
  fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4,
  display: "block", textTransform: "uppercase", letterSpacing: "0.4px",
};

const sectionStyle = {
  fontSize: 11, fontWeight: 700, color: "#2563eb",
  textTransform: "uppercase", letterSpacing: "0.6px",
  paddingBottom: 8, borderBottom: "1px solid #f1f5f9",
  marginBottom: 14, marginTop: 4,
};

export default function AddEmployeeModal({ onClose, onAdd }) {
  const [form,  setForm]  = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const focus = (e) => (e.target.style.borderColor = "#2563eb");
  const blur  = (e) => (e.target.style.borderColor = "#e2e8f0");

  const handleSubmit = () => {
    if (!form.fname.trim())     { setError("First name is required.");          return; }
    if (!form.lname.trim())     { setError("Last name is required.");           return; }
    if (!form.email.trim())     { setError("Email is required.");               return; }
    if (!form.phone.trim())     { setError("Phone is required.");               return; }
    if (!form.username.trim())  { setError("Username is required.");            return; }
    if (!form.role.trim())      { setError("Role / designation is required.");  return; }
    if (!form.salary)           { setError("Basic salary is required.");        return; }
    if (!form.company.trim())   { setError("Company is required.");             return; }
    if (!form.university.trim()){ setError("University is required.");          return; }
    if (!form.street.trim())    { setError("Street address is required.");      return; }
    if (!form.city.trim())      { setError("City is required.");                return; }
    if (!form.state.trim())     { setError("State is required.");               return; }
    if (!form.country.trim())   { setError("Country is required.");             return; }
    setError("");

    const initials = (form.fname[0] + form.lname[0]).toUpperCase();

    onAdd({
      name:       `${form.fname.trim()} ${form.lname.trim()}`,
      email:      form.email.trim(),
      phone:      form.phone.trim(),
      username:   form.username.trim(),
      dept:       form.dept,
      jobTitle:   form.role.trim(),
      role:       "user",
      status:     form.status,
      avatar:     initials,
      salary:     Number(form.salary),
      gender:     form.gender,
      bloodGroup: form.bloodGroup,
      company:    form.company.trim(),
      university: form.university.trim(),
      address: {
        address: form.street.trim(),
        city:    form.city.trim(),
        state:   form.state.trim(),
        country: form.country.trim(),
      },
    });
    onClose();
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", width: 520, maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 12px 40px rgba(0,0,0,0.15)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Add new employee</div>
            <div style={{ fontSize: 12.5, color: "#f11d1d", marginTop: 3 }}> *All fields are mandatory</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #64748b", background: "#f8fafc", cursor: "pointer", fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: "18px 22px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Personal */}
          <div>
            <div style={sectionStyle}>Personal Information</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>First Name</label>
                <input style={fieldStyle} placeholder="Enter First Name" value={form.fname} onChange={e => set("fname", e.target.value)} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={labelStyle}>Last Name</label>
                <input style={fieldStyle} placeholder="Enter Last Name" value={form.lname} onChange={e => set("lname", e.target.value)} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={fieldStyle} type="email" placeholder="abc@company.com" value={form.email} onChange={e => set("email", e.target.value)} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={fieldStyle} placeholder="+91 12345 67890" value={form.phone} onChange={e => set("phone", e.target.value)} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={labelStyle}>Username</label>
                <input style={fieldStyle} placeholder="firstname.lastname" value={form.username} onChange={e => set("username", e.target.value)} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={labelStyle}>Blood Group</label>
                <select style={fieldStyle} value={form.bloodGroup} onChange={e => set("bloodGroup", e.target.value)}>
                  {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>Gender</label>
                <div style={{ display: "flex", gap: 20, paddingTop: 6 }}>
                  {["male", "female", "other"].map(g => (
                    <label key={g} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: "#334155", cursor: "pointer" }}>
                      <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={() => set("gender", g)} style={{ accentColor: "#2563eb", width: 14, height: 14 }} />
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Work */}
          <div>
            <div style={sectionStyle}>Work Information</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Department</label>
                <select style={fieldStyle} value={form.dept} onChange={e => set("dept", e.target.value)}>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Role / Designation</label>
                <input style={fieldStyle} placeholder="Sr. Developer" value={form.role} onChange={e => set("role", e.target.value)} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={labelStyle}>Basic Salary (₹)</label>
                <input style={fieldStyle} type="number" placeholder="75000" value={form.salary} onChange={e => set("salary", e.target.value)} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select style={fieldStyle} value={form.status} onChange={e => set("status", e.target.value)}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Company</label>
                <input style={fieldStyle} placeholder="Company name" value={form.company} onChange={e => set("company", e.target.value)} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={labelStyle}>University</label>
                <input style={fieldStyle} placeholder="University name" value={form.university} onChange={e => set("university", e.target.value)} onFocus={focus} onBlur={blur} />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <div style={sectionStyle}>Address</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>Street Address</label>
                <input style={fieldStyle} placeholder="123 Main Street" value={form.street} onChange={e => set("street", e.target.value)} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <input style={fieldStyle} placeholder="City" value={form.city} onChange={e => set("city", e.target.value)} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={labelStyle}>State</label>
                <input style={fieldStyle} placeholder="State" value={form.state} onChange={e => set("state", e.target.value)} onFocus={focus} onBlur={blur} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>Country</label>
                <input style={fieldStyle} placeholder="Country" value={form.country} onChange={e => set("country", e.target.value)} onFocus={focus} onBlur={blur} />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: "14px 22px", borderTop: "1px solid #f1f5f9", flexShrink: 0 }}>
          {error && (
            <div style={{ fontSize: 12, color: "#dc2626", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
              <span>⚠</span> {error}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #e2e8f0", background: "none", fontSize: 13, color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            <button onClick={handleSubmit} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Add employee</button>
          </div>
        </div>
      </div>
    </div>
  );
}