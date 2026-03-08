// Update user profile (PATCH to /api/me/)
export async function updateProfile(data) {
  const res = await fetch(`${API_BASE}/api/me/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}
// Fetch all arthnatal bookings for the current user
export async function fetchArthnatalBookings() {
  const res = await fetch(`${API_BASE}/api/arthnatal/`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  });
  return res.json();
}
// Submit arthnatal/antenatal program booking
export async function createArthnatalBooking(form) {
  const res = await fetch(`${API_BASE}/api/arthnatal/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(form),
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}
const API_BASE = process.env.REACT_APP_API_BASE || '';

// Create a child account (parent-managed, full medical tracking)
export async function createChildAccount(childProfileId) {
  const res = await fetch(`${API_BASE}/api/child-accounts/create/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ child_profile_id: childProfileId }),
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}

// Create a child patient profile (for child accounts)
export async function createChildPatientProfile(data) {
  const res = await fetch(`${API_BASE}/api/patient-profiles/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    // If response is not JSON, return a clear error
    return { error: 'Server returned invalid response', raw: text };
  }
}

export function getAuthHeaders() {
  const token = localStorage.getItem('access');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchServices() {
  const res = await fetch(`${API_BASE}/api/services/`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  });
  return res.json();
}

export async function createAppointment(payload) { 
  // Attach clinic_id automatically if available in stored profile
  try {
    const raw = localStorage.getItem('user_profile');
    if (raw) {
      const profile = JSON.parse(raw);
      const cid = profile?.clinicId || profile?.clinic_id;
      if (cid && !payload.clinic_id) payload.clinic_id = cid;
    }
  } catch (e) {
    // ignore
  }

  const res = await fetch(`${API_BASE}/api/appointments/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  // return a consistent object with status so callers can show server errors
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}

export async function fetchAppointments() {
  const res = await fetch(`${API_BASE}/api/appointments/`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  });
  return res.json();
}

export async function fetchDoctors(params = {}) {
  // params: { clinic_id, date, time }
  const qs = new URLSearchParams();
  if (params.clinic_id) qs.set('clinic_id', params.clinic_id);
  if (params.date) qs.set('date', params.date);
  if (params.time) qs.set('time', params.time);
  const url = `${API_BASE}/api/doctors/` + (qs.toString() ? `?${qs.toString()}` : '');
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  });
  return res.json();
}

export async function getProfile() {
  const res = await fetch(`${API_BASE}/api/me/`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}


export async function deleteAppointment(id) {
  const res = await fetch(`${API_BASE}/api/appointments/${id}/`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  return res.ok;
}

// Delete an arthnatal booking by ID
export async function deleteArthnatalBooking(id) {
  const res = await fetch(`${API_BASE}/api/arthnatal/${id}/`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  return res.ok;
}

export default { login, fetchServices, createAppointment, deleteAppointment, deleteArthnatalBooking };
