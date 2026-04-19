import React, { useEffect, useState } from 'react';
import './AppointmentBillboard.css';

function Section({ title, children }) {
  return (
    <div className="billboard-section">
      <h4 className="billboard-section-title">{title}</h4>
      <div className="billboard-section-content">{children}</div>
    </div>
  );
}

export default function AppointmentBillboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch all appointments from backend with authentication
    const token = localStorage.getItem('access');
    console.log('AppointmentBillboard: Using token:', token);
    fetch('http://localhost:8000/api/appointments/upcoming/', {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch appointments');
        return res.json();
      })
      .then(data => {
        console.log('Billboard API response:', data);
        // Handle both array and object responses
        if (Array.isArray(data)) {
          setAppointments(data);
        } else if (data && Array.isArray(data.results)) {
          setAppointments(data.results);
        } else if (data && Array.isArray(data.appointments)) {
          setAppointments(data.appointments);
        } else if (data && Array.isArray(Object.values(data))) {
          setAppointments(Object.values(data));
        } else {
          setError('Unexpected API response shape.');
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load appointments');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="billboard-loading">Loading appointments...</div>;
  if (error) return <div className="billboard-error">{error}</div>;

  return (
    <section className="appointment-billboard" id="billboard-section">
      <h3 className="billboard-title">Upcoming Appointments Billboard</h3>
      <div className="billboard-section">
        <div className="billboard-section-title">All Upcoming Appointments</div>
        <div className="billboard-section-content">
          {appointments.length ? appointments.map(a => (
            <div className="billboard-row" key={a.id || a.key || Math.random()}>
              <span><b>Patient Name:</b> {a.patient_full_name || a.full_name || a.name || a.patient_name || a.patient}</span>{' '}
              <span><b>Clinic:</b> {a.clinic_id}</span>{' '}
              <span><b>Date:</b> {a.scheduled_date}</span>{' '}
              <span><b>Time:</b> {a.scheduled_time}</span>{' '}
              <span><b>Status:</b> {a.status}</span>{' '}
              <span><b>Note:</b> {a.note}</span>
            </div>
          )) : <div className="billboard-empty">No upcoming appointments</div>}
          {error && <div className="billboard-error">{error}</div>}
        </div>
      </div>
    </section>
  );
}
