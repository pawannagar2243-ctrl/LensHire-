import { useCallback, useEffect, useState } from 'react';
import api from '../../services/adminApi';
import BookingTable from '../../components/common/admin/BookingTable';
import Loader from '../../components/common/admin/Loader';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/bookings', {
        params: {
          search: query || undefined,
          status: status || undefined,
          page,
          limit: 20,
        },
      });
      setBookings(data.bookings || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [query, status, page]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const updateStatus = async (booking, bookingStatus) => {
    const label = bookingStatus.toLowerCase();
    if (!window.confirm(`${bookingStatus === 'Cancelled' ? 'Cancel' : bookingStatus} this booking?`)) return;
    try {
      await api.put(`/bookings/${booking._id}`, { bookingStatus });
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${label}`);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setQuery(search.trim());
  };

  return (
    <div>
      <div className="d-flex flex-wrap gap-2 mb-3">
        <form className="d-flex gap-2 flex-grow-1" style={{ maxWidth: 420 }} onSubmit={handleSearch}>
          <input
            type="search"
            className="form-control"
            placeholder="Search customer, camera, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-outline-secondary">
            <i className="bi bi-search" />
          </button>
        </form>
        <select
          className="form-select"
          style={{ maxWidth: 180 }}
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {error && (
        <div className="alert alert-danger py-2">
          <i className="bi bi-exclamation-circle me-1" />
          {error}
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <Loader />
          ) : (
            <BookingTable
              bookings={bookings}
              onConfirm={(b) => updateStatus(b, 'Confirmed')}
              onCancel={(b) => updateStatus(b, 'Cancelled')}
              onComplete={(b) => updateStatus(b, 'Completed')}
            />
          )}
        </div>
        {!loading && pages > 1 && (
          <div className="card-footer bg-white d-flex justify-content-between align-items-center">
            <small className="text-muted">{total} bookings</small>
            <div className="btn-group">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </button>
              <button type="button" className="btn btn-sm btn-outline-secondary" disabled>
                {page} / {pages}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
