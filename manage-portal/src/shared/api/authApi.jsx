import { apiPost } from "./apiClient";

export const loginUser = (email, password) =>
  apiPost("/auth/login", { email, password });