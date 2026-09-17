import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { adminPath } from '../../services/adminApi';
import CameraTable from '../../components/common/admin/CameraTable';
import Loader from '../../components/common/admin/Loader';

export default function Cameras() {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchCameras = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/cameras', {
        params: { search: query || undefined, page, limit: 20, sort: 'newest' },
      });
      setCameras(data.cameras || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load cameras');
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  const handleDelete = async (cam) => {
    if (!window.confirm(`Delete "${cam.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/cameras/${cam._id}`);
      fetchCameras();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setQuery(search.trim());
  };

  return (
    <div>
      <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between mb-3">
        <form className="d-flex gap-2 flex-grow-1" style={{ maxWidth: 420 }} onSubmit={handleSearch}>
          <input
            type="search"
            className="form-control"
            placeholder="Search cameras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-outline-secondary">
            <i className="bi bi-search" />
          </button>
        </form>
        <Link to={adminPath('/cameras/new')} className="btn btn-primary">
          <i className="bi bi-plus-lg me-1" />
          Add Camera
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger py-2">
          <i className="bi bi-exclamation-circle me-1" />
          {error}
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? <Loader /> : <CameraTable cameras={cameras} onDelete={handleDelete} />}
        </div>
        {!loading && pages > 1 && (
          <div className="card-footer bg-white d-flex justify-content-between align-items-center">
            <small className="text-muted">
              {total} camera{total !== 1 ? 's' : ''}
            </small>
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
