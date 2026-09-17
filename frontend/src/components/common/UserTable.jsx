import { Link } from 'react-router-dom';
import { formatDate } from '../../services/api';

export default function UserTable({ users, onBlockToggle, onDelete }) {
  if (!users?.length) {
    return (
      <div className="text-center text-muted py-5">
        <i className="bi bi-people fs-1 d-block mb-2" />
        No users found
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>
                <Link to={`/users/${u._id}`} className="fw-semibold text-decoration-none">
                  {u.name}
                </Link>
              </td>
              <td>{u.email}</td>
              <td>{u.phone || '—'}</td>
              <td>
                <span className={`badge ${u.role === 'admin' ? 'text-bg-dark' : 'text-bg-secondary'}`}>
                  {u.role}
                </span>
              </td>
              <td>
                <span className={`badge ${u.isBlocked ? 'text-bg-danger' : 'text-bg-success'}`}>
                  {u.isBlocked ? 'Blocked' : 'Active'}
                </span>
              </td>
              <td>{formatDate(u.createdAt)}</td>
              <td className="text-end text-nowrap">
                <Link to={`/users/${u._id}`} className="btn btn-sm btn-outline-secondary me-1" title="View">
                  <i className="bi bi-eye" />
                </Link>
                {u.role !== 'admin' && (
                  <>
                    <button
                      type="button"
                      className={`btn btn-sm me-1 ${u.isBlocked ? 'btn-outline-success' : 'btn-outline-warning'}`}
                      title={u.isBlocked ? 'Unblock' : 'Block'}
                      onClick={() => onBlockToggle(u)}
                    >
                      <i className={`bi ${u.isBlocked ? 'bi-unlock' : 'bi-lock'}`} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      title="Delete"
                      onClick={() => onDelete(u)}
                    >
                      <i className="bi bi-trash" />
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
