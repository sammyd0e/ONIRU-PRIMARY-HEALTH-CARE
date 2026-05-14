
import React, { useState } from 'react';
import './ServicesPage.css';
// import { Link } from 'react-router-dom';
import BookingModal from '../components/BookingModal';
import ArthnatalModal from '../components/ArthnatalModal';

const SERVICES = [
  {
    id: 'arthenatal',
    title: 'Arthenatal Care',
    duration: 'Per visit',
    description: 'Comprehensive antenatal care for expectant mothers — regular checkups, screening, counseling and birth planning.',
    cta: 'Book antenatal appointment',
  },
 
  {
    id: 'immunization',
    title: 'Immunization (age 0–5)',
    duration: 'Vaccination visit',
    description: 'Routine childhood immunizations following national schedule — safe, recorded and age‑appropriate for 0–5 years.',
    cta: 'Schedule immunization',
  },
  {
    id: 'vitals and Laboratory Screening',
    title: 'Vitals & Screening',
    duration: '5–15 min',
    description: 'Quick vitals check (BP, pulse, temperature, weight) and basic screening to monitor health status.',
    cta: 'Check vitals',
  },
   {
    id: 'Family Planning',
    title: 'Family Planning',
    duration: '30–45 min',
    description: 'Comprehensive family planning services including consultations, contraceptive counseling and reproductive health care.',
    cta: 'Book a consultation',
  },
];


export default function ServicesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [arthnatalOpen, setArthnatalOpen] = useState(false);

  function openFor(service) {
    setSelectedService(service);
    setModalOpen(true);
  }

  function handleClose() {
    setModalOpen(false);
    setSelectedService(null);
  }

  function handleBooked(res) {
    try { if (res && res.order_number) alert('Booked: ' + res.order_number); }
    catch (e) {}
  }

  function handleArthnatalSubmit(form) {
    // You can send form data to backend here
    // For now, just show a success message in the modal
  }

  return (
    <div className="services-page container">
      <header className="services-header">
        <div className='lead'>
          <h1 className='generalll'>Our Services</h1>
          <p className="lead">Quality, compassionate care — choose a service and book an appointment online.</p>
        </div>
        <div className="services-hero" aria-hidden>
          <div className="service-illus">🩺</div>
        </div>
      </header>

      <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '1.5rem 0 0.5rem 0' }}>
        <button className="btn btn-primary" style={{ fontWeight: 600 }} onClick={() => setArthnatalOpen(true)}>
          Book Arthnatal Program
        </button>
      </div>

      <section className="services-grid" id="services-section">
        {SERVICES.map(s => (
          <article key={s.id} className="service-card">
            <div className="service-card-head">
              <div className="service-icon" aria-hidden>✚</div>
              <div>
                <h3>{s.title}</h3>
                <div className="service-meta">{s.price} · {s.duration}</div>
              </div>
            </div>

            <p className="service-desc">{s.description}</p>

            <div className="service-actions">
              <button className="btn btn-primary" onClick={() => openFor(s)}>{s.cta}</button>
              <button className="btn btn-ghost" onClick={() => alert('More details coming soon')}>Details</button>
            </div>
          </article>
        ))}
      </section>

      <BookingModal open={modalOpen} service={selectedService} onClose={handleClose} onBooked={handleBooked} />
      <ArthnatalModal open={arthnatalOpen} onClose={() => setArthnatalOpen(false)} onSubmit={handleArthnatalSubmit} />
    </div>
  );
}
