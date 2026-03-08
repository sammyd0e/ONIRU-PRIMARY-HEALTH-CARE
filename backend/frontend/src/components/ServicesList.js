import React, { useEffect, useState } from 'react';
import { fetchServices } from '../api';

export default function ServicesList() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    let mounted = true;
    fetchServices().then(data => {
      if (mounted && Array.isArray(data)) setServices(data);
    }).catch(() => {});
    return () => { mounted = false };
  }, []);

  return (
    <div>
      <h2>Services</h2>
      <ul>
        {services.map(s => (
          <li key={s.id}>{s.title} — ${s.price}</li>
        ))}
      </ul>
    </div>
  );
}
