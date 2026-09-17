import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AdminAuthContext';
import Loader from './Loader';

export default function ProtectedRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <Loader text="Checking session..." />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <Navigate
        to={location.pathname.startsWith('/admin') ? '/admin/login' : '/login'}
        replace
        state={{ from: location }}
      />
    );
  }

  return children;
}
