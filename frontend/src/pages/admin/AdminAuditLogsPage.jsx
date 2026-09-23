import React, { useEffect, useState } from 'react';
import { Activity, Clock, Shield } from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/audit-logs')
      .then((res) => setLogs(res.data.data.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading security audit trails..." />;

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Immutable Audit Log Trails</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            System activity logging for security compliance, administrative actions, and dispute evidence
          </p>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Security Action</th>
              <th>Entity</th>
              <th>IP Address</th>
              <th>Metadata</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l._id}>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(l.createdAt).toLocaleString()}
                </td>
                <td>
                  <strong>{l.actor?.name || 'System / Guest'}</strong>
                  {l.actor?.role && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {l.actor.role}
                    </div>
                  )}
                </td>
                <td>
                  <span className="badge badge-confirmed">
                    {l.action}
                  </span>
                </td>
                <td>
                  {l.entityType}
                  {l.entityId && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      #{l.entityId.slice(-6)}
                    </div>
                  )}
                </td>
                <td style={{ fontSize: '0.8rem' }}>{l.ipAddress || '127.0.0.1'}</td>
                <td style={{ fontSize: '0.75rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {JSON.stringify(l.metadata || {})}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAuditLogsPage;
