import { useCallback, useEffect, useState } from 'react';
import api, { getImageUrl } from '../../services/adminApi';
import Loader from '../../components/common/admin/Loader';

const emptyForm = { name: '', description: '', imageFile: null };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/categories');
      setCategories(data.categories || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
  };

  const startEdit = (cat) => {
    setEditId(cat._id);
    setForm({ name: cat.name, description: cat.description || '', imageFile: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('description', form.description);
      if (form.imageFile) fd.append('image', form.imageFile);

      if (editId) {
        await api.put(`/categories/${editId}`, fd);
      } else {
        await api.post('/categories', fd);
      }
      resetForm();
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await api.delete(`/categories/${cat._id}`);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="row g-3">
      <div className="col-lg-4">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white">
            <h2 className="h6 mb-0">{editId ? 'Edit Category' : 'Add Category'}</h2>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="card-body">
              {error && <div className="alert alert-danger py-2 small">{error}</div>}
              <div className="mb-3">
                <label className="form-label">Name *</label>
                <input
                  className="form-control"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="mb-0">
                <label className="form-label">Image</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={(e) => setForm((f) => ({ ...f, imageFile: e.target.files?.[0] || null }))}
                />
              </div>
            </div>
            <div className="card-footer bg-white d-flex gap-2">
              {editId && (
                <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                  Cancel
                </button>
              )}
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="col-lg-8">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            {loading ? (
              <Loader />
            ) : categories.length === 0 ? (
              <div className="text-center text-muted py-5">No categories yet</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Cameras</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => (
                      <tr key={cat._id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {cat.image ? (
                              <img
                                src={getImageUrl(cat.image)}
                                alt=""
                                className="rounded"
                                style={{ width: 40, height: 40, objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                className="bg-light rounded d-flex align-items-center justify-content-center text-muted"
                                style={{ width: 40, height: 40 }}
                              >
                                <i className="bi bi-tag" />
                              </div>
                            )}
                            <span className="fw-semibold">{cat.name}</span>
                          </div>
                        </td>
                        <td className="text-muted small">{cat.description || '—'}</td>
                        <td>{cat.cameraCount ?? 0}</td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => startEdit(cat)}
                          >
                            <i className="bi bi-pencil" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(cat)}
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
