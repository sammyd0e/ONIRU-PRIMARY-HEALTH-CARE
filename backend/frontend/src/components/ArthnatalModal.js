import React, { useState } from 'react';
import './ArthnatalModal.css';
import { createArthnatalBooking } from '../api';

export default function ArthnatalModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    expectedDate: '',
    medicalHistory: '',
    address: '',
    age: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!open) return null;

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      // Map frontend fields to backend API fields
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        preferred_date: form.expectedDate, // backend expects this field
        note: form.notes // backend expects this field
      };
      const res = await createArthnatalBooking(payload);
      if (res.ok) {
        setSuccess('Antenatal booking submitted!');
        onSubmit && onSubmit(form);
        setTimeout(() => {
          setSuccess('');
          setLoading(false);
          onClose && onClose();
        }, 1200);
      } else {
        let msg = 'Failed to submit booking';
        if (res.body && res.body.detail) msg = res.body.detail;
        else if (typeof res.body === 'string') msg = res.body;
        setError(msg);
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Network error');
      setLoading(false);
    }
  }

  return (
    <div className="arthnatal-modal-backdrop" role="dialog" aria-modal="true">
      <form className="arthnatal-modal" onSubmit={handleSubmit}>
        <h3>Book Arthnatal Program</h3>
        <div className="row">
          <label htmlFor="an-name">Full Name</label>
          <input id="an-name" name="name" type="text" required value={form.name} onChange={handleChange} />
        </div>
        <div className="row">
          <label htmlFor="an-email">Email</label>
          <input id="an-email" name="email" type="email" required value={form.email} onChange={handleChange} />
        </div>
        <div className="row">
          <label htmlFor="an-phone">Phone</label>
          <input id="an-phone" name="phone" type="tel" required value={form.phone} onChange={handleChange} />
        </div>
        <div className="row">
          <label htmlFor="an-expectedDate">Expected Delivery Date</label>
          <input id="an-expectedDate" name="expectedDate" type="date" required value={form.expectedDate} onChange={handleChange} />
        </div>
        <div className="row">
          <label htmlFor="an-age">Age</label>
          <input id="an-age" name="age" type="number" min="10" max="60" required value={form.age} onChange={handleChange} />
        </div>
        <div className="row">
          <label htmlFor="an-address">Address</label>
          <input id="an-address" name="address" type="text" required value={form.address} onChange={handleChange} />
        </div>
        <div className="row">
          <label htmlFor="an-medicalHistory">Medical History</label>
          <textarea id="an-medicalHistory" name="medicalHistory" rows="2" value={form.medicalHistory} onChange={handleChange} placeholder="E.g. allergies, previous pregnancies, conditions" />
        </div>
        <div className="row">
          <label htmlFor="an-notes">Other Notes</label>
          <textarea id="an-notes" name="notes" rows="2" value={form.notes} onChange={handleChange} placeholder="Anything else?" />
        </div>
        <div className="actions">
          <button type="button" className="arthnatal-btn ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" className="arthnatal-btn primary" disabled={loading}>{loading ? 'Booking…' : 'Book Now'}</button>
        </div>
        <div className="notice">
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
        </div>
      </form>
    </div>
  );
}
