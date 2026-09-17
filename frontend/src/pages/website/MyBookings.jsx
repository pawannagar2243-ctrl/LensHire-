import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { formatCurrency, formatDate, getImageUrl } from '../../services/api';
import Loader from '../../components/common/Loader';

const statusClass = {
  Pending: 'bg-warning text-dark',
  Confirmed: 'bg-success',
  Cancelled: 'bg-danger',
  Completed: 'bg-primary',
};

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/bookings');
      setBookings(data.bookings || []);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cancelBooking = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.put(`/bookings/${id}`, { bookingStatus: 'Cancelled' });
      toast.success('Booking cancelled');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed');
    }
  };

  if (loading) return <Loader full />;

  return (
    <div className="container py-5">
      <h1 className="h2 fw-bold mb-4">My Bookings</h1>
      {bookings.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-calendar-x fs-1 text-muted d-block mb-3" />
          <p className="text-muted">You have no bookings yet.</p>
          <Link to="/cameras" className="btn btn-warning">Browse Cameras</Link>
        </div>
      ) : (
        <div className="row g-3">
          {bookings.map((b) => (
            <div className="col-12" key={b._id}>
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="row align-items-center g-3">
                    <div className="col-md-2">
                      <img
                        src={getImageUrl(b.camera?.images?.[0])}
                        alt=""
                        className="rounded w-100"
                        style={{ height: 90, objectFit: 'cover' }}
                      />
                    </div>
                    <div className="col-md-4">
                      <h6 className="mb-1">{b.camera?.name || 'Camera'}</h6>
                      <small className="text-muted">ID: {b._id.slice(-8).toUpperCase()}</small>
                    </div>
                    <div className="col-md-3">
                      <small className="text-muted d-block">
                        {formatDate(b.startDate)} → {formatDate(b.endDate)}
                      </small>
                      <small>{b.totalDays} days · {formatCurrency(b.totalAmount)}</small>
                    </div>
                    <div className="col-md-2">
                      <span className={`badge ${statusClass[b.bookingStatus] || 'bg-secondary'}`}>
                        {b.bookingStatus}
                      </span>
                      <div className="small text-muted mt-1">Pay: {b.paymentStatus}</div>
                    </div>
                    <div className="col-md-1 text-end">
                      {['Pending', 'Confirmed'].includes(b.bookingStatus) && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => cancelBooking(b._id)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
