import { apiGet, apiPost, apiDelete } from "./apiClient";

export const fetchAnnouncements = ()        => apiGet("/announcements");
export const addAnnouncement    = (data)    => apiPost("/announcements", data);
export const deleteAnnouncement = (id)      => apiDelete(`/announcements/${id}`);