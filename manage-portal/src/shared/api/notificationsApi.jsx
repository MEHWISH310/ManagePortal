import { apiGet, apiPost, apiPatch, apiDelete } from "./apiClient";

export const fetchNotifications = ()    => apiGet("/notifications");
export const markRead           = (id)  => apiPatch(`/notifications/${id}/read`, {});
export const markAllRead        = ()    => apiPatch("/notifications/read-all", {});
export const addNotification    = (data) => apiPost("/notifications", data);
export const deleteNotification = (id)  => apiDelete(`/notifications/${id}`);