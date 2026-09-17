import { Link } from 'react-router-dom';
import { formatCurrency, getImageUrl } from '../../services/api';

export default function CameraTable({ cameras, onDelete }) {
  if (!cameras?.length) {
    return (
      <div className="text-center text-muted py-5">
        <i className="bi bi-camera fs-1 d-block mb-2" />
        No cameras found
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th>Camera</th>
            <th>Category</th>
            <th>Price/Day</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Featured</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {cameras.map((cam) => (
            <tr key={cam._id}>
              <td>
                <div className="d-flex align-items-center gap-2">
                  {cam.images?.[0] ? (
                    <img
                      src={getImageUrl(cam.images[0])}
                      alt={cam.name}
                      className="rounded"
                      style={{ width: 48, height: 48, objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      className="bg-light rounded d-flex align-items-center justify-content-center text-muted"
                      style={{ width: 48, height: 48 }}
                    >
                      <i className="bi bi-camera" />
                    </div>
                  )}
                  <div>
                    <div className="fw-semibold">{cam.name}</div>
                    <small className="text-muted">
                      {cam.brand} · {cam.model}
                    </small>
                  </div>
                </div>
              </td>
              <td>{cam.category?.name || '—'}</td>
              <td>{formatCurrency(cam.pricePerDay)}</td>
              <td>{cam.stock}</td>
              <td>
                <span className={`badge ${cam.availability ? 'text-bg-success' : 'text-bg-secondary'}`}>
                  {cam.availability ? 'Available' : 'Unavailable'}
                </span>
              </td>
              <td>
                {cam.featured ? (
                  <i className="bi bi-star-fill text-warning" />
                ) : (
                  <i className="bi bi-star text-muted" />
                )}
              </td>
              <td className="text-end">
                <Link to={`/cameras/${cam._id}/edit`} className="btn btn-sm btn-outline-primary me-1">
                  <i className="bi bi-pencil" />
                </Link>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onDelete(cam)}
                >
                  <i className="bi bi-trash" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
