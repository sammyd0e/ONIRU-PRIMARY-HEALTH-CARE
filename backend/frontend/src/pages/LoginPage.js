import React from 'react';
import Login from '../components/Login';
import '../components/CenteredModalPage.css';

export default function LoginPage() {
  return (
    <div className="centered-modal-page">
      <div className="centered-modal-card" id="login-section">
        <h1 style={{textAlign:'center', marginBottom:'1.5rem'}}>Sign In</h1>
        <Login />
      </div>
    </div>
  );
}
