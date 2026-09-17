import { useAuth } from '../../../context/AdminAuthContext';

export default function AdminNavbar({ onToggleSidebar, title }) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-bottom sticky-top">
      <div className="d-flex align-items-center justify-content-between px-3 px-md-4 py-3">
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary d-lg-none"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <i className="bi bi-list" />
          </button>
          <h1 className="h5 mb-0 fw-semibold">{title || 'Dashboard'}</h1>
        </div>

        <div className="d-flex align-items-center gap-2 gap-md-3">
          <div className="text-end d-none d-sm-block">
            <div className="small fw-semibold">{user?.name}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
              {user?.email}
            </div>
          </div>
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={logout}>
            <i className="bi bi-box-arrow-right me-1" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
