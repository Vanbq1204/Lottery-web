import React, { useState, useEffect } from 'react';
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
