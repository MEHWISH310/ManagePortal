import { useState, useEffect } from "react";
import { fetchAnnouncements, addAnnouncement, deleteAnnouncement } from "../api/announcementsApi";

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  useEffect(() => {
    fetchAnnouncements()
      .then(data => {
        const mapped = data.map(a => ({
          id:   a._id,
          title: a.title,
          body:  a.body || "",
          tags:  a.tags || [],
          date:  new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        }));
        setAnnouncements(mapped);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async ({ title, body, tags = [] }) => {
    try {
      const res = await addAnnouncement({ title, body, tags });
      setAnnouncements(prev => [{
        id:    res._id,
        title: res.title,
        body:  res.body || "",
        tags:  res.tags || [],
        date:  new Date(res.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      }, ...prev]);
    } catch (err) {
      console.error("Add announcement failed:", err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAnnouncement(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error("Delete announcement failed:", err.message);
    }
  };

  return { announcements, loading, error, handleAdd, handleDelete };
}