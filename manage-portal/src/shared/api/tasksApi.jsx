import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";

export const fetchTasks = ()           => apiGet("/tasks");
export const addTask    = (data)       => apiPost("/tasks", data);
export const updateTask = (id, data)   => apiPut(`/tasks/${id}`, data);
export const deleteTask = (id)         => apiDelete(`/tasks/${id}`);