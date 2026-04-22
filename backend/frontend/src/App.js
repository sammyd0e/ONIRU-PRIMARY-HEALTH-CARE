import React, { useState } from 'react';
// import AppointmentBillboard from './components/AppointmentBillboard';
import BillboardAppointmentsPage from './pages/BillboardAppointmentsPage';
import './App.css';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ServicesPage from './pages/ServicesPage';
import AppointmentsPage from './pages/AppointmentsPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import { CreateChildAccountForm } from './pages/ProfilePage';
import FrontDeskAppointmentPage from './pages/FrontDeskAppointmentPage';
import { createAppointment } from './api';

import AboutUsPage from './pages/AboutUsPage';
import DoctorsPage from './pages/doctorspage';


function Header({ isAuth, onSignOut, onToggleMenu, menuOpen, handleNavAndScroll }) {
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



function AppContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const isAuth = !!localStorage.getItem('access');
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.removeItem('access');
    window.location.href = '/login';
  };

  const toggleMenu = () => setMenuOpen(v => !v);

  const handleNavAndScroll = (path, sectionId) => {
    navigate(path);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 350);
  };

  // Only allow authorized users to access FrontDeskAppointmentPage
  function RequireAuth({ children }) {
    if (!isAuth) {
      return <Navigate to="/login" replace />;
    }
    return children;
  }

  return (
    <div className="App">
      <Header isAuth={isAuth} onSignOut={handleSignOut} onToggleMenu={toggleMenu} menuOpen={menuOpen} handleNavAndScroll={handleNavAndScroll} />

      <main className="main-content">
        <section className="hero">
          <div className="container">
            <h2 className='' >Welcome to <br></br> <h1 className='oniru'>Oniru Health Center</h1> </h2>
            <p className="ooniru">
 featuring online booking, digital records, AI diagnostics, and real-time tracking, all securely online 😊. 
<br /> <span style={{ color: 'gold' }}></span></p>
            <div className="hero-ctas">
              <button className="btn btn-primary oniru " onClick={() => handleNavAndScroll('/services', 'services-section')}>Browse Services</button>
              <button className="btn btn-ghost oniru" onClick={() => handleNavAndScroll('/billboard-appointments', 'billboard-section')}>Billboard Appointments</button>
            </div>
          </div>
        </section>

        <section className="features">
          <Feature iconClass="bi bi-geo-fill oniru">
            <p className='oniru'>Palace Road, Oniru, Lagos Nigeria <br/></p>
          </Feature>
          <Feature iconClass="bi bi-telephone-inbound-fill oniru">
            <p className='oniru'>+234 907 6664 963</p>
          </Feature>
          <Feature iconClass="bi bi-alarm oniru">
            <p className='oniru' >Mon–Fri 08:00–21:00<br/></p>
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
          <Route path="/frontdesk-appointment" element={
            <RequireAuth>
              <FrontDeskAppointmentPage onSubmit={async (data) => {
                const res = await createAppointment(data);
                if (!res.ok) throw new Error(res.body?.detail || 'Failed to create appointment');
                // Optionally, show a success message or redirect
              }} />
            </RequireAuth>
          } />
          <Route path="/frontdeskappointment" element={
            <RequireAuth>
              <FrontDeskAppointmentPage onSubmit={async (data) => {
                const res = await createAppointment(data);
                if (!res.ok) throw new Error(res.body?.detail || 'Failed to create appointment');
                // Optionally, show a success message or redirect
              }} />
            </RequireAuth>
          } />
          <Route path="/doctorspage" element={<DoctorsPage />} />
          <Route path="/doctors" element={<DoctorsPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
