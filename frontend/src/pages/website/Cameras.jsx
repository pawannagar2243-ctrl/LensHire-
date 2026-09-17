import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import CameraCard from '../../components/cards/CameraCard';
import CameraFilter from '../../components/common/CameraFilter';
import Pagination from '../../components/common/Pagination';
import Loader from '../../components/common/Loader';

const defaultFilters = {
  search: '',
  category: '',
  brand: '',
  availability: '',
  sort: 'newest',
  minPrice: '',
  maxPrice: '',
  page: 1,
};

const CameraListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    ...defaultFilters,
    category: searchParams.get('category') || '',
    search: searchParams.get('q') || searchParams.get('search') || '',
  });
  const [cameras, setCameras] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = { ...filters, limit: 12 };
        Object.keys(params).forEach((k) => {
          if (params[k] === '' || params[k] == null) delete params[k];
        });
        const { data } = await api.get('/cameras', { params });
        setCameras(data.cameras || []);
        setPages(data.pages || 1);
        setTotal(data.total || 0);
        setBrands(data.brands || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters]);

  const onFilterChange = (next) => {
    setFilters(next);
    const sp = new URLSearchParams();
    if (next.category) sp.set('category', next.category);
    if (next.search) sp.set('q', next.search);
    setSearchParams(sp);
  };

  return (
    <div className="container py-5">
      <div className="mb-4">
        <h1 className="h2 fw-bold">Camera Listing</h1>
        <p className="text-muted mb-0">{total} cameras found</p>
      </div>

      <CameraFilter
        filters={filters}
        onChange={onFilterChange}
        categories={categories}
        brands={brands}
        onReset={() => {
          setFilters(defaultFilters);
          setSearchParams({});
        }}
      />

      {loading ? (
        <Loader full />
      ) : cameras.length === 0 ? (
        <div className="alert alert-light border text-center py-5">
          <i className="bi bi-camera fs-1 text-muted d-block mb-2" />
          No cameras match your filters.
        </div>
      ) : (
        <>
          <div className="row g-4">
            {cameras.map((cam) => (
              <div className="col-md-6 col-lg-4 col-xl-3" key={cam._id}>
                <CameraCard camera={cam} />
              </div>
            ))}
          </div>
          <Pagination
            page={filters.page}
            pages={pages}
            onChange={(page) => setFilters((f) => ({ ...f, page }))}
          />
        </>
      )}
    </div>
  );
};

export default CameraListing;
