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
  const [loAMessage, setLoAMessage] = useState('');
  const [deaAMessage, setDeaAMessage] = useState('');
  const [threeSMessage, setThreeSMessage] = useState('');
  const [fourSMessage, setFourSMessage] = useState('');
  const [tongMessage, setTongMessage] = useState('');
  const [dauMessage, setDauMessage] = useState('');
  const [ditMessage, setDitMessage] = useState('');
  const [dauAMessage, setDauAMessage] = useState('');
  const [ditAMessage, setDitAMessage] = useState('');
  const [kepMessage, setKepMessage] = useState('');
  const [boMessage, setBoMessage] = useState('');
  const [x2Message, setX2Message] = useState('');
  const [x3Message, setX3Message] = useState('');
  const [x4Message, setX4Message] = useState('');
  const [xq3Message, setXq3Message] = useState('');
  const [xq4Message, setXq4Message] = useState('');
  const [xNhayMessage, setXNhayMessage] = useState('');
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
  const defaultFormat = { lo: 'Lo', loA: 'Lo A', twoS: 'De', deaA: 'De A', threeS: 'Bc', fourS: '4s', tong: 'De Tong', dau: 'De Dau', dit: 'De Dit', dauA: 'De Dau A', ditA: 'De Dit A', kep: 'Kep', boPrefix: 'Bo', xien2: 'Xien2', xien3: 'Xien3', xien4: 'Xien4', xq3: 'xq3', xq4: 'xq4', xiennhay: 'Xiennhay' };
  const resolveFormatKey = (u) => { const id = u?._id || u?.id; return id ? `msgExportFormat:${id}` : 'msgExportFormat'; };
  const getInitialFormat = (u) => { try { const raw = localStorage.getItem(resolveFormatKey(u)); if (!raw) return defaultFormat; const parsed = JSON.parse(raw); return { ...defaultFormat, ...(parsed || {}) }; } catch (_) { return defaultFormat; } };
  const [format, setFormat] = useState(() => getInitialFormat(user));
  useEffect(() => { try { localStorage.setItem(resolveFormatKey(user), JSON.stringify(format)); } catch (_) { } }, [format, user]);

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
    const loAStats = stats?.loA || {};
    const deAStats = stats?.['deaA'] || {};
    const threeSStats = stats?.['3s'] || {};
    const fourSStats = stats?.['4s'] || {};
    const grouped = stats?.grouped || {};
    const xStats = stats?.xien || {};
    const xqStats = stats?.xienquay || {};

    setLotoMessage(buildLotoMessage(lotoStats)); // Lô không nhân hệ số
    setLoAMessage(buildLoAMessage(loAStats));
    setTwoSMessage(buildTwoSMessage(twoSStats));
    {
      const hasDeA = deAStats && Object.keys(deAStats).length > 0;
      const msg = buildTwoSMessage(deAStats).replace(/^De:/, `${format.deaA}:`);
      setDeaAMessage(hasDeA ? msg : '');
    }
    setThreeSMessage(buildThreeSMessage(threeSStats));
    setFourSMessage(buildFourSMessage(fourSStats));
    setTongMessage(buildGroupedLines(format.tong, grouped?.tong));
    setDauMessage(buildGroupedLines(format.dau, grouped?.dau));
    setDitMessage(buildGroupedLines(format.dit, grouped?.dit));
    {
      const dauAMap = grouped?.dauA || grouped?.daua || {};
      const ditAMap = grouped?.ditA || grouped?.dita || {};
      setDauAMessage(Object.keys(dauAMap).length > 0 ? buildGroupedLines(format.dauA, dauAMap) : '');
      setDitAMessage(Object.keys(ditAMap).length > 0 ? buildGroupedLines(format.ditA, ditAMap) : '');
    }
    setKepMessage(buildKepPerItemLines(format.kep, grouped?.kep));
    setBoMessage(buildBoLines(grouped?.bo));
    const { x2, x3, x4 } = buildXSplitMessages(xStats);
    setX2Message(x2);
    setX3Message(x3);
    setX4Message(x4);
    const { xq3, xq4 } = buildXqSplitMessages(xqStats);
    setXq3Message(xq3);
    setXq4Message(xq4);
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
      return `${format.lo}: (Không có dữ liệu)`;
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

    return `${format.lo}: ${segments.join(', ')}`;
  };

  const buildLoAMessage = (loAStats) => {
    if (!loAStats || Object.keys(loAStats).length === 0) {
      return '';
    }
    const groups = new Map();
    for (const [number, points] of Object.entries(loAStats)) {
      const p = parseInt(points) || 0;
      if (!groups.has(p)) groups.set(p, []);
      groups.get(p).push(String(number).padStart(2, '0'));
    }
    const sortedPoints = Array.from(groups.keys()).sort((a, b) => b - a);
    const segments = sortedPoints.map(p => {
      const nums = groups.get(p).sort((a, b) => parseInt(a) - parseInt(b));
      return `${nums.join(',')}x${p}đ`;
    });
    return `${format.loA}: ${segments.join(', ')}`;
  };

  const buildTwoSMessage = (twoSStats) => {
    if (!twoSStats || Object.keys(twoSStats).length === 0) return `${format.twoS}: (Không có dữ liệu)`;
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
      return `${nums.join(',')} x ${a}n`;
    });
    return `${format.twoS}: ${segments.join(', ')}`;
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
    if (Object.keys(agg).length === 0) return `${format.threeS}: (Không có dữ liệu)`;
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
      return `${nums.join(',')} x ${a}n`;
    });
    return `${format.threeS}: ${segments.join(', ')}`;
  };

  const buildFourSMessage = (fourSStats) => {
    const agg = aggregateAmountNFromNested(fourSStats);
    if (Object.keys(agg).length === 0) return `${format.fourS}: (Không có dữ liệu)`;
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
      return `${nums.join(',')} x ${a}n`;
    });
    return `${format.fourS}: ${segments.join(', ')}`;
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
      return `${items.join(',')} x ${a}n`;
    });
    return `${label}: ${segments.join(', ')}`;
  };

  const buildGroupedLines = (label, groupedMap) => {
    const simple = {};
    Object.entries(groupedMap || {}).forEach(([key, val]) => {
      const amt = parseInt(val?.totalAmount || 0) || 0;
      simple[key] = (simple[key] || 0) + amt;
    });
    if (Object.keys(simple).length === 0) return `${label} : (Không có dữ liệu)`;
    const groups = new Map();
    for (const [key, n] of Object.entries(simple)) {
      const a = parseInt(n) || 0;
      const scaled = Math.max(1, Math.round(a * sendFactor));
      if (!groups.has(scaled)) groups.set(scaled, []);
      groups.get(scaled).push(key);
    }
    const sortedAmounts = Array.from(groups.keys()).sort((a, b) => b - a);
    const lines = sortedAmounts.map(a => {
      const items = groups.get(a).sort();
      return `${label} : ${items.join(',')} x ${a}n`;
    });
    return lines.join('\n');
  };

  const buildBoLines = (groupedMap) => {
    const map = groupedMap || {};
    const getAlias = (name) => {
      const n = String(name).toLowerCase();
      const base = (x) => `De cham ${x}`;
      switch (n) {
        case 'chamkhong': return base('0');
        case 'chammot': return base('1');
        case 'chamhai': return base('2');
        case 'chamba': return base('3');
        case 'chambon': return base('4');
        case 'chamnam': return base('5');
        case 'chamsau': return base('6');
        case 'chambay': return base('7');
        case 'chamtam': return base('8');
        case 'chamchin': return base('9');
        case 'chanle': return 'De chanle';
        case 'lechan': return 'De lechan';
        case 'lele': return 'De lele';
        case 'chanchan': return 'De chanchan';
        default: return null;
      }
    };
    const numeric = {};
    const special = [];
    Object.entries(map).forEach(([key, val]) => {
      const alias = getAlias(key);
      const amt = Math.max(1, Math.round((parseInt(val?.totalAmount || val || 0) || 0) * sendFactor));
      if (!amt) return;
      const isNumericTwo = /^\d{2}$/.test(String(key));
      if (alias) special.push(`${alias} x ${amt}n`);
      else if (!isNumericTwo) special.push(`De ${removeAccents(String(key).toLowerCase())} x ${amt}n`);
      else numeric[key] = (numeric[key] || 0) + amt;
    });
    const byAmount = new Map();
    Object.entries(numeric).forEach(([k, a]) => {
      if (a <= 0) return;
      if (!byAmount.has(a)) byAmount.set(a, []);
      byAmount.get(a).push(k);
    });
    const numericLines = Array.from(byAmount.keys()).sort((a, b) => b - a).map(a => {
      const items = byAmount.get(a).sort();
      return `Bo : ${items.join(',')} x ${a}n`;
    });
    return [...numericLines, ...special.sort()].join('\n');
  };

  const removeAccents = (s) => {
    if (!s) return s;
    return String(s)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };

  const buildGroupedLinesNoAccent = (label, groupedMap) => {
    const simple = {};
    Object.entries(groupedMap || {}).forEach(([key, val]) => {
      const amt = parseInt(val?.totalAmount || 0) || 0;
      const normKey = removeAccents(key);
      simple[normKey] = (simple[normKey] || 0) + amt;
    });
    if (Object.keys(simple).length === 0) return `${label} : (Không có dữ liệu)`;
    const groups = new Map();
    for (const [key, n] of Object.entries(simple)) {
      const a = parseInt(n) || 0;
      const scaled = Math.max(1, Math.round(a * sendFactor));
      if (!groups.has(scaled)) groups.set(scaled, []);
      groups.get(scaled).push(removeAccents(key));
    }
    const sortedAmounts = Array.from(groups.keys()).sort((a, b) => b - a);
    const lines = sortedAmounts.map(a => {
      const items = groups.get(a).map(x => removeAccents(x)).sort();
      return `${label} : ${items.join(',')} x ${a}n`;
    });
    return lines.join('\n');
  };

  const buildKepPerItemLines = (label, groupedMap) => {
    const map = groupedMap || {};
    const totals = new Map();
    Object.entries(map).forEach(([key, val]) => {
      const amt = Math.max(1, Math.round((parseInt(val?.totalAmount || val || 0) || 0) * sendFactor));
      if (!amt) return;
      const item = removeAccents(String(key)).toLowerCase().trim();
      totals.set(item, (totals.get(item) || 0) + amt);
    });
    const lab = removeAccents(String(label || 'Kep')).toLowerCase();
    const lines = Array.from(totals.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([item, amt]) => `${lab} ${item} x ${amt}n`);
    return lines.join('\n');
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

  const buildXSplitMessages = (xStats) => {
    const agg = aggregateCombosN(xStats);
    const byLen = { 2: {}, 3: {}, 4: {} };
    Object.entries(agg).forEach(([combo, n]) => {
      const core = combo.split(' ')[0];
      const parts = core.split('-').filter(Boolean);
      const len = parts.length;
      if (byLen[len]) byLen[len][combo] = n;
    });
    const buildLabel = (label, map) => {
      if (Object.keys(map).length === 0) return `${label}: (Không có dữ liệu)`;
      const groups = new Map();
      for (const [combo, n] of Object.entries(map)) {
        const a = parseInt(n) || 0;
        const scaled = Math.max(1, Math.round(a * sendFactor));
        if (!groups.has(scaled)) groups.set(scaled, []);
        groups.get(scaled).push(combo);
      }
      const sorted = Array.from(groups.keys()).filter(a => a > 0).sort((a, b) => b - a);
      const segments = sorted.map(a => {
        const combos = groups.get(a).sort();
        return `${combos.join(', ')} x ${a}n`;
      });
      return `${label}: ${segments.join(', ')}`;
    };
    return {
      x2: buildLabel('Xien2', byLen[2]),
      x3: buildLabel('Xien3', byLen[3]),
      x4: buildLabel('Xien4', byLen[4])
    };
  };

  const buildXqSplitMessages = (xqStats) => {
    const agg = aggregateCombosN(xqStats);
    const byLen = { 3: {}, 4: {} };
    Object.entries(agg).forEach(([combo, n]) => {
      const parts = combo.split('-').filter(Boolean);
      const len = parts.length;
      if (byLen[len]) byLen[len][combo] = n;
    });
    const buildLabel = (label, map) => {
      if (Object.keys(map).length === 0) return `${label}: (Không có dữ liệu)`;
      const groups = new Map();
      for (const [combo, n] of Object.entries(map)) {
        const a = parseInt(n) || 0;
        const scaled = Math.max(1, Math.round(a * sendFactor));
        if (!groups.has(scaled)) groups.set(scaled, []);
        groups.get(scaled).push(combo);
      }
      const sorted = Array.from(groups.keys()).filter(a => a > 0).sort((a, b) => b - a);
      const segments = sorted.map(a => {
        const combos = groups.get(a).sort();
        return `${combos.join(', ')} x ${a}n`;
      });
      return `${label}: ${segments.join(', ')}`;
    };
    return {
      xq3: buildLabel('xq3', byLen[3]),
      xq4: buildLabel('xq4', byLen[4])
    };
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
      setLotoMessage('Lo: (Không thể tải dữ liệu)');
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
        { date: selectedDate, multiplier: sendFactor, format },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (resp.data?.success) {
        const m = resp.data.snapshot?.messages || {};

        // Kiểm tra xem có phải là message "Không có cược trong thời gian này" không
        if (m.loto === 'Không có cược trong thời gian này') {
          setLotoMessage('Không có cược trong thời gian này');
          setTwoSMessage('');
          setThreeSMessage('');
          setFourSMessage('');
          setTongMessage('');
          setDauMessage('');
          setDitMessage('');
          setKepMessage('');
          setBoMessage('');
          setX2Message('');
          setX3Message('');
          setX4Message('');
          setXq3Message('');
          setXq4Message('');
          setXNhayMessage('');
        } else {
          // Cập nhật messages từ snapshot
          // Nếu rỗng thì hiển thị "(Không có dữ liệu)" ở UI, nhưng snapshot vẫn lưu rỗng
          setLotoMessage(m.loto || `${format.lo}: (Không có dữ liệu)`);
          setTwoSMessage(m.twoS || `${format.twoS}: (Không có dữ liệu)`);
          setLoAMessage(m.loA || '');
          setDeaAMessage(m.deaA || '');
          setThreeSMessage(m.threeS || `${format.threeS}: (Không có dữ liệu)`);
          setFourSMessage(m.fourS || `${format.fourS}: (Không có dữ liệu)`);
          setTongMessage(m.tong || `${format.tong} : (Không có dữ liệu)`);
          setDauMessage(m.dau || `${format.dau} : (Không có dữ liệu)`);
          setDitMessage(m.dit || `${format.dit} : (Không có dữ liệu)`);
          setDauAMessage(m.dauA || '');
          setDitAMessage(m.ditA || '');
          setKepMessage(m.kep || `${format.kep}: (Không có dữ liệu)`);
          setBoMessage(m.bo || 'Bo : (Không có dữ liệu)');
          setX2Message(m.xien2 || `${format.xien2}: (Không có dữ liệu)`);
          setX3Message(m.xien3 || `${format.xien3}: (Không có dữ liệu)`);
          setX4Message(m.xien4 || `${format.xien4}: (Không có dữ liệu)`);
          setXq3Message(m.xienq3 || `${format.xq3}: (Không có dữ liệu)`);
          setXq4Message(m.xienq4 || `${format.xq4}: (Không có dữ liệu)`);
          setXNhayMessage(m.xiennhay || ''); // Xiên nháy có thể không có
        }
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
        loAMessage,
        deaAMessage,
        threeSMessage,
        fourSMessage,
        tongMessage,
        dauMessage,
        ditMessage,
        dauAMessage,
        ditAMessage,
        kepMessage,
        boMessage,
        x2Message,
        x3Message,
        x4Message,
        xq3Message,
        xq4Message,
        xNhayMessage
      ].filter(msg => msg && msg.trim().length > 0 && !msg.includes('(Không có dữ liệu)'));
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
      messages?.loA,
      messages?.deaA,
      messages?.threeS,
      messages?.fourS,
      messages?.tong,
      messages?.dau,
      messages?.dauA,
      messages?.dit,
      messages?.ditA,
      messages?.kep,
      messages?.bo,
      messages?.xien2 || messages?.xien,
      messages?.xien3 || messages?.xien,
      messages?.xien4 || messages?.xien,
      messages?.xienq3 || messages?.xienquay,
      messages?.xienq4 || messages?.xienquay,
      messages?.xiennhay
    ].filter(msg => msg && msg.trim().length > 0); // Chỉ loại bỏ chuỗi rỗng hoặc undefined
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
        <div className="msg-block"><div className="msg-title">Lo</div><pre className="msg-line">{lotoMessage}</pre></div>
        <div className="msg-block"><div className="msg-title">De</div><pre className="msg-line">{twoSMessage}</pre></div>
        {deaAMessage && (
          <div className="msg-block"><div className="msg-title">De A</div><pre className="msg-line">{deaAMessage}</pre></div>
        )}
        {loAMessage && (
          <div className="msg-block"><div className="msg-title">Lo A</div><pre className="msg-line">{loAMessage}</pre></div>
        )}
        <div className="msg-block"><div className="msg-title">Bc</div><pre className="msg-line">{threeSMessage}</pre></div>
        {/* Chỉ hiển thị 4 số nếu có dữ liệu thật */}
        {fourSMessage && (
          <div className="msg-block"><div className="msg-title">4 số</div><pre className="msg-line">{fourSMessage}</pre></div>
        )}
        <div className="msg-block"><div className="msg-title">De Tong</div><pre className="msg-line">{tongMessage}</pre></div>
        <div className="msg-block"><div className="msg-title">De Dau</div><pre className="msg-line">{dauMessage}</pre></div>
        {dauAMessage && (
          <div className="msg-block"><div className="msg-title">De Dau A</div><pre className="msg-line">{dauAMessage}</pre></div>
        )}
        <div className="msg-block"><div className="msg-title">De Dit</div><pre className="msg-line">{ditMessage}</pre></div>
        {ditAMessage && (
          <div className="msg-block"><div className="msg-title">De Dit A</div><pre className="msg-line">{ditAMessage}</pre></div>
        )}
        <div className="msg-block"><div className="msg-title">Kep</div><pre className="msg-line">{kepMessage}</pre></div>
        <div className="msg-block"><div className="msg-title">Bo</div><pre className="msg-line">{boMessage}</pre></div>
        <div className="msg-block"><div className="msg-title">Xien2</div><pre className="msg-line">{x2Message}</pre></div>
        <div className="msg-block"><div className="msg-title">Xien3</div><pre className="msg-line">{x3Message}</pre></div>
        <div className="msg-block"><div className="msg-title">Xien4</div><pre className="msg-line">{x4Message}</pre></div>
        <div className="msg-block"><div className="msg-title">xq3</div><pre className="msg-line">{xq3Message}</pre></div>
        <div className="msg-block"><div className="msg-title">xq4</div><pre className="msg-line">{xq4Message}</pre></div>
        {xNhayMessage && (
          <div className="msg-block"><div className="msg-title">Xiennhay</div><pre className="msg-line">{xNhayMessage}</pre></div>
        )}
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
                            { multiplier: sendFactor, format },
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
                  {h.messages?.loA && (<pre className="msg-line">{h.messages?.loA}</pre>)}
                  {h.messages?.deaA && (<pre className="msg-line">{h.messages?.deaA}</pre>)}
                  <pre className="msg-line">{h.messages?.threeS}</pre>
                  {/* Chỉ hiển thị 4 số nếu có dữ liệu thật */}
                  {h.messages?.fourS && (
                    <pre className="msg-line">{h.messages?.fourS}</pre>
                  )}
                  <pre className="msg-line">{h.messages?.tong}</pre>
                  <pre className="msg-line">{h.messages?.dau}</pre>
                  {h.messages?.dauA && (<pre className="msg-line">{h.messages?.dauA}</pre>)}
                  <pre className="msg-line">{h.messages?.dit}</pre>
                  {h.messages?.ditA && (<pre className="msg-line">{h.messages?.ditA}</pre>)}
                  <pre className="msg-line">{h.messages?.kep}</pre>
                  <pre className="msg-line">{h.messages?.bo}</pre>
                  <pre className="msg-line">{h.messages?.xien2 || h.messages?.xien}</pre>
                  <pre className="msg-line">{h.messages?.xien3 || h.messages?.xien}</pre>
                  <pre className="msg-line">{h.messages?.xien4 || h.messages?.xien}</pre>
                  <pre className="msg-line">{h.messages?.xienq3 || h.messages?.xienquay}</pre>
                  <pre className="msg-line">{h.messages?.xienq4 || h.messages?.xienquay}</pre>
                  {h.messages?.xiennhay && (
                    <pre className="msg-line">{h.messages?.xiennhay}</pre>
                  )}
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
