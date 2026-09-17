import { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const Contact = () => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/contact', form);
      toast.success('Message sent successfully');
      setForm({ firstName: '', lastName: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row g-5">
        <div className="col-lg-5">
          <h1 className="h2 fw-bold mb-3">Contact Us</h1>
          <p className="text-muted">
            Questions about a rental or need gear advice? Send us a message.
          </p>
          <ul className="list-unstyled">
            <li className="mb-2">
              <i className="bi bi-envelope text-warning me-2" />
              pawannagar2243@gmail.com
            </li>
            <li className="mb-2">
              <i className="bi bi-telephone text-warning me-2" />
              +91 8239537689
            </li>
            <li>
              <i className="bi bi-geo-alt text-warning me-2" />
              Mumbai, India
            </li>
          </ul>
        </div>
        <div className="col-lg-7">
          <form onSubmit={handleSubmit} className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">First Name</label>
                  <input className="form-control" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Last Name</label>
                  <input className="form-control" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={form.email} onChange={(e) => set('email', e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Subject</label>
                  <input className="form-control" value={form.subject} onChange={(e) => set('subject', e.target.value)} />
                </div>
                <div className="col-12">
                  <label className="form-label">Message</label>
                  <textarea className="form-control" rows={5} value={form.message} onChange={(e) => set('message', e.target.value)} required />
                </div>
                <div className="col-12">
                  <button type="submit" className="btn btn-warning px-4" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
