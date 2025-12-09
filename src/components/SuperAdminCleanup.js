import { getApiUrl } from '../config/api';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SuperAdminInterface.css';

const SuperAdminCleanup = () => {
  const [date, setDate] = useState('');
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedStoreIds, setSelectedStoreIds] = useState(new Set());

  const getCurrentVNDateStr = () => {
    const now = new Date();
    const vn = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const y = vn.getFullYear();
    const m = String(vn.getMonth() + 1).padStart(2, '0');
    const d = String(vn.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const retentionMaxSelectable = () => {
    // Cho phép chọn bất kỳ ngày nào; chặn ở backend đối với hôm nay & ngày mai
    return '';
  };

  const isDateAllowed = (dStr) => {
    if (!dStr) return false;
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const todayStr = getCurrentVNDateStr();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const yy = yesterday.getFullYear();
    const ym = String(yesterday.getMonth() + 1).padStart(2, '0');
    const yd = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayStr = `${yy}-${ym}-${yd}`;
    return (dStr !== todayStr && dStr !== yesterdayStr);
  };

  const checkStats = async () => {
    setError('');
    setLoading(true);
    setStatsData(null);
    setSelectedStoreIds(new Set());

    try {
      if (!date) { setError('Vui lòng chọn ngày'); setLoading(false); return; }
      if (!isDateAllowed(date)) { setError('Chỉ được xóa các ngày trước 2 ngày gần nhất (Hôm nay và Hôm qua)'); setLoading(false); return; }

      const token = localStorage.getItem('token');
      const resp = await axios.get(getApiUrl(`/superadmin/cleanup/stats?date=${date}`), { headers: { Authorization: `Bearer ${token}` } });

      if (resp.data?.success) {
        const data = resp.data.data || [];
        setStatsData(data);

        // Auto-select stores where all winning invoices are paid (and there are winning invoices)
        const autoSelected = new Set();
        data.forEach(admin => {
          admin.stores.forEach(store => {
            // Logic: Auto-select if (totalWinning > 0 AND paid == totalWinning) OR (totalWinning == 0)
            // User request: "Nếu cửa hàng nào mà hoá đơn trả hết ví dụ 20/20 thì tự động tích vào"
            // Assuming if 0/0 (no winning invoices), we can also safely delete?
            // Let's stick to the user's example: 20/20 -> auto select.
            // If 0/0, it means no winning invoices to pay, so it's "paid all" in a trivial sense.
            // But usually we want to clean up old data regardless of winning status if it's old enough.
            // However, the user emphasized "paid/total".
            // Let's auto-select if paidWinningInvoices === totalWinningInvoices.
            if (store.paidWinningInvoices === store.totalWinningInvoices) {
              autoSelected.add(store.storeId);
            }
          });
        });
        setSelectedStoreIds(autoSelected);

      } else {
        setError(resp.data?.message || 'Không thể lấy thống kê');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi server khi lấy thống kê');
    } finally { setLoading(false); }
  };

  const handleCheckboxChange = (storeId) => {
    const newSelected = new Set(selectedStoreIds);
    if (newSelected.has(storeId)) {
      newSelected.delete(storeId);
    } else {
      newSelected.add(storeId);
    }
    setSelectedStoreIds(newSelected);
  };

  const performCleanup = async () => {
    if (selectedStoreIds.size === 0) {
      setError('Vui lòng chọn ít nhất một cửa hàng để xóa dữ liệu.');
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa dữ liệu ngày ${date} cho ${selectedStoreIds.size} cửa hàng đã chọn không?\n\nLƯU Ý: Hành động này sẽ xóa cả LỊCH SỬ XUẤT TIN NHẮN của các Admin liên quan.\n\nHành động này không thể hoàn tác!`)) {
      return;
    }

    setError(''); setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Send selected storeIds in body
      const resp = await axios.delete(getApiUrl(`/superadmin/cleanup`), {
        headers: { Authorization: `Bearer ${token}` },
        data: { date, storeIds: Array.from(selectedStoreIds) }
      });

      if (resp.data?.success) {
        alert(`Đã xóa thành công:\n- ${resp.data.deletedInvoices} hóa đơn cược\n- ${resp.data.deletedWinningInvoices} hóa đơn thưởng\n- ${resp.data.deletedDailyReports || 0} báo cáo ngày\n- ${resp.data.deletedSnapshots || 0} bản ghi xuất tin nhắn`);
        // Refresh stats
        checkStats();
      } else setError(resp.data?.message || 'Không thể xóa');
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi server khi xóa dữ liệu');
    } finally { setLoading(false); }
  };

  // Calculate total stats for summary
  const getTotalStats = () => {
    if (!statsData) return { totalWinningInvoices: 0, paidWinningInvoices: 0 };
    return statsData.reduce((acc, admin) => {
      const adminStats = admin.stores.reduce((storeAcc, store) => ({
        totalWinningInvoices: storeAcc.totalWinningInvoices + store.totalWinningInvoices,
        paidWinningInvoices: storeAcc.paidWinningInvoices + store.paidWinningInvoices
      }), { totalWinningInvoices: 0, paidWinningInvoices: 0 });
      return {
        totalWinningInvoices: acc.totalWinningInvoices + adminStats.totalWinningInvoices,
        paidWinningInvoices: acc.paidWinningInvoices + adminStats.paidWinningInvoices
      };
    }, { totalWinningInvoices: 0, paidWinningInvoices: 0 });
  };

  const totals = getTotalStats();

  return (
    <div className="super-admin-content">
      <div className="super-admin-header">
        <h2>Làm sạch dữ liệu theo ngày</h2>
        <p>Chọn ngày để xem thống kê và xóa dữ liệu cũ (chỉ cho phép xóa trước 2 ngày gần nhất).</p>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
        <label style={{ fontWeight: 'bold' }}>Ngày cần xóa:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={retentionMaxSelectable()}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        <button
          onClick={checkStats}
          disabled={loading || !date}
          style={{
            padding: '8px 16px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            opacity: (loading || !date) ? 0.7 : 1
          }}
        >
          {loading ? 'Đang tải...' : '🔍 Kiểm tra dữ liệu'}
        </button>
      </div>

      {error && <div style={{ color: '#d32f2f', fontWeight: 600, marginBottom: 15, padding: '10px', background: '#ffebee', borderRadius: '4px' }}>{error}</div>}

      {statsData && (
        <div className="cleanup-results">
          <div className="stats-summary" style={{ marginBottom: '20px', display: 'flex', gap: '20px' }}>
            <div className="stat-box" style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>{totals.totalWinningInvoices}</div>
              <div style={{ color: '#555' }}>Tổng hóa đơn trúng thưởng</div>
            </div>
            <div className="stat-box" style={{ background: '#e8f5e9', padding: '15px', borderRadius: '8px', flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#388e3c' }}>{totals.paidWinningInvoices}</div>
              <div style={{ color: '#555' }}>Hóa đơn trúng đã trả</div>
            </div>
          </div>

          <div className="admin-stores-table-container" style={{ overflowX: 'auto' }}>
            <table className="admin-mgmt-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', width: '50px' }}>Chọn</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Admin</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Cửa hàng</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>Hóa đơn trúng (Đã trả / Tổng)</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>Báo cáo ngày</th>
                </tr>
              </thead>
              <tbody>
                {statsData.map((admin) => (
                  <React.Fragment key={admin.adminId}>
                    {admin.stores.length > 0 ? (
                      admin.stores.map((store, index) => (
                        <tr key={store.storeId} style={{ background: selectedStoreIds.has(store.storeId) ? '#e8f5e9' : 'white' }}>
                          <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={selectedStoreIds.has(store.storeId)}
                              onChange={() => handleCheckboxChange(store.storeId)}
                              style={{ transform: 'scale(1.5)', cursor: 'pointer' }}
                            />
                          </td>
                          {index === 0 && (
                            <td
                              rowSpan={admin.stores.length}
                              style={{
                                padding: '12px',
                                border: '1px solid #ddd',
                                verticalAlign: 'top',
                                background: '#fff'
                              }}
                            >
                              <div style={{ fontWeight: 'bold' }}>{admin.adminName}</div>
                              {admin.totalSnapshots > 0 && (
                                <div style={{ fontSize: '12px', color: '#d32f2f', marginTop: '5px' }}>
                                  ({admin.totalSnapshots} bản ghi tin nhắn)
                                </div>
                              )}
                              {admin.totalDailyReports > 0 && (
                                <div style={{ fontSize: '12px', color: '#388e3c', marginTop: '5px' }}>
                                  ({admin.totalDailyReports} báo cáo ngày)
                                </div>
                              )}
                            </td>
                          )}
                          <td style={{ padding: '12px', border: '1px solid #ddd' }}>{store.storeName}</td>
                          <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                            <span style={{ fontWeight: 'bold', color: '#388e3c' }}>{store.paidWinningInvoices}</span>
                            <span style={{ margin: '0 5px' }}>/</span>
                            <span>{store.totalWinningInvoices}</span>
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                            {store.hasDailyReport ? 
                              <span style={{ color: '#2e7d32', fontWeight: 600 }}>Có</span> :
                              <span style={{ color: '#777' }}>-</span>
                            }
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr key={admin.adminId}>
                        <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>-</td>
                        <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>{admin.adminName}</td>
                        <td colSpan="3" style={{ padding: '12px', border: '1px solid #ddd', fontStyle: 'italic', color: '#888' }}>Không có cửa hàng</td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {statsData.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>Không có dữ liệu admin nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '20px', textAlign: 'right', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 'bold' }}>
              Đã chọn: {selectedStoreIds.size} cửa hàng
            </div>
            <button
              onClick={performCleanup}
              disabled={loading || selectedStoreIds.size === 0}
              style={{
                padding: '12px 24px',
                background: selectedStoreIds.size > 0 ? '#d32f2f' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: selectedStoreIds.size > 0 ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
              }}
            >
              {loading ? 'Đang xử lý...' : '🗑️ Xóa dữ liệu đã chọn'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminCleanup;
