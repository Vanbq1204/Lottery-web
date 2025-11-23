import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { getApiUrl } from '../config/api';
import './SuperAdminNotifications.css';

const SuperAdminNotifications = () => {
  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [scope, setScope] = useState('all');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [sending, setSending] = useState(false);
  const [sentList, setSentList] = useState([]);

  const loadSent = async () => {
    try {
      const res = await axios.get(getApiUrl('/notifications/sent'), { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setSentList(res.data);
    } catch (_) { }
  };

  useEffect(() => { loadSent(); }, []);

  const search = async () => {
    try {
      const params = {};
      if (query) params.q = query;
      if (roleFilter !== 'all') params.role = roleFilter;
      const res = await axios.get(getApiUrl('/notifications/recipients'), { params, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setSearchResults(res.data);
    } catch (_) { }
  };

  const toggleRecipient = (u) => {
    const exists = selectedRecipients.find(x => x.id === u.id);
    if (exists) setSelectedRecipients(selectedRecipients.filter(x => x.id !== u.id));
    else setSelectedRecipients([...selectedRecipients, u]);
  };

  const send = async () => {
    if (!title.trim() || !contentHtml.trim()) return;
    setSending(true);
    try {
      const payload = { title, contentHtml, scope };
      if (scope === 'custom') payload.recipientIds = selectedRecipients.map(r => r.id);
      await axios.post(getApiUrl('/notifications'), payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setTitle('');
      setContentHtml('');
      setSelectedRecipients([]);
      loadSent();
      alert('Đã gửi thông báo thành công!');
    } catch (e) {
      alert('Lỗi khi gửi thông báo');
    } finally {
      setSending(false);
    }
  };

  const deleteNotif = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá thông báo này?')) return;
    try {
      await axios.delete(getApiUrl(`/notifications/${id}`), { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setSentList(sentList.filter(n => n.id !== id));
    } catch (e) {
      alert('Lỗi khi xoá thông báo');
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ color: [] }],
      [{ align: [] }],
      ['clean']
    ]
  };

  const formats = ['header', 'bold', 'italic', 'underline', 'color', 'align'];

  return (
    <div className="sa-notifications-container">
      <div className="sa-header">
        <h2>📢 Quản lý Thông báo</h2>
      </div>

      <div className="sa-card">
        <h3>✨ Soạn thông báo mới</h3>

        <div className="form-group">
          <label className="form-label">Tiêu đề thông báo</label>
          <input
            className="input-modern"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề thông báo..."
          />
        </div>

        <div className="form-group quill-container">
          <label className="form-label">Nội dung chi tiết</label>
          <ReactQuill
            theme="snow"
            value={contentHtml}
            onChange={setContentHtml}
            modules={modules}
            formats={formats}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Đối tượng nhận tin</label>
          <div className="scope-options">
            <label className="scope-option">
              <input type="radio" name="scope" value="all" checked={scope === 'all'} onChange={e => setScope(e.target.value)} />
              <div className="scope-card">
                <span className="scope-card-icon">🌍</span>
                <span>Toàn bộ hệ thống</span>
              </div>
            </label>
            <label className="scope-option">
              <input type="radio" name="scope" value="admins" checked={scope === 'admins'} onChange={e => setScope(e.target.value)} />
              <div className="scope-card">
                <span className="scope-card-icon">🛡️</span>
                <span>Chỉ Admin</span>
              </div>
            </label>
            <label className="scope-option">
              <input type="radio" name="scope" value="employees" checked={scope === 'employees'} onChange={e => setScope(e.target.value)} />
              <div className="scope-card">
                <span className="scope-card-icon">👥</span>
                <span>Chỉ Nhân viên</span>
              </div>
            </label>
            <label className="scope-option">
              <input type="radio" name="scope" value="custom" checked={scope === 'custom'} onChange={e => setScope(e.target.value)} />
              <div className="scope-card">
                <span className="scope-card-icon">🎯</span>
                <span>Chọn riêng</span>
              </div>
            </label>
          </div>
        </div>

        {scope === 'custom' && (
          <div className="recipient-selector">
            <div className="search-bar">
              <input
                className="search-input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Tìm theo tên, username, cửa hàng..."
              />
              <select className="role-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                <option value="all">Tất cả vai trò</option>
                <option value="admin">Admin</option>
                <option value="employee">Nhân viên</option>
              </select>
              <button className="btn-search" onClick={search}>Tìm kiếm</button>
            </div>

            <div className="recipient-grids">
              <div className="recipient-column">
                <h4>Kết quả tìm kiếm</h4>
                <div className="sa-user-list">
                  {searchResults.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>Không có kết quả</div>}
                  {searchResults.map(u => (
                    <div key={u.id} className="sa-user-item">
                      <div className="sa-user-info">
                        <div className="sa-user-name">{u.name}</div>
                        <div className="sa-user-meta">{u.username} • {u.role === 'admin' ? 'Admin' : 'Nhân viên'}</div>
                        {u.storeName && <div className="sa-user-meta">🏠 {u.storeName}</div>}
                      </div>
                      <button className="btn-action btn-add" onClick={() => toggleRecipient(u)}>+ Thêm</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="recipient-column">
                <h4>Đã chọn ({selectedRecipients.length})</h4>
                <div className="sa-user-list">
                  {selectedRecipients.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>Chưa chọn ai</div>}
                  {selectedRecipients.map(u => (
                    <div key={u.id} className="sa-user-item">
                      <div className="sa-user-info">
                        <div className="sa-user-name">{u.name}</div>
                        <div className="sa-user-meta">{u.username}</div>
                      </div>
                      <button className="btn-action btn-remove" onClick={() => toggleRecipient(u)}>✕ Xóa</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="btn-send-wrapper">
          <button className="btn-send" onClick={send} disabled={sending}>
            {sending ? '⏳ Đang gửi...' : '🚀 Gửi thông báo ngay'}
          </button>
        </div>
      </div>

      <div className="sa-card">
        <h3>📜 Lịch sử thông báo đã gửi</h3>
        <div className="history-list">
          {sentList.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>Chưa có thông báo nào được gửi.</div>}
          {sentList.map(n => (
            <div key={n.id} className="history-item">
              <div className="history-header">
                <div className="history-title">{n.title}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div className="badge badge-scope">{n.scope}</div>
                  <button className="btn-delete-history" onClick={() => deleteNotif(n.id)} title="Xoá thông báo">🗑️</button>
                </div>
              </div>
              <div className="history-meta">
                <span>🕒 {new Date(n.createdAt).toLocaleString()}</span>
                <span>•</span>
                <span>📨 {n.recipientsCount} người nhận</span>
                <span>•</span>
                <span>✍️ {n.authorName}</span>
              </div>
              <div className="history-content" dangerouslySetInnerHTML={{ __html: n.contentHtml }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminNotifications;