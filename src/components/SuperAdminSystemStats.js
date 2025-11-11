import { getApiUrl } from '../config/api';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SuperAdminInterface.css';

const SuperAdminSystemStats = () => {
  const getCurrentVietnamDate = () => {
    const now = new Date();
    const vietnamTime = new Date(now.toLocaleString('en-US', {timeZone: 'Asia/Ho_Chi_Minh'}));
    const d = String(vietnamTime.getDate()).padStart(2,'0');
    const m = String(vietnamTime.getMonth()+1).padStart(2,'0');
    const y = vietnamTime.getFullYear();
    return `${y}-${m}-${d}`;
  };

  const [date, setDate] = useState(getCurrentVietnamDate());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadStats = async (d) => {
    try {
      setLoading(true); setError('');
      const token = localStorage.getItem('token');
      const resp = await axios.get(getApiUrl(`/superadmin/system-statistics?date=${d}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.data?.success) setRows(resp.data.admins || []);
      else setError(resp.data?.message || 'Không thể tải thống kê');
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi server khi tải thống kê');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStats(date); }, []);

  const formatN = (n) => (parseInt(n)||0).toLocaleString('vi-VN').replace(/,/g,'.');

  return (
    <div className="super-admin-system-stats">
      <div className="super-admin-header">
        <h2>Thống kê toàn bộ hệ thống</h2>
        <p>Báo cáo gộp theo từng Admin (tổng các cửa hàng).</p>
      </div>
      <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:12}}>
        <label>Ngày:</label>
        <input type="date" value={date} onChange={(e)=>{setDate(e.target.value); loadStats(e.target.value);}} />
        <button onClick={()=>loadStats(date)} disabled={loading}>{loading?'Đang tải...':'Tải lại'}</button>
      </div>
      {error && <div style={{color:'#d32f2f',fontWeight:600}}>{error}</div>}
      <div className="system-stats-table-wrapper">
        <table className="system-stats-table">
          <thead>
            <tr>
              <th>Admin</th>
              <th>Tổng doanh thu</th>
              <th>Lô</th>
              <th>2 số</th>
              <th>3 số</th>
              <th>4 số</th>
              <th>Tổng</th>
              <th>Đầu</th>
              <th>Đít</th>
              <th>Kép</th>
              <th>Bộ</th>
              <th>Xiên</th>
              <th>Xiên quay</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=> (
              <tr key={r.adminId}>
                <td>{r.adminName}</td>
                <td>{formatN(r.totalRevenue)}</td>
                <td>{formatN(r.lotoTotal)}</td>
                <td>{formatN(r['2sTotal'])}</td>
                <td>{formatN(r['3sTotal'])}</td>
                <td>{formatN(r['4sTotal'])}</td>
                <td>{formatN(r.tongTotal)}</td>
                <td>{formatN(r.dauTotal)}</td>
                <td>{formatN(r.ditTotal)}</td>
                <td>{formatN(r.kepTotal)}</td>
                <td>{formatN(r.boTotal)}</td>
                <td>{formatN(r.xienTotal)}</td>
                <td>{formatN(r.xienquayTotal)}</td>
              </tr>
            ))}
            {rows.length===0 && !loading && (
              <tr><td colSpan="13" style={{textAlign:'center',color:'#666'}}>Không có dữ liệu</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SuperAdminSystemStats;