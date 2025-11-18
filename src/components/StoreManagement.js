import { getApiUrl } from '../config/api';

import React, { useState, useEffect } from 'react';
import './StoreManagement.css';

const StoreManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    employeeName: '',
    storeName: '',
    storeAddress: '',
    storePhone: '',
    isActive: true,
    allowChangePassword: true,
    showLotteryResults: false
  });
  const [showCreatePwd, setShowCreatePwd] = useState(false);
  const [showEditPwd, setShowEditPwd] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/superadmin/admins'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setAdmins(data.admins);
      } else {
        alert('Lỗi khi tải danh sách admin: ' + data.message);
      }
    } catch (error) {
      console.error('Error loading admins:', error);
      alert('Lỗi khi tải danh sách admin');
    } finally {
      setLoading(false);
    }
  };

  const loadStoresForAdmin = async (adminId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/superadmin/stores/${adminId}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setStores(data.stores);
      } else {
        alert('Lỗi khi tải danh sách cửa hàng: ' + data.message);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
      alert('Lỗi khi tải danh sách cửa hàng');
    }
  };

  const handleSelectAdmin = (admin) => {
    setSelectedAdmin(admin);
    loadStoresForAdmin(admin.id);
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    
    if (!selectedAdmin) {
      alert('Vui lòng chọn admin trước');
      return;
    }

    if (!formData.username || !formData.password || !formData.employeeName || !formData.storeName) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      setCreating(true);
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/superadmin/stores'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          adminId: selectedAdmin.id,
          ...formData
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Tạo cửa hàng thành công!');
        setShowCreateForm(false);
        setFormData({
          username: '',
          password: '',
          employeeName: '',
          storeName: '',
          storeAddress: '',
          storePhone: '',
          isActive: true,
          allowChangePassword: true,
          showLotteryResults: false
        });
        loadStoresForAdmin(selectedAdmin.id);
      } else {
        alert('Lỗi khi tạo cửa hàng: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating store:', error);
      alert('Lỗi khi tạo cửa hàng');
    } finally {
      setCreating(false);
    }
  };

  const handleEditStore = async (e) => {
    e.preventDefault();
    
    if (!formData.employeeName || !formData.storeName) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      const token = localStorage.getItem('token');
              const response = await fetch(getApiUrl(`/superadmin/stores/${editingStore.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        alert('Cập nhật cửa hàng thành công!');
        setShowEditForm(false);
        setEditingStore(null);
        loadStoresForAdmin(selectedAdmin.id);
      } else {
        alert('Lỗi khi cập nhật cửa hàng: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating store:', error);
      alert('Lỗi khi cập nhật cửa hàng');
    }
  };

  const handleDeleteStore = async (storeId, storeName) => {
    if (!window.confirm(`Bạn có chắc muốn xóa cửa hàng "${storeName}"? Điều này sẽ xóa tất cả nhân viên trong cửa hàng.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/superadmin/stores/${storeId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        alert('Xóa cửa hàng thành công!');
        loadStoresForAdmin(selectedAdmin.id);
      } else {
        alert('Lỗi khi xóa cửa hàng: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting store:', error);
      alert('Lỗi khi xóa cửa hàng');
    }
  };

  const openEditForm = (store) => {
    setEditingStore(store);
    setFormData({
      username: store.employeeUsername || '',
      password: '',
      employeeName: store.employeeName || '',
      storeName: store.name || '',
      storeAddress: store.address || '',
      storePhone: store.phone || '',
      isActive: store.isActive,
      allowChangePassword: store.allowChangePassword ?? true,
      showLotteryResults: store.showLotteryResults ?? false
    });
    setShowEditForm(true);
  };

  if (loading) {
    return <div className="store-mgmt-loading">Đang tải...</div>;
  }

  return (
    <div className="store-mgmt-container">
      <div className="store-mgmt-header">
        <h2>Quản lý cửa hàng con</h2>
      </div>

      <div className="store-mgmt-content">
        {/* Admin List */}
        <div className="store-mgmt-admin-section">
          <h3>Danh sách Admin</h3>
          <div className="store-mgmt-admin-list">
            {admins.map(admin => (
              <div 
                key={admin.id} 
                className={`store-mgmt-admin-card ${selectedAdmin?.id === admin.id ? 'selected' : ''}`}
                onClick={() => handleSelectAdmin(admin)}
              >
                <div className="admin-info">
                  <div className="admin-name">{admin.name}</div>
                  <div className="admin-username">@{admin.username}</div>
                  <div className="admin-email">{admin.email}</div>
                </div>
                <div className={`admin-status ${admin.isActive ? 'active' : 'inactive'}`}>
                  {admin.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Store Management */}
        {selectedAdmin && (
          <div className="store-mgmt-store-section">
            <div className="store-section-header">
              <h3>Cửa hàng của {selectedAdmin.name}</h3>
              <button 
                className="store-mgmt-create-btn"
                onClick={() => setShowCreateForm(true)}
              >
                + Thêm cửa hàng
              </button>
            </div>

            <div className="store-mgmt-store-list">
              {stores.length === 0 ? (
                <div className="store-mgmt-empty">
                  <p>Admin này chưa có cửa hàng nào</p>
                </div>
              ) : (
                stores.map(store => (
                  <div key={store.id} className="store-mgmt-store-card">
                    <div className="store-info">
                      <div className="store-name">{store.name}</div>
                      <div className="store-address">{store.address}</div>
                      <div className="store-phone">{store.phone}</div>
                      <div className="store-employee">
                        Nhân viên: {store.employeeName} (@{store.employeeUsername})
                      </div>
                    </div>
                    <div className="store-actions">
                      <div className={`store-status ${store.isActive ? 'active' : 'inactive'}`}>
                        {store.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                      </div>
                      <div className="store-buttons">
                        <button
                          className="store-edit-btn"
                          onClick={() => openEditForm(store)}
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          className="store-delete-btn"
                          onClick={() => handleDeleteStore(store.id, store.name)}
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="store-mgmt-modal">
          <div className="store-mgmt-modal-content">
            {creating && (
              <div className="store-mgmt-creating-overlay">
                <div className="creating-spinner"></div>
                <div className="creating-text">Đang tạo cửa hàng...</div>
              </div>
            )}
            <h3>Thêm cửa hàng mới</h3>
            <form onSubmit={handleCreateStore}>
              <div className="store-mgmt-form-row">
                <div className="store-mgmt-form-group">
                  <label>Username nhân viên:</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    required
                  />
                </div>
                
                <div className="store-mgmt-form-group">
                  <label>Mật khẩu:</label>
                  <div className="password-input-row">
                    <input
                      type={showCreatePwd ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                    />
                    <button type="button" className="toggle-eye-btn" onClick={() => setShowCreatePwd(p => !p)}>
                      {showCreatePwd ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="store-mgmt-form-group">
                <label>Tên nhân viên:</label>
                <input
                  type="text"
                  value={formData.employeeName}
                  onChange={(e) => setFormData({...formData, employeeName: e.target.value})}
                  required
                />
              </div>
              
              <div className="store-mgmt-form-group">
                <label>Tên cửa hàng:</label>
                <input
                  type="text"
                  value={formData.storeName}
                  onChange={(e) => setFormData({...formData, storeName: e.target.value})}
                  required
                />
              </div>
              
              <div className="store-mgmt-form-group">
                <label>Địa chỉ cửa hàng:</label>
                <textarea
                  value={formData.storeAddress}
                  onChange={(e) => setFormData({...formData, storeAddress: e.target.value})}
                  rows="3"
                />
              </div>
              
              <div className="store-mgmt-form-group">
                <label>Số điện thoại:</label>
                <input
                  type="text"
                  value={formData.storePhone}
                  onChange={(e) => setFormData({...formData, storePhone: e.target.value})}
                />
              </div>
              
              <div className="store-mgmt-form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  />
                  Hoạt động
                </label>
              </div>

              <div className="store-mgmt-form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.allowChangePassword}
                    onChange={(e) => setFormData({...formData, allowChangePassword: e.target.checked})}
                  />
                  Cho phép hiển thị Đổi mật khẩu cho nhân viên
                </label>
              </div>

              <div className="store-mgmt-form-row">
                <div className="store-mgmt-form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.showLotteryResults}
                      onChange={(e) => setFormData({...formData, showLotteryResults: e.target.checked})}
                    />
                    Hiển thị tab Kết quả xổ số
                  </label>
                </div>
              </div>
              
              <div className="store-mgmt-form-actions">
                <button type="submit" disabled={creating}>{creating ? 'Đang tạo...' : 'Tạo cửa hàng'}</button>
                <button type="button" onClick={() => setShowCreateForm(false)} disabled={creating}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {showEditForm && (
        <div className="store-mgmt-modal">
          <div className="store-mgmt-modal-content">
            <h3>Sửa thông tin cửa hàng</h3>
            <form onSubmit={handleEditStore}>
              <div className="store-mgmt-form-group">
                <label>Tên nhân viên:</label>
                <input
                  type="text"
                  value={formData.employeeName}
                  onChange={(e) => setFormData({...formData, employeeName: e.target.value})}
                  required
                />
              </div>
              
              <div className="store-mgmt-form-group">
                <label>Tên cửa hàng:</label>
                <input
                  type="text"
                  value={formData.storeName}
                  onChange={(e) => setFormData({...formData, storeName: e.target.value})}
                  required
                />
              </div>
              
              <div className="store-mgmt-form-group">
                <label>Địa chỉ cửa hàng:</label>
                <textarea
                  value={formData.storeAddress}
                  onChange={(e) => setFormData({...formData, storeAddress: e.target.value})}
                  rows="3"
                />
              </div>
              
              <div className="store-mgmt-form-group">
                <label>Số điện thoại:</label>
                <input
                  type="text"
                  value={formData.storePhone}
                  onChange={(e) => setFormData({...formData, storePhone: e.target.value})}
                />
              </div>
              
              <div className="store-mgmt-form-group">
                <label>Mật khẩu mới (để trống nếu không đổi):</label>
                <div className="password-input-row">
                  <input
                    type={showEditPwd ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Để trống nếu không thay đổi"
                  />
                  <button type="button" className="toggle-eye-btn" onClick={() => setShowEditPwd(p => !p)}>
                    {showEditPwd ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              
              <div className="store-mgmt-form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  />
                  Hoạt động
                </label>
              </div>

              <div className="store-mgmt-form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.allowChangePassword}
                    onChange={(e) => setFormData({...formData, allowChangePassword: e.target.checked})}
                  />
                  Cho phép hiển thị Đổi mật khẩu cho nhân viên
                </label>
              </div>

              <div className="store-mgmt-form-row">
                <div className="store-mgmt-form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.showLotteryResults}
                      onChange={(e) => setFormData({...formData, showLotteryResults: e.target.checked})}
                    />
                    Hiển thị tab Kết quả xổ số
                  </label>
                </div>
              </div>
              
              <div className="store-mgmt-form-actions">
                <button type="submit">Cập nhật</button>
                <button type="button" onClick={() => setShowEditForm(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreManagement;