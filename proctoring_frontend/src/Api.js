const API_URL = "http://127.0.0.1:8000";

export async function fetchDetections() {
  const res = await fetch(`${API_URL}/detections/`);
  return res.json();
}

export function downloadReport() {
  window.location.href = `${API_URL}/report/csv`;
}
