import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPatientDiagnosesAndResults, updatePatientDiagnosisOrResult } from '../api.nurseDiagnosis';
import { addDiagnosisOrTestResult } from '../api.nurseDiagnosisAdd';
import { deleteDiagnosisOrTestResult } from '../api.nurseDiagnosisDelete';
import './NurseVitalsPage.css';


export default function NurseVitalsPage() {
  const navigate = useNavigate();
  // Nurse authentication check
  useEffect(() => {
    if (sessionStorage.getItem('nurseAuth') !== 'true') {
      navigate('/nurse-login');
    }
  }, [navigate]);
  // Nurse logout handler
  function handleNurseLogout() {
    sessionStorage.removeItem('nurseAuth');
    navigate('/nurse-login');
  }
  // Add new diagnosis/test result state
  const [newDiagType, setNewDiagType] = useState('Diagnosis');
  const [newDiagValue, setNewDiagValue] = useState('');
  const [newDiagLoading, setNewDiagLoading] = useState(false);
  const [newDiagError, setNewDiagError] = useState('');

  // Add new diagnosis/test result handler
  async function handleAddDiagnosis(e) {
    e.preventDefault();
    if (!newDiagValue.trim()) {
      setNewDiagError('Please enter a value.');
      return;
    }
    if (!clinicId) {
      setNewDiagError('No clinic ID. Search for a patient first.');
      return;
    }
    if (!patient || !patient.id) {
      setNewDiagError('No patient selected. Search for a patient first.');
      return;
    }
    setNewDiagLoading(true);
    setNewDiagError('');
    try {
      const data = await addDiagnosisOrTestResult(newDiagType, clinicId, newDiagValue, patient.id);
      setDiagnoses([data, ...diagnoses]);
      setNewDiagValue('');
      setNewDiagType('Diagnosis');
    } catch {
      setNewDiagError('Failed to add.');
    }
    setNewDiagLoading(false);
  }
  const [clinicId, setClinicId] = useState('');
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState({
    bloodPressure: '',
    sugarLevel: '',
    cholesterolLevel: '',
    weight: '',
    height: '',
  });

  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Diagnoses & Test Results state
  const [diagnoses, setDiagnoses] = useState([]);
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);
  const [diagnosisError, setDiagnosisError] = useState('');
  const [editDiagnosisId, setEditDiagnosisId] = useState(null);
  const [editDiagnosisValue, setEditDiagnosisValue] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    setLoading(true);
    try {
      const token = window.localStorage.getItem('access');
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE}/users/patient-profile-by-clinic-id/?clinic_id=${clinicId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      const data = await res.json();
      if (res.ok && data.profile) {
        setPatient(data.profile);
        setVitals({
          bloodPressure: data.profile.bloodPressure || '',
          sugarLevel: data.profile.sugarLevel || '',
          cholesterolLevel: data.profile.cholesterolLevel || '',
          weight: data.profile.weight || '',
          height: data.profile.height || '',
        });
        setMsg('Patient found.');
      } else {
        setPatient(null);
        setMsg('');
        setError(data.error || 'Patient not found.');
      }
      // Fetch diagnoses & test results for this patient
      if (res.ok && data.profile && data.profile.clinicId) {
        setDiagnosisLoading(true);
        fetchPatientDiagnosesAndResults(data.profile.clinicId)
          .then((d) => {
            setDiagnoses(Array.isArray(d) ? d : []);
            setDiagnosisLoading(false);
            setDiagnosisError('');
          })
          .catch(() => {
            setDiagnoses([]);
            setDiagnosisError('Could not load diagnoses or test results.');
            setDiagnosisLoading(false);
          });
      } else {
        setDiagnoses([]);
      }
    } catch (err) {
      setError('Network error.');
      setPatient(null);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setVitals({ ...vitals, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    setLoading(true);
    try {
      const token = window.localStorage.getItem('access');
      const res = await fetch(`${process.env.REACT_APP_API_BASE}/users/patient-profile-by-clinic-id/?clinic_id=${clinicId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(vitals),
        }
      );
      const data = await res.json();
      if (res.ok && data.profile) {
        setMsg('Vitals updated successfully!');
        setPatient(data.profile);
      } else {
        setError(data.error || 'Failed to update vitals.');
      }
    } catch (err) {
      setError('Network error.');
    }
    setLoading(false);
  };

  return (
    <div className="nurse-vitals-container">
      <button style={{ float: 'right', margin: 8 }} className="btn" onClick={handleNurseLogout}>Logout</button>
      <h2 className="nurse-vitals-header">Enter Patient Vitals (Nurse)</h2>
      <form className="nurse-vitals-form" onSubmit={handleSearch}>
        <label>
          Patient Clinic ID:
          <input
            type="text"
            value={clinicId}
            onChange={e => setClinicId(e.target.value)}
            required
          />
        </label>
        <button className="btn" type="submit">Search</button>
      </form>
      {msg && <div style={{ color: '#16a34a', marginBottom: 12 }}>{msg}</div>}
      {error && <div className="nurse-vitals-error">{error}</div>}
      {patient && (
        <>
          <div className="nurse-vitals-section-title">Patient Vitals</div>
          <form className="nurse-vitals-form" onSubmit={handleSave}>
            <input name="bloodPressure" placeholder="Blood Pressure" value={vitals.bloodPressure} onChange={handleChange} />
            <input name="sugarLevel" placeholder="Sugar Level" value={vitals.sugarLevel} onChange={handleChange} />
            <input name="cholesterolLevel" placeholder="Cholesterol Level" value={vitals.cholesterolLevel} onChange={handleChange} />
            <input name="weight" placeholder="Weight (kg)" value={vitals.weight} onChange={handleChange} />
            <input name="height" placeholder="Height (cm)" value={vitals.height} onChange={handleChange} />
            <button className="btn" type="submit">Save Vitals</button>
          </form>
          {msg && <div style={{ color: '#16a34a', marginBottom: 12 }}>{msg}</div>}
          {error && <div className="nurse-vitals-error">{error}</div>}
        </>
      )}
      <div className="nurse-vitals-section-title">Diagnoses & Test Results</div>
      <form className="nurse-vitals-form" onSubmit={handleAddDiagnosis}>
        <select value={newDiagType} onChange={e => setNewDiagType(e.target.value)}>
          <option value="Diagnosis">Diagnosis</option>
          <option value="Test Result">Test Result</option>
        </select>
        <input
          type="text"
          placeholder={newDiagType === 'Diagnosis' ? 'Diagnosis label' : 'Test result'}
          value={newDiagValue}
          onChange={e => setNewDiagValue(e.target.value)}
        />
        <button className="btn" type="submit" disabled={newDiagLoading}>{newDiagLoading ? 'Adding...' : 'Add'}</button>
      </form>
      {newDiagError && <div className="nurse-vitals-error">{newDiagError}</div>}
      {diagnosisLoading ? (
        <div>Loading...</div>
      ) : (
        <table className="nurse-vitals-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Label / Result</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {diagnoses.map(d => (
              <tr key={d.id}>
                <td>{d.type}</td>
                <td>{editDiagnosisId === d.id ? (
                  <input
                    value={editDiagnosisValue}
                    onChange={e => setEditDiagnosisValue(e.target.value)}
                  />
                ) : (
                  d.type === 'Diagnosis' ? d.label : d.result
                )}</td>
                <td>{d.date}</td>
                <td>
                  {editDiagnosisId === d.id ? (
                    <>
                      <button className="btn" style={{ marginRight: 8 }} onClick={async () => {
                        try {
                          await updatePatientDiagnosisOrResult(d.type, d.id, editDiagnosisValue);
                          setDiagnoses(diagnoses.map(x => x.id === d.id ? { ...x, label: editDiagnosisValue, result: editDiagnosisValue } : x));
                          setEditDiagnosisId(null);
                          setEditDiagnosisValue('');
                        } catch {
                          alert('Failed to update.');
                        }
                      }}>Save</button>
                      <button className="btn" onClick={() => { setEditDiagnosisId(null); setEditDiagnosisValue(''); }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="btn" style={{ marginRight: 8 }} onClick={() => { setEditDiagnosisId(d.id); setEditDiagnosisValue(d.type === 'Diagnosis' ? d.label : d.result || ''); }}>Edit</button>
                      <button className="btn" style={{ background: '#dc2626', color: '#fff' }} onClick={async () => {
                        if (window.confirm('Are you sure you want to delete this item?')) {
                          try {
                            await deleteDiagnosisOrTestResult(d.type, d.id);
                            setDiagnoses(diagnoses.filter(x => x.id !== d.id));
                          } catch {
                            alert('Failed to delete.');
                          }
                        }
                      }}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {diagnosisError && <div className="nurse-vitals-error">{diagnosisError}</div>}
    </div>
  );
}
