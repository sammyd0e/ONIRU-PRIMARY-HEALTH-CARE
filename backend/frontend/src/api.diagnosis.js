
import { getAuthHeaders } from './api';
// Fetch recent diagnoses and test results for the current user
export async function fetchRecentDiagnosesAndResults() {
  const res = await fetch(`${process.env.REACT_APP_API_BASE || ''}/api/diagnoses/`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch diagnoses/results');
  return res.json();
}
