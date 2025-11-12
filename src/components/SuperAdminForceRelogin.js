import { getApiUrl } from '../config/api';
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SuperAdminForceRelogin = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const resp = await axios.get(getApiUrl('/superadmin/session/force-relogin/status'), { headers: { Authorization: `Bearer ${token}` } });
      if (resp.data?.success) setStatus(resp.data.forceReloginAt || null);
    } catch (err) { /* ignore */ }
  };

  useEffect(() => { loadStatus(); }, []);

  const triggerForceRelogin = async () => {
    if (!window.confirm('Bạn có chắc muốn yêu cầu toàn bộ tài khoản đăng nhập lại?')) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const resp = await axios.post(getApiUrl('/superadmin/session/force-relogin'), {}, { headers: { Authorization: `Bearer ${token}` } });
      if (resp.data?.success) {
        alert('Đã kích hoạt yêu cầu đăng nhập lại.');
        setStatus(resp.data.forceReloginAt);
      } else {
        alert(resp.data?.message || 'Không thể kích hoạt yêu cầu đăng nhập lại');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi server');
    } finally {
      setLoading(false);
    }
  };

  const formatVN = (iso) => {
    if (!iso) return 'Chưa từng kích hoạt';
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  };

  return (
    <div style={{ border: '2px solid black', borderRadius: 8, padding: 16, background: 'white' }}>
      <h3>Yêu cầu đăng nhập lại</h3>
      <p>Chức năng này sẽ buộc tất cả tài khoản Admin và Nhân viên đăng xuất và phải đăng nhập lại.</p>
      <div style={{ margin: '12px 0' }}>
        <strong>Lần kích hoạt gần nhất:</strong> {formatVN(status)}
      </div>
      <button onClick={triggerForceRelogin} disabled={loading} style={{ border: '2px solid #d32f2f', background: '#d32f2f', color: 'white', padding: '8px 12px', borderRadius: 4, fontWeight: 700 }}>
        {loading ? 'Đang kích hoạt...' : 'Kích hoạt yêu cầu đăng nhập lại'}
      </button>
    </div>
  );
};

export default SuperAdminForceRelogin;