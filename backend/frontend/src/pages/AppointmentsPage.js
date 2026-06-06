import React, { useEffect, useState } from 'react';
import { fetchAppointments, fetchArthnatalBookings, deleteAppointment, deleteArthnatalBooking } from '../api';
import BookingModal from '../components/BookingModal';
import './AppointmentsPage.css';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [hasPendingGeneral, setHasPendingGeneral] = useState(false);

  const fetchAndUpdateAppointments = React.useCallback(() => {
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

  useEffect(() => {
    fetchAndUpdateAppointments();
  }, [fetchAndUpdateAppointments]);

  function handleBooked(newAppt) {
    if (!newAppt) return;
    if (hasPendingGeneral && newAppt._type === 'appointment') {
      setModalOpen(false);
      return;
    }
    setModalOpen(false);
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
      fetchAndUpdateAppointments();
    } else alert('Failed to delete appointment.');
  }

  const getAppointmentDate = (apt) => {
    const dateStr = apt.scheduled_date || apt.preferred_date;
    if (!dateStr) return null;
    return new Date(dateStr);
  };

  const formatDate = (date) => {
    if (!date) return 'TBD';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (time) => {
    if (!time) return 'TBD';
    return time;
  };

  const getServiceType = (apt) => {
    return apt._type === 'arthnatal' ? 'Antenatal' : 'General';
  };

  return (
    <div className="appointments-page">
      <div className="appointments-header">
        <div className="header-content">
          <h1>My Appointments</h1>
          <p className="header-subtitle">Manage and book healthcare appointments with ease</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => !hasPendingGeneral && setModalOpen(true)}
          disabled={hasPendingGeneral}
          aria-label="Book new appointment"
        >
          <span className="btn-icon">+</span>
          <span>Book Appointment</span>
        </button>
      </div>

      {hasPendingGeneral && (
        <div className="alert alert-warning">
          <span className="alert-icon">⚠️</span>
          <span>You have a pending general appointment. Complete or delete it before booking another.</span>
        </div>
      )}

      <section className="appointments-section">
        <div className="section-header">
          <h2>Upcoming Appointments</h2>
          <span className="appointment-count">{appointments.length}</span>
        </div>

        {appointments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No Upcoming Appointments</h3>
            <p>You don't have any scheduled appointments yet.</p>
            <button
              className="btn btn-secondary"
              onClick={() => setModalOpen(true)}
            >
              Book Your First Appointment
            </button>
          </div>
        ) : (
          <div className="appointments-grid">
            {appointments.map((apt, idx) => (
              <div key={apt.id || idx} className="appointment-card">
                <div className="card-header">
                  <div className="service-badge">{getServiceType(apt)}</div>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(apt.id, apt._type)}
                    title="Delete appointment"
                    aria-label="Delete appointment"
                  >
                    ×
                  </button>
                </div>

                <div className="card-body">
                  <div className="appointment-detail">
                    <label className="detail-label">📅 Date</label>
                    <p className="detail-value">{formatDate(getAppointmentDate(apt))}</p>
                  </div>

                  <div className="appointment-detail">
                    <label className="detail-label">🕐 Time</label>
                    <p className="detail-value">{formatTime(apt.scheduled_time || apt.preferred_time || 'TBD')}</p>
                  </div>

                  {apt.doctor_name && (
                    <div className="appointment-detail">
                      <label className="detail-label">👨‍⚕️ Doctor</label>
                      <p className="detail-value">{apt.doctor_name}</p>
                    </div>
                  )}

                  {(apt.clinic_name || apt.clinic) && (
                    <div className="appointment-detail">
                      <label className="detail-label">🏥 Clinic</label>
                      <p className="detail-value">{apt.clinic_name || apt.clinic}</p>
                    </div>
                  )}

                  {apt.name && (
                    <div className="appointment-detail">
                      <label className="detail-label">📋 Program</label>
                      <p className="detail-value">{apt.name}</p>
                    </div>
                  )}

                  {apt.order_number && (
                    <div className="appointment-detail">
                      <label className="detail-label">🔖 Booking ID</label>
                      <p className="detail-value">{apt.order_number}</p>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <span className="status-badge status-confirmed">Confirmed</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <BookingModal
        open={modalOpen}
        service={{ title: 'General appointment' }}
        onClose={() => setModalOpen(false)}
        onBooked={handleBooked}
        hasPendingGeneral={hasPendingGeneral}
      />
    </div>
  );
}
