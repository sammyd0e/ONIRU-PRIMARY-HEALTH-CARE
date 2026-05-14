import React, { useState, useEffect } from 'react';
import './BookingModal.css';
import { createAppointment, fetchDoctors } from '../api';

export default function BookingModal({ open, service, onClose, onBooked, hasPendingGeneral }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('08:00');
  const [note, setNote] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (open) {
      setError(''); setSuccess(''); setLoading(false);
      // Prefill date with tomorrow
      const t = new Date();
      t.setDate(t.getDate() + 1);
      setDate(t.toISOString().slice(0,10));
      setTime('09:00');
      setNote('');
      setDoctors([]);
      setDoctorId(null);

      // Try to prefill clinic id from stored profile
      try {
        const raw = localStorage.getItem('user_profile');
        if (raw) {
          const profile = JSON.parse(raw);
          const cid = profile?.clinicId || profile?.clinic_id;
          if (cid) setClinicId(cid);
        }
      } catch (e) {}
    }
  }, [open]);

  // Fetch doctors whenever clinicId, date or time change
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!clinicId) return setDoctors([]);
      try {
        const res = await fetchDoctors({ clinic_id: clinicId, date, time });
        if (!mounted) return;
        if (Array.isArray(res)) setDoctors(res);
        else setDoctors([]);
      } catch (e) {
        if (mounted) setDoctors([]);
      }
    }
    load();
    return () => { mounted = false };
  }, [clinicId, date, time]);

  if (!open) return null;
  // Block modal if user already has a pending general appointment
  if (hasPendingGeneral && (service?.title === 'General appointment' || service?.id === 'General appointment')) {
    return (
      <div className="sb-modal-backdrop" role="dialog" aria-modal="true">
        <div className="sb-modal">
          <h3 style={{display:'flex',alignItems:'center',gap:8}}>
            <span role="img" aria-label="calendar">📅</span> Book Appointment
          </h3>
          <div className="error" style={{margin:'2em 0',color:'red',fontWeight:'bold'}}>You already have a pending general appointment. Please wait until it is completed or deleted before booking another.</div>
          <div className="actions">
            <button type="button" className="sb-btn primary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  function validate() {
    const errors = {};
    if (!clinicId) errors.clinicId = 'Clinic ID is required.';
    if (!date) errors.date = 'Date is required.';
    if (!time) errors.time = 'Time slot is required.';
    return errors;
  }

  async function submit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    const errors = validate();
    if (Object.keys(errors).length) {
      setTouched({ clinicId: true, date: true, time: true });
      setError('Please fill all required fields.');
      return;
    }
    setLoading(true);
    const payload = {
      service_id: service?.id || service?.title || '',
      scheduled_date: date,
      scheduled_time: time,
      clinic_id: clinicId,
      doctor: doctorId || undefined,
      note: note || '',
    };
    try {
      const res = await createAppointment(payload);
      if (res && res.ok) {
        const body = res.body || {};
        setSuccess('Appointment created successfully!');
        setTimeout(() => {
          setLoading(false);
          onBooked && onBooked(body);
          onClose && onClose();
        }, 700);
        return;
      }
      let msg = 'Failed to create appointment';
      if (res) {
        if (res.status === 401) msg = 'You must be signed in to book an appointment.';
        else if (res.status === 403) msg = 'You do not have permission to create appointments.';
        else if (res.body) {
          const b = res.body;
          if (b.detail) {
            const detail = b.detail.toLowerCase();
            if (detail.includes('all time frames for this day are full')) {
              msg = 'All time frames for this day are full. Please pick the next day.';
            } else if (detail.includes('the time frame is full')) {
              msg = 'The selected time frame is full. Please pick another time frame.';
            } else if (detail.includes('fully booked')) {
              if (time === '14:00') {
                msg = 'The 2–4pm time frame is full for this day. Please pick another day.';
              } else {
                msg = 'The selected time frame is full. Please pick another time frame.';
              }
            } else {
              msg = b.detail;
            }
          } else if (typeof b === 'string') {
            const bstr = b.toLowerCase();
            if (bstr.includes('all time frames for this day are full')) {
              msg = 'All time frames for this day are full. Please pick the next day.';
            } else if (bstr.includes('the time frame is full')) {
              msg = 'The selected time frame is full. Please pick another time frame.';
            } else if (bstr.includes('fully booked')) {
              if (time === '14:00') {
                msg = 'The 2–4pm time frame is full for this day. Please pick another day.';
              } else {
                msg = 'The selected time frame is full. Please pick another time frame.';
              }
            } else {
              msg = b;
            }
          } else if (typeof b === 'object') {
            const parts = [];
            for (const k of Object.keys(b)) {
              const v = b[k];
              if (Array.isArray(v)) parts.push(`${k}: ${v.join(' ')}`);
              else parts.push(`${k}: ${String(v)}`);
            }
            if (parts.length) msg = parts.join(' — ');
            else msg = JSON.stringify(b);
          }
        }
      }
      setError(msg);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Network error');
      setLoading(false);
    }
  }

  const errors = validate();
  // Handler to close modal when clicking the backdrop
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      onClose && onClose();
    }
  }

  return (
    <div className="sb-modal-backdrop" role="dialog" aria-modal="true" onClick={handleBackdropClick}>
      <form className="sb-modal sb-modal-enhanced" onSubmit={submit} noValidate onClick={e => e.stopPropagation()}>
        <button
          type="button"
          className="modal-cancel-btn"
          aria-label="Cancel booking"
          onClick={onClose}
        >
          <span aria-hidden="true">&times;</span>
        </button>
        <div className="modal-header">
          <div className="modal-icon">
            <span role="img" aria-label="calendar" style={{fontSize:'2rem'}}>📅</span>
          </div>
          <div>
            <h3 style={{marginBottom:4, fontWeight:700, fontSize:'1.5rem', color:'#1976d2', letterSpacing:'0.01em'}}>Book Appointment</h3>
            <p className="muted" style={{marginBottom:0, fontSize:'1.08rem'}}>Fill in the details below to book your appointment.</p>
          </div>
        </div>
        <hr className="modal-divider" />
        <div className="form-section row">
          <div className="row">
            <label htmlFor="sb-clinic">Clinic ID <span className="required">*</span></label>
            <input
              id="sb-clinic"
              type="text"
              placeholder="Enter your clinic ID"
              value={clinicId}
              onChange={e=>setClinicId(e.target.value)}
              onBlur={()=>setTouched(t=>({...t,clinicId:true}))}
              aria-invalid={!!(touched.clinicId && errors.clinicId)}
              aria-describedby="sb-clinic-err"
            />
          </div>
          {touched.clinicId && errors.clinicId && <div className="field-error" id="sb-clinic-err">{errors.clinicId}</div>}
          <div className="row">
            <label htmlFor="sb-date">Date <span className="required">*</span></label>
            <input
              id="sb-date"
              type="date"
              value={date}
              onChange={e=>setDate(e.target.value)}
              onBlur={()=>setTouched(t=>({...t,date:true}))}
              aria-invalid={!!(touched.date && errors.date)}
              aria-describedby="sb-date-err"
            />
          </div>
          {touched.date && errors.date && <div className="field-error" id="sb-date-err">{errors.date}</div>}
          <div className="row">
            <label htmlFor="sb-time">Time Slot <span className="required">*</span></label>
            <select
              id="sb-time"
              value={time}
              onChange={e=>setTime(e.target.value)}
              onBlur={()=>setTouched(t=>({...t,time:true}))}
              aria-invalid={!!(touched.time && errors.time)}
              aria-describedby="sb-time-err"
            >
              <option value="08:00">8:00am - 10:00am</option>
              <option value="10:00">10:00am - 12:00pm</option>
              <option value="12:00">12:00pm - 2:00pm</option>
              <option value="14:00">2:00pm - 4:00pm</option>
            </select>
          </div>
          {touched.time && errors.time && <div className="field-error" id="sb-time-err">{errors.time}</div>}
          <div className="row">
            <label htmlFor="sb-doctor">Doctor</label>
            <select
              id="sb-doctor"
              value={doctorId || ''}
              onChange={e=>setDoctorId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">No preference / any available</option>
              {doctors.map(d => (
                <option key={d.id} value={d.user}>{d.display_name}{d.clinic_id ? ` — ${d.clinic_id}` : ''}</option>
              ))}
            </select>
          </div>
          <div className="row">
            <label htmlFor="sb-note">Note</label>
            <input
              id="sb-note"
              type="text"
              placeholder="Optional note for the doctor"
              value={note}
              onChange={e=>setNote(e.target.value)}
            />
          </div>
        </div>
        <div className="actions">
          <button type="button" className="sb-btn ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" className="sb-btn primary" disabled={loading}>{loading ? 'Booking…' : 'Book appointment'}</button>
        </div>
        <div className="notice">
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
        </div>
      </form>
    </div>
  );
}


