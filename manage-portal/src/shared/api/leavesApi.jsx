import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";

export const fetchLeaves = ()        => apiGet("/leaves");
export const applyLeave  = (data)    => apiPost("/leaves", data);
export const updateLeave = (id, data) => apiPut(`/leaves/${id}`, data);
export const deleteLeave = (id)      => apiDelete(`/leaves/${id}`);