import React, { useState } from 'react';

export default function NurseVitalsPage() {
  const [clinicId, setClinicId] = useState('');
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState({
    bloodPressure: '',
    sugarLevel: '',
    cholesterolLevel: '',
    weight: '',
    height: '',
  });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE}/users/patient-profile-by-clinic-id/?clinic_id=${clinicId}`);
      const data = await res.json();
      if (res.ok && data.profile) {
        setPatient(data.profile);
        setVitals({
          bloodPressure: data.profile.bloodPressure || '',
          sugarLevel: data.profile.sugarLevel || '',
          cholesterolLevel: data.profile.cholesterolLevel || '',
          weight: data.profile.weight || '',
          height: data.profile.height || '',
        });
        setMsg('Patient found.');
      } else {
        setPatient(null);
        setMsg('');
        setError(data.error || 'Patient not found.');
      }
    } catch (err) {
      setError('Network error.');
      setPatient(null);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setVitals({ ...-vitals, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    setLoading(true);
    try {
      const token = window.localStorage.getItem('access');
      const res = await fetch(`${process.env.REACT_APP_API_BASE}/users/patient-profile-by-clinic-id/?clinic_id=${clinicId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(vitals),
        }
      );
      const data = await res.json();
      if (res.ok && data.profile) {
        setMsg('Vitals updated successfully!');
        setPatient(data.profile);
      } else {
        setError(data.error || 'Failed to update vitals.');
      }
    } catch (err) {
      setError('Network error.');
    }
    setLoading(false);
  };

  return (
    <div className="nurse-vitals-page" style={{ maxWidth: 500, margin: '0 auto', padding: 24 }}>
      <h2>Enter Patient Vitals (Nurse)</h2>
      <form onSubmit={handleSearch} style={{ marginBottom: 24 }}>
        <label>
          Patient Clinic ID:
          <input
            type="text"
            value={clinicId}
            onChange={e => setClinicId(e.target.value)}
            required
            style={{ marginLeft: 8 }}
          />
        </label>
        <button className="btn" type="submit" disabled={loading} style={{ marginLeft: 12 }}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>
      {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}
      {msg && <div style={{ color: '#15803d', marginBottom: 12 }}>{msg}</div>}
      {patient && (
        <form onSubmit={handleSave} style={{ border: '1px solid #eee', padding: 16, borderRadius: 8 }}>
          <div><b>Name:</b> {patient.first_name} {patient.last_name} {patient.othername}</div>
          <div><b>Sex:</b> {patient.sex}</div>
          <div><b>DOB:</b> {patient.dob}</div>
          <div><b>Clinic ID:</b> {patient.clinicId}</div>
          <hr style={{ margin: '16px 0' }} />
          <div>
            <label>Blood Pressure <input name="bloodPressure" value={vitals.bloodPressure} onChange={handleChange} /></label>
          </div>
          <div>
            <label>Sugar Level <input name="sugarLevel" value={vitals.sugarLevel} onChange={handleChange} /></label>
          </div>
          <div>
            <label>Cholesterol Level <input name="cholesterolLevel" value={vitals.cholesterolLevel} onChange={handleChange} /></label>
          </div>
          <div>
            <label>Weight <input name="weight" value={vitals.weight} onChange={handleChange} /></label>
          </div>
          <div>
            <label>Height <input name="height" value={vitals.height} onChange={handleChange} /></label>
          </div>
          <button className="btn" type="submit" disabled={loading} style={{ marginTop: 16 }}>
            {loading ? 'Saving…' : 'Save Vitals'}
          </button>
        </form>
      )}
    </div>
  );
}
