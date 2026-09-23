import React, { useEffect, useState } from 'react';
import { FileText, CheckCircle2, DollarSign, Download } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const CustomerInvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [message, setMessage] = useState('');

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices');
      setInvoices(res.data.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handlePay = async (invoiceId) => {
    setPayingId(invoiceId);
    setMessage('');
    try {
      await api.post(`/invoices/${invoiceId}/pay`);
      setMessage('Invoice paid successfully! Thank you.');
      await fetchInvoices();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setPayingId(null);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your invoices..." />;

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.85rem' }}>Invoices & Payment Receipts</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Transparent itemized billing for all your CareConnect home service bookings
          </p>
        </div>
      </div>

      {message && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {message}
        </div>
      )}

      {invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Invoices will be generated automatically once your service quotes are accepted."
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Provider</th>
                <th>Subtotal</th>
                <th>Platform Fee</th>
                <th>Tax</th>
                <th>Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv._id}>
                  <td>
                    <strong>#{inv._id.slice(-6).toUpperCase()}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(inv.issuedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>{inv.provider?.name}</td>
                  <td>${inv.subtotal}</td>
                  <td>${inv.platformFee}</td>
                  <td>${inv.tax}</td>
                  <td>
                    <strong style={{ color: 'var(--primary-700)', fontSize: '1.05rem' }}>
                      ${inv.total}
                    </strong>
                  </td>
                  <td>
                    <StatusBadge status={inv.status} />
                  </td>
                  <td>
                    {inv.status === 'PENDING' ? (
                      <button
                        onClick={() => handlePay(inv._id)}
                        className="btn btn-primary btn-sm"
                        disabled={payingId === inv._id}
                      >
                        {payingId === inv._id ? 'Processing...' : 'Pay Now'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {inv.status === 'PAID' ? '✓ Paid' : inv.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomerInvoicesPage;
