import { useState } from 'react';

/**
 * Reusable booking form fields — used when embedding booking UI elsewhere.
 * Full booking flow lives in pages/BookingPage.jsx
 */
const BookingForm = ({ initial = {}, onChange, camera }) => {
  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    quantity: 1,
    name: '',
    email: '',
    phone: '',
    address: '',
    ...initial,
  });

  const update = (key, value) => {
    const next = { ...form, [key]: value };
    setForm(next);
    onChange?.(next);
  };

  return (
    <div className="row g-3">
      <div className="col-md-4">
        <label className="form-label">Start Date</label>
        <input
          type="date"
          className="form-control"
          value={form.startDate}
          onChange={(e) => update('startDate', e.target.value)}
        />
      </div>
      <div className="col-md-4">
        <label className="form-label">End Date</label>
        <input
          type="date"
          className="form-control"
          value={form.endDate}
          onChange={(e) => update('endDate', e.target.value)}
        />
      </div>
      <div className="col-md-4">
        <label className="form-label">Quantity</label>
        <input
          type="number"
          min={1}
          max={camera?.stock || 10}
          className="form-control"
          value={form.quantity}
          onChange={(e) => update('quantity', e.target.value)}
        />
      </div>
      <div className="col-md-6">
        <label className="form-label">Name</label>
        <input className="form-control" value={form.name} onChange={(e) => update('name', e.target.value)} />
      </div>
      <div className="col-md-6">
        <label className="form-label">Email</label>
        <input type="email" className="form-control" value={form.email} onChange={(e) => update('email', e.target.value)} />
      </div>
      <div className="col-md-6">
        <label className="form-label">Phone</label>
        <input className="form-control" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
      </div>
      <div className="col-md-6">
        <label className="form-label">Address</label>
        <input className="form-control" value={form.address} onChange={(e) => update('address', e.target.value)} />
      </div>
    </div>
  );
};

export default BookingForm;
