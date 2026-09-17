import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card border-0 shadow">
            <div className="card-body p-4 p-md-5">
              <h1 className="h3 fw-bold mb-1">Create Account</h1>
              <p className="text-muted mb-4">Join LensHire to book cameras</p>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input className="form-control" value={form.name} onChange={(e) => set('name', e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={form.email} onChange={(e) => set('email', e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Phone</label>
                  <input type="tel" className="form-control" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                </div>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label">Password</label>
                    <input type="password" className="form-control" value={form.password} onChange={(e) => set('password', e.target.value)} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Confirm Password</label>
                    <input type="password" className="form-control" value={form.confirm} onChange={(e) => set('confirm', e.target.value)} required />
                  </div>
                </div>
                <button type="submit" className="btn btn-warning w-100" disabled={loading}>
                  {loading ? 'Creating...' : 'Register'}
                </button>
              </form>
              <p className="text-center mt-3 mb-0 small">
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
