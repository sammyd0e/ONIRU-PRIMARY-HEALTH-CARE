import React from 'react';
import AppointmentBillboard from '../components/AppointmentBillboard';
import '../components/AppointmentBillboard.css';

export default function BillboardAppointmentsPage() {
  return (
    <div className="billboard-appointments-page">
      <h2 style={{color:'#0e7490', marginBottom:24, textAlign:'center'}}>All Appointments Billboard</h2>
      <AppointmentBillboard />
    </div>
  );
}
