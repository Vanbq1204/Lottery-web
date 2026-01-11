import { getApiUrl } from '../config/api';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SuperAdminInterface.css';

const SuperAdminSystemStats = () => {
  const getCurrentVietnamDate = () => {
    const now = new Date();
    const vietnamTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const d = String(vietnamTime.getDate()).padStart(2, '0');
    const m = String(vietnamTime.getMonth() + 1).padStart(2, '0');
    const y = vietnamTime.getFullYear();
    return `${y}-${m}-${d}`;
  };

  const [date, setDate] = useState(getCurrentVietnamDate());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({}); // adminId -> boolean
  const [storeRows, setStoreRows] = useState({}); // adminId -> stores[]
  const [loadingStores, setLoadingStores] = useState({}); // adminId -> boolean

  // Prize statistics states
  const [prizeRows, setPrizeRows] = useState([]);
  const [prizeLoading, setPrizeLoading] = useState(false);
  const [expandedPrize, setExpandedPrize] = useState({}); // adminId -> boolean
  const [prizeStoreRows, setPrizeStoreRows] = useState({}); // adminId -> stores[]
  const [loadingPrizeStores, setLoadingPrizeStores] = useState({}); // adminId -> boolean

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

    // Also load prize statistics
    loadPrizeStats(d);
  };

  const loadPrizeStats = async (d) => {
    try {
      setPrizeLoading(true);
      const token = localStorage.getItem('token');
      const resp = await axios.get(getApiUrl(`/superadmin/system-prize-statistics?date=${d}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.data?.success) setPrizeRows(resp.data.admins || []);
    } catch (err) {
      console.error('Error loading prize stats:', err);
    } finally {
      setPrizeLoading(false);
    }
  };

  useEffect(() => { loadStats(date); }, []);

  const loadStoresForAdmin = async (adminId) => {
    try {
      setLoadingStores(prev => ({ ...prev, [adminId]: true }));
      const token = localStorage.getItem('token');
      const resp = await axios.get(getApiUrl(`/superadmin/system-statistics/stores?adminId=${adminId}&date=${date}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.data?.success) {
        setStoreRows(prev => ({ ...prev, [adminId]: resp.data.stores || [] }));
      }
    } catch (err) {
      // ignore errors for store loading
    } finally {
      setLoadingStores(prev => ({ ...prev, [adminId]: false }));
    }
  };

  const toggleExpand = async (adminId) => {
    const open = !!expanded[adminId];
    if (!open && !storeRows[adminId]) {
      await loadStoresForAdmin(adminId);
    }
    setExpanded(prev => ({ ...prev, [adminId]: !open }));
  };

  const loadPrizeStoresForAdmin = async (adminId) => {
    try {
      setLoadingPrizeStores(prev => ({ ...prev, [adminId]: true }));
      const token = localStorage.getItem('token');
      const resp = await axios.get(getApiUrl(`/superadmin/system-prize-statistics/stores?adminId=${adminId}&date=${date}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.data?.success) {
        setPrizeStoreRows(prev => ({ ...prev, [adminId]: resp.data.stores || [] }));
      }
    } catch (err) {
      console.error('Error loading prize stores:', err);
    } finally {
      setLoadingPrizeStores(prev => ({ ...prev, [adminId]: false }));
    }
  };

  const togglePrizeExpand = async (adminId) => {
    const open = !!expandedPrize[adminId];
    if (!open && !prizeStoreRows[adminId]) {
      await loadPrizeStoresForAdmin(adminId);
    }
    setExpandedPrize(prev => ({ ...prev, [adminId]: !open }));
  };

  const formatN = (n) => (parseInt(n) || 0).toLocaleString('vi-VN').replace(/,/g, '.');

  return (
    <div className="super-admin-system-stats">
      <div className="super-admin-header">
        <h2>Thống kê toàn bộ hệ thống</h2>
        <p>Báo cáo gộp theo từng Admin (tổng các cửa hàng).</p>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <label>Ngày:</label>
        <input type="date" value={date} onChange={(e) => { setDate(e.target.value); loadStats(e.target.value); }} />
        <button onClick={() => loadStats(date)} disabled={loading}>{loading ? 'Đang tải...' : 'Tải lại'}</button>
      </div>
      {error && <div style={{ color: '#d32f2f', fontWeight: 600 }}>{error}</div>}
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
            {rows.map(r => (
              <React.Fragment key={r.adminId}>
                <tr>
                  <td>
                    <button className="expand-btn" onClick={() => toggleExpand(r.adminId)}>{expanded[r.adminId] ? '▾' : '▸'}</button>
                    {r.adminName}
                  </td>
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
                {expanded[r.adminId] && (
                  <tr className="expanded-row">
                    <td colSpan="13">
                      <div className="store-breakdown-wrapper">
                        {loadingStores[r.adminId] ? (
                          <div className="loading-inline">Đang tải dữ liệu cửa hàng...</div>
                        ) : (
                          <table className="system-stats-table store-breakdown-table">
                            <thead>
                              <tr>
                                <th>Cửa hàng</th>
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
                              {(storeRows[r.adminId] || []).map(s => (
                                <tr key={s.storeId}>
                                  <td>{s.storeName}</td>
                                  <td>{formatN(s.totalRevenue)}</td>
                                  <td>{formatN(s.lotoTotal)}</td>
                                  <td>{formatN(s['2sTotal'])}</td>
                                  <td>{formatN(s['3sTotal'])}</td>
                                  <td>{formatN(s['4sTotal'])}</td>
                                  <td>{formatN(s.tongTotal)}</td>
                                  <td>{formatN(s.dauTotal)}</td>
                                  <td>{formatN(s.ditTotal)}</td>
                                  <td>{formatN(s.kepTotal)}</td>
                                  <td>{formatN(s.boTotal)}</td>
                                  <td>{formatN(s.xienTotal)}</td>
                                  <td>{formatN(s.xienquayTotal)}</td>
                                </tr>
                              ))}
                              {(!storeRows[r.adminId] || storeRows[r.adminId].length === 0) && (
                                <tr><td colSpan="13" style={{ textAlign: 'center', color: '#666' }}>Không có dữ liệu cửa hàng</td></tr>
                              )}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {rows.length === 0 && !loading && (
              <tr><td colSpan="13" style={{ textAlign: 'center', color: '#666' }}>Không có dữ liệu</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Prize Statistics Table */}
      <div className="super-admin-header" style={{ marginTop: '40px' }}>
        <h2>Thống kê thưởng toàn hệ thống</h2>
        <p>Báo cáo tiền thưởng gộp theo từng Admin (tổng các cửa hàng).</p>
      </div>
      <div className="system-stats-table-wrapper">
        <table className="system-stats-table">
          <thead>
            <tr>
              <th>Admin</th>
              <th>Tổng tiền thưởng</th>
              <th>Số hóa đơn thưởng</th>
            </tr>
          </thead>
          <tbody>
            {prizeRows.map(r => (
              <React.Fragment key={r.adminId}>
                <tr>
                  <td>
                    <button className="expand-btn" onClick={() => togglePrizeExpand(r.adminId)}>{expandedPrize[r.adminId] ? '▾' : '▸'}</button>
                    {r.adminName}
                  </td>
                  <td style={{ color: '#d32f2f', fontWeight: '600' }}>{formatN(r.totalPrizeAmount)}</td>
                  <td>{r.invoiceCount}</td>
                </tr>
                {expandedPrize[r.adminId] && (
                  <tr className="expanded-row">
                    <td colSpan="3">
                      <div className="store-breakdown-wrapper">
                        {loadingPrizeStores[r.adminId] ? (
                          <div className="loading-inline">Đang tải dữ liệu cửa hàng...</div>
                        ) : (
                          <table className="system-stats-table store-breakdown-table">
                            <thead>
                              <tr>
                                <th>Cửa hàng</th>
                                <th>Tổng tiền thưởng</th>
                                <th>Số hóa đơn thưởng</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(prizeStoreRows[r.adminId] || []).map(s => (
                                <tr key={s.storeId}>
                                  <td>{s.storeName}</td>
                                  <td style={{ color: '#d32f2f', fontWeight: '600' }}>{formatN(s.totalPrizeAmount)}</td>
                                  <td>{s.invoiceCount}</td>
                                </tr>
                              ))}
                              {(!prizeStoreRows[r.adminId] || prizeStoreRows[r.adminId].length === 0) && (
                                <tr><td colSpan="3" style={{ textAlign: 'center', color: '#666' }}>Không có dữ liệu cửa hàng</td></tr>
                              )}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {prizeRows.length === 0 && !prizeLoading && (
              <tr><td colSpan="3" style={{ textAlign: 'center', color: '#666' }}>Không có dữ liệu thưởng</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SuperAdminSystemStats;