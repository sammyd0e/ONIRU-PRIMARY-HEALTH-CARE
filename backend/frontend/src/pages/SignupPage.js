import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SignupPage() {
  const navigate = useNavigate(); 
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    othername: '',
    sex: '',
    bloodGroup: '',
    dob: '',
    stateOfOrigin: '',
    houseAddress: '',
    nextOfKin: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ , setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const validate = () => {
    if (!form.first_name.trim()) return 'First name is required';
    if (!form.last_name.trim()) return 'Last name is required';
    if (!form.sex) return 'Sex is required';
    if (!form.phone.trim()) return 'Phone is required';
    if (!form.email.trim()) return 'Email is required';
    // simple email check
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return 'Enter a valid email';
    // password validation
    if (!form.password) return 'Password is required';
    if (form.password.length < 8) return 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    return '';
  };

  const handleSubmit = e => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setLoading(true);
    // helper: read csrftoken cookie (Django's default)
    const getCookie = (name) => {
      const matches = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]/+^])/g, '\\$1') + '=([^;]*)'));
      return matches ? decodeURIComponent(matches[1]) : undefined;
    };

    // POST to backend signup endpoint. Using same-origin credentials and CSRF token.
    (async () => {
      try {
        const res = await fetch('/api/signup/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken') || '',
          },
          credentials: 'same-origin',
          body: JSON.stringify(form),
        });

        setLoading(false);

        if (res.ok) {
          // try to parse JSON but tolerate empty/non-json responses
          try {
            const data = await res.json();
            console.log('signup response', data);
            if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
            // Prefer the canonical profile object if returned by the server
            if (data.profile) {
              localStorage.setItem('user_profile', JSON.stringify(data.profile));
            } else if (data.submitted) {
              // fallback to the submitted values; include clinicId if present
              const profile = { ...(data.submitted || {}) };
              if (data.clinicId) profile.clinicId = data.clinicId;
              localStorage.setItem('user_profile', JSON.stringify(profile));
            } else if (data.clinicId) {
              // minimal profile containing clinicId
              localStorage.setItem('user_profile', JSON.stringify({ clinicId: data.clinicId }));
            }
          } catch (e) {
            // Not JSON — that's ok, we still consider the signup successful
            console.warn('Signup succeeded but response was not JSON', e);
          }
          setSuccess(true);
          // Redirect to the profile page to show the submitted information
          setTimeout(() => navigate('/profile'), 800);
          return;
        }

        // Non-OK response: try to build a friendly message, but never render raw HTML
        let msg = `Signup failed (status ${res.status})`;
        try {
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const data = await res.json();
            // Prefer helpful fields if provided by the API
            if (data.error) msg = data.error;
            else if (data.detail) msg = data.detail;
            else if (data.errors) msg = typeof data.errors === 'string' ? data.errors : JSON.stringify(data.errors);
            else msg = JSON.stringify(data);
          } else {
            const text = await res.text();
            // If the server returned HTML (Django error page / traceback), don't render it into the page.
            const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(text) || text.trim().startsWith('<');
            if (looksLikeHtml) {
              console.error('Server returned HTML error response on signup:', text);
              msg = `Server error (status ${res.status}) — please try again later.`;
            } else {
              msg = text || msg;
            }
          }
        } catch (e) {
          console.error('Error reading signup error response', e);
        }

        setError(msg);
      } catch (err) {
        setLoading(false);
        console.error('Network or fetch error during signup', err);
        setError('Network error — please try again: ' + (err.message || err));
      }
    })();
  };

  return (
    <div className="signup-page container" class='bgsp'>
      <div className="signup-card" id="signup-section">
        <h2>Create an account</h2>
        <p className="muted">Please enter your details to sign up.</p>
        {error && <div className="form-error">{error}</div>}
        {success ? (
          <div className="form-success">Account created — redirecting…</div>
        ) : (
          <form onSubmit={handleSubmit} className="signup-form">

            <label>
              Full name (FML)
              <input name="first_name" value={form.first_name} onChange={handleChange} />
            </label>
            <label>
              Last name(optional)
              <input name="last_name" value={form.last_name} onChange={handleChange} />
            </label>
            <label>
              Other name (optional)
              <input name="othername" value={form.othername} onChange={handleChange} />
            </label>

            <label>
              Sex
              <select name="sex" value={form.sex} onChange={handleChange}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label>
              Blood group
              <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange}>
                <option value="">Select</option>
                <option>A+</option>
                <option>A-</option>
                <option>B+</option>
                <option>B-</option>
                <option>AB+</option>
                <option>AB-</option>
                <option>O+</option>
                <option>O-</option>
              </select>
            </label>

            <label>
              Date of birth
              <input type="date" name="dob" value={form.dob} onChange={handleChange} />
            </label>

            <label className="full-width">
              House address
              <input name="houseAddress" value={form.houseAddress} onChange={handleChange} placeholder="Street, city, postal code" />
            </label>

            <label>
              State of origin
              <input name="stateOfOrigin" value={form.stateOfOrigin} onChange={handleChange} />
            </label>

            <label>
              Next of kin
              <input name="nextOfKin" value={form.nextOfKin} onChange={handleChange} />
            </label>

            <label>
              Phone number
              <input name="phone" value={form.phone} onChange={handleChange} />
            </label>

            <label>
              Email
              <input name="email" value={form.email} onChange={handleChange} />
            </label>

            <label className="password-row">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span>Create password</span>
                <button type="button" className="password-toggle" onClick={() => setShowPassword(s => !s)} aria-pressed={showPassword}>{showPassword ? 'Hide' : 'Show'}</button>
              </div>
              <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} />
            </label>

            <label className="password-row">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span>Confirm password</span>
              </div>
              <input type={showPassword ? 'text' : 'password'} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} />
            </label>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Create account</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
