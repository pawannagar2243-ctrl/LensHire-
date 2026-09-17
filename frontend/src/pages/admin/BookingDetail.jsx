import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { adminPath, formatCurrency, formatDate, getImageUrl } from '../../services/adminApi';
import Loader from '../../components/common/admin/Loader';

const bookingBadge = {
  Pending: 'text-bg-warning',
  Confirmed: 'text-bg-primary',
  Cancelled: 'text-bg-danger',
  Completed: 'text-bg-success',
};

const paymentBadge = {
  Pending: 'text-bg-secondary',
  Paid: 'text-bg-success',
  Failed: 'text-bg-danger',
  Refunded: 'text-bg-info',
};

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Pending');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/bookings/${id}`);
      setBooking(data.booking);
      setNotes(data.booking?.notes || '');
      setPaymentStatus(data.booking?.paymentStatus || 'Pending');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateBooking = async (payload) => {
    setSaving(true);
    try {
      const { data } = await api.put(`/bookings/${id}`, payload);
      setBooking(data.booking);
      setNotes(data.booking?.notes || '');
      setPaymentStatus(data.booking?.paymentStatus || 'Pending');
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Permanently delete this booking?')) return;
    try {
      await api.delete(`/bookings/${id}`);
      navigate(adminPath('/bookings'));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) return <Loader text="Loading booking..." />;
  if (error) {
    return (
      <div className="alert alert-danger">
        {error}{' '}
        <Link to={adminPath('/bookings')} className="alert-link">
          Back to bookings
        </Link>
      </div>
    );
  }
  if (!booking) return null;

  const cam = booking.camera;

  return (
    <div>
      <div className="mb-3 d-flex flex-wrap justify-content-between gap-2">
        <Link to={adminPath('/bookings')} className="text-decoration-none small">
          <i className="bi bi-arrow-left me-1" />
          Back to bookings
        </Link>
        <div className="d-flex gap-2">
          <span className={`badge ${bookingBadge[booking.bookingStatus]}`}>{booking.bookingStatus}</span>
          <span className={`badge ${paymentBadge[booking.paymentStatus]}`}>{booking.paymentStatus}</span>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-header bg-white">
              <h2 className="h6 mb-0">Booking Info</h2>
            </div>
            <div className="card-body">
              <div className="row g-3 small">
                <div className="col-sm-6">
                  <div className="text-muted">Booking ID</div>
                  <code>{booking._id}</code>
                </div>
                <div className="col-sm-6">
                  <div className="text-muted">Created</div>
                  <div className="fw-semibold">{formatDate(booking.createdAt)}</div>
                </div>
                <div className="col-sm-4">
                  <div className="text-muted">Start Date</div>
                  <div className="fw-semibold">{formatDate(booking.startDate)}</div>
                </div>
                <div className="col-sm-4">
                  <div className="text-muted">End Date</div>
                  <div className="fw-semibold">{formatDate(booking.endDate)}</div>
                </div>
                <div className="col-sm-4">
                  <div className="text-muted">Total Days</div>
                  <div className="fw-semibold">{booking.totalDays}</div>
                </div>
                <div className="col-sm-4">
                  <div className="text-muted">Quantity</div>
                  <div className="fw-semibold">{booking.quantity}</div>
                </div>
                <div className="col-sm-4">
                  <div className="text-muted">Price / Day</div>
                  <div className="fw-semibold">{formatCurrency(booking.pricePerDay)}</div>
                </div>
                <div className="col-sm-4">
                  <div className="text-muted">Security Deposit</div>
                  <div className="fw-semibold">{formatCurrency(booking.securityDeposit)}</div>
                </div>
                <div className="col-12">
                  <div className="text-muted">Total Amount</div>
                  <div className="fs-5 fw-semibold text-success">{formatCurrency(booking.totalAmount)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-3">
            <div className="card-header bg-white">
              <h2 className="h6 mb-0">Customer</h2>
            </div>
            <div className="card-body">
              <div className="row g-3 small">
                <div className="col-md-6">
                  <div className="text-muted">Name</div>
                  <div className="fw-semibold">{booking.customerDetails?.name}</div>
                </div>
                <div className="col-md-6">
                  <div className="text-muted">Email</div>
                  <div className="fw-semibold">{booking.customerDetails?.email}</div>
                </div>
                <div className="col-md-6">
                  <div className="text-muted">Phone</div>
                  <div className="fw-semibold">{booking.customerDetails?.phone}</div>
                </div>
                <div className="col-md-6">
                  <div className="text-muted">Account</div>
                  <div className="fw-semibold">
                    {booking.user?._id ? (
                      <Link to={adminPath(`/users/${booking.user._id}`)}>{booking.user.name}</Link>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
                <div className="col-12">
                  <div className="text-muted">Address</div>
                  <div className="fw-semibold">{booking.customerDetails?.address || '—'}</div>
                </div>
              </div>
            </div>
          </div>

          {cam && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white">
                <h2 className="h6 mb-0">Camera</h2>
              </div>
              <div className="card-body d-flex gap-3 align-items-center">
                {cam.images?.[0] ? (
                  <img
                    src={getImageUrl(cam.images[0])}
                    alt={cam.name}
                    className="rounded"
                    style={{ width: 80, height: 80, objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="bg-light rounded d-flex align-items-center justify-content-center text-muted"
                    style={{ width: 80, height: 80 }}
                  >
                    <i className="bi bi-camera fs-3" />
                  </div>
                )}
                <div>
                  <div className="fw-semibold">{cam.name}</div>
                  <div className="text-muted small">
                    {cam.brand} · {cam.model}
                  </div>
                  {cam.pricePerDay != null && (
                    <div className="small">{formatCurrency(cam.pricePerDay)} / day</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-header bg-white">
              <h2 className="h6 mb-0">Actions</h2>
            </div>
            <div className="card-body d-grid gap-2">
              {booking.bookingStatus === 'Pending' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={saving}
                  onClick={() => updateBooking({ bookingStatus: 'Confirmed' })}
                >
                  <i className="bi bi-check-lg me-1" />
                  Confirm Booking
                </button>
              )}
              {booking.bookingStatus === 'Confirmed' && (
                <button
                  type="button"
                  className="btn btn-success"
                  disabled={saving}
                  onClick={() => updateBooking({ bookingStatus: 'Completed' })}
                >
                  <i className="bi bi-check2-all me-1" />
                  Mark Completed
                </button>
              )}
              {['Pending', 'Confirmed'].includes(booking.bookingStatus) && (
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  disabled={saving}
                  onClick={() => updateBooking({ bookingStatus: 'Cancelled' })}
                >
                  <i className="bi bi-x-lg me-1" />
                  Cancel Booking
                </button>
              )}
              <button type="button" className="btn btn-outline-secondary" onClick={handleDelete}>
                <i className="bi bi-trash me-1" />
                Delete Booking
              </button>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white">
              <h2 className="h6 mb-0">Payment & Notes</h2>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Payment Status</label>
                <select
                  className="form-select"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Failed">Failed</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="btn btn-outline-primary w-100"
                disabled={saving}
                onClick={() => updateBooking({ paymentStatus, notes })}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
