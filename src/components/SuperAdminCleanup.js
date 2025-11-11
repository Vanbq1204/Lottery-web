import { getApiUrl } from '../config/api';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SuperAdminInterface.css';

const SuperAdminCleanup = () => {
  const [admins, setAdmins] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [date, setDate] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');

  const getCurrentVNDateStr = () => {
    const now = new Date();
    const vn = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const y = vn.getFullYear();
    const m = String(vn.getMonth()+1).padStart(2,'0');
    const d = String(vn.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  };
  const retentionMaxSelectable = () => {
    const base = new Date(getCurrentVNDateStr()+ 'T00:00:00+07:00');
    base.setDate(base.getDate() - 3); // chỉ cho chọn từ 3 ngày trước trở về trước (giữ lại hôm nay & hôm qua)
    const y = base.getFullYear();
    const m = String(base.getMonth()+1).padStart(2,'0');
    const d = String(base.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  };

  const isDateAllowed = (dStr) => {
    if (!dStr) return false;
    const today = new Date(getCurrentVNDateStr()+ 'T00:00:00+07:00');
    const retention = new Date(today);
    retention.setDate(today.getDate()-2); // giữ lại 2 ngày gần nhất
    const target = new Date(dStr+ 'T00:00:00+07:00');
    return target < retention;
  };

  const loadAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const resp = await axios.get(getApiUrl('/superadmin/admins'), { headers: { Authorization: `Bearer ${token}` } });
      if (resp.data?.success) setAdmins(resp.data.admins || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách admin');
    }
  };

  useEffect(()=>{ loadAdmins(); }, []);

  const checkStats = async () => {
    setError(''); setLoading(true);
    try {
      if (!selectedAdminId) { setError('Vui lòng chọn Admin'); setLoading(false); return; }
      if (!isDateAllowed(date)) { setError('Chỉ được xóa các ngày trước 2 ngày gần nhất'); setLoading(false); return; }
      const token = localStorage.getItem('token');
      const resp = await axios.get(getApiUrl(`/superadmin/cleanup/stats?adminId=${selectedAdminId}&date=${date}`), { headers: { Authorization: `Bearer ${token}` } });
      if (resp.data?.success) { setStats(resp.data.stats || null); setConfirm(true); }
      else setError(resp.data?.message || 'Không thể lấy thống kê');
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi server khi lấy thống kê');
    } finally { setLoading(false); }
  };

  const performCleanup = async () => {
    setError(''); setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const resp = await axios.delete(getApiUrl(`/superadmin/cleanup?adminId=${selectedAdminId}&date=${date}`), { headers: { Authorization: `Bearer ${token}` } });
      if (resp.data?.success) {
        alert(`Đã xóa thành công:\n- ${resp.data.deletedInvoices} hóa đơn cược\n- ${resp.data.deletedWinningInvoices} hóa đơn thưởng`);
        setConfirm(false); setStats(null);
      } else setError(resp.data?.message || 'Không thể xóa');
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi server khi xóa dữ liệu');
    } finally { setLoading(false); }
  };

  return (
    <div className="super-admin-content">
      <div className="super-admin-header">
        <h2>Làm sạch dữ liệu theo ngày</h2>
        <p>Chọn Admin và ngày (chỉ cho phép xóa trước 2 ngày gần nhất).</p>
      </div>

      <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:12,flexWrap:'wrap'}}>
        <label>Admin:</label>
        <select value={selectedAdminId} onChange={(e)=>setSelectedAdminId(e.target.value)} style={{padding:'6px 8px'}}>
          <option value="">-- Chọn Admin --</option>
          {admins.map(a=> (<option key={a.id} value={a.id}>{a.name || a.username}</option>))}
        </select>
        <label>Ngày cần xóa:</label>
        <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} max={retentionMaxSelectable()} />
        <button onClick={checkStats} disabled={loading || !selectedAdminId || !date}>{loading?'Đang kiểm tra...':'🔍 Kiểm tra dữ liệu sẽ xóa'}</button>
      </div>

      {error && <div style={{color:'#d32f2f',fontWeight:600,marginBottom:8}}>{error}</div>}

      {confirm ? (
        <div>
          <div className="super-admin-placeholder" style={{minHeight:'auto'}}>
            <div className="placeholder-box" style={{maxWidth:600}}>
              <h3>📊 Thống kê dữ liệu sẽ bị xóa</h3>
              {stats ? (
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                  <div className="stat-card"><div className="stat-number">{stats.totalInvoices}</div><div className="stat-label">Hóa đơn cược</div></div>
                  <div className="stat-card"><div className="stat-number">{stats.totalWinningInvoices}</div><div className="stat-label">Hóa đơn thưởng</div></div>
                  <div className="stat-card"><div className="stat-number">{stats.affectedStores}</div><div className="stat-label">Cửa hàng bị ảnh hưởng</div></div>
                </div>
              ) : <p>Không có dữ liệu.</p>}
            </div>
          </div>

          <div style={{display:'flex',gap:12,marginTop:12}}>
            <button onClick={()=>{setConfirm(false); setStats(null);}}>❌ Hủy bỏ</button>
            <button onClick={performCleanup} disabled={loading}>{loading?'Đang xóa...':'🗑️ Xác nhận xóa'}</button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SuperAdminCleanup;