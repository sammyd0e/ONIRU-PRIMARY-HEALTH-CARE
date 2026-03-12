import React, { useState } from 'react';
import { updateProfile, getProfile } from '../api';
import { fetchRecentDiagnosesAndResults } from '../api.diagnosis';
import { fetchArthnatalBookings } from '../api';
import { fetchAppointments } from '../api';
import { useNavigate } from 'react-router-dom';
import { createChildPatientProfile, createChildAccount } from '../api';

import './ProfilePage.css';
import SymptomChatbot from '../components/SymptomChatbot';

export default function ProfilePage() {
    // Debug: Show access token status
    const accessToken = window.localStorage.getItem('access');
    console.log('[DEBUG] Access token:', accessToken);
    // Show a visible warning if the access token is missing or looks invalid
    const isTokenMissing = !accessToken || accessToken.length < 10;
  // --- All hooks must be at the top ---
  // State for diagnoses and test results
  const [diagnosisData, setDiagnosisData] = useState([]);
  const [diagnosisLoading, setDiagnosisLoading] = useState(true);
  const [diagnosisError, setDiagnosisError] = useState(null);
  const [editVitals, setEditVitals] = useState(false);
  const [vitals, setVitals] = useState({
    bloodPressure: '',
    sugarLevel: '',
  
    cholesterolLevel: '',
    weight: '',
    height: '',
  });
  const [vitalsMsg, setVitalsMsg] = useState('');
  const [vitalsLoading, setVitalsLoading] = useState(false);

  React.useEffect(() => {
    let mounted = true;
    setDiagnosisLoading(true);
    fetchRecentDiagnosesAndResults()
      .then(data => {
        if (mounted) {
          setDiagnosisData(Array.isArray(data) ? data : []);
          setDiagnosisLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setDiagnosisError('Could not load recent diagnoses or test results.');
          setDiagnosisLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);


  // State for user, profile, and children
  const [user, setUser] = React.useState(null);
  const [profile, setProfile] = React.useState(null);
  const [children, setChildren] = React.useState([]);
  const [loadingProfile, setLoadingProfile] = React.useState(true);

  // Always fetch the latest profile from backend on mount
  React.useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        if (localStorage.getItem('access')) {
          const data = await getProfile();
          if (data.user) {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
          }
          if (data.profile) {
            setProfile(data.profile);
            localStorage.setItem('user_profile', JSON.stringify(data.profile));
            setVitals({
              bloodPressure: data.profile.bloodPressure || '',
              sugarLevel: data.profile.sugarLevel || '',
              cholesterolLevel: data.profile.cholesterolLevel || '',
              weight: data.profile.weight || '',
              height: data.profile.height || '',
            });
          }
          if (Array.isArray(data.children)) {
            setChildren(data.children);
          }
        }
      } catch (err) {
        setUser(null);
        setProfile(null);
        setChildren([]);
      }
      setLoadingProfile(false);
    };
    fetchProfile();
  }, []);
  // Modal state for child appointment
  const [appointmentModalChild, setAppointmentModalChild] = useState(null);

  const handleOpenAppointmentModal = (child) => {
    setAppointmentModalChild(child);
  };

  const handleCloseAppointmentModal = () => {
    setAppointmentModalChild(null);
  };

  // Child appointment form component
  function ChildAppointmentForm({ child, onClose }) {

    const [date, setDate] = React.useState('');
    const [time, setTime] = React.useState('');
    const [reason, setReason] = React.useState('');
    const [statusMsg, setStatusMsg] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    // Import createAppointment from api
    const { createAppointment } = require('../api');

    const handleSubmit = async e => {
      e.preventDefault();
      setLoading(true);
      setStatusMsg('');
      try {
        const payload = {
          child_account: child.id,
          scheduled_date: date,
          scheduled_time: time,
          note: reason,
        };
        console.log('[DEBUG] Creating appointment for child_account:', child.id, payload);
        const res = await createAppointment(payload);
        if (res.ok) {
          setStatusMsg('Appointment created successfully!');
          setDate('');
          setTime('');
          setReason('');
          // Refresh child appointments after creation
          if (typeof window.fetchAppointmentsWithChild === 'function') {
            window.fetchAppointmentsWithChild(child.id);
          }
          if (typeof window.refreshChildAppointments === 'function') {
            window.refreshChildAppointments();
          }
          // Or trigger a custom event for parent to listen
          if (typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(new CustomEvent('childAppointmentCreated', { detail: { childId: child.id } }));
          }
        } else {
          // Show backend error message if available
          let errorMsg = 'Failed to create appointment.';
          if (res.body && typeof res.body === 'object') {
            // If DRF returns a dict of errors, join them
            errorMsg += ' ' + Object.entries(res.body).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
          }
          setStatusMsg(errorMsg);
        }
      } catch (err) {
        setStatusMsg('Error creating appointment.');
      }
      setLoading(false);
    };

    return (
      <div>
        <h3>Create Appointment for {child.child_profile?.first_name} {child.child_profile?.last_name}</h3>
        <form onSubmit={handleSubmit} className="child-appointment-form">
          <div>
            <label>Date: <input type="date" value={date} onChange={e => setDate(e.target.value)} required /></label>
          </div>
          <div>
            <label>Time: <input type="time" value={time} onChange={e => setTime(e.target.value)} /></label>
          </div>
          <div>
            <label>Reason: <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for appointment" /></label>
          </div>
          <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Appointment'}</button>
          {statusMsg && <div style={{marginTop:8}}>{statusMsg}</div>}
        </form>
        <button className="btn btn-ghost" style={{marginTop:12}} onClick={onClose}>Close</button>
      </div>
    );
  }

  // Fetch child appointments for each child
  const [childAppointments, setChildAppointments] = React.useState({});
  React.useEffect(() => {
    if (!children || children.length === 0) return;
    let mounted = true;
    const fetchAll = async () => {
      const results = {};
      for (const child of children) {
        try {
          console.log('[DEBUG] Fetching appointments for child_account:', child.id);
          const data = await fetchAppointmentsWithChild(child.id);
          results[child.id] = Array.isArray(data) ? data : [];
        } catch {
          results[child.id] = [];
        }
      }
      if (mounted) setChildAppointments(results);
    };
    // Expose refresh function globally for debugging/refresh after creation
    window.refreshChildAppointments = fetchAll;
    fetchAll();
    // Listen for custom event to refresh after appointment creation
    const handler = (e) => {
      if (e.detail && e.detail.childId) {
        fetchAll();
      }
    };
    window.addEventListener('childAppointmentCreated', handler);
    return () => { mounted = false; window.removeEventListener('childAppointmentCreated', handler); };
  }, [children]);

  // Helper to fetch appointments for a child
  async function fetchAppointmentsWithChild(childId) {
    console.log('[DEBUG] fetchAppointmentsWithChild called with childId:', childId);
    const res = await fetch(`${process.env.REACT_APP_API_BASE || ''}/api/appointments/?child_account=${childId}`, {
      headers: { 'Content-Type': 'application/json', ...(window.localStorage.getItem('access') ? { Authorization: `Bearer ${window.localStorage.getItem('access')}` } : {}) },
    });
    const data = await res.json();
    console.log('[DEBUG] Appointments fetched for child_account', childId, data);
    return data;
  }

  // Render child info section
  const ChildInfoSection = () => (
    <section className="profile-section">
      <h3 className="generall">Child Accounts</h3>
      {children.length === 0 ? (
        <div className="muted">No child accounts found.</div>
      ) : (
        <div className="child-list">
          {children.map((child, idx) => (
            <div key={child.id || idx} className="child-card" style={{border:'1px solid #e5e7eb', borderRadius:8, padding:16, marginBottom:16, background:'#f9fafb'}}>
              <Row label="Profile Name" value={child.child_profile?.first_name + ' ' + child.child_profile?.last_name} />
              <Row label="Blood Group" value={child.bloodgroup} />
              <Row label="Sex" value={child.child_profile?.sex} />
              <Row label="Date of Birth" value={child.child_profile?.dob} />
              <Row label="State of Origin" value={child.child_profile?.stateOfOrigin} />
              <Row label="Clinic ID" value={child.child_profile?.clinicId} />
              <button className="btn" style={{marginTop:12}} onClick={() => handleOpenAppointmentModal(child)}>Create Appointment for Child</button>
              {/* Child appointments */}
              <div style={{marginTop:20, borderTop:'1px solid #e5e7eb', paddingTop:12}}>
                <h4 style={{marginBottom:8, color:'#0e7490', fontWeight:700, fontSize:17}}>Child Appointments</h4>
                {childAppointments[child.id] && childAppointments[child.id].detail === 'Authentication credentials were not provided.' ? (
                  <div className="muted" style={{color:'#b91c1c'}}>You are not logged in. Please sign in to view appointments.</div>
                ) : childAppointments[child.id] && childAppointments[child.id].length > 0 ? (
                  <ul className="appointments-list">
                    {childAppointments[child.id].map((item, i) => (
                      <li key={item.id || i} className="appointment-item">
                        <div style={{fontWeight:600, fontSize:16, color:'#0369a1'}}>{item.service_id || 'Service'}</div>
                        <div style={{fontSize:15, margin:'4px 0'}}>
                          <span style={{fontWeight:500}}>{item.scheduled_date ? new Date(item.scheduled_date).toLocaleDateString() : 'No date'}</span> {item.scheduled_time || ''}
                        </div>
                        <div style={{fontSize:14, marginTop:2}}><b>Status:</b> {item.status}</div>
                        {item.doctor && <div style={{fontSize:14, marginTop:2}}><b>Doctor:</b> {item.doctor}</div>}
                        {item.note && <div style={{fontSize:14, marginTop:2}}><b>Note:</b> {item.note}</div>}
                        {item.total_amount && <div style={{fontSize:14, marginTop:2}}><b>Total Amount:</b> {item.total_amount}</div>}
                        {item.order_number && <div style={{fontSize:14, marginTop:2}}><b>Order #:</b> {item.order_number}</div>}
                        {item.created_at && <div className="muted" style={{fontSize:12}}>Booked: {new Date(item.created_at).toLocaleString()}</div>}
                        {item.updated_at && <div className="muted" style={{fontSize:12}}>Updated: {new Date(item.updated_at).toLocaleString()}</div>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="muted">No appointments yet. Click "Create Appointment for Child" to book one.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Modal for appointment form */}
      {appointmentModalChild && (
        <div className="modal-overlay" style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.3)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div className="modal-content" style={{background:'#fff',padding:24,borderRadius:8,minWidth:320,maxWidth:400}}>
            <ChildAppointmentForm child={appointmentModalChild} onClose={handleCloseAppointmentModal} />
          </div>
        </div>
      )}
    </section>
  );

  // State for arthnatal bookings
  const [arthnatalBookings, setArthnatalBookings] = useState([]);
  const [arthnatalLoading, setArthnatalLoading] = useState(true);
  const [arthnatalError, setArthnatalError] = useState(null);

  React.useEffect(() => {
    let mounted = true;
    setArthnatalLoading(true);
    fetchArthnatalBookings()
      .then(data => {
        if (mounted) {
          setArthnatalBookings(Array.isArray(data) ? data : []);
          setArthnatalLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setArthnatalError('Could not load arthnatal records.');
          setArthnatalLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  // State for appointments
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState(null);

  React.useEffect(() => {
    let mounted = true;
    setAppointmentsLoading(true);
    fetchAppointments()
      .then(data => {
        if (mounted) {
          // Filter for only upcoming appointments for the current user
          const today = new Date();
          const upcoming = Array.isArray(data)
            ? data.filter(a => {
                // Only show appointments for the current user
                return (
                  a.patient === user?.id &&
                  a.scheduled_date && new Date(a.scheduled_date) >= today
                );
              })
            : [];
          setAppointments(upcoming);
          setAppointmentsLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setAppointmentsError('Could not load appointments.');
          setAppointmentsLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [user]);


  if (loadingProfile) {
    return (
      <div className="profile-page container">
        <div className="profile-card">
          <h2>Your profile</h2>
          <p className="muted">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user && !profile) {
    return (
      <div className="profile-page container">
        <div className="profile-card">
          <h2 class='general'>Your profile</h2>
          <p className="muted">No profile data found. If you just signed up, try refreshing; otherwise sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  // Helper to render a row with label and value
  const Row = ({ label, value }) => (
    <div className="profile-row">
      <div className="profile-label">{label}</div>
      <div className="profile-value">{value || <span className="muted">—</span>}</div>
    </div>
  );

    // Helper to format date
    const formatDate = date => {
      if (!date) return <span className="muted">—</span>;
      const d = new Date(date);
      return isNaN(d) ? <span className="muted">—</span> : d.toLocaleDateString();
    };

    // Get latest antenatal booking with expected date of birth
    // Determine latest antenatal booking by `created_at` (backend uses snake_case)
    const latestAntenatal = arthnatalBookings && arthnatalBookings.length > 0
      ? [...arthnatalBookings].sort((a, b) => {
          const ad = new Date(a.created_at || a.createdAt || 0);
          const bd = new Date(b.created_at || b.createdAt || 0);
          return bd - ad; // newest first
        })[0]
      : null;

    // Use backend fields (preferred_date, created_at) but also tolerate other names
    const expectedDateOfBirth = latestAntenatal?.preferred_date || latestAntenatal?.preferredDate || latestAntenatal?.expected_date_of_birth;

    // Next appointment date is 14 days after `created_at`
    let nextAppointmentDate = null;
    if (latestAntenatal?.created_at || latestAntenatal?.createdAt) {
      const created = new Date(latestAntenatal.created_at || latestAntenatal.createdAt);
      if (!isNaN(created)) {
        created.setDate(created.getDate() + 14);
        nextAppointmentDate = created;
      }
    }

    // Get next appointment (soonest upcoming)
    const nextAppointment = appointments && appointments.length > 0
      ? appointments.reduce((min, a) => {
          const adate = new Date(a.scheduled_date);
          if (!min) return a;
          const mindate = new Date(min.scheduled_date);
          return adate < mindate ? a : min;
        }, null)
      : null;

    // Professional section for antenatal info
    const AntenatalInfoSection = () => (
      <section className="profile-section antenatal-info-section">
        <h3 style={{color:'#0e7490', marginBottom:8}}>Antenatal Booking Information</h3>
        <Row label="Expected Date of Birth" value={formatDate(expectedDateOfBirth)} />
        <Row label="Next Appointment Date" value={formatDate(nextAppointmentDate)} />
      </section>
    );


  const handleVitalsChange = e => {
    setVitals({ ...vitals, [e.target.name]: e.target.value });
  };

  const handleVitalsSubmit = async e => {
    e.preventDefault();
    setVitalsLoading(true);
    setVitalsMsg('');
    const res = await updateProfile(vitals);
    if (res.ok) {
      // Refresh profile in localStorage and UI
      const fresh = await getProfile();
      if (fresh.profile) {
        localStorage.setItem('user_profile', JSON.stringify(fresh.profile));
        setVitalsMsg('Vitals updated!');
        setEditVitals(false);
        window.location.reload();
      } else {
        setVitalsMsg('Updated, but failed to refresh profile.');
      }
    } else {
      setVitalsMsg(res.body?.detail || 'Failed to update vitals.');
    }
    setVitalsLoading(false);
  };


  return (
    <div className="profile-page container">
      {isTokenMissing && (
        <div style={{background:'#fee2e2',color:'#b91c1c',padding:12,borderRadius:8,marginBottom:16,border:'1px solid #fca5a5'}}>
          <b>Warning:</b> You are not authenticated. Please log in to view appointments. <br/>
          <span style={{fontSize:12}}>No valid access token found in localStorage.</span>
        </div>
      )}
      <div className="profile-card">
  

        <header className="profile-header">
          <div className="avatar" aria-hidden>👤</div>
          <div>
            <h2>{user?.first_name || user?.email || 'User'}</h2>
            <p class="generall">Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'just now'}</p>
          </div>
        </header>

        <ClinicIdDisplay profile={profile} />
        {/* Antenatal Booking Info Section */}
        <AntenatalInfoSection />

        <section className="profile-section">
          <h3 class='generall'>Contact</h3>
          <Row label="Email" value={user?.email} />
          <Row label="Phone" value={profile?.phone || user?.phone_number} />
          <Row label="Address" value={profile?.houseAddress} />
        </section>


        <section className="profile-section">
          <h3 className='generall'>Personal</h3>
          <Row label="Full name" value={user?.first_name} />
          <Row label="Sex" value={profile?.sex} />
          <Row label="Blood group" value={profile?.bloodGroup} />
          <Row label="Date of birth" value={profile?.dob} />
          <Row label="State of origin" value={profile?.stateOfOrigin} />
          <Row label="Next of kin" value={profile?.nextOfKin} />
        </section>
        <ChildInfoSection />
          <section className="profile-section">
          <h3 className='muted'>Recent Diagnoses & Test Results</h3>
          {diagnosisLoading ? (
            <div className="muted">Loading...</div>
          ) : diagnosisError ? (
            <div className="muted" style={{color:'#b91c1c'}}>{diagnosisError}</div>
          ) : diagnosisData.length === 0 ? (
            <div className="muted">No recent diagnoses or test results found.</div>
          ) : (
            <ul className="diagnosis-list">
              {diagnosisData.map((item, idx) => (
                <li key={item.id || idx} className="diagnosis-item">
                  <div style={{fontWeight:600}}>{item.type || 'Diagnosis/Test'}</div>
                  <div style={{fontSize:15}}>{item.label || item.name}</div>
                  {item.date && <div className="muted" style={{fontSize:13}}>{new Date(item.date).toLocaleDateString()}</div>}
                  {item.details && <div style={{fontSize:14, marginTop:2}}>{item.details}</div>}
                  {item.result && <div style={{fontSize:14, marginTop:2}}><b>Result:</b> {item.result}</div>}
                  {item.extra_info && item.extra_info.trim() !== '' && (
                    <div style={{fontSize:13, marginTop:2, color:'#0e7490'}}><b>Note:</b> {item.extra_info}</div>
                  )}
                  {item.created_at && <div className="muted" style={{fontSize:12}}>Created: {new Date(item.created_at).toLocaleString()}</div>}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="profile-section">
          <h3>Vitals</h3>
          {editVitals ? (
            <form onSubmit={handleVitalsSubmit} className="edit-vitals-form" style={{marginTop:12}}>
              <div className="profile-row"><label>Blood Pressure <input name="bloodPressure" value={vitals.bloodPressure} onChange={handleVitalsChange} /></label></div>
              <div className="profile-row"><label>Sugar Level <input name="sugarLevel" value={vitals.sugarLevel} onChange={handleVitalsChange} /></label></div>
              <div className="profile-row"><label>Cholesterol Level <input name="cholesterolLevel" value={vitals.cholesterolLevel} onChange={handleVitalsChange} /></label></div>
              <div className="profile-row"><label>Weight <input name="weight" value={vitals.weight} onChange={handleVitalsChange} /></label></div>
              <div className="profile-row"><label>Height <input name="height" value={vitals.height} onChange={handleVitalsChange} /></label></div>
              <div style={{marginTop:8}}>
                <button className="btn" type="submit" disabled={vitalsLoading}>{vitalsLoading ? 'Saving…' : 'Save Vitals'}</button>
                <button className="btn btn-ghost" type="button" onClick={()=>setEditVitals(false)} disabled={vitalsLoading} style={{marginLeft:8}}>Cancel</button>
                {vitalsMsg && <span style={{marginLeft:12, color:vitalsMsg.includes('fail')?'#b91c1c':'#15803d'}}>{vitalsMsg}</span>}
              </div>
            </form>
          ) : (
            <>
              <Row label="Blood Pressure" value={profile?.bloodPressure} />
              <Row label="Sugar Level" value={profile?.sugarLevel} />
              <Row label="Cholesterol Level" value={profile?.cholesterolLevel} />
              <Row label="Weight" value={profile?.weight} />
              <Row label="Height" value={profile?.height} />
              <button className="btn btn-ghost" style={{marginTop:8}} onClick={()=>setEditVitals(true)}>Edit Vitals</button>
            </>
          )}
        </section>

        <section className="profile-section">
          <h3 className='muted'>Arthnatal Bookings</h3>
          {arthnatalLoading ? (
            <div className="muted">Loading...</div>
          ) : arthnatalError ? (
            <div className="muted" style={{color:'#b91c1c'}}>{arthnatalError}</div>
          ) : arthnatalBookings.length === 0 ? (
            <div className="muted">No arthnatal bookings found.</div>
          ) : (
            <ul className="arthnatal-list">
              {arthnatalBookings.map((item, idx) => (
                <li key={item.id || idx} className="arthnatal-item">
                  <div style={{fontWeight:600}}>{item.name || item.serviceName || 'Booking'}</div>
                  <div style={{fontSize:15}}>{item.preferred_date ? new Date(item.preferred_date).toLocaleDateString() : 'No preferred date'}</div>
                  {item.note && <div style={{fontSize:14, marginTop:2}}><b>Notes:</b> {item.note}</div>}
                  {item.created_at && <div className="muted" style={{fontSize:12}}>Booked: {new Date(item.created_at).toLocaleString()}</div>}
                  {item.email && <div style={{fontSize:13, marginTop:4}}>Email: {item.email}</div>}
                  {item.phone && <div style={{fontSize:13}}>Phone: {item.phone}</div>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="profile-section">
          <h3>Upcoming Appointments</h3>
          {appointmentsLoading ? (
            <div className="muted">Loading...</div>
          ) : appointmentsError ? (
            <div className="muted" style={{color:'#b91c1c'}}>{appointmentsError}</div>
          ) : appointments.length === 0 ? (
            <div className="muted">No upcoming appointments found.</div>
          ) : (
            <ul className="appointments-list">
              {appointments.map((item, idx) => (
                <li key={item.id || idx} className="appointment-item">
                  <div style={{fontWeight:600}}>{item.service_id || 'Service'}</div>
                  <div style={{fontSize:15}}>{item.scheduled_date ? new Date(item.scheduled_date).toLocaleDateString() : 'No date'} {item.scheduled_time || ''}</div>
                  <div style={{fontSize:14, marginTop:2}}>{item.status}</div>
                  {item.note && <div style={{fontSize:14, marginTop:2}}><b>Note:</b> {item.note}</div>}
                  {item.created_at && <div className="muted" style={{fontSize:12}}>Booked: {new Date(item.created_at).toLocaleString()}</div>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="profile-actions">
          <button className="btn btn-ghost" onClick={() => window.location.href = '/services'}>Browse services</button>
          <button className="btn" onClick={() => window.location.href = '/appointments'}>My appointments</button>
          <button className="btn" style={{marginLeft:8}} onClick={() => window.location.href = '/create-child-account'}>Create a Child Account</button>
        </footer>
      </div>

      {/* Floating AI Symptom Chatbot */}
      <FloatingSymptomChatbot />
    </div>
  );

  // Floating, moveable AI Health Assistant widget
  function FloatingSymptomChatbot() {
    const [pos, setPos] = React.useState(() => {
      // Try to restore from localStorage
      const saved = localStorage.getItem('aiAssistantPos');
      return saved ? JSON.parse(saved) : { x: window.innerWidth - 340, y: window.innerHeight - 180 };
    });
    const [dragging, setDragging] = React.useState(false);
    const [offset, setOffset] = React.useState({ x: 0, y: 0 });
    const ref = React.useRef();

    React.useEffect(() => {
      function handleMouseMove(e) {
        if (!dragging) return;
        const newX = e.clientX - offset.x;
        const newY = e.clientY - offset.y;
        setPos({ x: Math.max(8, Math.min(newX, window.innerWidth - 180)), y: Math.max(8, Math.min(newY, window.innerHeight - 80)) });
      }
      function handleMouseUp() {
        setDragging(false);
        localStorage.setItem('aiAssistantPos', JSON.stringify(pos));
      }
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }, [dragging, offset, pos]);

    // Touch support
    React.useEffect(() => {
      function handleTouchMove(e) {
        if (!dragging) return;
        if (e.touches && e.touches[0]) {
          const newX = e.touches[0].clientX - offset.x;
          const newY = e.touches[0].clientY - offset.y;
          setPos({ x: Math.max(8, Math.min(newX, window.innerWidth - 180)), y: Math.max(8, Math.min(newY, window.innerHeight - 80)) });
        }
      }
      function handleTouchEnd() {
        setDragging(false);
        localStorage.setItem('aiAssistantPos', JSON.stringify(pos));
      }
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
      return () => {
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }, [dragging, offset, pos]);

    // Responsive width for mobile
    const widgetWidth = window.innerWidth < 500 ? '180px' : '260px';

    return (
      <div
        className="ai-assistant-floating"
        ref={ref}
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          width: widgetWidth,
          minWidth: '120px',
          maxWidth: '90vw',
          zIndex: 1200,
          cursor: dragging ? 'grabbing' : 'grab',
          boxShadow: '0 6px 24px rgba(14,116,144,0.18)',
          borderRadius: '12px',
          padding: '4px 0',
        }}
        onMouseDown={e => {
          setDragging(true);
          setOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y });
          e.preventDefault();
        }}
        onTouchStart={e => {
          if (e.touches && e.touches[0]) {
            setDragging(true);
            setOffset({ x: e.touches[0].clientX - pos.x, y: e.touches[0].clientY - pos.y });
          }
        }}
      >
        <SymptomChatbot />
      </div>
    );
  }
}



function ClinicIdDisplay({ profile }) {
  const id = (profile && (profile.clinicId || profile.clinic_id)) || null;
  const [copied, setCopied] = React.useState(false);

  const doCopy = async () => {
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // fall back to older method
      const ta = document.createElement('textarea');
      ta.value = id;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(()=>setCopied(false),2000); } catch(_) {}
      document.body.removeChild(ta);
    }
  };

  return (
    <div style={{marginTop:8, marginBottom:6}}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div>
          <div style={{fontSize:12, color:'#6b7280'}}>Clinic ID</div>
          <div style={{fontSize:18, letterSpacing:2, fontWeight:700}}>{id || '—'}</div>
          <div className="muted" style={{fontSize:12}}>Share this ID when booking appointments.</div>
        </div>
        <div>
          <button className="btn" onClick={doCopy} disabled={!id} style={{padding:'6px 10px'}}>{copied ? 'Copied' : 'Copy'}</button>
        </div>
      </div>
    </div>
  );
}

export function CreateChildAccountForm() {
  const [form, setForm] = React.useState({
    first_name: '',
    last_name: '',
    sex: '',
    dob: '',
    phone: '',
    email: '',
  });
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      // 1. Create the child patient profile
      const profileRes = await createChildPatientProfile(form);
      if (!profileRes.ok || !profileRes.body?.id) {
        setMsg('Failed to create child profile.' + (profileRes.body ? ' ' + JSON.stringify(profileRes.body) : ''));
        setLoading(false);
        return;
      }
      // 2. Link the child profile to the parent account
      const childAccountRes = await createChildAccount(profileRes.body.id);
      if (childAccountRes.ok) {
        setMsg('Child account created successfully!');
        setTimeout(() => navigate('/profile'), 1500);
      } else {
        setMsg('Child profile created, but failed to link to parent.' + (childAccountRes.body ? ' ' + JSON.stringify(childAccountRes.body) : ''));
      }
    } catch (err) {
      setMsg('Failed to create child account. ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="child-account-form-container">
      <h2>Create a Child Account</h2>
      <form onSubmit={handleSubmit} className="child-account-form">
        <div><label>First Name <input name="first_name" value={form.first_name} onChange={handleChange} required /></label></div>
        <div><label>Last Name <input name="last_name" value={form.last_name} onChange={handleChange} required /></label></div>
        <div><label>Sex <select name="sex" value={form.sex} onChange={handleChange} required><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></label></div>
        <div><label>Date of Birth <input type="date" name="dob" value={form.dob} onChange={handleChange} required /></label></div>
        <button className="btn" type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create Child Account'}</button>
        {msg && <div style={{marginTop:8, color:msg.includes('fail')?'#b91c1c':'#15803d'}}>{msg}</div>}
      </form>
    </div>
  );
}
