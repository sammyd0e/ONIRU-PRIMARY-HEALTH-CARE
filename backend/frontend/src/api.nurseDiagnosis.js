// Utility API for NurseVitalsPage to fetch and update diagnoses & test results
import { getAuthHeaders } from './api';

export async function fetchPatientDiagnosesAndResults(clinicId) {
  const res = await fetch(`${process.env.REACT_APP_API_BASE || ''}/api/diagnoses-by-clinic-id/?clinic_id=${clinicId}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error(`API Error (${res.status}):`, errorData);
    throw new Error(`Failed to fetch diagnoses/results: ${res.status} - ${JSON.stringify(errorData)}`);
  }
  return res.json();
}

export async function updatePatientDiagnosisOrResult(type, id, value) {
  let url = '';
  let body = {};
  if (type === 'Diagnosis') {
    url = `${process.env.REACT_APP_API_BASE || ''}/api/diagnoses/${id}/`;
    body = { label: value };
  } else {
    url = `${process.env.REACT_APP_API_BASE || ''}/api/test-results/${id}/`;
    body = { result: value };
  }
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error(`API Error (${res.status}):`, errorData);
    throw new Error(`Failed to update: ${res.status} - ${JSON.stringify(errorData)}`);
  }
  return res.json();
}
