import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
function Feature({ iconClass, children }) {
  return (
    <div className="feature">
      <i className={iconClass}></i>
      <p>{children}</p>
    </div>
  );
}


function LandingPage() {
  return (
    <div className="landing-page">
      <main className="main-content">
        <section className="hero">
          <div className="container">
            <h2>Welcome to <br /><span className='oniru'>Oniru Health Center</span></h2>
            <p className="ooniru">
              Featuring online booking, digital records, AI diagnostics, and real-time tracking, all securely online 😊.
            </p>
            <div className="hero-ctas">
              <Link to="/services" className="btn btn-primary oniru">Browse Services</Link>
              <Link to="/billboard-appointments" className="btn btn-ghost oniru">Billboard Appointments</Link>
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
      </main>
    </div>
  );
}

export default LandingPage;
