import { Navigate, Route, Routes } from 'react-router-dom';
import WebsiteLayout from '../layouts/WebsiteLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import AdminRoutes from './AdminRoutes';
import { AuthProvider as AdminAuthProvider } from '../context/AdminAuthContext';
import Home from '../pages/website/Home';
import Cameras from '../pages/website/Cameras';
import CameraDetails from '../pages/website/CameraDetails';
import SearchCameras from '../pages/website/SearchCameras';
import CameraCategories from '../pages/website/CameraCategories';
import Booking from '../pages/website/Booking';
import MyBookings from '../pages/website/MyBookings';
import Login from '../pages/website/Login';
import Register from '../pages/website/Register';
import UserProfile from '../pages/website/UserProfile';
import Contact from '../pages/website/Contact';
import About from '../pages/website/About';

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="admin/*"
        element={
          <AdminAuthProvider>
            <AdminRoutes embedded />
          </AdminAuthProvider>
        }
      />
      <Route element={<WebsiteLayout />}>
        <Route index element={<Home />} />
        <Route path="cameras" element={<Cameras />} />
        <Route path="cameras/:id" element={<CameraDetails />} />
        <Route path="search" element={<SearchCameras />} />
        <Route path="categories" element={<CameraCategories />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route
          path="booking/:cameraId"
          element={
            <ProtectedRoute>
              <Booking />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}