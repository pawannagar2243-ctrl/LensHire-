import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { adminPath, getImageUrl } from '../../services/adminApi';
import Loader from '../../components/common/admin/Loader';

const emptySpec = { key: '', value: '' };

export default function CameraForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [existingImages, setExistingImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [specs, setSpecs] = useState([{ ...emptySpec }]);

  const [form, setForm] = useState({
    name: '',
    brand: '',
    model: '',
    category: '',
    description: '',
    pricePerDay: '',
    securityDeposit: '',
    availability: true,
    featured: false,
    stock: 1,
  });

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/cameras/${id}`);
        const cam = data.camera;
        if (cancelled || !cam) return;

        setForm({
          name: cam.name || '',
          brand: cam.brand || '',
          model: cam.model || '',
          category: cam.category?._id || cam.category || '',
          description: cam.description || '',
          pricePerDay: cam.pricePerDay ?? '',
          securityDeposit: cam.securityDeposit ?? '',
          availability: cam.availability !== false,
          featured: Boolean(cam.featured),
          stock: cam.stock ?? 1,
        });
        setExistingImages(cam.images || []);

        const specObj =
          cam.specifications instanceof Map
            ? Object.fromEntries(cam.specifications)
            : cam.specifications || {};
        const entries = Object.entries(specObj);
        setSpecs(entries.length ? entries.map(([key, value]) => ({ key, value })) : [{ ...emptySpec }]);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load camera');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const updateSpec = (index, field, value) => {
    setSpecs((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const addSpec = () => setSpecs((prev) => [...prev, { ...emptySpec }]);
  const removeSpec = (index) => setSpecs((prev) => prev.filter((_, i) => i !== index));

  useEffect(() => {
    return () => {
      imagePreviews.forEach((src) => URL.revokeObjectURL(src));
    };
  }, [imagePreviews]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const maxAllowed = 8;
    const totalImages = existingImages.length + files.length;

    if (files.length > maxAllowed || totalImages > maxAllowed) {
      setError(`You can upload up to ${maxAllowed} images per camera.`);
      e.target.value = '';
      return;
    }

    setError('');
    setImageFiles(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const specifications = {};
      specs.forEach(({ key, value }) => {
        if (key.trim()) specifications[key.trim()] = value;
      });

      if ((existingImages.length || 0) + imageFiles.length > 8) {
        setError('You can upload up to 8 images per camera.');
        setSaving(false);
        return;
      }

      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('brand', form.brand.trim());
      fd.append('model', form.model.trim());
      fd.append('category', form.category);
      fd.append('description', form.description);
      fd.append('pricePerDay', String(form.pricePerDay));
      fd.append('securityDeposit', String(form.securityDeposit || 0));
      fd.append('availability', String(form.availability));
      fd.append('featured', String(form.featured));
      fd.append('stock', String(form.stock || 1));
      fd.append('specifications', JSON.stringify(specifications));

      imageFiles.forEach((file) => fd.append('images', file));

      if (isEdit) {
        await api.put(`/cameras/${id}`, fd);
      } else {
        await api.post('/cameras', fd);
      }
      navigate(adminPath('/cameras'));
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader text="Loading camera..." />;

  return (
    <div>
      <div className="mb-3">
        <Link to={adminPath('/cameras')} className="text-decoration-none small">
          <i className="bi bi-arrow-left me-1" />
          Back to cameras
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger py-2">
          <i className="bi bi-exclamation-circle me-1" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Name *</label>
              <input
                className="form-control"
                required
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Brand *</label>
              <input
                className="form-control"
                required
                value={form.brand}
                onChange={(e) => updateField('brand', e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Model *</label>
              <input
                className="form-control"
                required
                value={form.model}
                onChange={(e) => updateField('model', e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Category *</label>
              <select
                className="form-select"
                required
                value={form.category}
                onChange={(e) => updateField('category', e.target.value)}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Price / Day *</label>
              <input
                type="number"
                min="0"
                step="1"
                className="form-control"
                required
                value={form.pricePerDay}
                onChange={(e) => updateField('pricePerDay', e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Security Deposit</label>
              <input
                type="number"
                min="0"
                step="1"
                className="form-control"
                value={form.securityDeposit}
                onChange={(e) => updateField('securityDeposit', e.target.value)}
              />
            </div>
            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows={3}
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Stock</label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={form.stock}
                onChange={(e) => updateField('stock', e.target.value)}
              />
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="availability"
                  checked={form.availability}
                  onChange={(e) => updateField('availability', e.target.checked)}
                />
                <label className="form-check-label" htmlFor="availability">
                  Available
                </label>
              </div>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="featured"
                  checked={form.featured}
                  onChange={(e) => updateField('featured', e.target.checked)}
                />
                <label className="form-check-label" htmlFor="featured">
                  Featured
                </label>
              </div>
            </div>

            <div className="col-12">
              <label className="form-label">Images</label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
              />
              {(existingImages.length > 0 || imagePreviews.length > 0) && (
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {existingImages.map((img) => (
                    <img
                      key={img}
                      src={getImageUrl(img)}
                      alt=""
                      className="rounded border"
                      style={{ width: 72, height: 72, objectFit: 'cover' }}
                    />
                  ))}
                  {imagePreviews.map((src) => (
                    <img
                      key={src}
                      src={src}
                      alt=""
                      className="rounded border"
                      style={{ width: 72, height: 72, objectFit: 'cover' }}
                    />
                  ))}
                </div>
              )}
              {imageFiles.length > 0 && (
                <small className="text-muted d-block mt-1">
                  {imageFiles.length} new file(s) selected
                </small>
              )}
            </div>

            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label mb-0">Specifications</label>
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={addSpec}>
                  <i className="bi bi-plus me-1" />
                  Add
                </button>
              </div>
              {specs.map((spec, index) => (
                <div className="row g-2 mb-2" key={index}>
                  <div className="col-md-5">
                    <input
                      className="form-control"
                      placeholder="Key (e.g. Sensor)"
                      value={spec.key}
                      onChange={(e) => updateSpec(index, 'key', e.target.value)}
                    />
                  </div>
                  <div className="col-md-5">
                    <input
                      className="form-control"
                      placeholder="Value"
                      value={spec.value}
                      onChange={(e) => updateSpec(index, 'value', e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <button
                      type="button"
                      className="btn btn-outline-danger w-100"
                      disabled={specs.length === 1}
                      onClick={() => removeSpec(index)}
                    >
                      <i className="bi bi-trash" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card-footer bg-white d-flex gap-2 justify-content-end">
          <Link to={adminPath('/cameras')} className="btn btn-outline-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-1" />
                {isEdit ? 'Update Camera' : 'Create Camera'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
