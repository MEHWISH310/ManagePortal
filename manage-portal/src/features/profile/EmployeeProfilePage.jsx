import { useState, useEffect, useRef } from "react";
import { updateUser, fetchUser } from "../../shared/api/usersApi";
import Spinner from "../../shared/ui/Spinner";

const DEPARTMENTS  = ["Engineering", "HR", "Finance", "Design", "Sales", "Product Management", "Marketing", "Operations", "General"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const STATUSES     = ["Active", "On Leave", "Inactive"];
const ROLES        = ["user", "moderator", "admin"];

const labelStyle = {
  fontSize: 11, fontWeight: 600, color: "#64748b",
  textTransform: "uppercase", letterSpacing: "0.4px",
  display: "flex", alignItems: "center", gap: 5, marginBottom: 5,
};

const editableInput = {
  width: "100%", padding: "9px 12px",
  border: "1.5px solid #e2e8f0", borderRadius: 9,
  fontSize: 13.5, color: "#0f172a", background: "#fff",
  fontFamily: "inherit", outline: "none",
  transition: "border-color 0.18s",
};

const lockedInput = {
  width: "100%", padding: "9px 12px",
  border: "1.5px solid #f1f5f9", borderRadius: 9,
  fontSize: 13.5, color: "#94a3b8", background: "#f8fafc",
  fontFamily: "inherit", outline: "none",
  cursor: "not-allowed",
};

const selectArrow = `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;

const LockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

function Field({ label, locked, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={labelStyle}>
        {label}
        {locked && <span style={{ color: "#cbd5e1" }}><LockIcon /></span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", locked }) {
  return (
    <input
      type={type} value={value || ""}
      onChange={e => !locked && onChange?.(e.target.value)}
      placeholder={placeholder} readOnly={locked}
      style={locked ? lockedInput : editableInput}
      onFocus={e => { if (!locked) e.target.style.borderColor = "#2563eb"; }}
      onBlur={e => { if (!locked) e.target.style.borderColor = "#e2e8f0"; }}
    />
  );
}

function SelectInput({ value, onChange, options, locked }) {
  return (
    <select
      value={value} onChange={e => !locked && onChange?.(e.target.value)}
      disabled={locked}
      style={{
        ...(locked ? lockedInput : editableInput),
        backgroundImage: selectArrow, backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center", paddingRight: 32,
        appearance: "none", cursor: locked ? "not-allowed" : "pointer",
      }}
    >
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 11.5, fontWeight: 700, color: "#2563eb",
      textTransform: "uppercase", letterSpacing: "0.6px",
      marginBottom: 14, marginTop: 4,
      paddingBottom: 8, borderBottom: "1px solid #f1f5f9",
    }}>{children}</div>
  );
}

const toForm = (employee, apiData) => ({
  firstName:  apiData?.firstName      || employee?.name?.split(" ")[0]  || "",
  lastName:   apiData?.lastName       || employee?.name?.split(" ")[1]  || "",
  email:      apiData?.email          || employee?.email                || "",
  phone:      apiData?.phone          || employee?.phone                || "",
  username:   apiData?.username       || employee?.username             || "",
  age:        apiData?.age            || employee?.age                  || "",
  gender:     apiData?.gender         || employee?.gender               || "male",
  bloodGroup: apiData?.bloodGroup     || employee?.bloodGroup           || "O+",
  dept:       apiData?.dept           || employee?.dept                 || "Engineering",
  jobTitle:   apiData?.jobTitle       || employee?.jobTitle             || "",
  company:    apiData?.company        || employee?.company              || "",
  university: apiData?.university     || employee?.university           || "",
  status:     apiData?.status         || employee?.status               || "Active",
  role:       apiData?.role           || employee?.role                 || "employee",
  street:     apiData?.address?.street  || employee?.address?.street   || "",
  city:       apiData?.address?.city    || employee?.address?.city     || "",
  state:      apiData?.address?.state   || employee?.address?.state    || "",
  country:    apiData?.address?.country || employee?.address?.country  || "",
  image:      apiData?.image          || employee?.image               || null,
});

export default function EmployeeProfilePage({ employee, onBack, onSave, readOnly = false }) {
  const isAdminEdit = employee?.isAdmin === true;

  const [form,    setForm]    = useState(() => toForm(employee, null));
  const [preview, setPreview] = useState(employee?.image || null);
  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");
  const fileRef = useRef();

  useEffect(() => {
    if (!employee?.id) return;
    setLoading(true);
    fetchUser(employee.id)
      .then(data => {
        setForm(toForm(employee, data));
        setPreview(data.image || employee?.image || null);
      })
      .catch(err => console.error("Failed to fetch user:", err.message))
      .finally(() => setLoading(false));
  }, [employee?.id]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setPreview(ev.target.result); set("image", ev.target.result); };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
  if (!form.firstName.trim() || !form.lastName.trim()) { setError("First and last name are required."); return; }
  if (!form.email.trim()) { setError("Email is required."); return; }
  setError("");
  setSaving(true);
  try {
    await updateUser(employee.id, {
      firstName:  form.firstName,
      lastName:   form.lastName,
      email:      form.email,
      phone:      form.phone,
      jobTitle:   form.jobTitle,
      dept:       form.dept,
      status:     form.status,
      role:       form.role,
      bloodGroup: form.bloodGroup,
      gender:     form.gender,
      university: form.university,
      company:    form.company,
      image:      form.image,
      address: {
        street:  form.street,
        city:    form.city,
        state:   form.state,
        country: form.country,
      },
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    onSave?.({
      ...employee,
      name:       `${form.firstName} ${form.lastName}`,
      email:      form.email,
      phone:      form.phone,
      username:   form.username,
      age:        form.age,
      gender:     form.gender,
      bloodGroup: form.bloodGroup,
      dept:       form.dept,
      jobTitle:   form.jobTitle,
      company:    form.company,
      university: form.university,
      status:     form.status,
      role:       form.role,
      image:      form.image,
      address: {
        street:  form.street,
        city:    form.city,
        state:   form.state,
        country: form.country,
      },
      avatar: `${form.firstName[0]}${form.lastName[0]}`.toUpperCase(),
    });
  } catch {
    setError("Failed to save. Please try again.");
  } finally {
    setSaving(false);
  }
};

  if (loading) return <Spinner text="Loading profile..." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "1.5px solid #64748b", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
          ← Back
        </button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
            {isAdminEdit ? `Edit : ${form.firstName} ${form.lastName}` : "My Profile"}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>
            {isAdminEdit ? "Update employee information" : "You can edit phone number and address details"}
          </div>
        </div>
        
      </div>

      {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", borderRadius: 9, padding: "10px 14px", fontSize: 13, fontWeight: 500 }}>✓ Profile updated successfully</div>}
      {error   && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c",  borderRadius: 9, padding: "10px 14px", fontSize: 13, fontWeight: 500 }}>⚠ {error}</div>}

      {/* Profile Photo */}
      <div className="db-card">
        <SectionTitle>Profile Photo</SectionTitle>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            {preview
              ? <img src={preview} alt="profile" style={{ width: 80, height: 80, borderRadius: 16, objectFit: "cover", border: "2px solid #e2e8f0" }} />
              : <div style={{ width: 80, height: 80, borderRadius: 16, background: "#2563eb", color: "#fff", fontSize: 26, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{form.firstName[0]}{form.lastName[0]}</div>
            }
            <button onClick={() => fileRef.current.click()} style={{ position: "absolute", bottom: -6, right: -6, width: 26, height: 26, borderRadius: 8, background: "#2563eb", color: "#fff", border: "2px solid #fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>✎</button>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{form.firstName} {form.lastName}</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{form.jobTitle} · {form.dept}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{form.email}</div>
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => fileRef.current.click()} style={{ fontSize: 12, fontWeight: 600, color: "#2563eb", background: "#eff6ff", border: "none", borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}>Upload photo</button>
              {preview && preview !== employee?.image && (
                <button onClick={() => { setPreview(employee?.image || null); set("image", employee?.image || null); }} style={{ fontSize: 12, fontWeight: 600, color: "#64748b", background: "#f1f5f9", border: "none", borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}>Remove</button>
              )}
              <span style={{ fontSize: 11, color: "#94a3b8" }}>JPG, PNG or GIF · max 2MB</span>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
        </div>
      </div>

      {/* Personal Info */}
      <div className="db-card">
        <SectionTitle>Personal Information</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
          <Field label="First Name" locked={!isAdminEdit}>
            <TextInput value={form.firstName} onChange={v => set("firstName", v)} placeholder="First name" locked={!isAdminEdit} />
          </Field>
          <Field label="Last Name" locked={!isAdminEdit}>
            <TextInput value={form.lastName} onChange={v => set("lastName", v)} placeholder="Last name" locked={!isAdminEdit} />
          </Field>
          <Field label="Email Address" locked>
            <TextInput value={form.email} placeholder="Email" locked />
          </Field>
          <Field label="Phone Number" locked={false}>
            <TextInput value={form.phone} onChange={v => set("phone", v)} placeholder="+91 98765 43210" locked={false} />
          </Field>
          <Field label="Username" locked>
            <TextInput value={form.username} placeholder="Username" locked />
          </Field>
          <Field label="Age" locked>
            <TextInput value={form.age ? `${form.age} years` : ""} placeholder="Age" locked />
          </Field>
          <Field label="Gender" locked>
            <div style={{ display: "flex", gap: 16, alignItems: "center", paddingTop: 8 }}>
              {["male", "female", "other"].map(g => (
                <label key={g} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: "#94a3b8", cursor: "not-allowed", fontWeight: form.gender === g ? 600 : 400 }}>
                  <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={() => {}} disabled style={{ accentColor: "#2563eb", width: 15, height: 15 }} />
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Blood Group" locked>
            <SelectInput value={form.bloodGroup} onChange={v => set("bloodGroup", v)} options={BLOOD_GROUPS} locked />
          </Field>
        </div>
      </div>

      {/* Work Info */}
      <div className="db-card">
        <SectionTitle>Work Information</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
          <Field label="Job Title" locked={!isAdminEdit}>
            <TextInput value={form.jobTitle} onChange={v => set("jobTitle", v)} placeholder="e.g. Sr. Developer" locked={!isAdminEdit} />
          </Field>
          <Field label="Department" locked={!isAdminEdit}>
            <SelectInput value={form.dept} onChange={v => set("dept", v)} options={DEPARTMENTS} locked={!isAdminEdit} />
          </Field>
          <Field label="Company" locked>
            <TextInput value={form.company} placeholder="Company name" locked />
          </Field>
          <Field label="University" locked>
            <TextInput value={form.university} placeholder="University name" locked />
          </Field>
          <Field label="Employment Status" locked={!isAdminEdit}>
  <SelectInput value={form.status} onChange={v => set("status", v)} options={STATUSES} locked={!isAdminEdit} />
</Field>
<Field label="System Role" locked={!isAdminEdit}>
  <div style={{ display: "flex", gap: 16, alignItems: "center", paddingTop: 8 }}>
    {ROLES.map(r => (
      <label key={r} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: !isAdminEdit ? "#94a3b8" : "#334155", cursor: !isAdminEdit ? "not-allowed" : "pointer", fontWeight: form.role === r ? 600 : 400 }}>
        <input type="radio" name="role" value={r} checked={form.role === r} onChange={() => isAdminEdit && set("role", r)} disabled={!isAdminEdit} style={{ accentColor: "#2563eb", width: 15, height: 15 }} />
        {r.charAt(0).toUpperCase() + r.slice(1)}
      </label>
    ))}
  </div>
</Field>
        </div>
      </div>

      {/* Address */}
      <div className="db-card">
        <SectionTitle>Address</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
          <Field label="Street Address"><TextInput value={form.street} onChange={v => set("street", v)} placeholder="123 Main Street" locked={false} /></Field>
          <Field label="City"><TextInput value={form.city} onChange={v => set("city", v)} placeholder="City" locked={false} /></Field>
          <Field label="State"><TextInput value={form.state} onChange={v => set("state", v)} placeholder="State" locked={false} /></Field>
          <Field label="Country"><TextInput value={form.country} onChange={v => set("country", v)} placeholder="Country" locked={false} /></Field>
        </div>
      </div>

      {/* Save */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingBottom: "1rem" }}>
        <button onClick={onBack} style={{ padding: "9px 20px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "none", fontSize: 13.5, fontWeight: 600, color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{ padding: "9px 24px", borderRadius: 9, border: "none", background: "#2563eb", color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8 }}>
          {saving ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.75s linear infinite" }} /> Saving...</> : "Save Changes"}
        </button>
      </div>
    </div>
  );
}