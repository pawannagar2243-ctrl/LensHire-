import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import CameraCard from '../../components/cards/CameraCard';
import Loader from '../../components/common/Loader';

const SearchCameras = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = async (term) => {
    if (!term.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await api.get('/cameras', { params: { search: term, limit: 24 } });
      setCameras(data.cameras || []);
    } catch {
      setCameras([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initial = searchParams.get('q');
    if (initial) {
      setQ(initial);
      runSearch(initial);
    }
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ q });
    runSearch(q);
  };

  return (
    <div className="container py-5">
      <h1 className="h2 fw-bold mb-4">Search Cameras</h1>
      <form onSubmit={onSubmit} className="row g-2 mb-4">
        <div className="col-md-9">
          <input
            type="search"
            className="form-control form-control-lg"
            placeholder="Search by name, brand, or model..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <button type="submit" className="btn btn-dark btn-lg w-100">
            <i className="bi bi-search me-2" />
            Search
          </button>
        </div>
      </form>

      {loading ? (
        <Loader full />
      ) : searched && cameras.length === 0 ? (
        <div className="alert alert-light border text-center py-5">No results for "{q}"</div>
      ) : (
        <div className="row g-4">
          {cameras.map((cam) => (
            <div className="col-md-6 col-lg-3" key={cam._id}>
              <CameraCard camera={cam} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchCameras;
