import { getAuthHeaders } from './api';

export async function addDiagnosisOrTestResult(type, clinicId, value, patientId) {
  let url = '';
  let body = {};
  if (type === 'Diagnosis') {
    url = `${process.env.REACT_APP_API_BASE || ''}/api/diagnoses/`;
    body = { label: value, details: '', extra_info: '', patient_id: patientId };
  } else {
    url = `${process.env.REACT_APP_API_BASE || ''}/api/test-results/`;
    body = { label: value, result: value, details: '', extra_info: '', patient_id: patientId };
  }
  console.log('[DEBUG] POST to:', url, 'body:', body);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    console.error(`API Error (${res.status}):`, json);
    throw new Error(`Failed to add: ${res.status} - ${JSON.stringify(json)}`);
  }
  console.log('[DEBUG] Add response:', json);
  return json;
}
