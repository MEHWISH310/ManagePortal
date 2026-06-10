import { useState, useEffect } from "react";
import { fetchNotifications, markRead, markAllRead, addNotification, deleteNotification } from "../api/notificationsApi";

export function useNotifications() {
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    fetchNotifications()
      .then(data => setNotifs(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markRead(id);
      setNotifs(ns => ns.map(n => n._id === id ? { ...n, unread: false } : n));
    } catch (err) { console.error(err); }
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead();
      setNotifs(ns => ns.map(n => ({ ...n, unread: false })));
    } catch (err) { console.error(err); }
  };

  const handleAdd = async (data) => {
    try {
      await addNotification(data);
      const fresh = await fetchNotifications();
      setNotifs(fresh);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifs(ns => ns.filter(n => n._id !== id));
    } catch (err) { console.error(err); }
  };

  return { notifs, loading, error, handleMarkRead, handleMarkAll, handleAdd, handleDelete };
}