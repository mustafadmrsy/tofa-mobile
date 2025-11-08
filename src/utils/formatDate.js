export function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString();
  } catch {
    return dateStr || "";
  }
}
