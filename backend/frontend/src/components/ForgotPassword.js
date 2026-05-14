import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch('/api/forgot-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.success || 'Check your email for a new password.');
      } else {
        setError(data.error || 'Unable to reset password.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="login-card" aria-live="polite">
      <div className="login-card-inner">
        <header className="login-header">
          <h2>Forgot Password</h2>
          <p className="muted">Enter your email to receive a new password.</p>
        </header>
        {message && <div className="form-success" role="alert">{message}</div>}
        {error && <div className="form-error" role="alert">{error}</div>}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label className="form-group">
            <span className="label-text">Email</span>
            <input
              type="email"
              name="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="form-input"
              placeholder="you@example.com"
            />
          </label>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? <span className="spinner" aria-hidden="true"></span> : 'Send Reset Email'}
            </button>
            <button type="button" className="btn btn-link" onClick={() => navigate('/login')}>Back to Login</button>
          </div>
        </form>
      </div>
    </div>
  );
}
