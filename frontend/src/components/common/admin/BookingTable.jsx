import { Link } from 'react-router-dom';
import { adminPath, formatCurrency, formatDate } from '../../../services/adminApi';

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

export default function BookingTable({
  bookings,
  onConfirm,
  onCancel,
  onComplete,
  showActions = true,
}) {
  if (!bookings?.length) {
    return (
      <div className="text-center text-muted py-5">
        <i className="bi bi-calendar-x fs-1 d-block mb-2" />
        No bookings found
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th>Booking ID</th>
            <th>Customer</th>
            <th>Camera</th>
            <th>Start</th>
            <th>End</th>
            <th>Days</th>
            <th>Amount</th>
            <th>Payment</th>
            <th>Status</th>
            {showActions && <th className="text-end">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b._id}>
              <td>
                <code className="small">{String(b._id).slice(-8)}</code>
              </td>
              <td>
                <div className="fw-semibold">{b.customerDetails?.name || b.user?.name || '—'}</div>
                <small className="text-muted">{b.customerDetails?.email || b.user?.email}</small>
              </td>
              <td>{b.camera?.name || '—'}</td>
              <td>{formatDate(b.startDate)}</td>
              <td>{formatDate(b.endDate)}</td>
              <td>{b.totalDays}</td>
              <td>{formatCurrency(b.totalAmount)}</td>
              <td>
                <span className={`badge ${paymentBadge[b.paymentStatus] || 'text-bg-secondary'}`}>
                  {b.paymentStatus}
                </span>
              </td>
              <td>
                <span className={`badge ${bookingBadge[b.bookingStatus] || 'text-bg-secondary'}`}>
                  {b.bookingStatus}
                </span>
              </td>
              {showActions && (
                <td className="text-end text-nowrap">
                  <Link to={adminPath(`/bookings/${b._id}`)} className="btn btn-sm btn-outline-secondary me-1" title="View">
                    <i className="bi bi-eye" />
                  </Link>
                  {b.bookingStatus === 'Pending' && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary me-1"
                      title="Confirm"
                      onClick={() => onConfirm?.(b)}
                    >
                      <i className="bi bi-check-lg" />
                    </button>
                  )}
                  {['Pending', 'Confirmed'].includes(b.bookingStatus) && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger me-1"
                      title="Cancel"
                      onClick={() => onCancel?.(b)}
                    >
                      <i className="bi bi-x-lg" />
                    </button>
                  )}
                  {b.bookingStatus === 'Confirmed' && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success"
                      title="Complete"
                      onClick={() => onComplete?.(b)}
                    >
                      <i className="bi bi-check2-all" />
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
