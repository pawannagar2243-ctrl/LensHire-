const CameraFilter = ({
  filters,
  onChange,
  categories = [],
  brands = [],
  onReset,
}) => {
  const set = (key, value) => onChange({ ...filters, [key]: value, page: 1 });

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body">
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label className="form-label small fw-semibold">Search</label>
            <input
              type="text"
              className="form-control"
              placeholder="Name, brand, model..."
              value={filters.search || ''}
              onChange={(e) => set('search', e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-semibold">Category</label>
            <select
              className="form-select"
              value={filters.category || ''}
              onChange={(e) => set('category', e.target.value)}
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-semibold">Brand</label>
            <select
              className="form-select"
              value={filters.brand || ''}
              onChange={(e) => set('brand', e.target.value)}
            >
              <option value="">All</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-semibold">Availability</label>
            <select
              className="form-select"
              value={filters.availability || ''}
              onChange={(e) => set('availability', e.target.value)}
            >
              <option value="">All</option>
              <option value="true">Available</option>
              <option value="false">Unavailable</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-semibold">Sort</label>
            <select
              className="form-select"
              value={filters.sort || 'newest'}
              onChange={(e) => set('sort', e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="popular">Popular</option>
              <option value="name">Name</option>
            </select>
          </div>
          <div className="col-md-1">
            <button type="button" className="btn btn-outline-secondary w-100" onClick={onReset}>
              Reset
            </button>
          </div>
          <div className="col-md-3">
            <label className="form-label small fw-semibold">Min Price</label>
            <input
              type="number"
              className="form-control"
              min="0"
              value={filters.minPrice || ''}
              onChange={(e) => set('minPrice', e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label small fw-semibold">Max Price</label>
            <input
              type="number"
              className="form-control"
              min="0"
              value={filters.maxPrice || ''}
              onChange={(e) => set('maxPrice', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraFilter;
