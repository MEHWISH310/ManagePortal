export function formatSalary(num) {
  return "₹" + Number(num).toLocaleString("en-IN");
}