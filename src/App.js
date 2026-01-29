import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { getApiUrl } from './config/api';
import Login from './components/Login';
import EmployeeInterface from './components/EmployeeInterface';
import AdminInterface from './components/AdminInterface';
import SuperAdminInterface from './components/SuperAdminInterface';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra xem user đã đăng nhập chưa
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Socket.io integration
  useEffect(() => {
    if (user) {
      // Get base URL without /api prefix for Socket.io
      const apiUrl = getApiUrl('');
      const socketUrl = apiUrl.replace('/api', '');
      console.log('🔌 Connecting to Socket.io:', socketUrl);

      const socket = io(socketUrl, {
        transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      socket.on('connect', () => {
        console.log('Connected to socket server');

        if (user.role === 'employee' && user.storeId) {
          socket.emit('join_store', user.storeId);
        } else if (user.role === 'admin') {
          socket.emit('join_admin', user.id);
        }
        socket.emit('join_user', user.id);
      });

      socket.on('new_invoice', (data) => {
        console.log('New invoice received:', data);
        // Browser Notification
        if (!("Notification" in window)) {
          console.log("This browser does not support desktop notification");
        } else if (Notification.permission === "granted") {
          new Notification("LotoWeb - Đơn mới", { body: data.message });
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
              new Notification("LotoWeb - Đơn mới", { body: data.message });
            }
          });
        }

        // Có thể thêm logic update state global ở đây nếu cần
      });

      socket.on('new_notification', (data) => {
        if (!('Notification' in window)) {
        } else if (Notification.permission === 'granted') {
          new Notification('Thông báo hệ thống', { body: data.title });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              new Notification('Thông báo hệ thống', { body: data.title });
            }
          });
        }
        window.dispatchEvent(new Event('refresh_notifications'));
      });

      // Listen for force reload event from SuperAdmin
      socket.on('force-reload', (data) => {
        console.log('🔄 Force reload event received:', data);
        // Show notification before reload
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Hệ thống', { body: 'Quản trị viên yêu cầu reload trang...' });
        }
        // Force reload with cache busting (hard reload)
        setTimeout(() => {
          // Add timestamp to force cache refresh
          window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now();
        }, 500);
      });

      // Listen for maintenance mode activation event from SuperAdmin
      socket.on('maintenance-mode-activated', (data) => {
        console.log('🔧 Maintenance mode activated:', data);

        // Only logout if not superadmin
        if (user.role !== 'superadmin') {
          // Show notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Hệ thống đang bảo trì', {
              body: 'Hệ thống đang bảo trì. Bạn sẽ được đăng xuất.'
            });
          }

          // Show alert
          alert('Hệ thống đang bảo trì, vui lòng quay lại sau. Xin lỗi vì sự bất tiện này.');

          // Force logout
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            // Force reload to show maintenance message
            window.location.reload();
          }, 1000);
        }
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user]);

  // Interceptors: auto-logout when token hết hạn/401
  useEffect(() => {
    const logoutAndRedirect = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    };

    // Axios response interceptor
    const axiosInterceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error?.response?.status;
        const msg = error?.response?.data?.message || '';
        if (
          status === 401 ||
          msg.includes('Token không hợp lệ') ||
          msg.includes('Không có token xác thực') ||
          msg.includes('Chưa xác thực') ||
          msg.includes('Tài khoản đã bị khóa')
        ) {
          logoutAndRedirect();
        }
        return Promise.reject(error);
      }
    );

    // Fetch wrapper for 401
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const res = await originalFetch(...args);
      if (res.status === 401) {
        logoutAndRedirect();
      }
      return res;
    };

    return () => {
      axios.interceptors.response.eject(axiosInterceptorId);
      window.fetch = originalFetch;
    };
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };


  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  // Nếu chưa đăng nhập, hiển thị form đăng nhập
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Nếu đã đăng nhập, hiển thị giao diện tương ứng với role
  switch (user.role) {
    case 'employee':
      return <EmployeeInterface user={user} />;
    case 'admin':
      return <AdminInterface user={user} onLogout={handleLogout} />;
    case 'superadmin':
      return <SuperAdminInterface user={user} onLogout={handleLogout} />;
    default:
      return (
        <div className="error-container">
          <h2>Lỗi phân quyền</h2>
          <p>Tài khoản của bạn không có quyền truy cập hệ thống</p>
          <button onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }}>
            Đăng xuất
          </button>
        </div>
      );
  }
}

export default App;
