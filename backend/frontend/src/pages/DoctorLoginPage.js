import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Hardcoded doctor credentials (replace with secure backend validation in production)
const DOCTOR_USERNAME = 'doctor';
const DOCTOR_PASSWORD = 'doc2026';

export default function DoctorLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === DOCTOR_USERNAME && password === DOCTOR_PASSWORD) {
      // Mark doctor as authenticated (sessionStorage for simplicity)
      sessionStorage.setItem('doctorAuth', 'true');
      navigate('/doctorspage');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="doctor-login-container">
      <h2>Doctor Login</h2>
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
