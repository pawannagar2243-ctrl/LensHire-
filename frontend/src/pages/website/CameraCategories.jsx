import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getImageUrl } from '../../services/api';
import Loader from '../../components/common/Loader';

const CameraCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/categories')
      .then((res) => setCategories(res.data.categories || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader full />;

  return (
    <div className="container py-5">
      <h1 className="h2 fw-bold mb-2">Camera Categories</h1>
      <p className="text-muted mb-4">Browse gear by type</p>
      <div className="row g-4">
        {categories.map((cat) => (
          <div className="col-md-6 col-lg-4" key={cat._id}>
            <Link to={`/cameras?category=${cat._id}`} className="card border-0 shadow-sm h-100 text-decoration-none text-dark category-card">
              <div
                className="bg-dark"
                style={{
                  height: 160,
                  background: cat.image
                    ? `url(${getImageUrl(cat.image)}) center/cover`
                    : 'linear-gradient(135deg,#1e293b,#334155)',
                }}
              />
              <div className="card-body">
                <h5 className="card-title">{cat.name}</h5>
                <p className="text-muted small mb-2">{cat.description || 'Explore this category'}</p>
                <span className="badge bg-warning text-dark">{cat.cameraCount || 0} cameras</span>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CameraCategories;
