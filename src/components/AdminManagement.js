import { getApiUrl } from '../config/api';

import React, { useState, useEffect } from 'react';
import './AdminManagement.css';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [availableStores, setAvailableStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    storeId: '',
    allowChangePassword: true,
    allowMessageExport: true
  });
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    password: '',
    allowChangePassword: true,
    allowMessageExport: true
  });
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showCreatePwd, setShowCreatePwd] = useState(false);
  const [showEditPwd, setShowEditPwd] = useState(false);

  useEffect(() => {
    loadAdmins();
    loadAvailableStores();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.admin-mgmt-dropdown')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
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
        alert('Lỗi: ' + data.message);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách admin:', error);
      alert('Lỗi khi tải danh sách admin');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableStores = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/superadmin/available-stores'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setAvailableStores(data.stores);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách stores:', error);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password || !formData.name || !formData.email) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/superadmin/admins'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        alert('Tạo admin thành công');
        setShowCreateForm(false);
        setFormData({ username: '', password: '', name: '', email: '', storeId: '' });
        loadAdmins();
        loadAvailableStores();
      } else {
        alert('Lỗi: ' + data.message);
      }
    } catch (error) {
      console.error('Lỗi tạo admin:', error);
      alert('Lỗi khi tạo admin');
    }
  };

  const handleUpdateAdmin = async (adminId, updateData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/superadmin/admins/${adminId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      if (data.success) {
        alert('Cập nhật thành công');
        loadAdmins();
      } else {
        alert('Lỗi: ' + data.message);
      }
    } catch (error) {
      console.error('Lỗi cập nhật admin:', error);
      alert('Lỗi khi cập nhật admin');
    }
  };

  const handleDeleteAdmin = async (adminId, adminName) => {
    if (!window.confirm(`Bạn có chắc muốn xóa admin "${adminName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/superadmin/admins/${adminId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        alert('Xóa admin thành công');
        loadAdmins();
        loadAvailableStores();
      } else {
        alert('Lỗi: ' + data.message);
      }
    } catch (error) {
      console.error('Lỗi xóa admin:', error);
      alert('Lỗi khi xóa admin');
    }
  };

  const toggleAdminStatus = (adminId, currentStatus) => {
    const newStatus = !currentStatus;
    const message = newStatus ? 'kích hoạt' : 'vô hiệu hóa';
    
    if (window.confirm(`Bạn có chắc muốn ${message} tài khoản này?`)) {
      handleUpdateAdmin(adminId, { isActive: newStatus });
    }
  };

  const toggleDropdown = (adminId) => {
    setOpenDropdown(openDropdown === adminId ? null : adminId);
  };

  const openEditForm = (admin) => {
    setEditingAdmin(admin);
    setEditFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      allowChangePassword: admin.allowChangePassword ?? true,
      allowMessageExport: admin.allowMessageExport ?? true
    });
    setShowEditForm(true);
    setOpenDropdown(null); // Close dropdown
  };

  const handleEditAdmin = async (e) => {
    e.preventDefault();
    
    if (!editFormData.name || !editFormData.email) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const updateData = {
      name: editFormData.name,
      email: editFormData.email,
      allowChangePassword: !!editFormData.allowChangePassword,
      allowMessageExport: !!editFormData.allowMessageExport
    };

    if (editFormData.password) {
      updateData.password = editFormData.password;
    }

    try {
      await handleUpdateAdmin(editingAdmin.id, updateData);
      setShowEditForm(false);
      setEditingAdmin(null);
      setEditFormData({ name: '', email: '', password: '' });
    } catch (error) {
      // Error handled in handleUpdateAdmin
    }
  };

  if (loading) {
    return <div className="admin-mgmt-loading">Đang tải...</div>;
  }

  return (
    <div className="admin-mgmt-container">
      <div className="admin-mgmt-header">
        <h2>Quản lý tài khoản Admin</h2>
        <button 
          className="admin-mgmt-create-btn"
          onClick={() => setShowCreateForm(true)}
        >
          + Tạo Admin mới
        </button>
      </div>

      {/* Edit Form Modal */}
      {showEditForm && (
        <div className="admin-mgmt-modal">
          <div className="admin-mgmt-modal-content">
            <h3>Sửa thông tin Admin</h3>
            <form onSubmit={handleEditAdmin}>
              <div className="admin-mgmt-form-group">
                <label>Họ tên:</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="admin-mgmt-form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="admin-mgmt-form-group">
                <label>Mật khẩu mới (để trống nếu không đổi):</label>
                <div className="password-input-row">
                  <input
                    type={showEditPwd ? 'text' : 'password'}
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                    placeholder="Để trống nếu không thay đổi"
                  />
                  <button type="button" className="toggle-eye-btn" onClick={() => setShowEditPwd(p => !p)}>
                    {showEditPwd ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              
              <div className="admin-mgmt-form-group">
                <label>
                  <input type="checkbox" checked={editFormData.allowChangePassword} onChange={(e)=>setEditFormData({...editFormData, allowChangePassword: e.target.checked})} />
                  Cho phép hiển thị Đổi mật khẩu
                </label>
              </div>
              <div className="admin-mgmt-form-group">
                <label>
                  <input type="checkbox" checked={editFormData.allowMessageExport} onChange={(e)=>setEditFormData({...editFormData, allowMessageExport: e.target.checked})} />
                  Cho phép sử dụng Xuất tin nhắn
                </label>
              </div>

              <div className="admin-mgmt-form-actions">
                <button type="submit">Cập nhật</button>
                <button type="button" onClick={() => setShowEditForm(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="admin-mgmt-modal">
          <div className="admin-mgmt-modal-content">
            <h3>Tạo tài khoản Admin mới</h3>
            <form onSubmit={handleCreateAdmin}>
              <div className="admin-mgmt-form-group">
                <label>Username:</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                />
              </div>
              
              <div className="admin-mgmt-form-group">
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
              
              <div className="admin-mgmt-form-group">
                <label>Họ tên:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="admin-mgmt-form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="admin-mgmt-form-group">
                <label>Cửa hàng (tạm thời bỏ qua):</label>
                <select
                  value={formData.storeId}
                  onChange={(e) => setFormData({...formData, storeId: e.target.value})}
                  disabled
                >
                  <option value="">Sẽ triển khai sau</option>
                </select>
                <small style={{color: '#666', fontSize: '12px'}}>
                  Chức năng quản lý cửa hàng sẽ được triển khai sau
                </small>
              </div>
              
              <div className="admin-mgmt-form-group">
                <label>
                  <input type="checkbox" checked={formData.allowChangePassword} onChange={(e)=>setFormData({...formData, allowChangePassword: e.target.checked})} />
                  Cho phép hiển thị Đổi mật khẩu
                </label>
              </div>
              <div className="admin-mgmt-form-group">
                <label>
                  <input type="checkbox" checked={formData.allowMessageExport} onChange={(e)=>setFormData({...formData, allowMessageExport: e.target.checked})} />
                  Cho phép sử dụng Xuất tin nhắn
                </label>
              </div>

              <div className="admin-mgmt-form-actions">
                <button type="submit">Tạo Admin</button>
                <button type="button" onClick={() => setShowCreateForm(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin List */}
      <div className="admin-mgmt-list">
        {admins.length === 0 ? (
          <div className="admin-mgmt-empty">
            <p>Chưa có admin nào</p>
          </div>
        ) : (
          <table className="admin-mgmt-table">
                          <thead>
                <tr>
                  <th>Username</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Hành động</th>
                </tr>
              </thead>
            <tbody>
              {admins.map(admin => (
                <tr key={admin.id} className={openDropdown === admin.id ? 'dropdown-open' : ''}>
                  <td>{admin.username}</td>
                  <td>{admin.name}</td>
                  <td>{admin.email}</td>
                  <td>
                    <span className={`admin-mgmt-status ${admin.isActive ? 'active' : 'inactive'}`}>
                      {admin.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                    </span>
                  </td>
                  <td>
                    {new Date(admin.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td>
                    <div className="admin-mgmt-dropdown">
                      <button 
                        className={`admin-mgmt-dropdown-btn ${openDropdown === admin.id ? 'open' : ''}`}
                        onClick={() => toggleDropdown(admin.id)}
                      >
                        <span className="arrow-icon">▼</span>
                      </button>
                      <div className={`admin-mgmt-dropdown-content ${openDropdown === admin.id ? 'show' : ''}`}>
                        <button
                          className="admin-mgmt-dropdown-item edit"
                          onClick={() => openEditForm(admin)}
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          className={`admin-mgmt-dropdown-item ${admin.isActive ? 'deactivate' : 'activate'}`}
                          onClick={() => {
                            toggleAdminStatus(admin.id, admin.isActive);
                            setOpenDropdown(null);
                          }}
                        >
                          {admin.isActive ? '🚫 Vô hiệu hóa' : '✅ Kích hoạt'}
                        </button>
                        <button
                          className="admin-mgmt-dropdown-item delete"
                          onClick={() => {
                            handleDeleteAdmin(admin.id, admin.name);
                            setOpenDropdown(null);
                          }}
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminManagement;