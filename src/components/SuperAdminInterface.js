import React, { useState } from 'react';
import AdminManagement from './AdminManagement';
import StoreManagement from './StoreManagement';
import SuperAdminSystemStats from './SuperAdminSystemStats';
import SuperAdminCleanup from './SuperAdminCleanup';
import SuperAdminForceRelogin from './SuperAdminForceRelogin';
import SuperAdminLotteryHistory from './SuperAdminLotteryHistory';
import './SuperAdminInterface.css';

const SuperAdminInterface = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('admin-management');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'admin-management', label: 'Quản lý tài khoản Admin', icon: '👤' },
    { id: 'store-management', label: 'Quản lý cửa hàng con', icon: '🏪' },
    { id: 'system-statistics', label: 'Thống kê toàn bộ hệ thống', icon: '📊' },
    { id: 'system-cleanup', label: 'Làm sạch dữ liệu theo ngày', icon: '🗑️' },
    { id: 'force-relogin', label: 'Yêu cầu đăng nhập lại', icon: '🔁' },
    { id: 'system-history', label: 'Lịch sử hệ thống', icon: '🕘' }
  ];

  const handleMenuClick = (id) => {
    setActiveTab(id);
    if (window.innerWidth <= 992) setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

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
            <SuperAdminSystemStats />
          </div>
        );

      case 'system-cleanup':
        return (
          <div className="super-admin-content">
            <SuperAdminCleanup />
          </div>
        );

      case 'force-relogin':
        return (
          <div className="super-admin-content">
            <SuperAdminForceRelogin />
          </div>
        );

      case 'system-history':
        return (
          <div className="super-admin-content">
            <SuperAdminLotteryHistory />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="super-admin-interface">
      {/* Sidebar Menu */}
      <div className={`super-admin-sidebar ${isMobileMenuOpen ? 'super-admin-sidebar--open' : 'super-admin-sidebar--closed'}`}>
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
              onClick={() => handleMenuClick(item.id)}
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

      {/* Mobile top bar */}
      <div className="super-admin-mobile-topbar">
        <button className="super-admin-mobile-menu-button" onClick={toggleMobileMenu}>☰ Menu</button>
        <div className="super-admin-mobile-topbar-title">Trang quản trị</div>
        <button className="super-admin-mobile-logout-button" onClick={onLogout}>Đăng xuất</button>
      </div>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && <div className="super-admin-overlay" onClick={closeMobileMenu} />}

      {/* Main Content */}
      <div className="super-admin-main">
        {renderContent()}
      </div>
    </div>
  );
};

export default SuperAdminInterface;