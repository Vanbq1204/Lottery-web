import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import './NotificationModal.css';

const NotificationModal = () => {
  const [notification, setNotification] = useState(null);
  const [visible, setVisible] = useState(false);

  const getCurrentUserId = () => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u?.id || null;
    } catch (_) {
      return null;
    }
  };

  const load = async () => {
    try {
      const res = await axios.get(getApiUrl('/notifications/unread'), { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const list = res.data || [];
      const userId = getCurrentUserId();
      const key = userId ? `dismissedNotifications_${userId}` : 'dismissedNotifications';
      const dismissed = JSON.parse(sessionStorage.getItem(key) || '[]');
      const first = list.find(n => !dismissed.includes(n.id));
      if (first) {
        setNotification(first);
        setVisible(true);
      } else {
        setNotification(null);
        setVisible(false);
      }
    } catch (_) { }
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('refresh_notifications', handler);
    return () => window.removeEventListener('refresh_notifications', handler);
  }, []);

  const markRead = async () => {
    if (!notification) return;
    try {
      await axios.post(getApiUrl(`/notifications/${notification.id}/read`), {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setVisible(false);
      setNotification(null);
      window.dispatchEvent(new Event('refresh_notifications'));
    } catch (_) { }
  };

  const close = () => {
    if (!notification) return;
    const userId = getCurrentUserId();
    const key = userId ? `dismissedNotifications_${userId}` : 'dismissedNotifications';
    const dismissed = JSON.parse(sessionStorage.getItem(key) || '[]');
    if (!dismissed.includes(notification.id)) dismissed.push(notification.id);
    sessionStorage.setItem(key, JSON.stringify(dismissed));
    setVisible(false);
  };

  if (!visible || !notification) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3 className="modal-title">{notification.title}</h3>
          <button className="btn-close-modal" onClick={close}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <div dangerouslySetInnerHTML={{ __html: notification.contentHtml }} />
        </div>
        <div className="modal-footer">
          <button className="btn-mark-read-modal" onClick={markRead}>
            <span>✓</span> Đã đọc
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;