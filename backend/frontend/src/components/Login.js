import React, { useState } from 'react';
import { login, getProfile } from '../api';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await login(email.trim(), password);
      if (data && data.access) {
        localStorage.setItem('access', data.access);
        if (data.refresh) localStorage.setItem('refresh', data.refresh);
        // Try to fetch and cache profile (best-effort)
        try {
          const me = await getProfile();
          if (me.user) localStorage.setItem('user', JSON.stringify(me.user));
          if (me.profile) localStorage.setItem('user_profile', JSON.stringify(me.profile));
        } catch (err) {
          console.warn('Failed to fetch profile after login', err);
        }
        navigate('/profile');
      } else {
        setError('Invalid email or password');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to sign in — please try again');
      setLoading(false);
    }
  };

  return (
    <div className="login-card" aria-live="polite">
      <div className="login-card-inner">
        <header className="login-header">
          <h2>Welcome back</h2>
          <p className="muted">Sign in to manage appointments and view your profile</p>
        </header>

        {error && (
          <div className="form-error" role="alert" aria-atomic="true">{error}</div>
        )}

        <form className="login-form" onSubmit={submit} noValidate>
          <label className="form-group">
            <span className="label-text">Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="form-input"
              placeholder="you@example.com"
            />
          </label>

          <label className="form-group">
            <span className="label-text">Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
            />
          </label>

          <div className="form-actions">
            <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
              {loading ? (
                <span className="spinner" aria-hidden="true"></span>
              ) : (
                'Sign in'
              )}
            </button>
            <button type="button" className="btn btn-link" onClick={() => navigate('/signup')}>Create account</button>
            <button type="button" className="btn btn-linkk" onClick={() => navigate('/')}>Home</button>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-link" onClick={() => navigate('/forgot-password')}>Forgot Password?</button>
          </div>
        </form>

        <footer className="login-footer">
          <small className="muted">Forgot password? Use the link above to reset your password.</small>
        </footer>
      </div>
    </div>
  );
}
