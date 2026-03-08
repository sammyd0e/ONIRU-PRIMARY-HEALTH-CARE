import React, { useEffect, useState } from 'react';
import { fetchAppointments, fetchArthnatalBookings, deleteAppointment, deleteArthnatalBooking } from '../api';
import BookingModal from '../components/BookingModal';
import './AppointmentsPage.css';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  // Track if patient has a pending general appointment
  const [hasPendingGeneral, setHasPendingGeneral] = useState(false);

  // Helper to fetch and update appointments and pending state
  const fetchAndUpdateAppointments = React.useCallback(() => {
    // Fetch both regular appointments and arthnatal bookings
    Promise.all([
      fetchAppointments(),
      fetchArthnatalBookings()
    ]).then(([apptsData, arthnatalData]) => {
      const appts = Array.isArray(apptsData) ? apptsData : (Array.isArray(apptsData.results) ? apptsData.results : []);
      const arthnatal = Array.isArray(arthnatalData) ? arthnatalData : (Array.isArray(arthnatalData.results) ? arthnatalData.results : []);
      const taggedAppts = appts.map(a => ({ ...a, _type: 'appointment' }));
      const taggedArthnatal = arthnatal.map(a => ({ ...a, _type: 'arthnatal' }));
      const now = new Date();
      const isUpcoming = x => {
        const dateStr = x.scheduled_date || x.preferred_date || x.created_at;
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return date >= now;
      };
      const combined = [...taggedAppts, ...taggedArthnatal].filter(isUpcoming).sort((a, b) => {
        const getDate = x => x.scheduled_date || x.preferred_date || x.created_at || '';
        return getDate(a).localeCompare(getDate(b));
      });
      setAppointments(combined);
      const pendingGeneral = taggedAppts.filter(isUpcoming).length > 0;
      setHasPendingGeneral(pendingGeneral);
    }).catch(() => {});
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAndUpdateAppointments();
  }, [fetchAndUpdateAppointments]);

  function handleBooked(newAppt) {
    if (!newAppt) return;
    // Prevent booking if already has pending general appointment
    if (hasPendingGeneral && newAppt._type === 'appointment') {
      setModalOpen(false);
      return;
    }
    setModalOpen(false);
    // Refetch appointments to update UI instantly
    fetchAndUpdateAppointments();
  }

  async function handleDelete(id, type) {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;
    let ok = false;
    if (type === 'arthnatal') {
      ok = await deleteArthnatalBooking(id);
    } else {
      ok = await deleteAppointment(id);
    }
    if (ok) {
      // Refetch appointments to update UI instantly
      fetchAndUpdateAppointments();
    } else alert('Failed to delete appointment.');
  }

  return (
    <div className="appointments-page">
      <header className="page-header">
        <h1 className='generalll'>Appointments</h1>
        <p className="muted generall">Manage and book appointments with ease. Choose clinic, date, time and doctor.</p>
        <div className="actions">
          <button
            className="sb-btn primary general"
            onClick={() => {
              if (!hasPendingGeneral) setModalOpen(true);
            }}
            disabled={hasPendingGeneral}
          >
            Book appointment
          </button>
        </div>
        {hasPendingGeneral && (
          <p style={{color: 'red', marginTop: '1em'}}>You already have a pending general appointment. Please wait until it is completed or deleted before booking another.</p>
        )}
      </header>

      <section className="appointments-list">
        <h2>Upcoming</h2>
        {appointments.length === 0 && <p className="muted">You have no upcoming appointments.</p>}
        <ul>
          {appointments.map((a, idx) => {
            // Compose a label for both types
            let label = '';
            if (a._type === 'appointment') {
              label = a.order_number;
              if (!label) {
                if (a.scheduled_date || a.scheduled_time) {
                  label = `${a.scheduled_date || ''}${a.scheduled_time ? ' ' + a.scheduled_time : ''}`.trim();
                } else if (a.created_at) {
                  label = a.created_at;
                }
              }
            } else if (a._type === 'arthnatal') {
              label = a.name + (a.preferred_date ? ` (${a.preferred_date})` : '');
            }
            return (
              <li key={a.id || idx} className="appointment-item" style={{position: 'relative'}}>
                <pre className="appointment-json" style={{whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: '#000000ff', padding: '1em', borderRadius: '6px'}}>
                  {JSON.stringify(a, null, 2)}
                </pre>
                <button
                  className="sb-btn danger"
                  style={{position: 'absolute', top: 10, right: 10}}
                  onClick={() => handleDelete(a.id, a._type)}
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <BookingModal open={modalOpen} service={{ title: 'General appointment' }} onClose={() => setModalOpen(false)} onBooked={handleBooked} hasPendingGeneral={hasPendingGeneral} />
    </div>
  );
}
