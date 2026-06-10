import { useState, useEffect } from "react";
import { fetchUsers, addUser, updateUser, deleteUser } from "../api/usersApi";

export function useEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchUsers()
      .then(data => {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        // Backend returns array directly, not data.users
        const list = Array.isArray(data) ? data : data.users || [];
        const mapped = list
          .map(u => ({
            id:         u._id,
            name:       `${u.firstName} ${u.lastName}`,
            email:      u.email,
            phone:      u.phone       || "",
            username:   u.username    || "",
            gender:     u.gender      || "",
            bloodGroup: u.bloodGroup  || "",
            image:      u.image       || null,
            role:       u.role        || "employee",
            dept:       u.dept        || "General",
            jobTitle:   u.jobTitle    || "Employee",
            company:    u.company     || "",
            university: u.university  || "",
            address:    u.address     || {},
            status:     u.status      || "Active",
            salary:     u.salary      || 60000,
            avatar:     `${u.firstName[0]}${u.lastName[0]}`.toUpperCase(),
          }));
        setEmployees(mapped);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (empData) => {
  try {
    // Handle both flat fields (from AddEmployeeModal)
    // and nested address object (from ImportEmployeesPage)
    const address = empData.address || {
      street:  empData.street  || "",
      city:    empData.city    || "",
      state:   empData.state   || "",
      country: empData.country || "",
    };

    // Handle both name string and firstName/lastName separately
    const firstName = empData.firstName || empData.name?.split(" ")[0] || "";
    const lastName  = empData.lastName  || empData.name?.split(" ").slice(1).join(" ") || "";
    const fullName  = `${firstName} ${lastName}`.trim();

    const res = await addUser({
      firstName,
      lastName,
      email:      empData.email      || "",
      phone:      empData.phone      || "",
      username:   empData.username   || firstName.toLowerCase(),
      dept:       empData.dept       || "General",
      jobTitle:   empData.jobTitle   || empData.role || "Employee",
      role:       empData.role === "admin" ? "admin" : "employee",
      status:     empData.status     || "Active",
      salary:     Number(empData.salary) || 60000,
      bloodGroup: empData.bloodGroup || "",
      gender:     empData.gender     || "",
      company:    empData.company    || "",
      university: empData.university || "",
      address,
      password:   "Employee@123",
    });

    setEmployees(prev => [{
      id:         res._id,
      name:       fullName,
      email:      empData.email      || "",
      phone:      empData.phone      || "",
      username:   empData.username   || firstName.toLowerCase(),
      dept:       empData.dept       || "General",
      jobTitle:   empData.jobTitle   || empData.role || "Employee",
      role:       "employee",
      status:     empData.status     || "Active",
      salary:     Number(empData.salary) || 60000,
      bloodGroup: empData.bloodGroup || "",
      gender:     empData.gender     || "",
      company:    empData.company    || "",
      university: empData.university || "",
      address,
      avatar:     `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase(),
      image:      empData.image || null,
    }, ...prev]);
  } catch (err) {
    console.error("Add employee failed:", err.message);
  }
};

  const handleUpdate = async (updated) => {
    try {
      const [firstName, ...rest] = updated.name.split(" ");
      await updateUser(updated.id, {
        firstName,
        lastName:   rest.join(" "),
        email:      updated.email,
        phone:      updated.phone,
        dept:       updated.dept,
        jobTitle:   updated.jobTitle,
        status:     updated.status,
        salary:     updated.salary,
        gender:     updated.gender,
        bloodGroup: updated.bloodGroup,
        address:    updated.address,
      });
    } catch (err) {
      console.error("Update failed:", err.message);
    } finally {
      setEmployees(prev =>
        prev.map(e => e.id === updated.id ? { ...e, ...updated } : e)
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
    } catch {
      // silently ignore
    } finally {
      setEmployees(prev => prev.filter(e => e.id !== id));
    }
  };

  return { employees, loading, error, handleAdd, handleUpdate, handleDelete };
}