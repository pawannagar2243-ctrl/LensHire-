import { Link } from 'react-router-dom';
import { getImageUrl, formatCurrency } from '../../services/api';

const CameraCard = ({ camera }) => {
  const image = camera.images?.[0];
  const categoryName = camera.category?.name || 'Camera';

  return (
    <div className="card h-100 camera-card border-0 shadow-sm">
      <div className="position-relative overflow-hidden" style={{ height: 200 }}>
        <img
          src={getImageUrl(image)}
          className="card-img-top h-100 w-100 object-fit-cover"
          alt={camera.name}
        />
        <span
          className={`badge position-absolute top-0 end-0 m-2 ${
            camera.availability ? 'bg-success' : 'bg-secondary'
          }`}
        >
          {camera.availability ? 'Available' : 'Unavailable'}
        </span>
      </div>
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-1">
          <h6 className="card-title mb-0">{camera.name}</h6>
          <span className="text-warning small">
            <i className="bi bi-star-fill" /> {camera.rating?.toFixed(1) || '0.0'}
          </span>
        </div>
        <p className="text-muted small mb-2">
          {camera.brand} · {categoryName}
        </p>
        <p className="fw-bold text-primary mb-3">
          {formatCurrency(camera.pricePerDay)}
          <span className="fw-normal text-muted small"> / day</span>
        </p>
        <div className="mt-auto d-flex gap-2">
          <Link to={`/cameras/${camera._id}`} className="btn btn-outline-dark btn-sm flex-fill">
            View Details
          </Link>
          <Link
            to={`/booking/${camera._id}`}
            className={`btn btn-warning btn-sm flex-fill ${!camera.availability ? 'disabled' : ''}`}
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CameraCard;
