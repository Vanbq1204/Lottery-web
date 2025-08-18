import React, { useState } from 'react';
import AdminManagement from './AdminManagement';
import StoreManagement from './StoreManagement';
import './SuperAdminInterface.css';

const SuperAdminInterface = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('admin-management');

  const menuItems = [
    { id: 'admin-management', label: 'Quản lý tài khoản Admin', icon: '👤' },
    { id: 'store-management', label: 'Quản lý cửa hàng con', icon: '🏪' },
    { id: 'system-statistics', label: 'Thống kê toàn bộ hệ thống', icon: '📊' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'admin-management':
        return (
          <div className="super-admin-content">
            <AdminManagement />
          </div>
        );

      case 'store-management':
        return (
          <div className="super-admin-content">
            <StoreManagement />
          </div>
        );

      case 'system-statistics':
        return (
          <div className="super-admin-content">
            <div className="super-admin-header">
              <h2>Thống kê toàn bộ hệ thống</h2>
              <p>Báo cáo tổng hợp của toàn bộ hệ thống</p>
            </div>
            <div className="super-admin-placeholder">
              <div className="placeholder-box">
                <h3>Thống kê hệ thống</h3>
                <p>Chức năng sẽ được triển khai sau</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="super-admin-interface">
      {/* Sidebar Menu */}
      <div className="super-admin-sidebar">
        <div className="super-admin-user-info">
          <div className="super-admin-avatar">SA</div>
          <div className="super-admin-user-details">
            <h3>Super Admin</h3>
            <p>{user?.username || 'superadmin'}</p>
          </div>
        </div>

        <nav className="super-admin-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`super-admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="super-admin-nav-icon">{item.icon}</span>
              <span className="super-admin-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="super-admin-logout">
          <button className="super-admin-logout-btn" onClick={onLogout}>
            <span className="super-admin-logout-icon">🚪</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="super-admin-main">
        {renderContent()}
      </div>
    </div>
  );
};

export default SuperAdminInterface; 