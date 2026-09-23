import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, ChevronRight, Inbox } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

const getNotificationLink = (n, user) => {
  const role = user?.role;
  const entityType = n.relatedEntity?.entityType;
  const type = n.type;

  if (role === 'CUSTOMER') {
    if (
      entityType === 'ServiceRequest' ||
      type === 'QUOTE_RECEIVED' ||
      type === 'REQUEST_CREATED'
    ) {
      return '/customer/requests';
    }
    if (
      entityType === 'Booking' ||
      type === 'BOOKING_CONFIRMED' ||
      type === 'JOB_COMPLETED' ||
      type === 'BOOKING_CANCELLED'
    ) {
      return '/customer/bookings';
    }
    if (entityType === 'Invoice' || type === 'PAYMENT_RECEIVED') {
      return '/customer/invoices';
    }
    return '/customer/dashboard';
  }

  if (role === 'SERVICE_PROVIDER') {
    if (
      entityType === 'Booking' ||
      type === 'QUOTE_ACCEPTED' ||
      type === 'JOB_CONFIRMED' ||
      type === 'DISPATCH_ASSIGNED' ||
      type === 'BOOKING_CANCELLED'
    ) {
      return '/provider/jobs';
    }
    if (entityType === 'ServiceRequest' || type === 'NEW_REQUEST_AVAILABLE') {
      return '/provider/requests';
    }
    if (entityType === 'ProviderProfile' || type === 'VERIFICATION_UPDATE') {
      return '/provider/profile';
    }
    return '/provider/dashboard';
  }

  if (role === 'PLATFORM_ADMIN') {
    if (entityType === 'ProviderProfile' || type === 'VERIFICATION_UPDATE') {
      return '/admin/providers';
    }
    if (entityType === 'User') {
      return '/admin/users';
    }
    return '/admin/dashboard';
  }

  if (role === 'OPERATIONS_MANAGER') {
    return '/operations/dispatch';
  }

  if (role === 'SUPPORT_AGENT') {
    return '/support/dashboard';
  }

  return '/';
};

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (n) => {
    if (!n.isRead) {
      markAsRead(n._id);
    }
    setIsOpen(false);
    const targetUrl = getNotificationLink(n, user);
    if (targetUrl) {
      navigate(targetUrl);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary btn-sm"
        style={{ position: 'relative', padding: '0.4rem 0.6rem' }}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: 'var(--accent-rose)',
              color: 'white',
              fontSize: '0.65rem',
              fontWeight: 800,
              width: 18,
              height: 18,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 42,
            width: 340,
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border-subtle)',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div className="flex-between mb-3" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', margin: 0 }}>Notifications</h4>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: 'var(--primary-100)',
                    color: 'var(--primary-700)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.45rem',
                    borderRadius: '10px',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-600)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div
            style={{
              maxHeight: 340,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Inbox size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                <p style={{ fontSize: '0.85rem', margin: 0 }}>No notifications right now</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(n)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: n.isRead ? '#FFFFFF' : 'var(--primary-50)',
                    border: `1px solid ${n.isRead ? 'var(--border-subtle)' : 'var(--primary-200)'}`,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-400)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = n.isRead ? 'var(--border-subtle)' : 'var(--primary-200)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      {!n.isRead && (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: 'var(--primary-600)',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <div
                        style={{
                          fontWeight: n.isRead ? 600 : 700,
                          color: 'var(--text-main)',
                          fontSize: '0.85rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {n.title}
                      </div>
                    </div>
                    <div
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {n.message}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
                      {new Date(n.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
