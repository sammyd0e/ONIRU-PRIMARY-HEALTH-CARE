import { getAuthHeaders } from './api';

export async function addDiagnosisOrTestResult(type, clinicId, value) {
  const token = window.localStorage.getItem('access');
  let url = '';
  let body = {};
  // Accept patientId as a fourth argument
  const patientId = arguments[3];
  if (type === 'Diagnosis') {
    url = `${process.env.REACT_APP_API_BASE || ''}/api/diagnoses/`;
    body = { label: value, details: '', extra_info: '', clinic_id: clinicId, patient_id: patientId };
  } else {
    url = `${process.env.REACT_APP_API_BASE || ''}/api/test-results/`;
    body = { label: value, result: value, details: '', extra_info: '', clinic_id: clinicId, patient_id: patientId };
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to add');
  return res.json();
}
