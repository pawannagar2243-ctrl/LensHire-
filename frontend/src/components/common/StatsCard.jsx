export default function StatsCard({ title, value, icon, color = 'primary', subtitle }) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body d-flex align-items-center gap-3">
        <div
          className={`rounded-3 d-flex align-items-center justify-content-center bg-${color} bg-opacity-10 text-${color}`}
          style={{ width: 52, height: 52, flexShrink: 0 }}
        >
          <i className={`bi ${icon} fs-4`} />
        </div>
        <div className="min-w-0">
          <div className="text-muted small text-truncate">{title}</div>
          <div className="fs-4 fw-semibold lh-1">{value}</div>
          {subtitle && <div className="text-muted small mt-1">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}
