

import React, { useState, useEffect } from 'react';
import { getProfileByClinicId } from '../api';
import ProfilePage from './ProfilePage';
import './FrontDeskAppointmentPage.css';
import { useNavigate } from 'react-router-dom';

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 40 }}>
      <div className="loader" style={{ width: 32, height: 32, border: '4px solid #e0e7ef', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}



export default function DoctorsPage() {
  const [clinicId, setClinicId] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check doctor authentication
    if (sessionStorage.getItem('doctorAuth') !== 'true') {
      navigate('/doctor-login');
    }
  }, [navigate]);

  const handleFetchProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setProfile(null);
    try {
      const data = await getProfileByClinicId(clinicId);
      if (!data || !data.profile) {
        setError('No profile found for this clinic ID');
        setProfile(null);
      } else {
        setProfile(data.profile);
      }
    } catch (err) {
      setError('Error fetching profile.');
      setProfile(null);
    }
    setLoading(false);
  };

  return (
    <div className="doctors-page" style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '3rem 1rem' }}>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 32px rgba(0,0,0,0.07)', maxWidth: 420, width: '100%', padding: '2.5rem 2rem', marginTop: 24 }}>
        <h2 style={{ textAlign: 'center', color: '#2563eb', fontWeight: 700, marginBottom: 24, fontSize: 28 }}>Patient Lookup</h2>
        <form onSubmit={handleFetchProfile} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <label htmlFor="clinic-id-input" style={{ fontWeight: 500, color: '#374151', marginBottom: 4 }}>Clinic ID</label>
          <input
            id="clinic-id-input"
            type="text"
            value={clinicId}
            onChange={e => setClinicId(e.target.value.toUpperCase())}
            required
            placeholder="Enter patient's clinic ID"
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 8,
              border: '1.5px solid #cbd5e1',
              fontSize: 18,
              outline: 'none',
              marginBottom: 0,
              letterSpacing: 2,
              fontWeight: 600,
              background: '#f9fafb',
              color: '#111827',
              transition: 'border 0.2s',
            }}
            autoFocus
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={loading || !clinicId}
            style={{
              background: loading ? '#a5b4fc' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '0.75rem',
              fontSize: 18,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 8,
              boxShadow: '0 2px 8px rgba(37,99,235,0.07)',
              transition: 'background 0.2s',
            }}
          >
            {loading ? <Spinner /> : 'Show Patient Profile'}
          </button>
        </form>
        {error && <div style={{ color: '#dc2626', background: '#fef2f2', borderRadius: 8, padding: '0.75rem 1rem', marginTop: 18, textAlign: 'center', fontWeight: 500 }}>{error}</div>}
      </div>
      {loading && !error && <Spinner />}
      {profile && !loading && (
        <div style={{ marginTop: 40, width: '100%', maxWidth: 700 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 32px rgba(0,0,0,0.07)', padding: '2rem 1.5rem' }}>
            <h3 style={{ color: '#2563eb', fontWeight: 700, marginBottom: 18, fontSize: 22, textAlign: 'center' }}>Patient Profile</h3>
            <ProfilePage profileOverride={profile} />
          </div>
        </div>
      )}
    </div>
  );
}
