import React, { useState, useEffect } from 'react';
import { getAuthHeaders } from '../api';
import './FrontDeskAppointmentPage.css';

const APPOINTMENT_TYPES = [
  'General',
  'Antenatal',
  'Eyes',
  // Add more as needed
];

const APPOINTMENT_PRICES = {
  'General': 5000,
  'Antenatal': 7000,
  'Eyes': 6500,
  // Add more as needed
};


export default function FrontDeskAppointmentPage({ onSubmit }) {
  const [clinicId, setClinicId] = useState('');
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [appointmentType, setAppointmentType] = useState('');
  const [patientName, setPatientName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [sex, setSex] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  // const [loadingCount, setLoadingCount] = useState(false);
  const [error, setError] = useState('');
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [autoFetched, setAutoFetched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // const [dailyCount, setDailyCount] = useState({});

  useEffect(() => {
    if (clinicId) {
      setFetchingDetails(true);
      setError('');
      // Fetch appointment details by clinic ID
      fetch(`http://localhost:8000/api/appointment-by-clinic-id/?clinic_id=${clinicId}`, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      })
        .then(async res => {
          if (res.status === 404) {
            setAppointmentDetails(null);
            setAppointmentType('');
            setPatientName('');
            setAmount('');
            setAutoFetched(false);
            setError('No appointment found for this clinic ID');
            return null;
          }
          if (!res.ok) {
            const errMsg = await res.text();
            setError(`Error: ${res.status} ${errMsg}`);
            setAppointmentDetails(null);
            setAppointmentType('');
            setPatientName('');
            setAmount('');
            setAutoFetched(false);
            return null;
          }
          return res.json();
        })
        .then(data => {
          if (data) {
            setAppointmentDetails(data);
            setAppointmentType(data.appointment_type || '');
            setPatientName(data.patient_full_name || '');
            setAmount(APPOINTMENT_PRICES[data.appointment_type] || '');
            setScheduledDate(data.scheduled_date || '');
            setScheduledTime(data.scheduled_time ? data.scheduled_time.slice(0,5) : '');
            setAutoFetched(true);
            setError('');
          }
        })
        .catch(err => {
          setAppointmentDetails(null);
          setAppointmentType('');
          setPatientName('');
          setAmount('');
          setAutoFetched(false);
          setError('Network or server error. Please try again.');
        })
        .finally(() => setFetchingDetails(false));
    } else {
      setAppointmentDetails(null);
      setAppointmentType('');
      setPatientName('');
      setAmount('');
      setError('');
      setAutoFetched(false);
    }
  }, [clinicId]);

  const handleSubmit = e => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      name: patientName,
      clinic_id: clinicId,
      amount_paid: amount ? Number(amount) : 0,
      sex: sex || (appointmentDetails && appointmentDetails.sex ? appointmentDetails.sex : ''),
      payment_method: paymentMethod,
      appointment_type: appointmentType,
    };
    fetch('/api/attended-patients/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to record appointment');
        return res.json();
      })
      .then(() => {
        alert('Appointment recorded successfully!');
        setClinicId('');
        setAppointmentDetails(null);
        setAppointmentType('');
        setPatientName('');
        setAmount('');
        setPaymentMethod('');
        setError('');
        setSubmitting(false);
      })
      .catch(err => {
        setError(err.message);
        setSubmitting(false);
      });
  };

  return (
    <div className="frontdesk-appointment-page">
      <h2>Front Desk Appointment Entry</h2>
      <div className="daily-count-section" style={{marginBottom: '1.5rem', background: '#000000', padding: '1rem', borderRadius: 8}}>
        <h4 style={{marginBottom:8}}>Today's Patient Count by Service</h4>
        {loadingCount ? (
          <div style={{color:'#888'}}>Loading...</div>
        ) : dailyCount && Object.keys(dailyCount).length > 0 ? (
          <ul style={{paddingLeft:18, margin:0}}>
            {Object.entries(dailyCount).map(([service, count]) => (
              <li key={service}><b>{service}:</b> {count}</li>
            ))}
          </ul>
        ) : (
          <div style={{color:'#888'}}>No records for today yet.</div>
        )}
      </div>
      <form onSubmit={handleSubmit}>
        <label>
          Sex:
          <select
            value={sex}
            onChange={e => setSex(e.target.value)}
            required
            style={{ marginLeft: 8 }}
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <br />
        <label>
          Clinic ID:
          <input
            type="text"
            value={clinicId}
            onChange={e => setClinicId(e.target.value)}
            required
            autoFocus
          />
        </label>
        {fetchingDetails && clinicId && (
          <div style={{color:'#888',margin:'8px 0'}}>Fetching appointment details...</div>
        )}
        {autoFetched && (
          <div className="auto-details" style={{background:'#2b00ff',padding:'12px',borderRadius:'6px',marginBottom:'12px'}}>
            <div><b>Patient Name:</b> {patientName}</div>
            <div><b>Appointment Type:</b> {appointmentType}</div>
          </div>
        )}
        <label>
          Appointment Type:
          <select
            value={appointmentType}
            onChange={e => {
              setAppointmentType(e.target.value);
              setAmount(APPOINTMENT_PRICES[e.target.value] || '');
            }}
            disabled={autoFetched}
          >
            {APPOINTMENT_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
        <label>
          Amount Paid:
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
            min="0"
            disabled={autoFetched}
          />
        </label>
        <label>
          Appointment Date:
          <input
            type="date"
            value={scheduledDate}
            onChange={e => setScheduledDate(e.target.value)}
            required
          />
        </label>
        <label>
          Appointment Time:
          <input
            type="time"
            value={scheduledTime}
            onChange={e => setScheduledTime(e.target.value)}
            required
          />
        </label>
        <div className="payment-method-buttons">
          <button
            type="button"
            className={paymentMethod === 'cash' ? 'selected' : ''}
            onClick={() => setPaymentMethod('cash')}
          >
            Paid by Cash
          </button>
          <button
            type="button"
            className={paymentMethod === 'transfer' ? 'selected' : ''}
            onClick={() => setPaymentMethod('transfer')}
          >
            Paid by Transfer
          </button>
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
}


