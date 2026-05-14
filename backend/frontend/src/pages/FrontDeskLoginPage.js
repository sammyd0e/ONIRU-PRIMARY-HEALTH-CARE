import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import './FrontDeskLoginPage.css';

// Hardcoded front desk credentials (replace with secure backend validation in production)
const FRONTDESK_USERNAME = 'frontdesk';
const FRONTDESK_PASSWORD = 'front2026';

export default function FrontDeskLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === FRONTDESK_USERNAME && password === FRONTDESK_PASSWORD) {
      // Mark front desk as authenticated (sessionStorage for simplicity)
      sessionStorage.setItem('frontdeskAuth', 'true');
      navigate('/frontdesk-appointment');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="frontdesk-login-container">
      <h2>Front Desk Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="error">{error}</div>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
