import React, { useState } from 'react';
import AppointmentBillboard from './components/AppointmentBillboard';
import BillboardAppointmentsPage from './pages/BillboardAppointmentsPage';
import './App.css';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ServicesPage from './pages/ServicesPage';
import AppointmentsPage from './pages/AppointmentsPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import { CreateChildAccountForm } from './pages/ProfilePage';

import AboutUsPage from './pages/AboutUsPage';


function Header({ isAuth, onSignOut, onToggleMenu, menuOpen }) {
  const navigate = require('react-router-dom').useNavigate();
  // Helper to navigate and scroll to section after route change
  const handleNavAndScroll = (path, sectionId) => {
    navigate(path);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 350); // delay to allow page render
  };
  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="brand">
          <img className="brand-logo" src={process.env.PUBLIC_URL + '/onirulogo.jpg'} alt="Oniru logo" />
          <Link to="/services" className="brand-link">
            <h1>Oniru Health Center</h1>
            <p className="tagline">Providing top-notch medical care</p>
          </Link>
        </div>

        <button
          className={`nav-toggle ${menuOpen ? 'open' : ''}`}
          aria-label="Toggle navigation"
          onClick={onToggleMenu}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`site-nav ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
          <Link to="/services" className="nav-link">Services</Link>
          <Link to="/appointments" className="nav-link">Appointments</Link>
          <Link to="/about" className="nav-link">About Us</Link>
          {isAuth ? (
            <>
              <Link to="/profile" className="nav-link">Profile</Link>
              <button className="btn btn-ghost" onClick={onSignOut}>Sign out</button>
            </>
          ) : (
            <button
              className="btn nav-anim login-btn"
              onClick={() => handleNavAndScroll('/login', 'login-section')}
            >Sign in</button>
          )}
          <button
            className="btn nav-anim signup-btn"
            onClick={() => handleNavAndScroll('/signup', 'signup-section')}
          >Sign up</button>
        </nav>
      </div>
    </header>
  );
}

function Feature({ iconClass, children }) {
  return (
    <article className="feature">
      <div className="feature-icon"><i className={iconClass} /></div>
      <div className="feature-body">{children}</div>
    </article>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <small>© {new Date().getFullYear()} SoftBuy — Built with care</small>
        <div className="footer-links">
          <a href="mailto:hello@example.com">Contact</a>
          <a href="/privacy">Privacy</a>
        </div>
      </div>
    </footer>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const isAuth = !!localStorage.getItem('access');

  const handleSignOut = () => {
    localStorage.removeItem('access');
    window.location.href = '/login';
  };

  const toggleMenu = () => setMenuOpen(v => !v);

  return (
    <BrowserRouter>
      <div className="App">
        <Header isAuth={isAuth} onSignOut={handleSignOut} onToggleMenu={toggleMenu} menuOpen={menuOpen} />

        <main
          className="main-content container"
          style={{
           
          }}
        >
          <section className="hero">
            <div className="hero-copy">
              <h2>Find & book care with confidence</h2>
              <p className="lead">Easily discover services, book appointments, and manage your care <br /> <span style={{ color: 'gold' }}>all in one place.</span></p>
              <div className="hero-ctas">
                <Link to="/services" className="btn btn-primary">Browse Services</Link>
                <Link to="/billboard-appointments" className="btn btn-ghost">Billboard Appointments</Link>
              </div>
              
            </div>

           
          </section>

          <section className="features">
            <Feature iconClass="bi bi-geo-fill">
              <p>Palace Road, Oniru, Lagos Nigeria <br/></p>
            </Feature>
            <Feature iconClass="bi bi-telephone-inbound-fill">
              <p>+234 907 6664 963</p>
            </Feature>
            <Feature iconClass="bi bi-alarm">
              <p>Mon–Fri 08:00–21:00<br/></p>
            </Feature>
          </section>

          <Routes>
            <Route path="/" element={<Navigate to="/services" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/about" element={<AboutUsPage />} />
            <Route path="/billboard-appointments" element={<BillboardAppointmentsPage />} />
            <Route path="/create-child-account" element={<CreateChildAccountForm />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
