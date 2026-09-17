import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from '../components/common/admin/AdminSidebar';
import AdminNavbar from '../components/common/admin/AdminNavbar';

const titles = {
  '/': 'Dashboard',
  '/cameras': 'Cameras',
  '/cameras/new': 'Add Camera',
  '/categories': 'Categories',
  '/users': 'Users',
  '/bookings': 'Bookings',
  '/messages': 'Messages',
};

function resolveTitle(pathname) {
  const adminPath = pathname.startsWith('/admin') ? pathname.slice('/admin'.length) || '/' : pathname;

  if (titles[adminPath]) return titles[adminPath];
  if (adminPath.startsWith('/cameras/') && adminPath.endsWith('/edit')) return 'Edit Camera';
  if (adminPath.startsWith('/users/')) return 'User Details';
  if (adminPath.startsWith('/bookings/')) return 'Booking Details';
  return 'Admin';
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="admin-shell">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="admin-main">
        <AdminNavbar
          title={resolveTitle(location.pathname)}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
