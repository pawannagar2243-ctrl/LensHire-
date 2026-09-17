import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api, { formatCurrency } from '../../services/adminApi';
import StatsCard from '../../components/common/admin/StatsCard';
import Loader from '../../components/common/admin/Loader';

const PIE_COLORS = ['#f0ad4e', '#0d6efd', '#dc3545', '#198754'];

function formatMonthLabel(key) {
  if (!key) return '';
  const [y, m] = key.split('-');
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/dashboard/stats');
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Loader text="Loading dashboard..." />;
  if (error) {
    return (
      <div className="alert alert-danger">
        <i className="bi bi-exclamation-circle me-2" />
        {error}
      </div>
    );
  }

  const stats = data?.stats || {};
  const charts = data?.charts || {};
  const monthly = (charts.monthlyBookings || []).map((m) => ({
    ...m,
    label: formatMonthLabel(m.month),
  }));
  const popular = (charts.popularCameras || []).map((c) => ({
    name: c.name || 'Unknown',
    count: c.count,
  }));
  const statusData = (charts.bookingStatus || []).filter((s) => s.count > 0);

  return (
    <div>
      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3">
          <StatsCard title="Total Cameras" value={stats.totalCameras ?? 0} icon="bi-camera" color="primary" />
        </div>
        <div className="col-6 col-xl-3">
          <StatsCard title="Total Users" value={stats.totalUsers ?? 0} icon="bi-people" color="info" />
        </div>
        <div className="col-6 col-xl-3">
          <StatsCard title="Total Bookings" value={stats.totalBookings ?? 0} icon="bi-calendar-check" color="success" />
        </div>
        <div className="col-6 col-xl-3">
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon="bi-currency-rupee"
            color="warning"
          />
        </div>
        <div className="col-6 col-xl-4">
          <StatsCard title="Pending" value={stats.pendingBookings ?? 0} icon="bi-hourglass-split" color="warning" />
        </div>
        <div className="col-6 col-xl-4">
          <StatsCard title="Confirmed" value={stats.confirmedBookings ?? 0} icon="bi-check-circle" color="primary" />
        </div>
        <div className="col-6 col-xl-4">
          <StatsCard title="Cancelled" value={stats.cancelledBookings ?? 0} icon="bi-x-circle" color="danger" />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pt-3">
              <h2 className="h6 mb-0">Monthly Bookings</h2>
            </div>
            <div className="card-body" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#0d6efd" radius={[4, 4, 0, 0]} name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pt-3">
              <h2 className="h6 mb-0">Monthly Revenue</h2>
            </div>
            <div className="card-body" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#198754"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pt-3">
              <h2 className="h6 mb-0">Popular Cameras</h2>
            </div>
            <div className="card-body" style={{ height: 300 }}>
              {popular.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={popular} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6610f2" radius={[0, 4, 4, 0]} name="Bookings" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-muted text-center py-5">No booking data yet</div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pt-3">
              <h2 className="h6 mb-0">Booking Status</h2>
            </div>
            <div className="card-body" style={{ height: 300 }}>
              {statusData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ status, count }) => `${status}: ${count}`}
                    >
                      {statusData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-muted text-center py-5">No bookings yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
