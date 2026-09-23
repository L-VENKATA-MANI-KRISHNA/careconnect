import React from 'react';

const StatusBadge = ({ status = 'OPEN' }) => {
  const normalized = status.toLowerCase();
  let badgeClass = 'badge-pending';

  if (['open', 'available', 'active'].includes(normalized)) {
    badgeClass = 'badge-open';
  } else if (['confirmed', 'in_progress', 'provider_on_the_way'].includes(normalized)) {
    badgeClass = 'badge-confirmed';
  } else if (['completed', 'approved', 'resolved', 'paid'].includes(normalized)) {
    badgeClass = 'badge-completed';
  } else if (['cancelled', 'rejected', 'disputed', 'blocked', 'suspended'].includes(normalized)) {
    badgeClass = 'badge-cancelled';
  }

  const label = status.replace(/_/g, ' ');

  return <span className={`badge ${badgeClass}`}>{label}</span>;
};

export default StatusBadge;
