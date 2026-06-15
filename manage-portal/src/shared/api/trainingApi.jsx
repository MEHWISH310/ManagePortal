import { apiGet, apiPost, apiDelete } from "./apiClient";

export const fetchTrainings    = ()        => apiGet("/training");
export const createTraining    = (data)    => apiPost("/training", data);
export const deleteTraining    = (id)      => apiDelete(`/training/${id}`);
export const createOrder       = (data)    => apiPost("/payment/create-order", data);
export const verifyPayment     = (data)    => apiPost("/payment/verify", data);
export const fetchMyPayments   = ()        => apiGet("/payment/my-payments");