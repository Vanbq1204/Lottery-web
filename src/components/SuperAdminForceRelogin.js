import { getApiUrl } from '../config/api';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SuperAdminMaintenance from './SuperAdminMaintenance';

const SuperAdminForceRelogin = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('session'); // 'session' or 'maintenance'

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

  const triggerForceReload = async () => {
    if (!window.confirm('Bạn có chắc muốn yêu cầu toàn bộ tài khoản reload trang ngay lập tức?')) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const resp = await axios.post(getApiUrl('/superadmin/session/force-reload'), {}, { headers: { Authorization: `Bearer ${token}` } });
      if (resp.data?.success) {
        alert('Đã gửi yêu cầu reload trang đến tất cả người dùng.');
      } else {
        alert(resp.data?.message || 'Không thể kích hoạt yêu cầu reload');
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
    <div>
      <h2 style={{ marginBottom: 16 }}>Quản lý phiên đăng nhập</h2>

      {/* Tab Navigation */}
      <div style={{ marginBottom: 16, borderBottom: '2px solid #ddd' }}>
        <button
          onClick={() => setActiveTab('session')}
          style={{
            padding: '10px 20px',
            marginRight: 8,
            border: 'none',
            borderBottom: activeTab === 'session' ? '3px solid #1976d2' : '3px solid transparent',
            background: 'transparent',
            fontWeight: activeTab === 'session' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: 15
          }}
        >
          🔁 Yêu cầu đăng nhập lại / Reload
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'maintenance' ? '3px solid #1976d2' : '3px solid transparent',
            background: 'transparent',
            fontWeight: activeTab === 'maintenance' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: 15
          }}
        >
          🔧 Kích hoạt bảo trì hệ thống
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'session' ? (
        <div style={{ border: '2px solid black', borderRadius: 8, padding: 16, background: 'white' }}>
          {/* Force Relogin Section */}
          <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #ddd' }}>
            <h4 style={{ marginTop: 0 }}>Yêu cầu đăng nhập lại</h4>
            <p>Chức năng này sẽ buộc tất cả tài khoản Admin và Nhân viên đăng xuất và phải đăng nhập lại.</p>
            <div style={{ margin: '12px 0' }}>
              <strong>Lần kích hoạt gần nhất:</strong> {formatVN(status)}
            </div>
            <button onClick={triggerForceRelogin} disabled={loading} style={{ border: '2px solid #d32f2f', background: '#d32f2f', color: 'white', padding: '8px 12px', borderRadius: 4, fontWeight: 700 }}>
              {loading ? 'Đang kích hoạt...' : 'Kích hoạt yêu cầu đăng nhập lại'}
            </button>
          </div>

          {/* Force Reload Section */}
          <div>
            <h4 style={{ marginTop: 0 }}>Reload trang toàn hệ thống</h4>
            <p>Chức năng này sẽ buộc tất cả tài khoản reload trang ngay lập tức (giống như ấn F5).</p>
            <button onClick={triggerForceReload} disabled={loading} style={{ border: '2px solid #1976d2', background: '#1976d2', color: 'white', padding: '8px 12px', borderRadius: 4, fontWeight: 700 }}>
              {loading ? 'Đang gửi...' : '🔄 Kích hoạt reload trang'}
            </button>
          </div>
        </div>
      ) : (
        <SuperAdminMaintenance />
      )}
    </div>
  );
};

export default SuperAdminForceRelogin;