import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import './NotificationBell.css';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  // Initialize visibility based on local storage
  const [isVisible, setIsVisible] = useState(() => !localStorage.getItem('notificationBellHidden'));
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const showBell = () => {
    setIsVisible(true);
    localStorage.removeItem('notificationBellHidden');
  };

  const hideBell = () => {
    setIsVisible(false);
    setOpen(false);
    localStorage.setItem('notificationBellHidden', 'true');
  };

  const load = async () => {
    try {
      const res = await axios.get(getApiUrl('/notifications'), { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const newNotifs = res.data;

      setNotifications(prev => {
        const prevUnreadCount = prev.filter(n => !n.isRead).length;
        const newUnreadCount = newNotifs.filter(n => !n.isRead).length;
        // Only auto-show if there are MORE unread notifications than before
        if (newUnreadCount > prevUnreadCount) {
          showBell();
        }
        return newNotifs;
      });
    } catch (_) { }
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('refresh_notifications', handler);
    // Poll every 30 seconds to check for new notifications if not using sockets for everything
    const interval = setInterval(load, 30000);
    return () => {
      window.removeEventListener('refresh_notifications', handler);
      clearInterval(interval);
    };
  }, []);

  const markRead = async (id) => {
    try {
      const item = notifications.find(n => n.id === id);
      if (item && item.isRead) return;
      await axios.post(getApiUrl(`/notifications/${id}/read`), {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (_) { }
  };

  const markAllRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      await Promise.all(unreadIds.map(id => axios.post(getApiUrl(`/notifications/${id}/read`), {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })));
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (_) { }
  };

  // Swipe handlers
  const minSwipeDistance = 40;
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isVisible && isRightSwipe) {
      hideBell();
    } else if (!isVisible && isLeftSwipe) {
      showBell();
    }
  };

  return (
    <>
      {/* Invisible trigger area for swiping back when hidden */}
      {!isVisible && (
        <div
          className="bell-trigger-area"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={showBell} // Click to show as well for desktop/convenience
          title="Vuốt sang trái để hiện thông báo"
        />
      )}

      <div
        className={`notification-wrapper ${isVisible ? 'visible' : 'hidden'}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="bell-container">
          <button className="notification-btn" onClick={() => setOpen(!open)}>
            <span className="bell-icon">🔔</span>
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="badge-count">{notifications.filter(n => !n.isRead).length > 9 ? '9+' : notifications.filter(n => !n.isRead).length}</span>
            )}
          </button>
          {isVisible && (
            <button className="btn-hide-bell" onClick={(e) => { e.stopPropagation(); hideBell(); }} title="Ẩn thông báo">
              ›
            </button>
          )}
        </div>

        {open && isVisible && (
          <div className="notification-dropdown">
            <div className="dropdown-header">
              <h3>Thông báo</h3>
              <div className="header-actions">
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <button className="btn-mark-all" onClick={markAllRead}>Đánh dấu đã đọc tất cả</button>
                )}
                <button className="btn-close-x" onClick={() => setOpen(false)}>✕</button>
              </div>
            </div>

            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📭</span>
                  <p>Không có thông báo</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`notification-item ${n.isRead ? '' : 'unread'}`}>
                    <div className="notif-icon">📢</div>
                    <div className="notif-content-wrapper">
                      <div className="notif-title">{n.title}</div>
                      <span className="notif-time">{new Date(n.createdAt).toLocaleString()}</span>
                      {expandedId === n.id && (
                        <div className="notif-body" dangerouslySetInnerHTML={{ __html: n.contentHtml }} />
                      )}
                      <div className="notif-actions" style={{ justifyContent: 'space-between' }}>
                        <button onClick={() => setExpandedId(expandedId === n.id ? null : n.id)} className="btn-read" style={{ background: 'rgba(0,0,0,0.06)', color: '#2d3436' }}>{expandedId === n.id ? 'Thu gọn' : 'Xem nội dung'}</button>
                        {!n.isRead && (
                          <button className="btn-read" onClick={() => markRead(n.id)}>Đã đọc</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationBell;