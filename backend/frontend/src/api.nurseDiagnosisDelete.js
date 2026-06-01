import { getAuthHeaders } from './api';

export async function deleteDiagnosisOrTestResult(type, id) {
  let url = '';
  if (type === 'Diagnosis') {
    url = `${process.env.REACT_APP_API_BASE || ''}/api/diagnoses/${id}/`;
  } else {
    url = `${process.env.REACT_APP_API_BASE || ''}/api/test-results/${id}/`;
  }
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error(`API Error (${res.status}):`, errorData);
    throw new Error(`Failed to delete: ${res.status} - ${JSON.stringify(errorData)}`);
  }
  return true;
}
