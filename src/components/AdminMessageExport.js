import { getApiUrl } from '../config/api';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminMessageExport.css';

const AdminMessageExport = ({ user }) => {
  // Lấy ngày hiện tại theo múi giờ Việt Nam (UTC+7)
  const getCurrentVietnamDate = () => {
    const now = new Date();
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    return vietnamTime.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getCurrentVietnamDate());
  const [isLoading, setIsLoading] = useState(false);
  const [lotoMessage, setLotoMessage] = useState('');
  const [twoSMessage, setTwoSMessage] = useState('');
  const [threeSMessage, setThreeSMessage] = useState('');
  const [fourSMessage, setFourSMessage] = useState('');
  const [tongMessage, setTongMessage] = useState('');
  const [dauMessage, setDauMessage] = useState('');
  const [ditMessage, setDitMessage] = useState('');
  const [kepMessage, setKepMessage] = useState('');
  const [boMessage, setBoMessage] = useState('');
  const [xMessage, setXMessage] = useState('');
  const [xquayMessage, setXquayMessage] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [history, setHistory] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [changeRequests, setChangeRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [copiedMap, setCopiedMap] = useState({});
  const [showRequestsPanel, setShowRequestsPanel] = useState(false);
  // Helpers lấy/lưu hệ số theo admin
  const resolveFactorKey = (u) => {
    const id = u?._id || u?.id;
    return id ? `msgSendFactor:${id}` : 'msgSendFactor';
  };
  const getInitialFactor = (u) => {
    try {
      const key = resolveFactorKey(u);
      const rawUser = localStorage.getItem(key);
      const rawGlobal = localStorage.getItem('msgSendFactor');
      const raw = rawUser != null ? rawUser : rawGlobal;
      const v = parseFloat(raw);
      return !isNaN(v) ? Math.max(1, v) : 1.0;
    } catch (_) {
      return 1.0;
    }
  };

  const [sendFactor, setSendFactor] = useState(() => getInitialFactor(user)); // Hệ số gửi đi, mặc định 1.0 (tối thiểu 1)
  const [baseStats, setBaseStats] = useState(null); // Lưu thống kê thô để tính lại nhanh

  // Scroll position preservation
  const scrollPositionRef = React.useRef(0);

  // Khi đổi admin, tải lại hệ số theo admin đó
  useEffect(() => {
    setSendFactor(getInitialFactor(user));
  }, [user]);

  // Lưu lại hệ số mỗi khi thay đổi (ghi cả key theo admin và key chung để dự phòng)
  useEffect(() => {
    try {
      const key = resolveFactorKey(user);
      localStorage.setItem(key, String(sendFactor));
      localStorage.setItem('msgSendFactor', String(sendFactor));
    } catch (_) { /* ignore */ }
  }, [sendFactor, user]);

  // Tính lại tất cả chuỗi tin nhắn từ stats hiện có
  const recomputeMessagesFromStats = (stats) => {
    if (!stats) return;
    const lotoStats = stats?.loto || {};
    const twoSStats = stats?.['2s'] || {};
    const threeSStats = stats?.['3s'] || {};
    const fourSStats = stats?.['4s'] || {};
    const grouped = stats?.grouped || {};
    const xStats = stats?.xien || {};
    const xqStats = stats?.xienquay || {};

    setLotoMessage(buildLotoMessage(lotoStats)); // Lô không nhân hệ số
    setTwoSMessage(buildTwoSMessage(twoSStats));
    setThreeSMessage(buildThreeSMessage(threeSStats));
    setFourSMessage(buildFourSMessage(fourSStats));
    setTongMessage(buildGroupedLine('Tổng', grouped?.tong));
    setDauMessage(buildGroupedLine('Đầu', grouped?.dau));
    setDitMessage(buildGroupedLine('Đít', grouped?.dit));
    setKepMessage(buildGroupedLine('Kép', grouped?.kep));
    setBoMessage(buildGroupedLine('Bộ', grouped?.bo));
    setXMessage(buildXMessage(xStats));
    setXquayMessage(buildXquayMessage(xqStats));
  };

  // Khi hệ số thay đổi, tính lại ngay từ baseStats (không gọi API)
  useEffect(() => {
    if (baseStats) {
      recomputeMessagesFromStats(baseStats);
    }
  }, [sendFactor, baseStats]);

  // Gom nhóm theo cùng số điểm và tạo chuỗi tin cho Lô
  const buildLotoMessage = (lotoStats) => {
    if (!lotoStats || Object.keys(lotoStats).length === 0) {
      return 'L: (Không có dữ liệu)';
    }

    const groups = new Map(); // key: points, value: array of numbers
    for (const [number, points] of Object.entries(lotoStats)) {
      const p = parseInt(points) || 0;
      if (!groups.has(p)) groups.set(p, []);
      groups.get(p).push(number.padStart(2, '0'));
    }

    // Sắp xếp điểm giảm dần, trong mỗi nhóm sắp xếp số tăng dần
    const sortedPoints = Array.from(groups.keys()).sort((a, b) => b - a);
    const segments = [];

    for (const p of sortedPoints) {
      const nums = groups.get(p)
        .map((n) => n)
        .sort((a, b) => parseInt(a) - parseInt(b));
      if (nums.length === 0) continue;
      const listStr = nums.join(',');
      segments.push(`${listStr}x${p}đ`);
    }

    return `L: ${segments.join(', ')}`;
  };

  const buildTwoSMessage = (twoSStats) => {
    if (!twoSStats || Object.keys(twoSStats).length === 0) return 'Đ: (Không có dữ liệu)';
    const groups = new Map();
    for (const [number, amountN] of Object.entries(twoSStats)) {
      const a = parseInt(amountN) || 0;
      const scaled = Math.max(1, Math.round(a * sendFactor));
      if (!groups.has(scaled)) groups.set(scaled, []);
      groups.get(scaled).push(number.padStart(2, '0'));
    }
    const sortedAmounts = Array.from(groups.keys()).sort((a, b) => b - a);
    const segments = sortedAmounts.map(a => {
      const nums = groups.get(a).sort((x, y) => parseInt(x) - parseInt(y));
      return `${nums.join(',')}x${a}n`;
    });
    return `Đ: ${segments.join(', ')}`;
  };

  const aggregateAmountNFromNested = (nested) => {
    const agg = {};
    Object.values(nested || {}).forEach(caseMap => {
      if (Array.isArray(caseMap)) {
        caseMap.forEach(detail => {
          const key = detail?.numbers;
          const n = parseInt(detail?.totalAmount ?? 0) || 0; // totalAmount đã là đơn vị n
          if (key && n > 0) {
            agg[key] = (agg[key] || 0) + n;
          }
        });
      } else {
        Object.entries(caseMap || {}).forEach(([key, val]) => {
          const n = parseInt(val?.totalAmount ?? 0) || 0; // không chia 1000
          if (n > 0) {
            agg[key] = (agg[key] || 0) + n;
          }
        });
      }
    });
    return agg;
  };

  const buildThreeSMessage = (threeSStats) => {
    const agg = aggregateAmountNFromNested(threeSStats);
    if (Object.keys(agg).length === 0) return '3s: (Không có dữ liệu)';
    const groups = new Map();
    for (const [num, n] of Object.entries(agg)) {
      const amount = parseInt(n) || 0;
      const scaled = Math.max(1, Math.round(amount * sendFactor));
      if (!groups.has(scaled)) groups.set(scaled, []);
      groups.get(scaled).push(num.padStart(3, '0'));
    }
    const sorted = Array.from(groups.keys()).filter(a => a > 0).sort((a, b) => b - a);
    const segments = sorted.map(a => {
      const nums = groups.get(a).sort((x, y) => parseInt(x) - parseInt(y));
      return `${nums.join(',')}x${a}n`;
    });
    return `3s: ${segments.join(', ')}`;
  };

  const buildFourSMessage = (fourSStats) => {
    const agg = aggregateAmountNFromNested(fourSStats);
    if (Object.keys(agg).length === 0) return '4s: (Không có dữ liệu)';
    const groups = new Map();
    for (const [num, n] of Object.entries(agg)) {
      const amount = parseInt(n) || 0;
      const scaled = Math.max(1, Math.round(amount * sendFactor));
      if (!groups.has(scaled)) groups.set(scaled, []);
      groups.get(scaled).push(num.padStart(4, '0'));
    }
    const sorted = Array.from(groups.keys()).filter(a => a > 0).sort((a, b) => b - a);
    const segments = sorted.map(a => {
      const nums = groups.get(a).sort((x, y) => parseInt(x) - parseInt(y));
      return `${nums.join(',')}x${a}n`;
    });
    return `4s: ${segments.join(', ')}`;
  };

  const buildGroupedLine = (label, groupedMap) => {
    const simple = {};
    Object.entries(groupedMap || {}).forEach(([key, val]) => {
      const amt = parseInt(val?.totalAmount || 0) || 0;
      simple[key] = (simple[key] || 0) + amt;
    });
    if (Object.keys(simple).length === 0) return `${label}: (Không có dữ liệu)`;
    const groups = new Map();
    for (const [key, n] of Object.entries(simple)) {
      const a = parseInt(n) || 0;
      const scaled = Math.max(1, Math.round(a * sendFactor));
      if (!groups.has(scaled)) groups.set(scaled, []);
      groups.get(scaled).push(key);
    }
    const sortedAmounts = Array.from(groups.keys()).sort((a, b) => b - a);
    const segments = sortedAmounts.map(a => {
      const items = groups.get(a).sort();
      return `${items.join(',')}x${a}n`;
    });
    return `${label}: ${segments.join(', ')}`;
  };

  const aggregateCombosN = (nested) => {
    const agg = {};
    Object.values(nested || {}).forEach(caseMap => {
      if (Array.isArray(caseMap)) {
        caseMap.forEach(detail => {
          const key = detail?.numbers;
          const n = parseInt(detail?.totalAmount ?? 0) || 0; // totalAmount đã là đơn vị n
          if (key && n > 0) {
            agg[key] = (agg[key] || 0) + n;
          }
        });
      } else {
        Object.entries(caseMap || {}).forEach(([key, val]) => {
          const n = parseInt(val?.totalAmount ?? 0) || 0; // không chia 1000
          if (n > 0) {
            agg[key] = (agg[key] || 0) + n;
          }
        });
      }
    });
    return agg;
  };

  const buildXMessage = (xStats) => {
    const agg = aggregateCombosN(xStats);
    if (Object.keys(agg).length === 0) return 'X: (Không có dữ liệu)';
    const groups = new Map();
    for (const [combo, n] of Object.entries(agg)) {
      const a = parseInt(n) || 0;
      const scaled = Math.max(1, Math.round(a * sendFactor));
      if (!groups.has(scaled)) groups.set(scaled, []);
      groups.get(scaled).push(combo);
    }
    const sorted = Array.from(groups.keys()).filter(a => a > 0).sort((a, b) => b - a);
    const segments = sorted.map(a => {
      const combos = groups.get(a).sort();
      return `${combos.join(', ')}x${a}n`;
    });
    return `X: ${segments.join(', ')}`;
  };

  const buildXquayMessage = (xqStats) => {
    const agg = aggregateCombosN(xqStats);
    if (Object.keys(agg).length === 0) return 'Xquay: (Không có dữ liệu)';
    const groups = new Map();
    for (const [combo, n] of Object.entries(agg)) {
      const a = parseInt(n) || 0;
      const scaled = Math.max(1, Math.round(a * sendFactor));
      if (!groups.has(scaled)) groups.set(scaled, []);
      groups.get(scaled).push(combo);
    }
    const sorted = Array.from(groups.keys()).filter(a => a > 0).sort((a, b) => b - a);
    const segments = sorted.map(a => {
      const combos = groups.get(a).sort();
      return `${combos.join(', ')}x${a}n`;
    });
    return `Xquay: ${segments.join(', ')}`;
  };

  const loadStatistics = async (date) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const url = getApiUrl(`/admin/total-statistics?date=${date}`);
      const resp = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const stats = resp.data?.stats || resp.data?.statistics || null;
      setBaseStats(stats);
      recomputeMessagesFromStats(stats);
    } catch (error) {
      console.error('Lỗi tải thống kê:', error);
      setLotoMessage('L: (Không thể tải dữ liệu)');
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistory = async (date) => {
    try {
      const token = localStorage.getItem('token');
      const url = getApiUrl(`/admin/message-exports/history?date=${date}`);
      const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      if (resp.data?.success) setHistory(resp.data.snapshots || []);
    } catch (error) {
      // ignore history load errors
    }
  };

  const loadChangeRequests = async () => {
    try {
      setReqLoading(true);
      const token = localStorage.getItem('token');
      const url = getApiUrl(`/admin/invoice-change-requests?status=pending`);
      const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      if (resp.data?.success) setChangeRequests(resp.data.requests || []);
    } catch (e) { /* ignore */ }
    finally { setReqLoading(false); }
  };

  const decideChangeRequest = async (requestId, action) => {
    try {
      const token = localStorage.getItem('token');
      const resp = await axios.put(getApiUrl(`/admin/invoice-change-requests/${requestId}`), { action }, { headers: { Authorization: `Bearer ${token}` } });
      if (resp.data?.success) {
        setChangeRequests(prev => prev.filter(r => r._id !== requestId));
        alert(action === 'approve' ? 'Đã chấp thuận yêu cầu.' : 'Đã từ chối yêu cầu.');
      } else {
        alert(resp.data?.message || 'Không thể xử lý yêu cầu');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi xử lý yêu cầu');
    }
  };

  const exportNow = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('token');
      const resp = await axios.post(getApiUrl('/admin/message-exports/export'),
        { date: selectedDate, multiplier: sendFactor },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (resp.data?.success) {
        const m = resp.data.snapshot?.messages || {};
        setLotoMessage(m.loto || lotoMessage);
        setTwoSMessage(m.twoS || twoSMessage);
        setThreeSMessage(m.threeS || threeSMessage);
        setFourSMessage(m.fourS || fourSMessage);
        setTongMessage(m.tong || tongMessage);
        setDauMessage(m.dau || dauMessage);
        setDitMessage(m.dit || ditMessage);
        setKepMessage(m.kep || kepMessage);
        setBoMessage(m.bo || boMessage);
        setXMessage(m.xien || xMessage);
        setXquayMessage(m.xienquay || xquayMessage);
      }
      await loadHistory(selectedDate);
    } catch (error) {
      alert('Lỗi xuất tin nhắn: ' + (error.response?.data?.message || error.message));
    } finally {
      setExporting(false);
    }
  };

  // Copy tất cả dòng tin nhắn vào clipboard
  const copyToClipboard = async () => {
    try {
      const lines = [
        lotoMessage,
        twoSMessage,
        threeSMessage,
        fourSMessage,
        tongMessage,
        dauMessage,
        ditMessage,
        kepMessage,
        boMessage,
        xMessage,
        xquayMessage
      ].filter(Boolean);
      const text = lines.join('\n\n');
      await navigator.clipboard.writeText(text);
      setCopyStatus('Đã sao chép');
      setTimeout(() => setCopyStatus(''), 2000);
    } catch (e) {
      setCopyStatus('Sao chép thất bại');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };

  const buildSnapshotText = (messages) => {
    const lines = [
      messages?.loto,
      messages?.twoS,
      messages?.threeS,
      messages?.fourS,
      messages?.tong,
      messages?.dau,
      messages?.dit,
      messages?.kep,
      messages?.bo,
      messages?.xien,
      messages?.xienquay
    ].filter(Boolean);
    return lines.join('\n\n');
  };

  const copySnapshot = async (snapshot) => {
    try {
      const text = buildSnapshotText(snapshot?.messages || {});
      await navigator.clipboard.writeText(text);
      setCopyStatus(`Đã sao chép lần ${snapshot?.sequence}`);
      setCopiedMap(prev => ({ ...prev, [snapshot?.sequence]: true }));
      setTimeout(() => setCopyStatus(''), 2000);
      setTimeout(() => setCopiedMap(prev => ({ ...prev, [snapshot?.sequence]: false })), 1500);
    } catch (e) {
      setCopyStatus('Sao chép thất bại');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };

  useEffect(() => {
    loadStatistics(selectedDate);
    loadHistory(selectedDate);
    loadChangeRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Socket.io listener for real-time updates
  useEffect(() => {
    const { io } = require('socket.io-client');
    const baseUrl = getApiUrl('').replace('/api', '');
    const socket = io(baseUrl);

    if (user) {
      socket.emit('join_admin', user.id);

      socket.on('new_invoice', (data) => {
        console.log('Real-time update (Message Export): New invoice received', data);
        // Save container scroll position
        const container = document.querySelector('.admin-content-section');
        scrollPositionRef.current = container ? container.scrollTop : 0;

        // Reload statistics and history
        Promise.all([
          loadStatistics(selectedDate),
          loadHistory(selectedDate)
        ]).then(() => {
          requestAnimationFrame(() => {
            if (container) {
              container.scrollTop = scrollPositionRef.current;
            }
          });
        }).catch(() => { });
      });

      socket.on('edit_invoice', (data) => {
        console.log('Real-time update (Message Export): Invoice edited', data);
        const container = document.querySelector('.admin-content-section');
        scrollPositionRef.current = container ? container.scrollTop : 0;

        Promise.all([
          loadStatistics(selectedDate),
          loadHistory(selectedDate)
        ]).then(() => {
          requestAnimationFrame(() => {
            if (container) container.scrollTop = scrollPositionRef.current;
          });
        }).catch(() => { });
      });

      socket.on('delete_invoice', (data) => {
        console.log('Real-time update (Message Export): Invoice deleted', data);
        const container = document.querySelector('.admin-content-section');
        scrollPositionRef.current = container ? container.scrollTop : 0;

        Promise.all([
          loadStatistics(selectedDate),
          loadHistory(selectedDate)
        ]).then(() => {
          requestAnimationFrame(() => {
            if (container) container.scrollTop = scrollPositionRef.current;
          });
        }).catch(() => { });
      });
    }

    return () => {
      socket.disconnect();
    };
  }, [user, selectedDate]);

  const onDateChange = (e) => {
    const d = e.target.value;
    setSelectedDate(d);
    loadStatistics(d);
    loadHistory(d);
  };

  return (
    <div className="msg-export-container">
      <div className="msg-export-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>
          <h2>Xuất tin nhắn</h2>
          <p>Tổng hợp từ tất cả cửa hàng của bạn theo ngày.</p>
          <div className="msg-export-meta">Đã xuất tin nhắn {history?.length || 0} lần trong ngày này.</div>
        </div>
        <div className="msg-header-actions">
          <button className="msg-inbox-btn" onClick={() => setShowRequestsPanel(prev => !prev)}>
            <span>📥 Yêu cầu</span>
            {changeRequests?.length > 0 && (
              <span className="msg-badge">{changeRequests.length}</span>
            )}
          </button>
        </div>
      </div>

      {changeRequests?.length > 0 && (
        <div className="msg-alert-bar">
          <span>🔔 Có {changeRequests.length} yêu cầu chỉnh sửa/xóa hóa đơn từ nhân viên</span>
          <button className="msg-alert-btn" onClick={() => setShowRequestsPanel(true)}>Xem và xử lý</button>
        </div>
      )}

      <div className="msg-export-controls">
        <div className="msg-control-group">
          <label>Chọn ngày:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={onDateChange}
          />
        </div>
        <div className="msg-control-group">
          <label>Hệ số gửi đi:</label>
          <input
            type="number"
            min={1}
            step={0.1}
            value={sendFactor}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              const clamped = isNaN(val) ? 1.0 : Math.max(1, val);
              setSendFactor(clamped);
              // Không gọi API; chuỗi sẽ tự tính lại từ baseStats
            }}
          />
        </div>
        <div className="msg-control-actions">
          <button className="msg-refresh-btn" onClick={() => loadStatistics(selectedDate)} disabled={isLoading}>
            {isLoading ? 'Đang tải...' : 'Tải lại toàn bộ'}
          </button>
          <button className="msg-copy-btn" onClick={exportNow} disabled={exporting}>
            {exporting ? 'Đang xuất...' : 'Xuất & Lưu lần này'}
          </button>
          <button className="msg-copy-btn" onClick={copyToClipboard}>
            Sao chép
          </button>
          {copyStatus && <span className="msg-copy-status">{copyStatus}</span>}
        </div>
        <div className="msg-note">"Tải lại toàn bộ" chỉ cập nhật dữ liệu hiển thị, KHÔNG ảnh hưởng đến lần xuất tiếp theo.</div>
      </div>

      <div className="msg-export-content">
        {showRequestsPanel && (
          <div className="msg-block">
            <div className="msg-title">Yêu cầu chỉnh sửa/xóa hóa đơn từ nhân viên</div>
            <div style={{ marginBottom: 8 }}>
              <button className="msg-refresh-btn" onClick={loadChangeRequests} disabled={reqLoading}>{reqLoading ? 'Đang tải...' : 'Tải danh sách yêu cầu'}</button>
            </div>
            {changeRequests && changeRequests.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {changeRequests.map(req => (
                  <div key={req._id} style={{ border: '1px solid #eee', borderRadius: 6, padding: 8 }}>
                    <div style={{ fontWeight: 600 }}>HĐ: {req.invoiceId} • Loại: {req.requestType === 'edit' ? 'Sửa' : 'Xóa'}</div>
                    <div>Nhân viên: {req.employeeId?.name || req.employeeId?.username || 'N/A'}</div>
                    {req.reason ? <div>Lý do: {req.reason}</div> : null}
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <button className="msg-copy-btn" onClick={() => decideChangeRequest(req._id, 'approve')}>Chấp thuận</button>
                      <button className="msg-refresh-btn" onClick={() => decideChangeRequest(req._id, 'reject')}>Từ chối</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="msg-copy-status">Chưa có yêu cầu nào</div>
            )}
          </div>
        )}
        <div className="msg-block"><div className="msg-title">Lô</div><pre className="msg-line">{lotoMessage}</pre></div>
        <div className="msg-block"><div className="msg-title">2 số (Đề)</div><pre className="msg-line">{twoSMessage}</pre></div>
        <div className="msg-block"><div className="msg-title">3 số</div><pre className="msg-line">{threeSMessage}</pre></div>
        <div className="msg-block"><div className="msg-title">4 số</div><pre className="msg-line">{fourSMessage}</pre></div>
        <div className="msg-block"><div className="msg-title">Tổng</div><pre className="msg-line">{tongMessage}</pre></div>
        <div className="msg-block"><div className="msg-title">Đầu</div><pre className="msg-line">{dauMessage}</pre></div>
        <div className="msg-block"><div className="msg-title">Đít</div><pre className="msg-line">{ditMessage}</pre></div>
        <div className="msg-block"><div className="msg-title">Kép</div><pre className="msg-line">{kepMessage}</pre></div>
        <div className="msg-block"><div className="msg-title">Bộ</div><pre className="msg-line">{boMessage}</pre></div>
        <div className="msg-block"><div className="msg-title">Xiên</div><pre className="msg-line">{xMessage}</pre></div>
        <div className="msg-block"><div className="msg-title">Xiên quay</div><pre className="msg-line">{xquayMessage}</pre></div>
        <div className="msg-block">
          <div className="msg-title">Lịch sử xuất trong ngày</div>
          {history && history.length > 0 ? (
            <div>
              {history.map(h => (
                <div key={h._id || h.sequence} className="msg-snapshot">
                  <div style={{ fontWeight: 600 }}>Lần {h.sequence} • {new Date(h.startTime).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} → {new Date(h.endTime).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</div>
                  <div className="msg-snapshot-actions">
                    <button
                      className={`msg-copy-btn snapshot-copy-btn ${copiedMap[h.sequence] ? 'copied' : ''}`}
                      onClick={() => copySnapshot(h)}
                    >
                      {copiedMap[h.sequence] ? 'Đã sao chép ✓' : `Sao chép lần ${h.sequence}`}
                    </button>
                    <button
                      className="msg-refresh-btn"
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('token');
                          const resp = await axios.put(
                            getApiUrl(`/admin/message-exports/reexport/${h._id}`),
                            { multiplier: sendFactor },
                            { headers: { Authorization: `Bearer ${token}` } }
                          );
                          if (resp.data?.success) {
                            // reload history to reflect updated messages
                            await loadHistory(selectedDate);
                            alert(`Đã xuất lại lần ${h.sequence}`);
                          } else {
                            alert(resp.data?.message || 'Không thể xuất lại');
                          }
                        } catch (err) {
                          alert(err.response?.data?.message || 'Lỗi khi xuất lại');
                        }
                      }}
                    >
                      {`Xuất lại lần ${h.sequence}`}
                    </button>
                  </div>
                  <pre className="msg-line">{h.messages?.loto}</pre>
                  <pre className="msg-line">{h.messages?.twoS}</pre>
                  <pre className="msg-line">{h.messages?.threeS}</pre>
                  <pre className="msg-line">{h.messages?.fourS}</pre>
                  <pre className="msg-line">{h.messages?.tong}</pre>
                  <pre className="msg-line">{h.messages?.dau}</pre>
                  <pre className="msg-line">{h.messages?.dit}</pre>
                  <pre className="msg-line">{h.messages?.kep}</pre>
                  <pre className="msg-line">{h.messages?.bo}</pre>
                  <pre className="msg-line">{h.messages?.xien}</pre>
                  <pre className="msg-line">{h.messages?.xienquay}</pre>
                </div>
              ))}
            </div>
          ) : (
            <div className="msg-copy-status">Chưa có lịch sử xuất trong ngày.</div>
          )}
        </div>


      </div>
    </div>
  );
};

export default AdminMessageExport;