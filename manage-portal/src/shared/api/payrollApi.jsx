import { apiGet, apiPatch } from "./apiClient";

export const fetchPayroll         = ()           => apiGet("/payroll");
export const updatePayrollStatus  = (id, status) => apiPatch(`/payroll/${id}/status`, { payrollStatus: status });