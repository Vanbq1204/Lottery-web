import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import './NotificationBell.css';

const NotificationBell = () => {
  const [unread, setUnread] = useState([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    try {
      const res = await axios.get(getApiUrl('/notifications/unread'), { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setUnread(res.data);
    } catch (_) { }
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('refresh_notifications', handler);
    return () => window.removeEventListener('refresh_notifications', handler);
  }, []);

  const markRead = async (id) => {
    try {
      await axios.post(getApiUrl(`/notifications/${id}/read`), {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setUnread(unread.filter(n => n.id !== id));
    } catch (_) { }
  };

  const markAllRead = async () => {
    // Assuming backend supports this or we loop. For now, let's loop or just clear UI if backend isn't ready.
    // Ideally: await axios.post(getApiUrl('/notifications/read-all'), ...)
    // For safety with current backend, we'll just mark visible ones individually in parallel (or just one by one).
    // If there are many, this might be slow, but it's a start.
    try {
      await Promise.all(unread.map(n => axios.post(getApiUrl(`/notifications/${n.id}/read`), {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })));
      setUnread([]);
    } catch (_) { }
  };

  return (
    <div className="notification-wrapper">
      <button className="notification-btn" onClick={() => setOpen(!open)}>
        <span className="bell-icon">🔔</span>
        {unread.length > 0 && (
          <span className="badge-count">{unread.length > 9 ? '9+' : unread.length}</span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h3>Thông báo</h3>
            <div className="header-actions">
              {unread.length > 0 && (
                <button className="btn-mark-all" onClick={markAllRead}>Đánh dấu đã đọc tất cả</button>
              )}
              <button className="btn-close-x" onClick={() => setOpen(false)}>✕</button>
            </div>
          </div>

          <div className="notification-list">
            {unread.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📭</span>
                <p>Không có thông báo mới</p>
              </div>
            ) : (
              unread.map(n => (
                <div key={n.id} className="notification-item unread">
                  <div className="notif-icon">📢</div>
                  <div className="notif-content-wrapper">
                    <div className="notif-title">{n.title}</div>
                    <span className="notif-time">{new Date(n.createdAt).toLocaleString()}</span>
                    <div className="notif-body" dangerouslySetInnerHTML={{ __html: n.contentHtml }} />
                    <div className="notif-actions">
                      <button className="btn-read" onClick={() => markRead(n.id)}>Đã đọc</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;