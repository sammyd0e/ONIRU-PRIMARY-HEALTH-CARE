

import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  return (
    <div className="landing-page-bg">
      <div className="landing-bg-image" />
      <main className="main-content landing-overlay">
        <section className="hero-pro hero-overlay">
          <div className="container hero-container">
            <div className="hero-text">
              <h1 className="hero-title">Welcome to Oniru Health Center</h1>
              <p className="hero-subtitle">Empowering your health journey with technology, expertise, and compassion.</p>
              <ul className="hero-list">
                <li>Online Appointment Booking</li>
                <li>Personalized Patient Portal & Digital Records</li>
                <li>Expert Medical Team & Modern Facilities</li>
                <li>AI-powered Diagnostics & Real-time Updates</li>
                <li>Confidential, Secure, and Patient-Centered Care</li>
              </ul>
              <div className="hero-ctas">
                <Link to="/services" className="btn btn-primary">Explore Our Services</Link>
                <Link to="/billboard-appointments" className="btn btn-ghost">View Appointments</Link>
              </div>
            </div>
            <div className="hero-image">
              <img src={process.env.PUBLIC_URL + '/onirulogo.jpg'} alt="Oniru Health Center" className="hero-img" />
            </div>
          </div>
        </section>

        <section className="features-pro">
          <div className="feature-card">
            <div className="feature-icon"><i className="bi bi-geo-alt-fill"></i></div>
            <div className="feature-content">
              <h4>Location</h4>
              <p>Palace Road, Oniru, Lagos, Nigeria</p>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><i className="bi bi-telephone-inbound-fill"></i></div>
            <div className="feature-content">
              <h4>Contact</h4>
              <p>+234 907 6664 963</p>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><i className="bi bi-alarm"></i></div>
            <div className="feature-content">
              <h4>Hours</h4>
              <p>Mon–Fri 08:00–21:00</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default LandingPage;
