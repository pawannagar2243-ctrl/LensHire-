import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api, { getImageUrl, formatCurrency } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';

const CameraDetails = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [camera, setCamera] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [camRes, revRes] = await Promise.all([
        api.get(`/cameras/${id}`),
        api.get(`/reviews/${id}`),
      ]);
      setCamera(camRes.data.camera);
      setReviews(revRes.data.reviews || []);
      setActiveImg(0);
    } catch {
      toast.error('Camera not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info('Please login to leave a review');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/reviews', { cameraId: id, rating, comment });
      toast.success('Review submitted');
      setComment('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader full />;
  if (!camera) {
    return (
      <div className="container py-5 text-center">
        <p>Camera not found.</p>
        <Link to="/cameras" className="btn btn-primary">Back to listing</Link>
      </div>
    );
  }

  const images = camera.images?.length ? camera.images : [null];
  const specs =
    camera.specifications instanceof Map
      ? Object.fromEntries(camera.specifications)
      : camera.specifications || {};

  return (
    <div className="container py-5">
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="rounded overflow-hidden shadow-sm bg-light mb-3" style={{ height: 400 }}>
            <img
              src={getImageUrl(images[activeImg])}
              alt={camera.name}
              className="w-100 h-100 object-fit-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="d-flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  className={`btn p-0 border ${i === activeImg ? 'border-warning border-2' : ''}`}
                  style={{ width: 72, height: 72 }}
                  onClick={() => setActiveImg(i)}
                >
                  <img src={getImageUrl(img)} alt="" className="w-100 h-100 object-fit-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="col-lg-6">
          <span className="badge bg-secondary mb-2">{camera.category?.name}</span>
          <h1 className="h2 fw-bold">{camera.name}</h1>
          <p className="text-muted">
            {camera.brand} · {camera.model}
          </p>
          <div className="d-flex align-items-center gap-3 mb-3">
            <span className="text-warning">
              <i className="bi bi-star-fill" /> {camera.rating?.toFixed(1) || '0.0'}
            </span>
            <span className="text-muted small">({camera.reviewCount || reviews.length} reviews)</span>
            <span className={`badge ${camera.availability ? 'bg-success' : 'bg-secondary'}`}>
              {camera.availability ? 'Available' : 'Unavailable'}
            </span>
          </div>
          <h3 className="text-primary fw-bold">
            {formatCurrency(camera.pricePerDay)}
            <span className="fs-6 fw-normal text-muted"> / day</span>
          </h3>
          <p className="mb-1">
            Security deposit: <strong>{formatCurrency(camera.securityDeposit)}</strong>
          </p>
          <p className="mt-3">{camera.description}</p>

          {Object.keys(specs).length > 0 && (
            <div className="mt-4">
              <h5>Specifications</h5>
              <table className="table table-sm">
                <tbody>
                  {Object.entries(specs).map(([k, v]) => (
                    <tr key={k}>
                      <th className="w-40 text-muted">{k}</th>
                      <td>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Link
            to={`/booking/${camera._id}`}
            className={`btn btn-warning btn-lg mt-3 px-4 ${!camera.availability ? 'disabled' : ''}`}
          >
            <i className="bi bi-calendar-check me-2" />
            Book This Camera
          </Link>
        </div>
      </div>

      <hr className="my-5" />

      <div className="row g-4">
        <div className="col-lg-7">
          <h4 className="mb-3">Reviews</h4>
          {reviews.length === 0 ? (
            <p className="text-muted">No reviews yet.</p>
          ) : (
            reviews.map((r) => (
              <div key={r._id} className="border-bottom py-3">
                <div className="d-flex justify-content-between">
                  <strong>{r.user?.name || 'User'}</strong>
                  <span className="text-warning small">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <i className="bi bi-star-fill" key={i} />
                    ))}
                  </span>
                </div>
                <p className="mb-0 mt-1 text-muted">{r.comment}</p>
              </div>
            ))
          )}
        </div>
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5>Write a Review</h5>
              <form onSubmit={submitReview}>
                <div className="mb-3">
                  <label className="form-label">Rating</label>
                  <select className="form-select" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>{n} Stars</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Comment</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-dark" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraDetails;
