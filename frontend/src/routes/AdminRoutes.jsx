import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/common/admin/ProtectedRoute';
import AdminLayout from '../layouts/AdminLayout';
import Login from '../pages/admin/AdminLogin';
import Dashboard from '../pages/admin/Dashboard';
import Cameras from '../pages/admin/Cameras';
import AddCamera from '../pages/admin/AddCamera';
import EditCamera from '../pages/admin/EditCamera';
import Categories from '../pages/admin/Categories';
import Users from '../pages/admin/Customers';
import UserDetail from '../pages/admin/UserDetail';
import Bookings from '../pages/admin/Bookings';
import BookingDetail from '../pages/admin/BookingDetail';
import ContactMessages from '../pages/admin/ContactMessages';

export default function App({ embedded = false }) {
  const basePath = '';

  return (
    <Routes>
      <Route path={embedded ? 'login' : '/login'} element={<Login />} />
      <Route
        path={embedded ? '' : '/'}
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="cameras" element={<Cameras />} />
        <Route path="cameras/new" element={<AddCamera />} />
        <Route path="cameras/:id/edit" element={<EditCamera />} />
        <Route path="categories" element={<Categories />} />
        <Route path="users" element={<Users />} />
        <Route path="users/:id" element={<UserDetail />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="bookings/:id" element={<BookingDetail />} />
        <Route path="messages" element={<ContactMessages />} />
      </Route>
      <Route path="*" element={<Navigate to={embedded ? 'login' : '/'} replace />} />
    </Routes>
  );
}
