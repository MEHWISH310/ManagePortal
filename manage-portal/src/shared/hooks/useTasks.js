import { useState, useEffect } from "react";
import { fetchTasks, addTask, updateTask, deleteTask } from "../api/tasksApi";

export function useTasks() {
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchTasks()
      .then(data => {
        const mapped = data.map(t => ({
          id:       t._id,
          title:    t.title,
          done:     t.done,
          priority: t.priority || "Medium",
          tag:      t.tag      || "General",
          due:      t.due      || "—",
        }));
        setTasks(mapped);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (taskData) => {
    try {
      const res = await addTask({
        title:    taskData.title,
        priority: taskData.priority || "Medium",
        tag:      taskData.tag      || "General",
        due:      taskData.due !== "—" ? taskData.due : "",
        done:     false,
      });
      setTasks(prev => [{
        id:       res._id,
        title:    res.title,
        done:     res.done,
        priority: res.priority,
        tag:      res.tag,
        due:      res.due || "—",
      }, ...prev]);
    } catch (err) {
      console.error("Add task failed:", err.message);
    }
  };

  const handleToggle = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    try {
      await updateTask(id, { done: !task.done });
    } catch (err) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, done: task.done } : t));
      console.error("Toggle task failed:", err.message);
    }
  };

  const handleDelete = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await deleteTask(id);
    } catch (err) {
      console.error("Delete task failed:", err.message);
    }
  };

  return { tasks, loading, error, handleAdd, handleToggle, handleDelete };
}