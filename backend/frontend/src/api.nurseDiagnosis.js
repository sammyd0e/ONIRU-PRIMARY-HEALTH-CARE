// Utility API for NurseVitalsPage to fetch and update diagnoses & test results
import { getAuthHeaders } from './api';

export async function fetchPatientDiagnosesAndResults(clinicId) {
  const res = await fetch(`${process.env.REACT_APP_API_BASE || ''}/api/diagnoses-by-clinic-id/?clinic_id=${clinicId}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch diagnoses/results');
  return res.json();
}

export async function updatePatientDiagnosisOrResult(id, payload) {
  const res = await fetch(`${process.env.REACT_APP_API_BASE || ''}/api/diagnoses/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update diagnosis/result');
  return res.json();
}
