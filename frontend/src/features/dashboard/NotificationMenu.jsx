import { useEffect, useRef, useState } from 'react';
import { ErrorState, ListSkeleton } from '../../components/feedback/LoadingStates';

function BellIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export default function NotificationMenu({
  isLoading = false,
  error = '',
  notifications,
  totalCount,
  unreadCount,
  onFilterChange,
  onNotificationOpen,
  onNotificationRead,
  onRetry,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const [pendingReadIds, setPendingReadIds] = useState([]);
  const menuRef = useRef(null);
  const items = notifications.map((notification) => ({
    ...notification,
    unread: notification.unread && !readNotificationIds.includes(notification.id),
  }));
  const resolvedUnreadCount = unreadCount ?? items.filter((notification) => notification.unread).length;
  const resolvedTotalCount = totalCount ?? items.length;
  const visibleNotifications =
    filter === 'unread'
      ? items.filter((notification) => notification.unread)
      : items;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function closeOnOutsideClick(event) {
      if (!menuRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick);

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
    };
  }, [isOpen]);

  function selectFilter(nextFilter) {
    setFilter(nextFilter);
    onFilterChange?.(nextFilter);
  }

  async function markAsRead(notification) {
    if (!notification?.id || pendingReadIds.includes(notification.id)) {
      return;
    }

    setReadNotificationIds((currentIds) =>
      currentIds.includes(notification.id)
        ? currentIds
        : [...currentIds, notification.id],
    );
    setPendingReadIds((currentIds) => [...currentIds, notification.id]);

    try {
      await onNotificationRead?.(notification);
    } finally {
      setPendingReadIds((currentIds) =>
        currentIds.filter((currentId) => currentId !== notification.id),
      );
    }
  }

  async function openNotification(notification) {
    await markAsRead(notification);
    setIsOpen(false);
    onNotificationOpen?.(notification);
  }

  return (
    <div className="notification-menu" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-label={`${resolvedUnreadCount} notificaciones sin leer`}
        className="notification-button"
        type="button"
        onClick={() => setIsOpen((currentOpen) => !currentOpen)}
      >
        <BellIcon />
        {resolvedUnreadCount > 0 && <span>{resolvedUnreadCount}</span>}
      </button>
      {isOpen && (
        <div className="notification-dropdown" role="menu">
          <div className="notification-dropdown-header">
            <strong>Notificaciones</strong>
            <div className="notification-tabs" role="tablist">
              <button
                aria-selected={filter === 'all'}
                className={filter === 'all' ? 'active' : ''}
                type="button"
                onClick={() => selectFilter('all')}
              >
                Todas
                <span>{resolvedTotalCount}</span>
              </button>
              <button
                aria-selected={filter === 'unread'}
                className={filter === 'unread' ? 'active' : ''}
                type="button"
                onClick={() => selectFilter('unread')}
              >
                No leídas
                <span>{resolvedUnreadCount}</span>
              </button>
            </div>
          </div>
          <div className="notification-list">
            {isLoading ? (
              <ListSkeleton count={3} />
            ) : error ? (
              <ErrorState description={error} onRetry={onRetry} />
            ) : visibleNotifications.length === 0 ? (
              <p className="notification-empty">Sin notificaciones.</p>
            ) : visibleNotifications.map((notification) => (
              <article
                aria-label={`Abrir notificación: ${notification.title ?? notification.type}`}
                aria-busy={pendingReadIds.includes(notification.id) || undefined}
                aria-disabled={pendingReadIds.includes(notification.id) || undefined}
                className={`notification-item ${notification.unread ? 'is-unread' : 'is-read'} ${pendingReadIds.includes(notification.id) ? 'is-pending' : ''}`}
                key={notification.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (!pendingReadIds.includes(notification.id)) openNotification(notification);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openNotification(notification);
                  }
                }}
              >
                <span aria-hidden="true" className="notification-item-icon">
                  <BellIcon />
                </span>
                <div>
                  <span className="notification-item-heading">
                    <strong>{notification.title ?? notification.type}</strong>
                    {notification.time && <time>{notification.time}</time>}
                  </span>
                  <p>{notification.message}</p>
                </div>
                {notification.unread && (
                  <span aria-hidden="true" className="notification-unread-indicator" />
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
