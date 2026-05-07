import { getAuthHeaders } from './api';

// Fetch recent diagnoses and test results for the current user
export async function fetchRecentDiagnosesAndResults() {
  const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
  const token = window.localStorage.getItem('access');
  console.log('[DEBUG] GET /api/diagnoses/ with headers:', headers, 'token:', token);
  const res = await fetch(`${process.env.REACT_APP_API_BASE || ''}/api/diagnoses/`, {
    headers,
  });
  if (!res.ok) throw new Error('Failed to fetch diagnoses/results');
  return res.json();
}

// Fetch diagnoses and test results for a patient by clinic ID
export async function fetchDiagnosesByClinicId(clinicId) {
  const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
  const token = window.localStorage.getItem('access');
  console.log('[DEBUG] GET /api/diagnoses-by-clinic-id/ with headers:', headers, 'token:', token);
  const res = await fetch(`${process.env.REACT_APP_API_BASE || ''}/api/diagnoses-by-clinic-id/?clinic_id=${clinicId}`, {
    headers,
  });
  if (!res.ok) throw new Error('Failed to fetch diagnoses/results for clinic ID');
  return res.json();
}
