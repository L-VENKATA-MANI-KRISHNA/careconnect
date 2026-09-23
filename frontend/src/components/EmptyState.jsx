import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ title = 'No items found', description = 'Nothing to show here yet.', action = null }) => {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-subtle)' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary-50)', color: 'var(--primary-600)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
        <Inbox size={28} />
      </div>
      <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto 1.25rem' }}>
        {description}
      </p>
      {action}
    </div>
  );
};

export default EmptyState;
