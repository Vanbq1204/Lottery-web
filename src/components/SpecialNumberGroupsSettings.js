import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config/api';

const SpecialNumberGroupsSettings = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', numbers: '' });

  const loadGroups = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const resp = await axios.get(getApiUrl('/employee/special-number-groups'), {
        headers: { Authorization: `Bearer ${token}` },
        params: { betType: 'bo' }
      });
      if (resp.data?.success) setGroups(resp.data.data || []);
      else setMessage(resp.data?.message || 'Không thể tải bộ số đặc biệt');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Lỗi server khi tải bộ số đặc biệt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGroups(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.numbers) {
      setMessage('Vui lòng nhập tên bộ và danh sách số');
      return;
    }
    // Validate name: viết liền không dấu, chỉ chữ a-z (không chứa số)
    if (!/^[a-z]+$/.test(form.name.trim().toLowerCase())) {
      setMessage('Tên bộ phải viết liền không dấu, chỉ gồm chữ a-z (không chứa số)');
      return;
    }
    // Cảnh báo trùng với bộ hệ thống (BODATA)
    const reservedNames = new Set([
      ...Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0')),
      'chanle', 'lechan', 'lele', 'chanchan',
      'chamkhong', 'chammot', 'chamhai', 'chamba', 'chambon', 'chamnam', 'chamsau', 'chambay', 'chamtam', 'chamchin'
    ]);
    const normalizedName = form.name.trim().toLowerCase();
    if (reservedNames.has(normalizedName)) {
      setMessage('Tên bộ trùng với bộ hệ thống (BODATA). Vui lòng chọn tên khác.');
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const resp = await axios.post(getApiUrl('/employee/special-number-groups'), {
        name: form.name,
        numbers: form.numbers,
        betType: 'bo'
      }, { headers: { Authorization: `Bearer ${token}` } });
      if (resp.data?.success) {
        setMessage('Đã tạo bộ số');
        setForm({ name: '', numbers: '' });
        loadGroups();
      } else {
        setMessage(resp.data?.message || 'Không thể tạo bộ số');
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Lỗi server khi tạo bộ số');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (groupId) => {
    if (!window.confirm('Xóa bộ số này?')) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const resp = await axios.delete(getApiUrl(`/employee/special-number-groups/${groupId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.data?.success) {
        setMessage('Đã xóa bộ số');
        loadGroups();
      } else {
        setMessage(resp.data?.message || 'Không thể xóa bộ số');
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Lỗi server khi xóa bộ số');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="special-groups-settings" style={{ padding: '20px' }}>
      <h2>🗂️ Quản lý Bộ (động) cho loại cược “Bộ”</h2>
      <p>Thêm các bộ số tùy chỉnh để sử dụng khi đánh “Bộ”. Tên bộ <strong>viết liền không dấu</strong> (ví dụ: <em>toto</em>, <em>nhonho</em>). Các số trong bộ là các số 2 chữ số (00–99).</p>

      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>Tên bộ (viết liền không dấu):</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="VD: toto, nhonho"
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
        />
        <label style={{ display: 'block', marginBottom: 8 }}>Các số trong bộ (cách nhau bởi dấu cách hoặc dấu phẩy):</label>
        <textarea
          value={form.numbers}
          onChange={(e) => setForm(prev => ({ ...prev, numbers: e.target.value }))}
          placeholder="VD: 00 02 04 06 08 10 12 14 ..."
          rows={4}
          style={{ width: '100%', padding: '10px' }}
        />
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <button onClick={handleCreate} disabled={loading} className="btn btn-save">{loading ? '🔄' : '➕ Thêm bộ'}</button>
          <button onClick={loadGroups} disabled={loading} className="btn btn-refresh">🔄 Tải lại</button>
        </div>
        {message && <div style={{ marginTop: 10, color: message.includes('Đã') ? '#2c5530' : '#b00020' }}>{message}</div>}
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Danh sách bộ số</h3>
        {groups.length === 0 ? (
          <div>Chưa có bộ số nào</div>
        ) : (
          <table className="twos-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Tên bộ</th>
                <th style={{ textAlign: 'left' }}>Số lượng</th>
                <th style={{ textAlign: 'left' }}>Danh sách số</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(g => (
                <tr key={g._id}>
                  <td>{g.name}</td>
                  <td>{g.numbers?.length || 0}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>{(g.numbers || []).join(', ')}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => handleDelete(g._id)} className="btn btn-delete">🗑️ Xóa</button>
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

export default SpecialNumberGroupsSettings;