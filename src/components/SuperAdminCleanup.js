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
  const [keepWinningInvoicesMap, setKeepWinningInvoicesMap] = useState(new Map()); // Map<storeId, boolean>
  const [allowRecentDates, setAllowRecentDates] = useState(false); // Allow deletion of today and yesterday

  // Auto cleanup settings states
  const [autoCleanupSettings, setAutoCleanupSettings] = useState([]);
  const [loadingAutoSettings, setLoadingAutoSettings] = useState(false);

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

    // Nếu allowRecentDates = true, cho phép xóa mọi ngày
    if (allowRecentDates) return true;

    // Nếu không, áp dụng rule cũ: không được xóa hôm nay và hôm qua
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
    setKeepWinningInvoicesMap(new Map());

    try {
      if (!date) { setError('Vui lòng chọn ngày'); setLoading(false); return; }
      if (!isDateAllowed(date)) { setError('Chỉ được xóa các ngày trước 2 ngày gần nhất (Hôm nay và Hôm qua)'); setLoading(false); return; }

      const token = localStorage.getItem('token');
      const resp = await axios.get(
        getApiUrl(`/superadmin/cleanup/stats?date=${date}&allowRecentDates=${allowRecentDates}`),
        { headers: { Authorization: `Bearer ${token}` } }
      );

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

  const handleKeepWinningInvoicesChange = (storeId) => {
    const newMap = new Map(keepWinningInvoicesMap);
    if (newMap.has(storeId)) {
      newMap.delete(storeId);
    } else {
      newMap.set(storeId, true);
    }
    setKeepWinningInvoicesMap(newMap);
  };

  const performCleanup = async () => {
    if (selectedStoreIds.size === 0) {
      setError('Vui lòng chọn ít nhất một cửa hàng để xóa dữ liệu.');
      return;
    }

    // Tạo summary thông tin các cửa hàng và chế độ
    const storesWithKeep = Array.from(selectedStoreIds).filter(id => keepWinningInvoicesMap.has(id));
    const storesWithoutKeep = Array.from(selectedStoreIds).filter(id => !keepWinningInvoicesMap.has(id));

    let deleteMessage = `Bạn có chắc chắn muốn xóa dữ liệu ngày ${date} cho ${selectedStoreIds.size} cửa hàng đã chọn không?\n\n`;

    // Cảnh báo đặc biệt nếu đang xóa ngày gần đây
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const todayStr = getCurrentVNDateStr();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    if (date === todayStr || date === yesterdayStr) {
      deleteMessage += `⚠️⚠️⚠️ CẢNH BÁO: BẠN ĐANG XÓA DỮ LIỆU NGÀY GẦN ĐÂY!\n`;
      deleteMessage += `Ngày: ${date === todayStr ? 'HÔM NAY' : 'HÔM QUA'}\n`;
      deleteMessage += `Đây là thao tác NGUY HIỂM và chỉ nên thực hiện khi thật sự cần thiết!\n\n`;
    }

    if (storesWithKeep.length > 0) {
      deleteMessage += `📋 ${storesWithKeep.length} cửa hàng: CHẾ ĐỘ GIỮ LẠI HOÁ ĐƠN THƯỞNG\n`;
    }
    if (storesWithoutKeep.length > 0) {
      deleteMessage += `📋 ${storesWithoutKeep.length} cửa hàng: XÓA TẤT CẢ (bao gồm hoá đơn thưởng)\n`;
    }

    deleteMessage += `\nLƯU Ý: Hành động này sẽ xóa LỊCH SỬ XUẤT TIN NHẮN của các Admin liên quan.\n\nHành động này không thể hoàn tác!`;

    if (!window.confirm(deleteMessage)) {
      return;
    }

    setError(''); setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Tạo mảng stores với cấu hình riêng cho từng cửa hàng
      const stores = Array.from(selectedStoreIds).map(storeId => ({
        storeId,
        keepWinningInvoices: keepWinningInvoicesMap.has(storeId)
      }));

      const resp = await axios.delete(getApiUrl(`/superadmin/cleanup`), {
        headers: { Authorization: `Bearer ${token}` },
        data: { date, stores, allowRecentDates }
      });

      if (resp.data?.success) {
        let message = `Đã xóa thành công:\n- ${resp.data.deletedInvoices} hóa đơn cược\n`;
        if (resp.data.deletedWinningInvoices > 0) {
          message += `- ${resp.data.deletedWinningInvoices} hóa đơn thưởng\n`;
        }
        message += `- ${resp.data.deletedDailyReports || 0} báo cáo ngày\n`;
        message += `- ${resp.data.deletedSnapshots || 0} bản ghi xuất tin nhắn\n`;
        message += `- ${resp.data.deletedInvoiceHistory || 0} lịch sử sửa đổi`;

        if (resp.data.keptWinningInvoices > 0) {
          message += `\n\n✅ Đã giữ lại ${resp.data.keptWinningInvoices} hóa đơn thưởng`;
        }

        alert(message);
        // Refresh stats
        checkStats();
      } else setError(resp.data?.message || 'Không thể xóa');
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi server khi xóa dữ liệu');
    } finally { setLoading(false); }
  };

  // Fetch auto cleanup settings
  const fetchAutoCleanupSettings = async () => {
    setLoadingAutoSettings(true);
    try {
      const token = localStorage.getItem('token');
      const resp = await axios.get(
        getApiUrl('/auto-cleanup/settings'),
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (resp.data?.success) {
        setAutoCleanupSettings(resp.data.data || []);
      } else {
        setError(resp.data?.message || 'Không thể lấy cài đặt tự động xóa');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi server khi lấy cài đặt');
    } finally {
      setLoadingAutoSettings(false);
    }
  };

  // Update auto cleanup settings for an admin
  const updateAutoCleanupSetting = async (adminId, settings) => {
    try {
      const token = localStorage.getItem('token');
      const resp = await axios.put(
        getApiUrl('/auto-cleanup/settings'),
        { adminId, ...settings },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (resp.data?.success) {
        // Refresh settings
        await fetchAutoCleanupSettings();
        return true;
      } else {
        setError(resp.data?.message || 'Không thể cập nhật cài đặt');
        return false;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi server khi cập nhật cài đặt');
      return false;
    }
  };

  // Load auto cleanup settings when component mounts
  useEffect(() => {
    fetchAutoCleanupSettings();
  }, []); // Empty dependency array = run once on mount

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
        <h2>Làm sạch dữ liệu</h2>
        <p>Quản lý xóa dữ liệu thủ công theo ngày và cấu hình tự động xóa cho từng chủ cửa hàng.</p>
      </div>

      {/* ============ PHẦN 1: XÓA THỦ CÔNG THEO NGÀY ============ */}
      <div style={{ marginBottom: 40, padding: '20px', background: '#f8f9fa', borderRadius: '12px' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#000' }}>📋 Xóa thủ công theo ngày</h3>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', background: '#ffffff', padding: '15px', borderRadius: '8px' }}>
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

        <div style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          marginBottom: 20,
          padding: '12px',
          background: allowRecentDates ? '#ffebee' : '#ffffff',
          borderRadius: '8px',
          border: allowRecentDates ? '2px solid #d32f2f' : '1px solid #ddd',
          transition: 'all 0.3s ease'
        }}>
          <input
            type="checkbox"
            id="allowRecentDates"
            checked={allowRecentDates}
            onChange={(e) => setAllowRecentDates(e.target.checked)}
            style={{ transform: 'scale(1.5)', cursor: 'pointer' }}
          />
          <label
            htmlFor="allowRecentDates"
            style={{
              fontWeight: 'bold',
              color: allowRecentDates ? '#d32f2f' : '#666',
              cursor: 'pointer',
              userSelect: 'none',
              flex: 1
            }}
          >
            {allowRecentDates ? '⚠️ CHẾ ĐỘ NGUY HIỂM: ' : '🔒 '}
            Cho phép xóa dữ liệu HÔM NAY và HÔM QUA
            {allowRecentDates && ' (ĐANG BẬT)'}
          </label>
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
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', width: '80px' }}>
                      <div style={{ fontSize: '11px', lineHeight: '1.2' }}>Giữ lại<br />HĐ Thưởng</div>
                    </th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Admin</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Cửa hàng</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>Hóa đơn trúng (Đã trả / Tổng)</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>Báo cáo ngày</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>Lịch sử sửa đổi</th>
                  </tr>
                </thead>
                <tbody>
                  {statsData.map((admin) => (
                    <React.Fragment key={admin.adminId}>
                      {admin.stores.length > 0 ? (
                        admin.stores.map((store, index) => (
                          <tr
                            key={store.storeId}
                            style={{
                              background: keepWinningInvoicesMap.has(store.storeId)
                                ? '#fff3e0'
                                : (selectedStoreIds.has(store.storeId) ? '#e8f5e9' : 'white')
                            }}
                          >
                            <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={selectedStoreIds.has(store.storeId)}
                                onChange={() => handleCheckboxChange(store.storeId)}
                                style={{ transform: 'scale(1.5)', cursor: 'pointer' }}
                              />
                            </td>
                            <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={keepWinningInvoicesMap.has(store.storeId)}
                                onChange={() => handleKeepWinningInvoicesChange(store.storeId)}
                                style={{ transform: 'scale(1.3)', cursor: 'pointer' }}
                                title="Chỉ giữ lại hoá đơn thưởng khi xóa"
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
                            <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                              {store.totalInvoiceHistory > 0 ? (
                                <span style={{ fontWeight: 600, color: '#1976d2' }}>{store.totalInvoiceHistory}</span>
                              ) : (
                                <span style={{ color: '#777' }}>-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr key={admin.adminId}>
                          <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>-</td>
                          <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>-</td>
                          <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>{admin.adminName}</td>
                          <td colSpan="4" style={{ padding: '12px', border: '1px solid #ddd', fontStyle: 'italic', color: '#888' }}>Không có cửa hàng</td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {statsData.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ padding: '20px', textAlign: 'center' }}>Không có dữ liệu admin nào.</td>
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

      {/* ============ PHẦN 2: CÀI ĐẶT TỰ ĐỘNG XÓA ============ */}
      <div style={{ marginTop: 40, padding: '20px', background: '#f0f7ff', borderRadius: '12px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#000' }}>⚙️ Cài đặt Tự động Xóa Dữ liệu</h3>
        <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#666' }}>
          Cấu hình tự động xóa dữ liệu cho từng chủ cửa hàng. Dữ liệu sẽ tự động bị xóa sau thời gian cấu hình (tính từ 00:00 ngày kế tiếp).
        </p>

        {loadingAutoSettings ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Chủ cửa hàng</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', width: '120px' }}>Bật/Tắt</th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', width: '180px' }}>
                      Xóa sau (giờ)
                    </th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', width: '200px' }}>
                      <div style={{ fontSize: '11px', lineHeight: '1.2' }}>
                        Giữ HĐ Thưởng<br />chưa trả
                      </div>
                    </th>
                    <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', width: '150px' }}>
                      Lần chạy cuối
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {autoCleanupSettings.map((setting) => (
                    <tr key={setting.adminId} style={{ background: setting.enabled ? '#e8f5e9' : 'white' }}>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        <strong>{setting.adminName}</strong>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={setting.enabled}
                          onChange={(e) => {
                            updateAutoCleanupSetting(setting.adminId, {
                              enabled: e.target.checked,
                              cleanupAfterHours: setting.cleanupAfterHours,
                              keepUnpaidWinningInvoices: setting.keepUnpaidWinningInvoices
                            });
                          }}
                          style={{ transform: 'scale(1.5)', cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                        <input
                          type="number"
                          min="1"
                          max="720"
                          value={setting.cleanupAfterHours}
                          onChange={(e) => {
                            // Chỉ update UI, chưa call API
                            const hours = parseInt(e.target.value) || 24;
                            setAutoCleanupSettings(prev =>
                              prev.map(s =>
                                s.adminId === setting.adminId
                                  ? { ...s, cleanupAfterHours: hours }
                                  : s
                              )
                            );
                          }}
                          onBlur={(e) => {
                            // Rời khỏi input mới call API
                            const hours = parseInt(e.target.value) || 24;
                            updateAutoCleanupSetting(setting.adminId, {
                              enabled: setting.enabled,
                              cleanupAfterHours: hours,
                              keepUnpaidWinningInvoices: setting.keepUnpaidWinningInvoices
                            });
                          }}
                          disabled={!setting.enabled}
                          style={{
                            width: '80px',
                            padding: '6px',
                            textAlign: 'center',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            opacity: setting.enabled ? 1 : 0.5
                          }}
                        />
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                          {setting.cleanupAfterHours >= 24
                            ? `(${Math.floor(setting.cleanupAfterHours / 24)} ngày)`
                            : ''}
                        </div>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={setting.keepUnpaidWinningInvoices}
                          onChange={(e) => {
                            updateAutoCleanupSetting(setting.adminId, {
                              enabled: setting.enabled,
                              cleanupAfterHours: setting.cleanupAfterHours,
                              keepUnpaidWinningInvoices: e.target.checked
                            });
                          }}
                          disabled={!setting.enabled}
                          style={{
                            transform: 'scale(1.3)',
                            cursor: setting.enabled ? 'pointer' : 'not-allowed',
                            opacity: setting.enabled ? 1 : 0.5
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', fontSize: '12px' }}>
                        {setting.lastRunAt
                          ? new Date(setting.lastRunAt).toLocaleString('vi-VN')
                          : <span style={{ color: '#999' }}>Chưa chạy</span>
                        }
                      </td>
                    </tr>
                  ))}
                  {autoCleanupSettings.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                        Không có chủ cửa hàng nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{
              marginTop: 20,
              padding: '15px',
              background: '#fff3e0',
              borderRadius: '6px',
              border: '1px solid #ff9800'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>📝 Hướng dẫn sử dụng:</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8' }}>
                <li><strong>Bật/Tắt:</strong> Bật để kích hoạt tự động xóa dữ liệu cho chủ cửa hàng này</li>
                <li><strong>Xóa sau (giờ):</strong> Thời gian kể từ 00:00 ngày kế tiếp đến khi xóa dữ liệu của ngày trước đó</li>
                <li><strong>Giữ HĐ Thưởng chưa trả:</strong> Nếu bật, các hóa đơn thưởng chưa trả tiền sẽ được giữ lại, không bị xóa</li>
                <li><strong>Ví dụ 1:</strong> Chọn "12 giờ" → Dữ liệu ngày 25 (bất kỳ thời điểm nào trong ngày 25) sẽ bị xóa vào lúc: <strong>00:00 ngày 26 + 12h = 12:00 trưa ngày 26</strong></li>
                <li><strong>Ví dụ 2:</strong> Chọn "24 giờ" → Dữ liệu ngày 25 sẽ bị xóa vào lúc: <strong>00:00 ngày 26 + 24h = 00:00 ngày 27</strong></li>
                <li><strong>Lưu ý:</strong> Tất cả dữ liệu trong cả ngày (từ 00:00 đến 23:59:59) sẽ bị xóa cùng lúc</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SuperAdminCleanup;
