import { useCallback, useEffect, useState } from 'react';
import api from '../../services/adminApi';
import UserTable from '../../components/common/admin/UserTable';
import Loader from '../../components/common/admin/Loader';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('adminUser') || 'null');
    } catch {
      return null;
    }
  })();
  const currentUserId = currentUser?._id || null;
  const currentUserRole = currentUser?.role || 'admin';
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/users', {
        params: { search: query || undefined, page, limit: 20 },
      });
      setUsers(data.users || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setQuery(search.trim());
  };

  const handleBlockToggle = async (user) => {
    const action = user.isBlocked ? 'unblock' : 'block';
    if (!window.confirm(`${action === 'block' ? 'Block' : 'Unblock'} ${user.name}?`)) return;
    try {
      await api.put(`/users/${user._id}`, { isBlocked: !user.isBlocked });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.name}" and their bookings?`)) return;
    try {
      await api.delete(`/users/${user._id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleRoleChange = async (user, nextRole) => {
    if (nextRole === user.role) return;

    const roleLabel = nextRole === 'super_admin' ? 'Super Admin' : nextRole === 'admin' ? 'Admin' : 'User';
    const confirmMessage = user._id === currentUserId
      ? 'You cannot change your own super admin role from this panel.'
      : `Change ${user.name} to ${roleLabel}?`;

    if (user._id === currentUserId) {
      alert(confirmMessage);
      return;
    }

    if (!window.confirm(confirmMessage)) return;

    try {
      await api.put(`/users/${user._id}`, { role: nextRole });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Role update failed');
    }
  };

  return (
    <div>
      <form className="d-flex gap-2 mb-3" style={{ maxWidth: 420 }} onSubmit={handleSearch}>
        <input
          type="search"
          className="form-control"
          placeholder="Search by name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn btn-outline-secondary">
          <i className="bi bi-search" />
        </button>
      </form>

      {error && (
        <div className="alert alert-danger py-2">
          <i className="bi bi-exclamation-circle me-1" />
          {error}
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <Loader />
          ) : (
            <UserTable
              users={users}
              onBlockToggle={handleBlockToggle}
              onDelete={handleDelete}
              onRoleChange={handleRoleChange}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
            />
          )}
        </div>
        {!loading && pages > 1 && (
          <div className="card-footer bg-white d-flex justify-content-between align-items-center">
            <small className="text-muted">{total} users</small>
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
