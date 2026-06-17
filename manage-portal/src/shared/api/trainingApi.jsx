import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";

export const fetchTrainings    = ()     => apiGet("/training");
export const createTraining    = (data) => apiPost("/training", data);
export const deleteTraining    = (id)   => apiDelete(`/training/${id}`);
export const createOrder       = (data) => apiPost("/payment/create-order", data);
export const verifyPayment     = (data) => apiPost("/payment/verify", data);
export const fetchMyPayments   = ()     => apiGet("/payment/my-payments");
export const fetchAllPayments  = ()     => apiGet("/payment/all-payments");
export const fetchEnrolled = (trainingId) => apiGet(`/payment/enrolled/${trainingId}`);
export const updateTraining = (id, data) => apiPut(`/training/${id}`, data);