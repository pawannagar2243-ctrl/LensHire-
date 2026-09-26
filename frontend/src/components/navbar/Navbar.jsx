import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const renderMainLinks = () => (
    <>
      <li className="nav-item">
        <NavLink className="nav-link" to="/" onClick={closeMobileMenu}>Home</NavLink>
      </li>
      <li className="nav-item">
        <NavLink className="nav-link" to="/cameras" onClick={closeMobileMenu}>Cameras</NavLink>
      </li>
      <li className="nav-item">
        <NavLink className="nav-link" to="/categories" onClick={closeMobileMenu}>Categories</NavLink>
      </li>
      <li className="nav-item">
        <NavLink className="nav-link" to="/search" onClick={closeMobileMenu}>Search</NavLink>
      </li>
      <li className="nav-item">
        <NavLink className="nav-link" to="/about" onClick={closeMobileMenu}>About</NavLink>
      </li>
      <li className="nav-item">
        <NavLink className="nav-link" to="/contact" onClick={closeMobileMenu}>Contact</NavLink>
      </li>
    </>
  );

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm">
        <div className="container">
          <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
            <i className="bi bi-camera2 fs-4 text-warning" />
            <span>
              Lens<span className="text-warning">Hire</span>
            </span>
          </Link>

          <button
            className="navbar-toggler d-lg-none"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse d-none d-lg-flex" id="mainNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {renderMainLinks(false)}
            </ul>
            <ul className="navbar-nav align-items-lg-center gap-lg-2">
              {isAuthenticated ? (
                <>
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/my-bookings">
                      <i className="bi bi-calendar-check me-1" />
                      My Bookings
                    </NavLink>
                  </li>
                  <li className="nav-item dropdown">
                    <a
                      className="nav-link dropdown-toggle"
                      href="#"
                      role="button"
                      data-bs-toggle="dropdown"
                    >
                      <i className="bi bi-person-circle me-1" />
                      {user?.name}
                    </a>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li>
                        <Link className="dropdown-item" to="/profile">Profile</Link>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <button className="dropdown-item text-danger" onClick={handleLogout}>
                          Logout
                        </button>
                      </li>
                    </ul>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/login">Login</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="btn btn-warning btn-sm px-3" to="/register">
                      Register
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <div
        className={`mobile-nav-backdrop ${mobileMenuOpen ? 'show' : ''}`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      <aside className={`mobile-nav-panel ${mobileMenuOpen ? 'open' : ''}`} aria-label="Mobile menu">
        <div className="mobile-nav-header">
          <span>Menu</span>
          <button
            type="button"
            className="mobile-nav-close"
            aria-label="Close menu"
            onClick={closeMobileMenu}
          >
            ×
          </button>
        </div>

        <div className="mobile-nav-actions">
          {isAuthenticated ? (
            <>
              <Link className="mobile-nav-action" to="/profile" onClick={closeMobileMenu}>
                <i className="bi bi-person-circle" />
                Profile
              </Link>
              <Link className="mobile-nav-action" to="/my-bookings" onClick={closeMobileMenu}>
                <i className="bi bi-calendar-check" />
                My Bookings
              </Link>
              <button type="button" className="mobile-nav-action mobile-nav-action-danger" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="mobile-nav-action" to="/login" onClick={closeMobileMenu}>
                <i className="bi bi-box-arrow-in-right" />
                Login
              </Link>
              <Link className="mobile-nav-action" to="/register" onClick={closeMobileMenu}>
                <i className="bi bi-person-plus" />
                Register
              </Link>
            </>
          )}
        </div>

        <ul className="mobile-nav-list">
          {renderMainLinks()}
        </ul>
      </aside>
    </>
  );
};

export default Navbar;
