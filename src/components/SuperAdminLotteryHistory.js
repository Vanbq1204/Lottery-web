import { getApiUrl } from '../config/api';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SuperAdminLotteryHistory.css';

const SuperAdminLotteryHistory = () => {
  const getCurrentVietnamDate = () => {
    const now = new Date();
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    return vietnamTime.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getCurrentVietnamDate());
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formatDateTime = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  };

  const loadHistory = async (date = selectedDate) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const resp = await axios.get(getApiUrl(`/superadmin/system-history/lottery?date=${date}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.data?.success) setHistory(resp.data.history || []);
    } catch (error) {
      alert('Lỗi tải lịch sử kết quả xổ số: ' + (error.response?.data?.message || error.message));
    } finally { setLoading(false); }
  };

  useEffect(() => { loadHistory(selectedDate); }, []); // initial

  const onDateChange = (e) => {
    const d = e.target.value;
    setSelectedDate(d);
    loadHistory(d);
  };

  const deleteHistoryForDate = async () => {
    if (!selectedDate) return;
    const [y, m, d] = selectedDate.split('-');
    const displayDate = `${d}/${m}/${y}`;
    if (!window.confirm(`Bạn có chắc muốn xóa toàn bộ lịch sử kết quả xổ số ngày ${displayDate}?`)) return;
    try {
      setDeleting(true);
      const token = localStorage.getItem('token');
      const resp = await axios.delete(getApiUrl(`/superadmin/system-history/lottery?date=${selectedDate}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.data?.success) {
        await loadHistory(selectedDate);
        alert(`Đã xóa ${resp.data.deleted || 0} bản ghi lịch sử cho ngày ${displayDate}`);
      } else {
        alert(resp.data?.message || 'Không thể xóa lịch sử');
      }
    } catch (error) {
      alert('Lỗi xóa lịch sử: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeleting(false);
    }
  };

  const changed = (a, b) => {
    const sa = Array.isArray(a) ? a.join(', ') : (a || '');
    const sb = Array.isArray(b) ? b.join(', ') : (b || '');
    return sa.trim() !== sb.trim();
  };

  const renderResultsRow = (label, before, after) => (
    <tr className={`sa-history-row ${changed(before, after) ? 'changed' : ''}`}>
      <td className="sa-history-cell sa-history-label">{label}</td>
      <td className="sa-history-cell sa-history-before sa-mono">{Array.isArray(before) ? before.join(', ') : (before || '')}</td>
      <td className="sa-history-cell sa-history-after sa-mono">{Array.isArray(after) ? after.join(', ') : (after || '')}</td>
    </tr>
  );

  return (
    <div className="sa-history-container">
      <div className="sa-history-header">
        <div className="sa-history-title">📜 Lịch sử hệ thống</div>
        <div className="sa-history-subtitle">Lịch sử kết quả xổ số do nhân viên nhập</div>
      </div>

      <div className="sa-history-controls">
        <div className="sa-control-group">
          <label>Chọn ngày:</label>
          <input type="date" value={selectedDate} onChange={onDateChange} />
        </div>
        <button className="sa-reload-btn" onClick={() => loadHistory(selectedDate)} disabled={loading}>
          {loading ? 'Đang tải...' : 'Tải lại'}
        </button>
        <button className="sa-delete-btn" onClick={deleteHistoryForDate} disabled={deleting}>
          {deleting ? 'Đang xóa...' : 'Xóa lịch sử ngày này'}
        </button>
      </div>

      {history.length === 0 ? (
        <div className="sa-empty">Không có lịch sử cho ngày này.</div>
      ) : (
        history.map(h => (
          <div key={h._id} className="sa-history-card">
            <div className="sa-history-meta">
              <div className="sa-meta-left">
                <div className="sa-meta-date">Ngày {h.turnNum}</div>
                <div className="sa-meta-time">Thời điểm: {formatDateTime(h.changedAt)}</div>
              </div>
              <div className="sa-meta-right">
                <span className={`sa-badge ${h.action === 'create' ? 'sa-badge--create' : 'sa-badge--update'}`}>
                  {h.action === 'create' ? 'Nhập lần đầu' : 'Cập nhật'}
                </span>
                <span className="sa-badge sa-badge--user">Nhân viên: {h.changedByName || h.changedByUsername || 'N/A'}</span>
                {h.storeName && <span className="sa-badge sa-badge--store">Cửa hàng: {h.storeName}</span>}
              </div>
            </div>

            <div className="sa-table-wrapper">
              <table className="sa-history-table">
                <thead>
                  <tr>
                    <th>Giải</th>
                    <th>Trước</th>
                    <th>Sau</th>
                  </tr>
                </thead>
                <tbody>
                  {renderResultsRow('G.ĐB', h.beforeResults?.gdb || '', h.afterResults?.gdb || '')}
                  {renderResultsRow('G.1', h.beforeResults?.g1 || '', h.afterResults?.g1 || '')}
                  {renderResultsRow('G.2', h.beforeResults?.g2 || [], h.afterResults?.g2 || [])}
                  {renderResultsRow('G.3', h.beforeResults?.g3 || [], h.afterResults?.g3 || [])}
                  {renderResultsRow('G.4', h.beforeResults?.g4 || [], h.afterResults?.g4 || [])}
                  {renderResultsRow('G.5', h.beforeResults?.g5 || [], h.afterResults?.g5 || [])}
                  {renderResultsRow('G.6', h.beforeResults?.g6 || [], h.afterResults?.g6 || [])}
                  {renderResultsRow('G.7', h.beforeResults?.g7 || [], h.afterResults?.g7 || [])}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default SuperAdminLotteryHistory;