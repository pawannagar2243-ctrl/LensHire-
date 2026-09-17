import { NavLink, useLocation } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: 'bi-speedometer2', end: true },
  { to: '/cameras', label: 'Cameras', icon: 'bi-camera' },
  { to: '/categories', label: 'Categories', icon: 'bi-tags' },
  { to: '/bookings', label: 'Bookings', icon: 'bi-calendar-check' },
  { to: '/users', label: 'Users', icon: 'bi-people' },
  { to: '/messages', label: 'Messages', icon: 'bi-envelope-paper' },
];

export default function AdminSidebar({ open, onClose }) {
  const { pathname } = useLocation();
  const basePath = pathname.startsWith('/admin') ? '/admin' : '';

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />}
      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-camera-reels fs-4 text-info" />
            <div>
              <div className="fw-semibold">Camera Booking</div>
              <small className="text-secondary">Admin Panel</small>
            </div>
          </div>
        </div>

        <nav className="nav flex-column py-3 flex-grow-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={`${basePath}${link.to === '/' ? '' : link.to}` || '/'}
              end={link.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <i className={`bi ${link.icon}`} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-3 mt-auto">
          <button
            type="button"
            className="btn btn-warning btn-sm w-100"
            onClick={() => {
              window.open('/', '_blank', 'noopener,noreferrer');
              onClose?.();
            }}
          >
            <i className="bi bi-globe2 me-2" />
            View Website
          </button>
        </div>

        <div className="px-3 pb-3 small text-secondary">
          <i className="bi bi-shield-lock me-1" />
          Admin access only
        </div>
      </aside>
    </>
  );
}
