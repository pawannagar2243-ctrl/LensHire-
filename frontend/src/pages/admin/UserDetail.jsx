import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { adminPath, formatDate } from '../../services/adminApi';
import BookingTable from '../../components/common/admin/BookingTable';
import Loader from '../../components/common/admin/Loader';

export default function UserDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/users/${id}`);
        if (!cancelled) {
          setUser(data.user);
          setBookings(data.bookings || []);
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load user');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <Loader text="Loading user..." />;
  if (error) {
    return (
      <div className="alert alert-danger">
        {error}{' '}
        <Link to={adminPath('/users')} className="alert-link">
          Back to users
        </Link>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div>
      <div className="mb-3">
        <Link to={adminPath('/users')} className="text-decoration-none small">
          <i className="bi bi-arrow-left me-1" />
          Back to users
        </Link>
      </div>

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
            <div>
              <h2 className="h5 mb-1">{user.name}</h2>
              <div className="text-muted">{user.email}</div>
            </div>
            <div className="d-flex gap-2 align-items-start">
              <span className={`badge ${user.role === 'admin' ? 'text-bg-dark' : 'text-bg-secondary'}`}>
                {user.role}
              </span>
              <span className={`badge ${user.isBlocked ? 'text-bg-danger' : 'text-bg-success'}`}>
                {user.isBlocked ? 'Blocked' : 'Active'}
              </span>
            </div>
          </div>
          <div className="row g-3 small">
            <div className="col-sm-6 col-md-3">
              <div className="text-muted">Phone</div>
              <div className="fw-semibold">{user.phone || '—'}</div>
            </div>
            <div className="col-sm-6 col-md-3">
              <div className="text-muted">Joined</div>
              <div className="fw-semibold">{formatDate(user.createdAt)}</div>
            </div>
            <div className="col-md-6">
              <div className="text-muted">Address</div>
              <div className="fw-semibold">{user.address || '—'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white">
          <h3 className="h6 mb-0">Bookings ({bookings.length})</h3>
        </div>
        <div className="card-body p-0">
          <BookingTable bookings={bookings} showActions={false} />
        </div>
      </div>
    </div>
  );
}
