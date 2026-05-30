import { useEffect, useRef, useState } from 'react';

function BellIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export default function NotificationMenu({ notifications }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const menuRef = useRef(null);
  const items = notifications.map((notification) => ({
    ...notification,
    unread: notification.unread && !readNotificationIds.includes(notification.id),
  }));
  const unreadCount = items.filter((notification) => notification.unread).length;
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

  function markAsRead(notificationId) {
    setReadNotificationIds((currentIds) =>
      currentIds.includes(notificationId)
        ? currentIds
        : [...currentIds, notificationId],
    );
  }

  return (
    <div className="notification-menu" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-label={`${unreadCount} notificaciones sin leer`}
        className="notification-button"
        type="button"
        onClick={() => setIsOpen((currentOpen) => !currentOpen)}
      >
        <BellIcon />
        <span>{unreadCount}</span>
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
                onClick={() => setFilter('all')}
              >
                Todas
                <span>{items.length}</span>
              </button>
              <button
                aria-selected={filter === 'unread'}
                className={filter === 'unread' ? 'active' : ''}
                type="button"
                onClick={() => setFilter('unread')}
              >
                No leídas
                <span>{unreadCount}</span>
              </button>
            </div>
          </div>
          <div className="notification-list">
            {visibleNotifications.map((notification) => (
              <article
                aria-label={`Marcar como leída: ${notification.type}`}
                className="notification-item"
                key={notification.id}
                role="button"
                tabIndex={0}
                onClick={() => markAsRead(notification.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    markAsRead(notification.id);
                  }
                }}
              >
                <span aria-hidden="true" className="notification-item-icon">
                  <BellIcon />
                </span>
                <div>
                  <span className="notification-item-heading">
                    <strong>{notification.type}</strong>
                    {notification.time && <time>{notification.time}</time>}
                  </span>
                  <p>{notification.message}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
