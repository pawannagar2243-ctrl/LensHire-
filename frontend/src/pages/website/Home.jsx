import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import CameraCard from '../../components/cards/CameraCard';
import Loader from '../../components/common/Loader';

const Home = () => {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [popular, setPopular] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [featRes, popRes, catRes] = await Promise.all([
          api.get('/cameras', { params: { featured: true, limit: 4 } }),
          api.get('/cameras', { params: { sort: 'popular', limit: 4 } }),
          api.get('/categories'),
        ]);
        setFeatured(featRes.data.cameras || []);
        setPopular(popRes.data.cameras || []);
        setCategories((catRes.data.categories || []).slice(0, 6));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(search)}`);
  };

  const steps = [
    { icon: 'bi-search', title: 'Browse', text: 'Explore cameras by category, brand, and price.' },
    { icon: 'bi-calendar-range', title: 'Select Dates', text: 'Pick your rental period and see the total cost.' },
    { icon: 'bi-bag-check', title: 'Book', text: 'Confirm your booking online in minutes.' },
    { icon: 'bi-camera-reels', title: 'Shoot', text: 'Pick up your gear and create something great.' },
  ];

  const reasons = [
    { icon: 'bi-shield-check', title: 'Verified Gear', text: 'Every camera is checked and maintained.' },
    { icon: 'bi-cash-coin', title: 'Transparent Pricing', text: 'Clear daily rates with no hidden fees.' },
    { icon: 'bi-headset', title: 'Support', text: 'Help whenever you need it during your rental.' },
    { icon: 'bi-lightning-charge', title: 'Fast Booking', text: 'Reserve equipment in a few clicks.' },
  ];

  const reviews = [
    { name: 'Aisha K.', text: 'Rented a Sony A7 for a wedding shoot — gear was perfect.', rating: 5 },
    { name: 'Rahul M.', text: 'Smooth booking process and fair prices for cinema cameras.', rating: 5 },
    { name: 'Priya S.', text: 'Loved the GoPro package for our trek. Will book again.', rating: 4 },
  ];

  return (
    <>
      {/* Hero */}
      <section
        className="hero-section text-white d-flex align-items-center"
        style={{
          minHeight: '78vh',
          background:
            'linear-gradient(120deg, rgba(15,23,42,.85), rgba(30,41,59,.7)), url(https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1600) center/cover',
        }}
      >
        <div className="container py-5">
          <div className="row">
            <div className="col-lg-7">
              <p className="text-warning fw-semibold mb-2 text-uppercase small letter-spacing">
                Camera Rental Made Simple
              </p>
              <h1 className="display-4 fw-bold mb-3">
                Lens<span className="text-warning">Hire</span>
              </h1>
              <p className="lead text-white-50 mb-4">
                Rent professional cameras, lenses, and cinema gear for your next shoot.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <Link to="/cameras" className="btn btn-warning btn-lg px-4">
                  Browse Cameras
                </Link>
                <Link to="/categories" className="btn btn-outline-light btn-lg px-4">
                  View Categories
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="container" style={{ marginTop: '-2.5rem', position: 'relative', zIndex: 2 }}>
        <form onSubmit={handleSearch} className="card border-0 shadow p-3 p-md-4">
          <div className="row g-2 align-items-center">
            <div className="col-md-9">
              <div className="input-group input-group-lg">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search" />
                </span>
                <input
                  type="search"
                  className="form-control"
                  placeholder="Search cameras, brands, models..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <button type="submit" className="btn btn-dark btn-lg w-100">
                Search
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Categories */}
      <section className="container py-5">
        <div className="d-flex justify-content-between align-items-end mb-4">
          <div>
            <h2 className="h3 fw-bold mb-1">Camera Categories</h2>
            <p className="text-muted mb-0">Find the right gear for every shoot</p>
          </div>
          <Link to="/categories" className="btn btn-link text-decoration-none">
            See all <i className="bi bi-arrow-right" />
          </Link>
        </div>
        {loading ? (
          <Loader />
        ) : (
          <div className="row g-3">
            {categories.map((cat) => (
              <div className="col-6 col-md-4 col-lg-2" key={cat._id}>
                <Link
                  to={`/cameras?category=${cat._id}`}
                  className="card border-0 shadow-sm text-center text-decoration-none h-100 category-tile"
                >
                  <div className="card-body py-4">
                    <i className="bi bi-camera-fill fs-2 text-warning d-block mb-2" />
                    <h6 className="mb-1 text-dark">{cat.name}</h6>
                    <small className="text-muted">{cat.cameraCount || 0} items</small>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured */}
      <section className="bg-light py-5">
        <div className="container">
          <h2 className="h3 fw-bold mb-1">Featured Cameras</h2>
          <p className="text-muted mb-4">Hand-picked gear ready to rent</p>
          {loading ? (
            <Loader />
          ) : (
            <div className="row g-4">
              {featured.map((cam) => (
                <div className="col-md-6 col-lg-3" key={cam._id}>
                  <CameraCard camera={cam} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular */}
      <section className="container py-5">
        <h2 className="h3 fw-bold mb-1">Popular Cameras</h2>
        <p className="text-muted mb-4">Most booked by our community</p>
        {loading ? (
          <Loader />
        ) : (
          <div className="row g-4">
            {popular.map((cam) => (
              <div className="col-md-6 col-lg-3" key={cam._id}>
                <CameraCard camera={cam} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="bg-dark text-white py-5">
        <div className="container">
          <h2 className="h3 fw-bold text-center mb-2">How Booking Works</h2>
          <p className="text-center text-secondary mb-5">Four simple steps to your next shoot</p>
          <div className="row g-4">
            {steps.map((s, i) => (
              <div className="col-md-6 col-lg-3" key={s.title}>
                <div className="text-center px-2">
                  <div className="rounded-circle bg-warning text-dark d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 56, height: 56 }}>
                    <span className="fw-bold">{i + 1}</span>
                  </div>
                  <h5>{s.title}</h5>
                  <p className="text-secondary small mb-0">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="container py-5">
        <h2 className="h3 fw-bold text-center mb-2">Why Choose Us</h2>
        <p className="text-center text-muted mb-5">Built for creators who need reliable gear</p>
        <div className="row g-4">
          {reasons.map((r) => (
            <div className="col-md-6 col-lg-3" key={r.title}>
              <div className="text-center p-3">
                <i className={`bi ${r.icon} fs-1 text-warning mb-3 d-block`} />
                <h5>{r.title}</h5>
                <p className="text-muted small mb-0">{r.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-light py-5">
        <div className="container">
          <h2 className="h3 fw-bold text-center mb-2">Customer Reviews</h2>
          <p className="text-center text-muted mb-5">What renters say about LensHire</p>
          <div className="row g-4">
            {reviews.map((r) => (
              <div className="col-md-4" key={r.name}>
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="text-warning mb-2">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <i className="bi bi-star-fill" key={i} />
                      ))}
                    </div>
                    <p className="mb-3">"{r.text}"</p>
                    <strong>{r.name}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-5 text-center text-white" style={{ background: 'linear-gradient(90deg, #0f172a, #1e3a5f)' }}>
        <div className="container py-3">
          <h2 className="fw-bold mb-3">Ready to book your next camera?</h2>
          <p className="text-white-50 mb-4">Browse our inventory and reserve gear in minutes.</p>
          <Link to="/cameras" className="btn btn-warning btn-lg px-5">
            Start Booking
          </Link>
        </div>
      </section>
    </>
  );
};

export default Home;
