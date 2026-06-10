import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";

export const fetchUsers = () => apiGet("/users");
export const fetchUser  = (id) => apiGet(`/users/${id}`);
export const addUser    = (data) => apiPost("/users", data);
export const updateUser = (id, data) => apiPut(`/users/${id}`, data);
export const deleteUser = (id) => apiDelete(`/users/${id}`);