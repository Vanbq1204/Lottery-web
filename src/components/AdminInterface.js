import { getApiUrl } from '../config/api';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminInterface.css';
import AdminStoreStatistics from './AdminStoreStatistics';
import AdminTotalStatistics from './AdminTotalStatistics';
import AdminPrizeStatistics from './AdminPrizeStatistics';
import TimeSettings from './TimeSettings';
import DataCleanup from './DataCleanup';
import AdminMessageExport from './AdminMessageExport';
import AdminMessageExportSettings from './AdminMessageExportSettings';
import PrizeSettings from './PrizeSettings';
import AdminChangePassword from './AdminChangePassword';
import AdminStoreTimeSettings from './AdminStoreTimeSettings';
import NotificationBell from './NotificationBell';
import NotificationModal from './NotificationModal';
import StoreExpirationBar from './StoreExpirationBar';

const AdminInterface = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('my-store');
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);

  const menuItems = [
    { id: 'my-store', label: 'Cửa hàng của tôi', icon: '🏪' },
    { id: 'reports', label: 'Báo cáo tổng hợp', icon: '📊' },
    ...(user?.allowMessageExport ? [{ id: 'message-export', label: 'Xuất tin nhắn', icon: '✉️' }] : []),
    { id: 'prize-stats', label: 'Thống kê thưởng tổng hợp', icon: '🏆' },
    {
      id: 'settings',
      label: 'Cài đặt',
      icon: '⚙️',
      hasDropdown: true,
      subItems: [
        ...(user?.allowMessageExport ? [{ id: 'message-export-settings', label: 'Cài đặt định dạng xuất', icon: '📝' }] : []),
        { id: 'prize-settings', label: 'Hệ số thưởng', icon: '🏆' },
        { id: 'time-settings', label: 'Tinh chỉnh thời gian nhập cược', icon: '⏰' },
        { id: 'store-time-settings', label: 'Quản lý thời gian theo cửa hàng', icon: '🏪' }
      ]
    },
    ...(user?.allowChangePassword ? [{ id: 'change-password', label: 'Đổi mật khẩu', icon: '🔒' }] : []),
    { id: 'data-cleanup', label: 'Làm sạch dữ liệu', icon: '🗑️' }
  ];

  // Load stores when component mounts
  useEffect(() => {
    if (activeTab === 'my-store') {
      loadStores();
    }
  }, [activeTab]);

  // Load danh sách cửa hàng
  const loadStores = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(getApiUrl('/admin/my-stores'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setStores(response.data.stores);
      }
    } catch (error) {
      console.error('Lỗi khi tải cửa hàng:', error);
      alert('Không thể tải danh sách cửa hàng');
    } finally {
      setIsLoading(false);
    }
  };

  // Xem chi tiết cửa hàng
  const viewStoreDetail = (store) => {
    setSelectedStore(store);
    if (window.innerWidth <= 992) setIsMobileMenuOpen(false);
  };

  // Quay lại danh sách cửa hàng
  const backToStoreList = () => {
    setSelectedStore(null);
  };

  const handleMenuClick = (itemId) => {
    setActiveTab(itemId);
    // Close settings dropdown when switching to non-settings menu
    if (!['message-export-settings', 'prize-settings', 'time-settings', 'store-time-settings'].includes(itemId)) {
      setIsSettingsDropdownOpen(false);
    }
    if (window.innerWidth <= 992) setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const renderContent = () => {
    const allowedMessageExport = Boolean(user?.allowMessageExport);
    switch (activeTab) {
      case 'my-store':
        if (selectedStore) {
          return (
            <div className="admin-content-section">
              <div className="admin-store-detail-header">
                <button className="admin-back-button" onClick={backToStoreList}>
                  ← Quay lại danh sách
                </button>
              </div>
              <AdminStoreStatistics store={selectedStore} user={user} />
            </div>
          );
        }

        return (
          <div className="admin-content-section">
            <h2>Cửa hàng của tôi</h2>
            <p className="title-mobile">Danh sách các cửa hàng bạn quản lý:</p>

            {isLoading ? (
              <div className="admin-loading">
                <p>Đang tải danh sách cửa hàng...</p>
              </div>
            ) : (
              <div className="admin-stores-grid">
                {stores.length > 0 ? (
                  stores.map((store) => (
                    <div
                      key={store._id}
                      className="admin-store-card"
                      onClick={() => viewStoreDetail(store)}
                    >
                      <StoreExpirationBar
                        startDate={store.startDate}
                        endDate={store.endDate}
                        storeName={store.name}
                      />
                      <div className="admin-store-header">
                        <h3>{store.name}</h3>
                      </div>
                      <div className="admin-store-info">
                        <p><strong>Địa chỉ:</strong> {store.address}</p>
                        <p><strong>Số điện thoại:</strong> {store.phone}</p>
                        <p><strong>Nhân viên:</strong></p>
                        <div className="admin-employees-list">
                          {store.employees.length > 0 ? (
                            store.employees.map((emp, index) => (
                              <span key={emp._id} className="admin-employee-tag">
                                {emp.name || emp.username}
                              </span>
                            ))
                          ) : (
                            <span className="admin-no-employees">Chưa có nhân viên</span>
                          )}
                        </div>
                      </div>
                      <div className="admin-store-footer">
                        <span className="admin-click-hint">Click để xem chi tiết</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="admin-no-stores">
                    <p>Chưa có cửa hàng nào được gán cho bạn.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case 'reports':
        return (
          <div className="admin-content-section">
            <AdminTotalStatistics user={user} />
          </div>
        );
      case 'prize-stats':
        return (
          <div className="admin-content-section">
            <AdminPrizeStatistics user={user} />
          </div>
        );
      case 'message-export':
        if (!allowedMessageExport) {
          return (
            <div className="admin-content-section">
              <h2>Không có quyền</h2>
              <p>Bạn không có quyền sử dụng chức năng xuất tin nhắn.</p>
            </div>
          );
        }
        return (
          <div className="admin-content-section">
            {/* Xuất tin nhắn tổng hợp theo ngày */}
            <AdminMessageExport user={user} />
          </div>
        );
      case 'message-export-settings':
        if (!allowedMessageExport) {
          return (
            <div className="admin-content-section">
              <h2>Không có quyền</h2>
              <p>Bạn không có quyền cài đặt định dạng xuất tin nhắn.</p>
            </div>
          );
        }
        return (
          <div className="admin-content-section">
            <AdminMessageExportSettings user={user} />
          </div>
        );
      case 'prize-settings':
        return (
          <div className="admin-content-section">
            <PrizeSettings />
          </div>
        );
      case 'change-password':
        return (
          <div className="admin-content-section">
            <AdminChangePassword />
          </div>
        );
      case 'time-settings':
        return (
          <div className="admin-content-section">
            <TimeSettings />
          </div>
        );
      case 'store-time-settings':
        return (
          <div className="admin-content-section">
            <AdminStoreTimeSettings />
          </div>
        );
      case 'data-cleanup':
        return (
          <div className="admin-content-section">
            <DataCleanup user={user} />
          </div>
        );
      default:
        return (
          <div className="admin-content-section">
            <h2>Chào mừng</h2>
            <p>Vui lòng chọn một mục từ menu bên trái.</p>
          </div>
        );
    }
  };

  return (
    <div className="admin-interface-container">
      <NotificationBell />
      <NotificationModal />
      {/* Left Sidebar Menu */}
      <div className={`admin-sidebar ${isMobileMenuOpen ? 'admin-sidebar--open' : 'admin-sidebar--closed'}`}>
        <div className="admin-sidebar-header">
          <h3>Quản trị viên</h3>
          <p className="admin-user-name">{user.name || user.username}</p>
        </div>

        <nav className="admin-sidebar-nav">
          {menuItems.map((item) => (
            item.hasDropdown ? (
              <div key={item.id}>
                <button
                  className={`admin-nav-item ${(['message-export-settings', 'time-settings', 'store-time-settings'].includes(activeTab)) ? 'admin-nav-active' : ''} admin-dropdown-toggle`}
                  onClick={() => setIsSettingsDropdownOpen(!isSettingsDropdownOpen)}
                >
                  <span className="admin-nav-icon">{item.icon}</span>
                  <span className="admin-nav-label">{item.label}</span>
                  <span className={`admin-dropdown-arrow ${isSettingsDropdownOpen ? 'open' : ''}`}>▼</span>
                </button>
                {isSettingsDropdownOpen && (
                  <div className="admin-dropdown-menu">
                    {item.subItems.map((subItem) => (
                      <button
                        key={subItem.id}
                        className={`admin-dropdown-item ${activeTab === subItem.id ? 'active' : ''}`}
                        onClick={() => {
                          handleMenuClick(subItem.id);
                          setIsSettingsDropdownOpen(false);
                        }}
                      >
                        <span className="admin-nav-icon">{subItem.icon}</span>
                        <span className="admin-nav-label">{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                key={item.id}
                className={`admin-nav-item ${activeTab === item.id ? 'admin-nav-active' : ''}`}
                onClick={() => handleMenuClick(item.id)}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                <span className="admin-nav-label">{item.label}</span>
              </button>
            )
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-logout-button" onClick={onLogout}>
            <span className="admin-nav-icon">🚪</span>
            <span className="admin-nav-label">Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Mobile top bar with hamburger */}
      <div className="admin-mobile-topbar">
        <button className="admin-mobile-menu-button" onClick={toggleMobileMenu}>
          ☰ Menu
        </button>
        <div className="admin-mobile-topbar-title">Trang quản trị</div>
        <button className="admin-mobile-logout-button" onClick={onLogout}>
          🚪 Đăng xuất
        </button>
      </div>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && <div className="admin-overlay" onClick={closeMobileMenu} />}

      {/* Main Content Area */}
      <div className="admin-main-content">
        <div className="admin-content-wrapper">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminInterface;
