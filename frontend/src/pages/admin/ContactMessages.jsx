import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../services/adminApi';
import Loader from '../../components/common/admin/Loader';

const statusFilters = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

export default function ContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/contact');
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const filteredMessages = useMemo(() => {
    const query = search.trim().toLowerCase();

    return messages.filter((message) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'read' && message.isRead) ||
        (statusFilter === 'unread' && !message.isRead);

      const searchableText = [
        message.firstName,
        message.lastName,
        message.email,
        message.subject,
        message.message,
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [messages, search, statusFilter]);

  const updateStatus = async (id, isRead) => {
    try {
      await api.put(`/contact/${id}/status`, { isRead });
      fetchMessages();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update message status');
    }
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;
  const readCount = messages.filter((m) => m.isRead).length;

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="mb-1">Messages</h3>
          <p className="text-muted mb-0">Customers enquiries from the contact form.</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button type="button" className="btn btn-outline-secondary" onClick={fetchMessages}>
            <i className="bi bi-arrow-clockwise me-1" /> Refresh
          </button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Total</span>
                <i className="bi bi-envelope-paper fs-4 text-primary" />
              </div>
              <div className="display-6 fw-bold mt-2">{messages.length}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Unread</span>
                <i className="bi bi-envelope-exclamation fs-4 text-warning" />
              </div>
              <div className="display-6 fw-bold mt-2 text-warning">{unreadCount}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Read</span>
                <i className="bi bi-envelope-open fs-4 text-success" />
              </div>
              <div className="display-6 fw-bold mt-2 text-success">{readCount}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-lg-6">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search" />
                </span>
                <input
                  type="search"
                  className="form-control"
                  placeholder="Search by name, email, subject or message..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-lg-6">
              <div className="btn-group w-100" role="group" aria-label="Message filters">
                {statusFilters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    className={`btn ${statusFilter === filter.value ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
                    onClick={() => setStatusFilter(filter.value)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger py-2 mb-3">
          <i className="bi bi-exclamation-circle me-1" />
          {error}
        </div>
      )}

      {loading ? (
        <Loader />
      ) : filteredMessages.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5 text-muted">
            <i className="bi bi-inbox fs-1 d-block mb-2" />
            No messages matched your search.
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm overflow-hidden">
          <div className="table-responsive message-table-wrap">
            <table className="table table-hover align-middle mb-0 table-sm">
              <thead className="table-light">
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map((message) => (
                  <tr key={message._id} className={message.isRead ? '' : 'table-warning'}>
                    <td>
                      <div className="fw-semibold">{message.firstName || ''} {message.lastName || ''}</div>
                    </td>
                    <td>
                      <a href={`mailto:${message.email}`} className="text-decoration-none">
                        {message.email}
                      </a>
                    </td>
                    <td>{message.subject || '—'}</td>
                    <td>
                      <div className="message-preview">
                        {message.message.length > 80 ? `${message.message.slice(0, 80)}...` : message.message}
                      </div>
                    </td>
                    <td>
                      <small className="text-muted">
                        {new Date(message.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </small>
                    </td>
                    <td>
                      <span className={`badge ${message.isRead ? 'bg-success-subtle text-success' : 'bg-warning text-dark'}`}>
                        {message.isRead ? 'Read' : 'Unread'}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex gap-2 justify-content-end flex-wrap action-buttons">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setSelectedMessage(message)}
                          title="View details"
                          aria-label="View message details"
                        >
                          <i className="bi bi-eye" />
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${message.isRead ? 'btn-outline-secondary' : 'btn-outline-success'}`}
                          onClick={() => updateStatus(message._id, !message.isRead)}
                          title={message.isRead ? 'Mark as unread' : 'Mark as read'}
                          aria-label={message.isRead ? 'Mark as unread' : 'Mark as read'}
                        >
                          <i className={`bi ${message.isRead ? 'bi-envelope-open' : 'bi-envelope-check'}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedMessage && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Message Details</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedMessage(null)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <div className="text-muted small mb-1">Customer</div>
                  <div className="fw-semibold">
                    {selectedMessage.firstName || ''} {selectedMessage.lastName || ''}
                  </div>
                </div>
                <div className="mb-3">
                  <div className="text-muted small mb-1">Email</div>
                  <a href={`mailto:${selectedMessage.email}`} className="text-decoration-none">
                    {selectedMessage.email}
                  </a>
                </div>
                <div className="mb-3">
                  <div className="text-muted small mb-1">Subject</div>
                  <div>{selectedMessage.subject || '—'}</div>
                </div>
                <div className="mb-3">
                  <div className="text-muted small mb-1">Received</div>
                  <div>
                    {new Date(selectedMessage.createdAt).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-muted small mb-2">Message</div>
                  <div className="p-3 bg-light rounded border text-break" style={{ whiteSpace: 'pre-wrap' }}>
                    {selectedMessage.message}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setSelectedMessage(null)}>
                  Close
                </button>
                <button
                  type="button"
                  className={`btn ${selectedMessage.isRead ? 'btn-outline-warning' : 'btn-success'}`}
                  onClick={() => {
                    updateStatus(selectedMessage._id, !selectedMessage.isRead);
                    setSelectedMessage(null);
                  }}
                >
                  {selectedMessage.isRead ? 'Mark Unread' : 'Mark Read'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
