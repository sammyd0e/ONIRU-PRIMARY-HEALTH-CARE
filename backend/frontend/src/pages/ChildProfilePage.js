import React, { useState } from 'react';
import { createChildAppointment } from '../api';

export default function ChildProfilePage({ child }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg('');
    try {
      const res = await createChildAppointment({
        child_account: child.id,
        appointment_date: date,
        appointment_time: time,
        reason,
      });
      if (res.ok) {
        setStatusMsg('Appointment created successfully!');
        setDate('');
        setTime('');
        setReason('');
      } else {
        setStatusMsg('Failed to create appointment.');
      }
    } catch (err) {
      setStatusMsg('Error creating appointment.');
    }
    setLoading(false);
  };

  return (
    <div className="child-profile-page">
      <h2>Child Profile</h2>
      <div className="child-details">
        <div><b>Name:</b> {child.child_profile?.first_name} {child.child_profile?.last_name}</div>
        <div><b>Blood Group:</b> {child.bloodgroup}</div>
        <div><b>Clinic ID:</b> {child.child_profile?.clinicId}</div>
      </div>
      <form onSubmit={handleSubmit} className="child-appointment-form">
        <h3>Create Appointment</h3>
        <div>
          <label>Date: <input type="date" value={date} onChange={e => setDate(e.target.value)} required /></label>
        </div>
        <div>
          <label>Time: <input type="time" value={time} onChange={e => setTime(e.target.value)} /></label>
        </div>
        <div>
          <label>Reason: <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for appointment" /></label>
        </div>
        <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Appointment'}</button>
        {statusMsg && <div style={{marginTop:8}}>{statusMsg}</div>}
      </form>
    </div>
  );
}
