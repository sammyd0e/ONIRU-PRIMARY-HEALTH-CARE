import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
// import AppointmentBillboard from './components/AppointmentBillboard';
import BillboardAppointmentsPage from './pages/BillboardAppointmentsPage';
import LandingPage from './pages/LandingPage';
import './App.css';
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
import NurseVitalsPage from './pages/NurseVitalsPage';
import NurseLoginPage from './pages/NurseLoginPage';
import DoctorLoginPage from './pages/DoctorLoginPage';
import FrontDeskLoginPage from './pages/FrontDeskLoginPage';
import { BrowserRouter } from 'react-router-dom';


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
              <Link to="/nurse-vitals" className="nav-link">Nurse Vitals
              
              </Link>
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



// NurseVitalsAuth: Protects nurse vitals route with sessionStorage check
function NurseVitalsAuth({ children }) {
  return sessionStorage.getItem('nurseAuth') === 'true'
    ? children
    : <Navigate to="/nurse-login" replace />;
}

function AppContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const isAuth = !!localStorage.getItem('access');
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.removeItem('access');
    sessionStorage.removeItem('nurseAuth');
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
      

        

        <Routes>
          <Route path="/" element={<LandingPage />} />
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
          <Route path="/nurse-login" element={<NurseLoginPage />} />
          <Route path="/nurse-vitals" element={<NurseVitalsAuth><NurseVitalsPage /></NurseVitalsAuth>} />
          <Route path="/doctor-login" element={<DoctorLoginPage />} />
          <Route path="/frontdesk-login" element={<FrontDeskLoginPage />} />
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
