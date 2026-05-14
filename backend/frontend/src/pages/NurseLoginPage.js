import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import './NurseLoginPage.css';

// Hardcoded nurse credentials (replace with secure backend validation in production)
const NURSE_USERNAME = 'nurse';
const NURSE_PASSWORD = 'vitals2026';

export default function NurseLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === NURSE_USERNAME && password === NURSE_PASSWORD) {
      // Mark nurse as authenticated (sessionStorage for simplicity)
      sessionStorage.setItem('nurseAuth', 'true');
      navigate('/nurse-vitals');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="nurse-login-container">
      <h2>Nurse Login</h2>
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
