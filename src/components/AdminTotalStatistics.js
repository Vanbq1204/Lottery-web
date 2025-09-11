import { getApiUrl } from '../config/api';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminTotalStatistics.css';

const AdminTotalStatistics = ({ user }) => {
  // Get current date in Vietnam timezone (UTC+7)
  const getCurrentVietnamDate = () => {
    const now = new Date();
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // Add 7 hours
    return vietnamTime.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getCurrentVietnamDate());
  const [isLoading, setIsLoading] = useState(false);
  const [statisticsData, setStatisticsData] = useState(null);
  const [activeTab, setActiveTab] = useState('betting'); // 'betting' hoặc 'prizes'
  const [activeDetailTab, setActiveDetailTab] = useState('loto'); // Tab chi tiết trong thống kê cược
  // UI và logic bộ lọc hiển thị cho bảng Lô tô (chỉ tác động giao diện)
  const [showLotoFilter, setShowLotoFilter] = useState(false);
  const [lotoFilterNumber, setLotoFilterNumber] = useState(''); // "00" - "99"
  const [lotoFilterSubtract, setLotoFilterSubtract] = useState(''); // số điểm trừ (1 con)
  const [lotoFilterPercent, setLotoFilterPercent] = useState(''); // % áp dụng toàn bộ
  // Top N con có điểm cao nhất - Lô tô
  const [topNCount, setTopNCount] = useState('');
  const [topNSelection, setTopNSelection] = useState([]); // [{number, points}]
  const [topNSubtracts, setTopNSubtracts] = useState({}); // { '10': '100', ... }
  // Ghim bộ lọc (persist) - Lô tô
  const [pinLotoFilter, setPinLotoFilter] = useState(false);
  
  // UI và logic bộ lọc cho tổng kép đầu đít bộ
  const [showCombinedFilter, setShowCombinedFilter] = useState(false);
  const [combinedFilterPercent, setCombinedFilterPercent] = useState('');
  const [pinCombinedFilter, setPinCombinedFilter] = useState(false);

  // UI và logic bộ lọc cho 2 số (tiền)
  const [showTwoSFilter, setShowTwoSFilter] = useState(false);
  const [twoSFilterNumber, setTwoSFilterNumber] = useState('');
  const [twoSFilterSubtract, setTwoSFilterSubtract] = useState(''); // số tiền trừ (n)
  const [twoSFilterPercent, setTwoSFilterPercent] = useState('');
  // Top N - 2 số
  const [topNTwoSCount, setTopNTwoSCount] = useState('');
  const [topNTwoSSelection, setTopNTwoSSelection] = useState([]); // [{number, amount}]
  const [topNTwoSSubtracts, setTopNTwoSSubtracts] = useState({}); // { '10': '50', ... }
  // Ghim - 2 số
  const [pinTwoSFilter, setPinTwoSFilter] = useState(false);
  // Trừ theo số tiền thấp nhất (00-99) - hỗ trợ nhiều lần
  const [twoSMinSubtracts, setTwoSMinSubtracts] = useState([]); // string[] mỗi phần tử là một lần trừ

  // UI và logic bộ lọc cho 3 số
  const [showThreeFilter, setShowThreeFilter] = useState(false);
  const [threeFilterNumber, setThreeFilterNumber] = useState('');
  const [threeFilterSubtract, setThreeFilterSubtract] = useState('');
  const [threeFilterPercent, setThreeFilterPercent] = useState('');
  const [topNThreeCount, setTopNThreeCount] = useState('');
  const [topNThreeSelection, setTopNThreeSelection] = useState([]); // [{key, amount}]
  const [topNThreeSubtracts, setTopNThreeSubtracts] = useState({});
  const [pinThreeFilter, setPinThreeFilter] = useState(false);

  // UI và logic bộ lọc cho Xiên
  const [showXienFilter, setShowXienFilter] = useState(false);
  const [xienFilterNumber, setXienFilterNumber] = useState('');
  const [xienFilterSubtract, setXienFilterSubtract] = useState('');
  const [xienFilterPercent, setXienFilterPercent] = useState('');
  const [topNXienCount, setTopNXienCount] = useState('');
  const [topNXienSelection, setTopNXienSelection] = useState([]);
  const [topNXienSubtracts, setTopNXienSubtracts] = useState({});
  const [pinXienFilter, setPinXienFilter] = useState(false);

  // UI và logic bộ lọc cho Xiên quay
  const [showXienQuayFilter, setShowXienQuayFilter] = useState(false);
  const [xienQuayFilterNumber, setXienQuayFilterNumber] = useState('');
  const [xienQuayFilterSubtract, setXienQuayFilterSubtract] = useState('');
  const [xienQuayFilterPercent, setXienQuayFilterPercent] = useState('');
  const [topNXienQuayCount, setTopNXienQuayCount] = useState('');
  const [topNXienQuaySelection, setTopNXienQuaySelection] = useState([]);
  const [topNXienQuaySubtracts, setTopNXienQuaySubtracts] = useState({});
  const [pinXienQuayFilter, setPinXienQuayFilter] = useState(false);
  
  // Bộ lọc cho tổng kép đầu đít bộ đã khai báo ở trên

  const getLotoFilterStorageKey = () => `lotoFilter:${user?.id}:${selectedDate}`;
  const getTwoSFilterStorageKey = () => `twoSFilter:${user?.id}:${selectedDate}`;
  const getThreeFilterStorageKey = () => `threeFilter:${user?.id}:${selectedDate}`;
  const getXienFilterStorageKey = () => `xienFilter:${user?.id}:${selectedDate}`;
  const getXienQuayFilterStorageKey = () => `xienQuayFilter:${user?.id}:${selectedDate}`;
  const getCombinedFilterStorageKey = () => `combinedFilter:${user?.id}:${selectedDate}`;

  const resetLotoFilters = () => {
    setShowLotoFilter(false);
    setLotoFilterNumber('');
    setLotoFilterSubtract('');
    setLotoFilterPercent('');
    setTopNCount('');
    setTopNSelection([]);
    setTopNSubtracts({});
  };

  const resetTwoSFilters = () => {
    setShowTwoSFilter(false);
    setTwoSFilterNumber('');
    setTwoSFilterSubtract('');
    setTwoSFilterPercent('');
    setTopNTwoSCount('');
    setTopNTwoSSelection([]);
    setTopNTwoSSubtracts({});
    setTwoSMinSubtracts([]);
  };

  const resetThreeFilters = () => {
    setShowThreeFilter(false);
    setThreeFilterNumber('');
    setThreeFilterSubtract('');
    setThreeFilterPercent('');
    setTopNThreeCount('');
    setTopNThreeSelection([]);
    setTopNThreeSubtracts({});
  };

  const resetXienFilters = () => {
    setShowXienFilter(false);
    setXienFilterNumber('');
    setXienFilterSubtract('');
    setXienFilterPercent('');
    setTopNXienCount('');
    setTopNXienSelection([]);
    setTopNXienSubtracts({});
  };

  const resetXienQuayFilters = () => {
    setShowXienQuayFilter(false);
    setXienQuayFilterNumber('');
    setXienQuayFilterSubtract('');
    setXienQuayFilterPercent('');
    setTopNXienQuayCount('');
    setTopNXienQuaySelection([]);
    setTopNXienQuaySubtracts({});
  };
  
  const resetCombinedFilters = () => {
    setShowCombinedFilter(false);
    setCombinedFilterPercent('');
    setPinCombinedFilter(false);
  };

  const clearPersistedLotoFilters = () => { try { localStorage.removeItem(getLotoFilterStorageKey()); } catch (e) {} };
  const clearPersistedTwoSFilters = () => { try { localStorage.removeItem(getTwoSFilterStorageKey()); } catch (e) {} };
  const clearPersistedThreeFilters = () => { try { localStorage.removeItem(getThreeFilterStorageKey()); } catch (e) {} };
  const clearPersistedXienFilters = () => { try { localStorage.removeItem(getXienFilterStorageKey()); } catch (e) {} };
  const clearPersistedXienQuayFilters = () => { try { localStorage.removeItem(getXienQuayFilterStorageKey()); } catch (e) {} };
  const clearPersistedCombinedFilters = () => { try { localStorage.removeItem(getCombinedFilterStorageKey()); } catch (e) {} };

  const handleRefreshLoto = async () => { clearPersistedLotoFilters(); resetLotoFilters(); await loadStatistics(); };
  const handleRefreshTwoS = async () => { clearPersistedTwoSFilters(); resetTwoSFilters(); await loadStatistics(); };
  const handleRefreshThree = async () => { clearPersistedThreeFilters(); resetThreeFilters(); await loadStatistics(); };
  const handleRefreshXien = async () => { clearPersistedXienFilters(); resetXienFilters(); await loadStatistics(); };
  const handleRefreshXienQuay = async () => { clearPersistedXienQuayFilters(); resetXienQuayFilters(); await loadStatistics(); };
  const handleRefreshCombined = async () => { clearPersistedCombinedFilters(); resetCombinedFilters(); await loadStatistics(); };

  const saveLotoFiltersToStorage = () => {
    if (!pinLotoFilter) return;
    try {
      const payload = { showLotoFilter, lotoFilterNumber, lotoFilterSubtract, lotoFilterPercent, topNCount, topNSubtracts, pinLotoFilter: true };
      localStorage.setItem(getLotoFilterStorageKey(), JSON.stringify(payload));
    } catch (e) {}
  };

  const saveTwoSFiltersToStorage = () => {
    if (!pinTwoSFilter) return;
    try {
      const payload = {
        showTwoSFilter,
        twoSFilterNumber,
        twoSFilterSubtract,
        twoSFilterPercent,
        topNTwoSCount,
        topNTwoSSubtracts,
        twoSMinSubtracts,
        pinTwoSFilter: true
      };
      localStorage.setItem(getTwoSFilterStorageKey(), JSON.stringify(payload));
    } catch (e) {}
  };

  const saveThreeFiltersToStorage = () => {
    if (!pinThreeFilter) return;
    try {
      const payload = { showThreeFilter, threeFilterNumber, threeFilterSubtract, threeFilterPercent, topNThreeCount, topNThreeSubtracts, pinThreeFilter: true };
      localStorage.setItem(getThreeFilterStorageKey(), JSON.stringify(payload));
    } catch (e) {}
  };

  const saveXienFiltersToStorage = () => {
    if (!pinXienFilter) return;
    try {
      const payload = { showXienFilter, xienFilterNumber, xienFilterSubtract, xienFilterPercent, topNXienCount, topNXienSubtracts, pinXienFilter: true };
      localStorage.setItem(getXienFilterStorageKey(), JSON.stringify(payload));
    } catch (e) {}
  };

  const saveXienQuayFiltersToStorage = () => {
    if (!pinXienQuayFilter) return;
    try {
      const payload = { showXienQuayFilter, xienQuayFilterNumber, xienQuayFilterSubtract, xienQuayFilterPercent, topNXienQuayCount, topNXienQuaySubtracts, pinXienQuayFilter: true };
      localStorage.setItem(getXienQuayFilterStorageKey(), JSON.stringify(payload));
    } catch (e) {}
  };
  
  const saveCombinedFiltersToStorage = () => {
    if (!pinCombinedFilter) return;
    try {
      const payload = { showCombinedFilter, combinedFilterPercent, pinCombinedFilter: true };
      localStorage.setItem(getCombinedFilterStorageKey(), JSON.stringify(payload));
    } catch (e) {}
  };

  const loadLotoFiltersFromStorage = () => {
    try {
      const raw = localStorage.getItem(getLotoFilterStorageKey());
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      setShowLotoFilter(!!data.showLotoFilter);
      setLotoFilterNumber(data.lotoFilterNumber ?? '');
      setLotoFilterSubtract(data.lotoFilterSubtract ?? '');
      setLotoFilterPercent(data.lotoFilterPercent ?? '');
      setTopNCount(data.topNCount ?? '');
      setTopNSubtracts(data.topNSubtracts ?? {});
      setPinLotoFilter(!!data.pinLotoFilter);
    } catch (e) {}
  };

  const loadTwoSFiltersFromStorage = () => {
    try {
      const raw = localStorage.getItem(getTwoSFilterStorageKey());
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      setShowTwoSFilter(!!data.showTwoSFilter);
      setTwoSFilterNumber(data.twoSFilterNumber ?? '');
      setTwoSFilterSubtract(data.twoSFilterSubtract ?? '');
      setTwoSFilterPercent(data.twoSFilterPercent ?? '');
      setTopNTwoSCount(data.topNTwoSCount ?? '');
      setTopNTwoSSubtracts(data.topNTwoSSubtracts ?? {});
      setTwoSMinSubtracts(Array.isArray(data.twoSMinSubtracts) ? data.twoSMinSubtracts : []);
      setPinTwoSFilter(!!data.pinTwoSFilter);
    } catch (e) {}
  };

  const loadThreeFiltersFromStorage = () => {
    try {
      const raw = localStorage.getItem(getThreeFilterStorageKey());
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      setShowThreeFilter(!!data.showThreeFilter);
      setThreeFilterNumber(data.threeFilterNumber ?? '');
      setThreeFilterSubtract(data.threeFilterSubtract ?? '');
      setThreeFilterPercent(data.threeFilterPercent ?? '');
      setTopNThreeCount(data.topNThreeCount ?? '');
      setTopNThreeSubtracts(data.topNThreeSubtracts ?? {});
      setPinThreeFilter(!!data.pinThreeFilter);
    } catch (e) {}
  };

  const loadXienFiltersFromStorage = () => {
    try {
      const raw = localStorage.getItem(getXienFilterStorageKey());
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      setShowXienFilter(!!data.showXienFilter);
      setXienFilterNumber(data.xienFilterNumber ?? '');
      setXienFilterSubtract(data.xienFilterSubtract ?? '');
      setXienFilterPercent(data.xienFilterPercent ?? '');
      setTopNXienCount(data.topNXienCount ?? '');
      setTopNXienSubtracts(data.topNXienSubtracts ?? {});
      setPinXienFilter(!!data.pinXienFilter);
    } catch (e) {}
  };

  const loadXienQuayFiltersFromStorage = () => {
    try {
      const raw = localStorage.getItem(getXienQuayFilterStorageKey());
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      setShowXienQuayFilter(!!data.showXienQuayFilter);
      setXienQuayFilterNumber(data.xienQuayFilterNumber ?? '');
      setXienQuayFilterSubtract(data.xienQuayFilterSubtract ?? '');
      setXienQuayFilterPercent(data.xienQuayFilterPercent ?? '');
      setTopNXienQuayCount(data.topNXienQuayCount ?? '');
      setTopNXienQuaySubtracts(data.topNXienQuaySubtracts ?? {});
      setPinXienQuayFilter(!!data.pinXienQuayFilter);
    } catch (e) {}
  };
  
  const loadCombinedFiltersFromStorage = () => {
    try {
      const raw = localStorage.getItem(getCombinedFilterStorageKey());
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      setShowCombinedFilter(!!data.showCombinedFilter);
      setCombinedFilterPercent(data.combinedFilterPercent ?? '');
      setPinCombinedFilter(!!data.pinCombinedFilter);
    } catch (e) {}
  };

  const buildTopNSelection = () => {
    const n = parseInt(topNCount, 10);
    if (isNaN(n) || n <= 0 || !statisticsData?.loto) {
      setTopNSelection([]);
      return;
    }
    const entries = Object.entries(statisticsData.loto)
      .map(([number, points]) => ({ number, points: points || 0 }))
      .sort((a, b) => b.points - a.points)
      .filter(item => item.points > 0)
      .slice(0, n);
    setTopNSelection(entries);
  };

  const buildTopNTwoSSelection = () => {
    const n = parseInt(topNTwoSCount, 10);
    if (isNaN(n) || n <= 0 || !statisticsData?.['2s']) {
      setTopNTwoSSelection([]);
      return;
    }
    const entries = Object.entries(statisticsData['2s'])
      .map(([number, amount]) => ({ number, amount: amount || 0 }))
      .sort((a, b) => b.amount - a.amount)
      .filter(item => item.amount > 0)
      .slice(0, n);
    setTopNTwoSSelection(entries);
  };

  const buildTopNThreeSelection = () => {
    const n = parseInt(topNThreeCount, 10);
    if (isNaN(n) || n <= 0 || !statisticsData?.['3s']) {
      setTopNThreeSelection([]);
      return;
    }
    const entries = Object.entries(statisticsData['3s'])
      .map(([key, amount]) => ({ key, amount: amount || 0 }))
      .sort((a, b) => b.amount - a.amount)
      .filter(item => item.amount > 0)
      .slice(0, n);
    setTopNThreeSelection(entries);
  };

  const buildTopNXienSelection = () => {
    const n = parseInt(topNXienCount, 10);
    if (isNaN(n) || n <= 0 || !statisticsData?.xien) {
      setTopNXienSelection([]);
      return;
    }
    const entries = Object.entries(statisticsData.xien)
      .map(([key, amount]) => ({ key, amount: amount || 0 }))
      .sort((a, b) => b.amount - a.amount)
      .filter(item => item.amount > 0)
      .slice(0, n);
    setTopNXienSelection(entries);
  };

  const buildTopNXienQuaySelection = () => {
    const n = parseInt(topNXienQuayCount, 10);
    if (isNaN(n) || n <= 0 || !statisticsData?.xienquay) {
      setTopNXienQuaySelection([]);
      return;
    }
    const entries = Object.entries(statisticsData.xienquay)
      .map(([key, amount]) => ({ key, amount: amount || 0 }))
      .sort((a, b) => b.amount - a.amount)
      .filter(item => item.amount > 0)
      .slice(0, n);
    setTopNXienQuaySelection(entries);
  };

  const adjustLotoPointsForDisplay = (numberStr, rawPoints) => {
    let adjusted = rawPoints || 0;

    const perNumberSubtract = parseInt(topNSubtracts[numberStr] ?? '', 10);
    if (!isNaN(perNumberSubtract) && perNumberSubtract > 0) {
      adjusted = Math.max(0, adjusted - perNumberSubtract);
    }

    const numFilter = (lotoFilterNumber || '').trim();
    const subtractVal = parseInt(lotoFilterSubtract, 10);
    if (numFilter !== '' && numberStr === numFilter && !isNaN(subtractVal) && subtractVal > 0) {
      adjusted = Math.max(0, adjusted - subtractVal);
    }

    const percentVal = parseInt(lotoFilterPercent, 10);
    if (!isNaN(percentVal) && percentVal > 0) {
      const clamped = Math.min(100, Math.max(0, percentVal));
      adjusted = adjusted * (100 - clamped) / 100;
    }

    return adjusted;
  };

  const adjustTwoSAmountForDisplay = (numberStr, rawAmount) => {
    let adjusted = rawAmount || 0;

    // Trừ theo danh sách Top N (2 số)
    const perNumberSubtract = parseInt(topNTwoSSubtracts[numberStr] ?? '', 10);
    if (!isNaN(perNumberSubtract) && perNumberSubtract > 0) {
      adjusted = Math.max(0, adjusted - perNumberSubtract);
    }

    // Trừ theo một con cụ thể
    const numFilter = (twoSFilterNumber || '').trim();
    const subtractVal = parseInt(twoSFilterSubtract, 10);
    if (numFilter !== '' && numberStr === numFilter && !isNaN(subtractVal) && subtractVal > 0) {
      adjusted = Math.max(0, adjusted - subtractVal);
    }

    // Trừ theo các lần tối thiểu đã áp dụng (00-99)
    if (Array.isArray(twoSMinSubtracts) && twoSMinSubtracts.length > 0) {
      const totalMin = twoSMinSubtracts.reduce((sum, v) => {
        const n = parseInt(v, 10); return sum + (isNaN(n) ? 0 : n);
      }, 0);
      if (totalMin > 0) adjusted = Math.max(0, adjusted - totalMin);
    }

    // Trừ theo % toàn bảng
    const percentVal = parseInt(twoSFilterPercent, 10);
    if (!isNaN(percentVal) && percentVal > 0) {
      const clamped = Math.min(100, Math.max(0, percentVal));
      adjusted = adjusted * (100 - clamped) / 100;
    }

    return adjusted;
  };

  // Tính toán min dựa trên số tiền hiện hành sau các lần trừ tối thiểu trước đó
  const computeCurrentTwoSAdjusted = () => {
    const twoSData = statisticsData?.['2s'] || {};
    const totalMin = (twoSMinSubtracts || []).reduce((sum, v) => {
      const n = parseInt(v, 10); return sum + (isNaN(n) ? 0 : n);
    }, 0);
    const zeros = [];
    let minPositive = Infinity;
    for (let i = 0; i < 100; i++) {
      const num = i.toString().padStart(2, '0');
      const base = twoSData[num] || 0;
      const current = Math.max(0, base - totalMin);
      if (current === 0) zeros.push(num);
      if (current > 0 && current < minPositive) minPositive = current;
    }
    return { zeros, minPositive };
  };

  // Áp dụng trừ theo số tiền thấp nhất cho 2 số (00-99) - nhiều lần
  const applyTwoSMinSubtract = () => {
    const { zeros, minPositive } = computeCurrentTwoSAdjusted();
    if (minPositive === Infinity) {
      alert('Không có dữ liệu tiền cược dương để áp dụng lọc.');
      return;
    }
    if (zeros.length > 0) {
      const agree = window.confirm(`Các con ${zeros.join(', ')} đang có số tiền cược là 0. Bạn có đồng ý lọc trừ theo mức thấp nhất hiện tại (${minPositive}n) không?`);
      if (!agree) return;
    }
    setTwoSMinSubtracts((prev) => [...prev, String(minPositive)]);
  };

  const clearTwoSMinSubtractLast = () => {
    setTwoSMinSubtracts((prev) => prev.slice(0, -1));
  };

  const clearTwoSMinSubtractAll = () => {
    setTwoSMinSubtracts([]);
  };

  const adjustThreeAmountForDisplay = (keyStr, rawAmount) => {
    let adjusted = rawAmount || 0;

    const perKeySubtract = parseInt(topNThreeSubtracts[keyStr] ?? '', 10);
    if (!isNaN(perKeySubtract) && perKeySubtract > 0) {
      adjusted = Math.max(0, adjusted - perKeySubtract);
    }

    const target = (threeFilterNumber || '').trim();
    const subtractVal = parseInt(threeFilterSubtract, 10);
    if (target !== '' && keyStr === target && !isNaN(subtractVal) && subtractVal > 0) {
      adjusted = Math.max(0, adjusted - subtractVal);
    }

    const percentVal = parseInt(threeFilterPercent, 10);
    if (!isNaN(percentVal) && percentVal > 0) {
      const clamped = Math.min(100, Math.max(0, percentVal));
      adjusted = adjusted * (100 - clamped) / 100;
    }

    return adjusted;
  };

  const adjustXienAmountForDisplay = (keyStr, rawAmount) => {
    let adjusted = rawAmount || 0;

    const perKeySubtract = parseInt(topNXienSubtracts[keyStr] ?? '', 10);
    if (!isNaN(perKeySubtract) && perKeySubtract > 0) {
      adjusted = Math.max(0, adjusted - perKeySubtract);
    }

    const target = (xienFilterNumber || '').trim();
    const subtractVal = parseInt(xienFilterSubtract, 10);
    if (target !== '' && keyStr === target && !isNaN(subtractVal) && subtractVal > 0) {
      adjusted = Math.max(0, adjusted - subtractVal);
    }

    const percentVal = parseInt(xienFilterPercent, 10);
    if (!isNaN(percentVal) && percentVal > 0) {
      const clamped = Math.min(100, Math.max(0, percentVal));
      adjusted = adjusted * (100 - clamped) / 100;
    }

    return adjusted;
  };

  const adjustXienQuayAmountForDisplay = (keyStr, rawAmount) => {
    let adjusted = rawAmount || 0;

    const perKeySubtract = parseInt(topNXienQuaySubtracts[keyStr] ?? '', 10);
    if (!isNaN(perKeySubtract) && perKeySubtract > 0) {
      adjusted = Math.max(0, adjusted - perKeySubtract);
    }

    const target = (xienQuayFilterNumber || '').trim();
    const subtractVal = parseInt(xienQuayFilterSubtract, 10);
    if (target !== '' && keyStr === target && !isNaN(subtractVal) && subtractVal > 0) {
      adjusted = Math.max(0, adjusted - subtractVal);
    }

    const percentVal = parseInt(xienQuayFilterPercent, 10);
    if (!isNaN(percentVal) && percentVal > 0) {
      const clamped = Math.min(100, Math.max(0, percentVal));
      adjusted = adjusted * (100 - clamped) / 100;
    }

    return adjusted;
  };
  
  const adjustCombinedAmountForDisplay = (rawAmount) => {
    let adjusted = rawAmount || 0;
    
    // Trừ theo % toàn bảng
    const percentVal = parseInt(combinedFilterPercent, 10);
    if (!isNaN(percentVal) && percentVal > 0) {
      const clamped = Math.min(100, Math.max(0, percentVal));
      adjusted = adjusted * (100 - clamped) / 100;
    }
    
    return adjusted;
  };

  // Tự động lưu khi filter thay đổi (nếu đã ghim)
  useEffect(() => { saveLotoFiltersToStorage(); /* eslint-disable-line */ }, [pinLotoFilter, showLotoFilter, lotoFilterNumber, lotoFilterSubtract, lotoFilterPercent, topNCount, topNSubtracts, selectedDate]);
  useEffect(() => { saveTwoSFiltersToStorage(); /* eslint-disable-line */ }, [pinTwoSFilter, showTwoSFilter, twoSFilterNumber, twoSFilterSubtract, twoSFilterPercent, topNTwoSCount, topNTwoSSubtracts, twoSMinSubtracts, selectedDate]);
  useEffect(() => { saveThreeFiltersToStorage(); /* eslint-disable-line */ }, [pinThreeFilter, showThreeFilter, threeFilterNumber, threeFilterSubtract, threeFilterPercent, topNThreeCount, topNThreeSubtracts, selectedDate]);
  useEffect(() => { saveXienFiltersToStorage(); /* eslint-disable-line */ }, [pinXienFilter, showXienFilter, xienFilterNumber, xienFilterSubtract, xienFilterPercent, topNXienCount, topNXienSubtracts, selectedDate]);
  useEffect(() => { saveXienQuayFiltersToStorage(); /* eslint-disable-line */ }, [pinXienQuayFilter, showXienQuayFilter, xienQuayFilterNumber, xienQuayFilterSubtract, xienQuayFilterPercent, topNXienQuayCount, topNXienQuaySubtracts, selectedDate]);
  useEffect(() => { saveCombinedFiltersToStorage(); /* eslint-disable-line */ }, [pinCombinedFilter, showCombinedFilter, combinedFilterPercent, selectedDate]);

  // Khôi phục khi đổi ngày hoặc vào màn
  useEffect(() => { loadLotoFiltersFromStorage(); /* eslint-disable-line */ }, [selectedDate]);
  useEffect(() => { loadTwoSFiltersFromStorage(); /* eslint-disable-line */ }, [selectedDate]);
  useEffect(() => { loadThreeFiltersFromStorage(); /* eslint-disable-line */ }, [selectedDate]);
  useEffect(() => { loadXienFiltersFromStorage(); /* eslint-disable-line */ }, [selectedDate]);
  useEffect(() => { loadXienQuayFiltersFromStorage(); /* eslint-disable-line */ }, [selectedDate]);
  useEffect(() => { loadCombinedFiltersFromStorage(); /* eslint-disable-line */ }, [selectedDate]);

  // Rebuild danh sách Top N khi dữ liệu hoặc tham số thay đổi
  useEffect(() => { buildTopNSelection(); /* eslint-disable-line */ }, [statisticsData, topNCount]);
  useEffect(() => { buildTopNTwoSSelection(); /* eslint-disable-line */ }, [statisticsData, topNTwoSCount]);
  useEffect(() => { buildTopNThreeSelection(); /* eslint-disable-line */ }, [statisticsData, topNThreeCount]);
  useEffect(() => { buildTopNXienSelection(); /* eslint-disable-line */ }, [statisticsData, topNXienCount]);
  useEffect(() => { buildTopNXienQuaySelection(); /* eslint-disable-line */ }, [statisticsData, topNXienQuayCount]);

  // Load data when component mounts or date changes
  useEffect(() => {
    if (activeTab === 'betting') {
      loadStatistics();
    }
  }, [selectedDate, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle date change
  const handleDateChange = (e) => { setSelectedDate(e.target.value); };

  // Handle tab change
  const handleTabChange = (tab) => { setActiveTab(tab); };

  // Load statistics data for all stores of admin
  const loadStatistics = async (date = selectedDate) => {
    setIsLoading(true);
    try {
      const response = await axios.get(getApiUrl('/admin/total-statistics'), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        params: { adminId: user.id, date: date }
      });

      if (response.data.success) {
        const rawStats = response.data.stats;
        
        const transformedStats = {
          totalRevenue: rawStats.totalRevenue,
          lotoTotal: rawStats.lotoTotal || 0,
          '2sTotal': rawStats['2sTotal'] || 0,
          '3sTotal': rawStats['3sTotal'] || 0,
          tongTotal: rawStats.tongTotal || 0,
          kepTotal: rawStats.kepTotal || 0,
          dauTotal: rawStats.dauTotal || 0,
          ditTotal: rawStats.ditTotal || 0,
          boTotal: rawStats.boTotal || 0,
          tongKepDauDitBoTotal: rawStats.tongKepDauDitBoTotal || 0,
          xienTotal: rawStats.xienTotal || 0,
          xienquayTotal: rawStats.xienquayTotal || 0,
          
          loto: rawStats.loto,
          '2s': rawStats['2s'],
          '3s': transformGroupedData(rawStats['3s']),
          tong: transformSimpleGroupedData(rawStats.grouped?.tong),
          kep: transformSimpleGroupedData(rawStats.grouped?.kep),
          dau: transformSimpleGroupedData(rawStats.grouped?.dau),
          dit: transformSimpleGroupedData(rawStats.grouped?.dit),
          bo: transformSimpleGroupedData(rawStats.grouped?.bo),
          xien: transformXienData(rawStats.xien),
          xienquay: transformXienData(rawStats.xienquay),
          
          lotoCalculationString: rawStats.lotoCalculationString,
          totalLotoRevenue: rawStats.totalLotoRevenue,
          lotoMultipliers: rawStats.lotoMultipliers,
          lotoPointsByStore: rawStats.lotoPointsByStore
        };
        
        setStatisticsData(transformedStats);
      }
    } catch (error) {
      console.error('Lỗi khi tải thống kê tổng hợp:', error);
      alert('Không thể tải dữ liệu thống kê tổng hợp');
    } finally {
      setIsLoading(false);
    }
  };

  // Transform grouped data (3s) - xử lý cấu trúc mới
  const transformGroupedData = (data) => {
    if (!data) return {};
    const result = {};
    Object.entries(data).forEach(([caseType, caseData]) => {
      Object.entries(caseData).forEach(([numbers, details]) => {
        if (typeof details === 'object' && details.totalAmount !== undefined) {
          result[numbers] = details.totalAmount;
        } else if (typeof details === 'number') {
          result[numbers] = details;
        }
      });
    });
    return result;
  };

  // Transform simple grouped data (tong, kep, dau, dit, bo)
  const transformSimpleGroupedData = (data) => {
    if (!data) return {};
    const result = {};
    Object.entries(data).forEach(([numbers, details]) => {
      result[numbers] = details.totalAmount;
    });
    return result;
  };

  // Transform xien data - xử lý cấu trúc mới
  const transformXienData = (data) => {
    if (!data) return {};
    const result = {};
    Object.entries(data).forEach(([caseType, caseData]) => {
      if (Array.isArray(caseData)) {
        caseData.forEach(detail => { result[detail.numbers] = detail.totalAmount; });
      } else {
        Object.entries(caseData).forEach(([numbers, details]) => {
          if (details.numbers && Array.isArray(details.numbers)) {
            result[details.numbers.join('-')] = details.totalAmount;
          } else {
            result[numbers] = details.totalAmount;
          }
        });
      }
    });
    return result;
  };

  // Generate loto statistics table data
  const generateLotoTableData = () => {
    const lotoData = statisticsData?.loto || {};
    const tableData = [];
    for (let row = 0; row < 20; row++) {
      const rowData = [];
      for (let col = 0; col < 5; col++) {
        const number = (row + col * 20).toString().padStart(2, '0');
        const points = lotoData[number] || 0;
        rowData.push({ number, points });
      }
      tableData.push(rowData);
    }
    return tableData;
  };

  // Generate 2s statistics table data
  const generate2sTableData = () => {
    const twoSData = statisticsData?.['2s'] || {};
    const tableData = [];
    for (let row = 0; row < 20; row++) {
      const rowData = [];
      for (let col = 0; col < 5; col++) {
        const number = (row + col * 20).toString().padStart(2, '0');
        const amount = twoSData[number] || 0;
        rowData.push({ number, amount });
      }
      tableData.push(rowData);
    }
    return tableData;
  };

  // Render combined bet table
  const renderCombinedBetTable = (betTypes, title) => {
    let groupTotal;
    if (betTypes.includes('tong') && betTypes.includes('kep') && betTypes.includes('dau') && betTypes.includes('dit') && betTypes.includes('bo')) {
      groupTotal = statisticsData.tongKepDauDitBoTotal || 0;
    } else {
      groupTotal = betTypes.reduce((sum, betType) => {
        const totalField = `${betType}Total`;
        return sum + (statisticsData[totalField] || 0);
      }, 0);
    }

    const betTypeNames = {
      'tong': 'Tổng',
      'kep': 'Kép', 
      'dau': 'Đầu',
      'dit': 'Đít',
      'bo': 'Bộ',
      '3s': '3 Số',
      'xien': 'Xiên',
      'xienquay': 'Xiên Quay'
    };

    const tableData = [];
    betTypes.forEach(betType => {
      const betData = statisticsData[betType] || {};
      Object.entries(betData).forEach(([number, amount]) => {
        let adjustedAmount = amount;
        if (betTypes.includes('tong') && betTypes.includes('kep') && betTypes.includes('dau') && betTypes.includes('dit') && betTypes.includes('bo')) {
          adjustedAmount = adjustCombinedAmountForDisplay(amount);
        }
        tableData.push({ betType: betTypeNames[betType], number, amount: adjustedAmount, rowClass: `admin-stats-row-${betType}` });
      });
    });

    if (tableData.length === 0) {
      return (
        <div className="admin-stats-no-data">
          <p>Không có dữ liệu cho nhóm cược này</p>
        </div>
      );
    }

    return (
      <div className="admin-stats-combined-table">

        <table>
          <caption><h4>{title}</h4></caption>
          <thead>
            <tr>
              <th>Loại cược</th>
              <th>Số</th>
              <th>Tiền cược(n)</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((item, index) => (
              <tr key={index} className={item.rowClass}>
                <td>{item.betType}</td>
                <td>{item.number}</td>
                <td style={{color: '#d32f2f', fontWeight: 600}}>{item.amount}n</td>
              </tr>
            ))}

            <tr className="admin-stats-row-total">
              <td colSpan="2" style={{textAlign: 'right', fontWeight: 600}}>Tổng tiền cược:</td>
              <td style={{color: '#d32f2f', fontWeight: 600}}>{formatThousand(tableData.reduce((sum, item) => sum + parseFloat(item.amount), 0))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // Tính tổng điểm loto sau khi lọc
  const calculateFilteredLotoTotal = () => {
    if (!statisticsData || !statisticsData.loto) return 0;
    
    let total = 0;
    for (let i = 0; i < 100; i++) {
      const number = i.toString().padStart(2, '0');
      const points = statisticsData.loto[number] || 0;
      const adjustedPoints = adjustLotoPointsForDisplay(number, points);
      total += adjustedPoints;
    }
    return total;
  };

  // Tính tổng tiền 2 số sau khi lọc
  const calculateFiltered2sTotal = () => {
    if (!statisticsData || !statisticsData['2s']) return 0;
    
    let total = 0;
    for (let i = 0; i < 100; i++) {
      const number = i.toString().padStart(2, '0');
      const amount = statisticsData['2s'][number] || 0;
      const adjustedAmount = adjustTwoSAmountForDisplay(number, amount);
      total += adjustedAmount;
    }
    return total;
  };

  // Tính tổng tiền 3 số sau khi lọc
  const calculateFiltered3sTotal = () => {
    if (!statisticsData || !statisticsData['3s']) return 0;
    
    let total = 0;
    Object.entries(statisticsData['3s'] || {}).forEach(([key, amount]) => {
      const adjustedAmount = adjustThreeAmountForDisplay(key, amount);
      total += adjustedAmount;
    });
    return total;
  };

  // Tính tổng tiền xiên sau khi lọc
  const calculateFilteredXienTotal = () => {
    if (!statisticsData || !statisticsData.xien) return 0;
    
    let total = 0;
    Object.entries(statisticsData.xien || {}).forEach(([key, amount]) => {
      const adjustedAmount = adjustXienAmountForDisplay(key, amount);
      total += adjustedAmount;
    });
    return total;
  };

  // Tính tổng tiền xiên quay sau khi lọc
  const calculateFilteredXienQuayTotal = () => {
    if (!statisticsData || !statisticsData.xienquay) return 0;
    
    let total = 0;
    Object.entries(statisticsData.xienquay || {}).forEach(([key, amount]) => {
      const adjustedAmount = adjustXienQuayAmountForDisplay(key, amount);
      
      // Áp dụng hệ số tương ứng với từng loại xiên quay
      // Đếm số lượng số trong xiên quay bằng cách đếm số dấu gạch ngang + 1
      const numberCount = key.split('-').length;
      
      if (numberCount === 3) {
        // Xiên 3 nhân với hệ số 4
        total += adjustedAmount * 4;
      } else if (numberCount === 4) {
        // Xiên 4 nhân với hệ số 11
        total += adjustedAmount * 11;
      } else {
        // Các trường hợp khác (nếu có)
        total += adjustedAmount;
      }
    });
    return total;
  };

  // Tính tổng tiền xiên quay sau khi lọc (không nhân hệ số)
  const calculateFilteredXienQuayTotalNoMultiplier = () => {
    if (!statisticsData || !statisticsData.xienquay) return 0;
    
    let total = 0;
    Object.entries(statisticsData.xienquay || {}).forEach(([key, amount]) => {
      const adjustedAmount = adjustXienQuayAmountForDisplay(key, amount);
      total += adjustedAmount;
    });
    return total;
  };

  // Bảng các bộ lô tô và số lượng số thực tế trong từng bộ
  const BO_DATA = {
    '00': [0, 5, 50, 55],
    '01': [1, 10, 6, 60, 51, 15, 56, 65],
    '02': [2, 20, 7, 70, 52, 25, 57, 75],
    '03': [3, 30, 8, 80, 53, 35, 58, 85],
    '04': [4, 40, 9, 90, 54, 45, 59, 95],
    '05': [5, 50, 0, 55],
    '06': [6, 60, 1, 10, 56, 65, 51, 15],
    '07': [7, 70, 2, 20, 57, 75, 52, 25],
    '08': [8, 80, 3, 30, 58, 85, 53, 35],
    '09': [9, 90, 4, 40, 59, 95, 54, 45],
    '10': [10, 1, 15, 51, 60, 6, 65, 56],
    '11': [11, 16, 61, 66],
    '12': [12, 21, 17, 71, 62, 26, 67, 76],
    '13': [13, 31, 18, 81, 63, 36, 68, 86],
    '14': [14, 41, 19, 91, 64, 46, 69, 96],
    '15': [15, 51, 10, 1, 65, 56, 60, 6],
    '16': [16, 61, 11, 66],
    '17': [17, 71, 12, 21, 67, 76, 62, 26],
    '18': [18, 81, 13, 31, 68, 86, 63, 36],
    '19': [19, 91, 14, 41, 69, 96, 64, 46],
    '20': [20, 2, 25, 52, 70, 7, 75, 57],
    '21': [21, 12, 26, 62, 71, 17, 76, 67],
    '22': [22, 27, 72, 77],
    '23': [23, 32, 28, 82, 73, 37, 78, 87],
    '24': [24, 42, 29, 92, 74, 47, 79, 97],
    '25': [25, 52, 20, 2, 75, 57, 70, 7],
    '26': [26, 62, 21, 12, 76, 67, 71, 17],
    '27': [27, 72, 22, 77],
    '28': [28, 82, 23, 32, 78, 87, 73, 37],
    '29': [29, 92, 24, 42, 79, 97, 74, 47],
    '30': [30, 3, 35, 53, 80, 8, 85, 58],
    '31': [31, 13, 36, 63, 81, 18, 86, 68],
    '32': [32, 23, 37, 73, 82, 28, 87, 78],
    '33': [33, 38, 83, 88],
    '34': [34, 43, 39, 93, 84, 48, 89, 98],
    '35': [35, 53, 30, 3, 85, 58, 80, 8],
    '36': [36, 63, 31, 13, 86, 68, 81, 18],
    '37': [37, 73, 32, 23, 87, 78, 82, 28],
    '38': [38, 83, 33, 88],
    '39': [39, 93, 34, 43, 89, 98, 84, 48],
    '40': [40, 4, 45, 54, 90, 9, 95, 59],
    '41': [41, 14, 46, 64, 91, 19, 96, 69],
    '42': [42, 24, 47, 74, 92, 29, 97, 79],
    '43': [43, 34, 48, 84, 93, 39, 98, 89],
    '44': [44, 49, 94, 99],
    '45': [45, 54, 40, 4, 95, 59, 90, 9],
    '46': [46, 64, 41, 14, 96, 69, 91, 19],
    '47': [47, 74, 42, 24, 97, 79, 92, 29],
    '48': [48, 84, 43, 34, 98, 89, 93, 39],
    '49': [49, 94, 44, 99],
    '50': [50, 5, 55, 0],
    '51': [51, 15, 56, 65, 1, 10, 6, 60],
    '52': [52, 25, 57, 75, 2, 20, 7, 70],
    '53': [53, 35, 58, 85, 3, 30, 8, 80],
    '54': [54, 45, 59, 95, 4, 40, 9, 90],
    '55': [55, 50, 5, 0],
    '56': [56, 65, 51, 15, 6, 60, 1, 10],
    '57': [57, 75, 52, 25, 7, 70, 2, 20],
    '58': [58, 85, 53, 35, 8, 80, 3, 30],
    '59': [59, 95, 54, 45, 9, 90, 4, 40],
    '60': [60, 6, 65, 56, 10, 1, 15, 51],
    '61': [61, 16, 66, 11],
    '62': [62, 26, 67, 76, 12, 21, 17, 71],
    '63': [63, 36, 68, 86, 13, 31, 18, 81],
    '64': [64, 46, 69, 96, 14, 41, 19, 91],
    '65': [65, 56, 60, 6, 15, 51, 10, 1],
    '66': [66, 61, 16, 11],
    '67': [67, 76, 62, 26, 17, 71, 12, 21],
    '68': [68, 86, 63, 36, 18, 81, 13, 31],
    '69': [69, 96, 64, 46, 19, 91, 14, 41],
    '70': [70, 7, 75, 57, 20, 2, 25, 52],
    '71': [71, 17, 76, 67, 21, 12, 26, 62],
    '72': [72, 27, 77, 22],
    '73': [73, 37, 78, 87, 23, 32, 28, 82],
    '74': [74, 47, 79, 97, 24, 42, 29, 92],
    '75': [75, 57, 70, 7, 25, 52, 20, 2],
    '76': [76, 67, 71, 17, 26, 62, 21, 12],
    '77': [77, 72, 27, 22],
    '78': [78, 87, 73, 37, 28, 82, 23, 32],
    '79': [79, 97, 74, 47, 29, 92, 24, 42],
    '80': [80, 8, 85, 58, 30, 3, 35, 53],
    '81': [81, 18, 86, 68, 31, 13, 36, 63],
    '82': [82, 28, 87, 78, 32, 23, 37, 73],
    '83': [83, 38, 88, 33],
    '84': [84, 48, 89, 98, 34, 43, 39, 93],
    '85': [85, 58, 80, 8, 35, 53, 30, 3],
    '86': [86, 68, 81, 18, 36, 63, 31, 13],
    '87': [87, 78, 82, 28, 37, 73, 32, 23],
    '88': [88, 83, 38, 33],
    '89': [89, 98, 84, 48, 39, 93, 34, 43],
    '90': [90, 9, 95, 59, 40, 4, 45, 54],
    '91': [91, 19, 96, 69, 41, 14, 46, 64],
    '92': [92, 29, 97, 79, 42, 24, 47, 74],
    '93': [93, 39, 98, 89, 43, 34, 48, 84],
    '94': [94, 49, 99, 44],
    '95': [95, 59, 90, 9, 45, 54, 40, 4],
    '96': [96, 69, 91, 19, 46, 64, 41, 14],
    '97': [97, 79, 92, 29, 47, 74, 42, 24],
    '98': [98, 89, 93, 39, 48, 84, 43, 34],
    '99': [99, 94, 49, 44],
    'chanle': [1, 3, 5, 7, 9, 21, 23, 25, 27, 29, 41, 43, 45, 47, 49, 61, 63, 65, 67, 69, 81, 83, 85, 87, 89],
    'lechan': [10, 12, 14, 16, 18, 30, 32, 34, 36, 38, 50, 52, 54, 56, 58, 70, 72, 74, 76, 78, 90, 92, 94, 96, 98],
    'lele': [11, 13, 15, 17, 19, 31, 33, 35, 37, 39, 51, 53, 55, 57, 59, 71, 73, 75, 77, 79, 91, 93, 95, 97, 99],
    'chanchan': [0, 2, 4, 6, 8, 20, 22, 24, 26, 28, 40, 42, 44, 46, 48, 60, 62, 64, 66, 68, 80, 82, 84, 86, 88]
  };

  // Tính tổng tiền tổng kép đầu đít bộ sau khi lọc
  const calculateFilteredCombinedTotal = () => {
    if (!statisticsData) return 0;
    
    let total = 0;
    const betTypes = ['tong', 'kep', 'dau', 'dit', 'bo'];
    
    betTypes.forEach(betType => {
      const betData = statisticsData[betType] || {};
      Object.entries(betData).forEach(([number, amount]) => {
        const adjustedAmount = adjustCombinedAmountForDisplay(amount);
        // Áp dụng hệ số tương ứng với từng loại cược
        if (betType === 'tong' || betType === 'kep' || betType === 'dau' || betType === 'dit') {
          total += parseFloat(adjustedAmount) * 10;
        } else if (betType === 'bo') {
          // Lấy số lượng số thực tế của bộ từ BO_DATA
          const boSize = Array.isArray(BO_DATA[number]) ? BO_DATA[number].length : 0;
          total += parseFloat(adjustedAmount) * boSize;
        }
      });
    });
    return total;
  };

  // Format tiền tệ
  const formatMoney = (amount) => { if (!amount || amount === 0) return '0 đ'; return Math.floor(amount).toLocaleString('vi-VN').replace(/,/g, '.') + ' đ'; };
  // Format nghìn đồng
  const formatThousand = (amount) => { if (!amount || amount === 0) return '0n'; return amount.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).replace(/,/g, '.') + 'n'; };

  // Render summary section
  const renderSummary = () => {
    if (!statisticsData) return null;

    const lotoTotalPoints = Object.values(statisticsData.loto || {}).reduce((sum, points) => sum + points, 0);
    const lotoRevenue = statisticsData.totalLotoRevenue || (lotoTotalPoints * 22);

    return (
      <div className="admin-stats-summary">
        <div className="admin-stats-total-revenue">
          <h3>Tổng doanh thu</h3>
          <span className="admin-stats-value">{formatMoney(statisticsData.totalRevenue)}</span>
        </div>
        <div className="admin-stats-summary-grid">
          <div className="admin-stats-card loto-card">
            <h4>Lô tô</h4>
            <span className="admin-stats-value">{formatThousand(lotoRevenue)}</span>
            {statisticsData.lotoCalculationString && (
              <div className="loto-calculation">
                <small>📊 {statisticsData.lotoCalculationString} = {formatThousand(lotoRevenue)}</small>
              </div>
            )}
          </div>
          <div className="admin-stats-card">
            <h4>2 số</h4>
            <span className="admin-stats-value">{formatThousand(statisticsData['2sTotal'])}</span>
          </div>
          <div className="admin-stats-card">
            <h4>3 số</h4>
            <span className="admin-stats-value">{formatThousand(statisticsData['3sTotal'])}</span>
          </div>
          <div className="admin-stats-card">
            <h4>Tổng</h4>
            <span className="admin-stats-value">{formatThousand(statisticsData.tongTotal)}</span>
          </div>
          <div className="admin-stats-card">
            <h4>Kép</h4>
            <span className="admin-stats-value">{formatThousand(statisticsData.kepTotal)}</span>
          </div>
          <div className="admin-stats-card">
            <h4>Đầu</h4>
            <span className="admin-stats-value">{formatThousand(statisticsData.dauTotal)}</span>
          </div>
          <div className="admin-stats-card">
            <h4>Đít</h4>
            <span className="admin-stats-value">{formatThousand(statisticsData.ditTotal)}</span>
          </div>
          <div className="admin-stats-card">
            <h4>Bộ</h4>
            <span className="admin-stats-value">{formatThousand(statisticsData.boTotal)}</span>
          </div>
          <div className="admin-stats-card">
            <h4>Xiên</h4>
            <span className="admin-stats-value">{formatThousand(statisticsData.xienTotal)}</span>
          </div>
          <div className="admin-stats-card">
            <h4>Xiên quay</h4>
            <span className="admin-stats-value">{formatThousand(statisticsData.xienquayTotal)}</span>
          </div>
        </div>
      </div>
    );
  };

  // Render betting statistics tabs
  const renderBettingStatistics = () => {
    if (!statisticsData) return null;

    const tabs = [
      { id: 'loto', label: 'Lô tô' },
      { id: '2s', label: '2 số' },
      { id: '3s', label: '3 số' },
      { id: 'combined-basic', label: 'Tổng, Kép, Đầu, Đít, Bộ' },
      { id: 'xien', label: 'Xiên' },
      { id: 'xienquay', label: 'Xiên quay' }
    ];

    const renderDetailContent = () => {
      switch (activeDetailTab) {
        case 'loto':
          const lotoTableData = generateLotoTableData();
          const lotoTotalPoints = Object.values(statisticsData.loto || {}).reduce((sum, points) => sum + points, 0);
          
          return (
            <div className="admin-stats-loto-table admin-filter-scope">
              <div className="admin-stats-loto-total">
                <h4>Tổng kết lô tô</h4>
                <div>
                  {statisticsData.lotoCalculationString && statisticsData.totalLotoRevenue ? (
                    <>
                      <span style={{color: '#1976d2', fontWeight: 600, fontSize: '14px'}}>
                        Tổng tiền đánh: {statisticsData.lotoCalculationString} = {formatThousand(statisticsData.totalLotoRevenue)}
                      </span>
                    </>
                  ) : (
                    <span style={{color: '#1976d2', fontWeight: 600, fontSize: '14px'}}>
                      Tổng tiền đánh: {formatThousand(lotoTotalPoints * 22)}
                    </span>
                  )}
                  <br />
                  <span className="admin-stats-loto-total-value">Tổng điểm: {lotoTotalPoints}đ</span>
                  {(lotoFilterNumber || lotoFilterSubtract || lotoFilterPercent || Object.keys(topNSubtracts).length > 0) && (
                    <div style={{marginTop: '5px'}}>
                      <span style={{color: '#388e3c', fontWeight: 600, fontSize: '14px'}}>Tổng điểm sau khi lọc: {calculateFilteredLotoTotal().toLocaleString('vi-VN').replace(/,/g, '.') + 'n'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bộ lọc hiển thị bảng Lô tô */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 12px 0', flexWrap: 'wrap' }}>
                <button className="admin-stats-tab filter-toggle-btn" onClick={() => setShowLotoFilter(prev => !prev)}>{showLotoFilter ? 'Ẩn bộ lọc' : 'Bộ lọc'}</button>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input type="checkbox" checked={pinLotoFilter} onChange={(e) => setPinLotoFilter(e.target.checked)} />
                  <span>Ghim bộ lọc</span>
                </label>
                <button className="admin-stats-tab" onClick={handleRefreshLoto}>Làm mới</button>
              </div>

              {showLotoFilter && (
                <div className="panel" style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span>Chọn ra</span>
                    <input type="number" min="1" placeholder="vd: 5" value={topNCount} onChange={(e) => setTopNCount(e.target.value)} style={{ width: '80px' }} />
                    <span>con có số điểm cao nhất của bảng</span>
                    <button className="admin-stats-tab" onClick={buildTopNSelection}>Chọn</button>
                  </div>

                  {topNSelection.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '6px 0 10px 0' }}>
                      {topNSelection.map(item => (
                        <div key={item.number} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span>Lọc con</span>
                          <input type="text" value={item.number} readOnly style={{ width: '60px', background: '#f0f0f0' }} />
                          <span>, đang có số điểm</span>
                          <input type="text" value={item.points} readOnly style={{ width: '80px', background: '#f0f0f0' }} />
                          <span>, lọc đi</span>
                          <input type="number" min="0" placeholder="vd: 100" value={topNSubtracts[item.number] ?? ''} onChange={(e) => setTopNSubtracts(prev => ({ ...prev, [item.number]: e.target.value }))} style={{ width: '100px' }} />
                          <span>điểm</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span>Lọc con</span>
                    <input type="text" placeholder="00-99" value={lotoFilterNumber} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 2); setLotoFilterNumber(v.padStart(v.length > 0 ? Math.min(2, v.length) : 0, '0')); }} style={{ width: '60px' }} />
                    <span>, số điểm là</span>
                    <input type="number" min="0" placeholder="vd: 100" value={lotoFilterSubtract} onChange={(e) => setLotoFilterSubtract(e.target.value)} style={{ width: '100px' }} />
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <span>Lọc tất cả</span>
                    <input type="number" min="0" max="100" placeholder="vd: 50" value={lotoFilterPercent} onChange={(e) => setLotoFilterPercent(e.target.value)} style={{ width: '80px' }} />
                    <span>% số điểm</span>
                  </div>
                </div>
              )}

              <table>
                <thead>
                  <tr>
                    <th>Lô tô</th>
                    <th>Điểm (đ)</th>
                    <th>Lô tô</th>
                    <th>Điểm (đ)</th>
                    <th>Lô tô</th>
                    <th>Điểm (đ)</th>
                    <th>Lô tô</th>
                    <th>Điểm (đ)</th>
                    <th>Lô tô</th>
                    <th>Điểm (đ)</th>
                  </tr>
                </thead>
                <tbody>
                  {lotoTableData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, colIndex) => {
                        const adjustedPoints = adjustLotoPointsForDisplay(cell.number, cell.points);
                        return (
                          <>
                            <td key={`${colIndex}-num`} className={adjustedPoints > 0 ? 'admin-stats-has-bet' : ''}>
                              <div className="admin-stats-loto-cell">
                                <div className="admin-stats-number">{cell.number}</div>
                              </div>
                            </td>
                            <td key={`${colIndex}-points`} className={adjustedPoints > 0 ? 'admin-stats-has-bet' : ''}>
                              <div className="admin-stats-loto-cell">
                                {adjustedPoints > 0 && (
                                  <div className="admin-stats-points">{adjustedPoints}đ</div>
                                )}
                              </div>
                            </td>
                          </>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );

        case '2s':
          const twoSTableData = generate2sTableData();
          
          return (
            <div className="admin-stats-2s-table admin-filter-scope">
              <div className="admin-stats-loto-total">
                <h4>Tổng kết 2 số</h4>
                <div>
                  <span style={{color: '#1976d2', fontWeight: 600, fontSize: '14px'}}>Tổng tiền đánh: {formatThousand(statisticsData['2sTotal'])}</span>
                  <br />
                  {(twoSFilterNumber || twoSFilterSubtract || twoSFilterPercent || Object.keys(topNTwoSSubtracts).length > 0 || twoSMinSubtracts.length > 0) && (
                    <div style={{marginTop: '5px'}}>
                      <span style={{color: '#388e3c', fontWeight: 600, fontSize: '14px'}}>Tổng tiền sau khi lọc: {calculateFiltered2sTotal().toLocaleString('vi-VN').replace(/,/g, '.') + 'n'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bộ lọc hiển thị bảng 2 số */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 12px 0', flexWrap: 'wrap' }}>
                <button className="admin-stats-tab filter-toggle-btn" onClick={() => setShowTwoSFilter(prev => !prev)}>{showTwoSFilter ? 'Ẩn bộ lọc' : 'Bộ lọc'}</button>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input type="checkbox" checked={pinTwoSFilter} onChange={(e) => setPinTwoSFilter(e.target.checked)} />
                  <span>Ghim bộ lọc</span>
                </label>
                <button className="admin-stats-tab" onClick={handleRefreshTwoS}>Làm mới</button>
              </div>

              {showTwoSFilter && (
                <div className="panel" style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span>Chọn ra</span>
                    <input type="number" min="1" placeholder="vd: 5" value={topNTwoSCount} onChange={(e) => setTopNTwoSCount(e.target.value)} style={{ width: '80px' }} />
                    <span>con có số tiền cao nhất của bảng</span>
                    <button className="admin-stats-tab" onClick={buildTopNTwoSSelection}>Chọn</button>
                  </div>

                  {topNTwoSSelection.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '6px 0 10px 0' }}>
                      {topNTwoSSelection.map(item => (
                        <div key={item.number} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span>Lọc con</span>
                          <input type="text" value={item.number} readOnly style={{ width: '60px', background: '#f0f0f0' }} />
                          <span>, đang có số tiền</span>
                          <input type="text" value={item.amount} readOnly style={{ width: '80px', background: '#f0f0f0' }} />
                          <span>, lọc đi</span>
                          <input type="number" min="0" placeholder="vd: 50" value={topNTwoSSubtracts[item.number] ?? ''} onChange={(e) => setTopNTwoSSubtracts(prev => ({ ...prev, [item.number]: e.target.value }))} style={{ width: '100px' }} />
                          <span>n</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dòng lọc: trừ theo số tiền thấp nhất 00-99 (nhiều lần) */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <button className="admin-stats-tab" onClick={applyTwoSMinSubtract}>Trừ theo số tiền thấp nhất (00-99)</button>
                    {twoSMinSubtracts.length > 0 && (
                      <>
                        <span>Đang trừ mỗi con:</span>
                        {twoSMinSubtracts.map((v, idx) => (
                          <input key={idx} type="text" readOnly value={v} style={{ width: '60px', background: '#f0f0f0' }} />
                        ))}
                        <span>n</span>
                        <button className="admin-stats-tab" onClick={clearTwoSMinSubtractLast}>Xóa lần cuối</button>
                        <button className="admin-stats-tab" onClick={clearTwoSMinSubtractAll}>Xóa tất cả</button>
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span>Lọc con</span>
                    <input type="text" placeholder="00-99" value={twoSFilterNumber} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 2); setTwoSFilterNumber(v.padStart(v.length > 0 ? Math.min(2, v.length) : 0, '0')); }} style={{ width: '60px' }} />
                    <span>, số tiền là</span>
                    <input type="number" min="0" placeholder="vd: 50" value={twoSFilterSubtract} onChange={(e) => setTwoSFilterSubtract(e.target.value)} style={{ width: '100px' }} />
                    <span>n</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <span>Lọc tất cả</span>
                    <input type="number" min="0" max="100" placeholder="vd: 50" value={twoSFilterPercent} onChange={(e) => setTwoSFilterPercent(e.target.value)} style={{ width: '80px' }} />
                    <span>% số tiền</span>
                  </div>
                </div>
              )}

              <table>
                <thead>
                  <tr>
                    <th>2 số</th>
                    <th>Tiền (n)</th>
                    <th>2 số</th>
                    <th>Tiền (n)</th>
                    <th>2 số</th>
                    <th>Tiền (n)</th>
                    <th>2 số</th>
                    <th>Tiền (n)</th>
                    <th>2 số</th>
                    <th>Tiền (n)</th>
                  </tr>
                </thead>
                <tbody>
                  {twoSTableData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, colIndex) => {
                        const adjustedAmount = adjustTwoSAmountForDisplay(cell.number, cell.amount);
                        return (
                          <>
                            <td key={`${colIndex}-num`} className={adjustedAmount > 0 ? 'admin-stats-2s-has-bet' : ''}>
                              <div className="admin-stats-2s-cell">
                                <div className="admin-stats-2s-number">{cell.number}</div>
                              </div>
                            </td>
                            <td key={`${colIndex}-amount`} className={adjustedAmount > 0 ? 'admin-stats-2s-has-bet' : ''}>
                              <div className="admin-stats-2s-cell">
                                {adjustedAmount > 0 && (
                                  <div className="admin-stats-2s-amount">{adjustedAmount.toLocaleString('vi-VN').replace(/,/g, '.') + 'n'}</div>
                                )}
                              </div>
                            </td>
                          </>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );

        case 'combined-basic':
          return (
            <div className="admin-stats-combined-table admin-filter-scope">
              <div className="admin-stats-combined-total">
                <h4>Tổng kết Tổng, Kép, Đầu, Đít, Bộ</h4>
                <div>
                  <span style={{color: '#333', fontWeight: 600, fontSize: '14px'}}>Tổng tiền đánh: {formatThousand(statisticsData.tongKepDauDitBoTotal || 0)}</span>
                  {(combinedFilterPercent) && (
                    <div style={{marginTop: '5px'}}>
                      <span style={{color: '#388e3c', fontWeight: 600, fontSize: '14px'}}>Tổng tiền sau khi lọc: {calculateFilteredCombinedTotal().toLocaleString('vi-VN').replace(/,/g, '.') + 'n'}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Bộ lọc tổng kép đầu đít bộ */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 12px 0', flexWrap: 'wrap' }}>
                <button className="admin-stats-tab filter-toggle-btn" onClick={() => setShowCombinedFilter(prev => !prev)}>{showCombinedFilter ? 'Ẩn bộ lọc' : 'Bộ lọc'}</button>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input type="checkbox" checked={pinCombinedFilter} onChange={(e) => setPinCombinedFilter(e.target.checked)} />
                  <span>Ghim bộ lọc</span>
                </label>
                <button className="admin-stats-tab" onClick={handleRefreshCombined}>Làm mới</button>
              </div>
              
              {showCombinedFilter && (
                <div className="panel" style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <span>Lọc tất cả</span>
                    <input type="number" min="0" max="100" placeholder="vd: 50" value={combinedFilterPercent} onChange={(e) => setCombinedFilterPercent(e.target.value)} style={{ width: '80px' }} />
                    <span>% số tiền</span>
                  </div>
                </div>
              )}
              
              {renderCombinedBetTable(['tong', 'kep', 'dau', 'dit', 'bo'], '')}
            </div>
          );

        case '3s':
          const betData3s = statisticsData['3s'];
          if (!betData3s || Object.keys(betData3s).length === 0) {
            return (
              <div className="admin-stats-no-data">
                <p>Không có dữ liệu cho 3 số</p>
              </div>
            );
          }

          return (
            <div className="admin-stats-combined-table admin-filter-scope">
              <div className="admin-stats-combined-total">
                <h4>Tổng kết 3 số</h4>
                <div>
                  <span style={{color: '#333', fontWeight: 600, fontSize: '14px'}}>Tổng tiền đánh: {formatThousand(statisticsData['3sTotal'])}</span>
                  {(threeFilterNumber || threeFilterSubtract || threeFilterPercent || Object.keys(topNThreeSubtracts).length > 0) && (
                    <div style={{marginTop: '5px'}}>
                      <span style={{color: '#388e3c', fontWeight: 600, fontSize: '14px'}}>Tổng tiền sau khi lọc: {calculateFiltered3sTotal().toLocaleString('vi-VN').replace(/,/g, '.') + 'n'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bộ lọc 3 số */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 12px 0', flexWrap: 'wrap' }}>
                <button className="admin-stats-tab filter-toggle-btn" onClick={() => setShowThreeFilter(prev => !prev)}>{showThreeFilter ? 'Ẩn bộ lọc' : 'Bộ lọc'}</button>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input type="checkbox" checked={pinThreeFilter} onChange={(e) => setPinThreeFilter(e.target.checked)} />
                  <span>Ghim bộ lọc</span>
                </label>
                <button className="admin-stats-tab" onClick={handleRefreshThree}>Làm mới</button>
              </div>

              {showThreeFilter && (
                <div className="panel" style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span>Chọn ra</span>
                    <input type="number" min="1" placeholder="vd: 5" value={topNThreeCount} onChange={(e) => setTopNThreeCount(e.target.value)} style={{ width: '80px' }} />
                    <span>mục có số tiền cao nhất</span>
                    <button className="admin-stats-tab" onClick={buildTopNThreeSelection}>Chọn</button>
                  </div>

                  {topNThreeSelection.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '6px 0 10px 0' }}>
                      {topNThreeSelection.map(item => (
                        <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span>Lọc mục</span>
                          <input type="text" value={item.key} readOnly style={{ width: '120px', background: '#f0f0f0' }} />
                          <span>, đang có số tiền</span>
                          <input type="text" value={item.amount} readOnly style={{ width: '80px', background: '#f0f0f0' }} />
                          <span>, lọc đi</span>
                          <input type="number" min="0" placeholder="vd: 50" value={topNThreeSubtracts[item.key] ?? ''} onChange={(e) => setTopNThreeSubtracts(prev => ({ ...prev, [item.key]: e.target.value }))} style={{ width: '100px' }} />
                          <span>n</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span>Lọc mục</span>
                    <input type="text" placeholder="vd: 123" value={threeFilterNumber} onChange={(e) => setThreeFilterNumber(e.target.value.trim())} style={{ width: '120px' }} />
                    <span>, số tiền là</span>
                    <input type="number" min="0" placeholder="vd: 50" value={threeFilterSubtract} onChange={(e) => setThreeFilterSubtract(e.target.value)} style={{ width: '100px' }} />
                    <span>n</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <span>Lọc tất cả</span>
                    <input type="number" min="0" max="100" placeholder="vd: 50" value={threeFilterPercent} onChange={(e) => setThreeFilterPercent(e.target.value)} style={{ width: '80px' }} />
                    <span>% số tiền</span>
                  </div>
                </div>
              )}

              <div className="admin-stats-bet-list">
                {Object.entries(betData3s).map(([key, value]) => {
                  const adjusted = adjustThreeAmountForDisplay(key, value);
                  return (
                    <div key={key} className="admin-stats-bet-item">
                      <span className="admin-stats-bet-number">{key}</span>
                      <span className="admin-stats-bet-amount">{adjusted}n</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );

        case 'xien':
          const betDataXien = statisticsData['xien'];
          if (!betDataXien || Object.keys(betDataXien).length === 0) {
            return (
              <div className="admin-stats-no-data">
                <p>Không có dữ liệu cho xiên</p>
              </div>
            );
          }

          return (
            <div className="admin-stats-combined-table admin-filter-scope">
              <div className="admin-stats-combined-total">
                <h4>Tổng kết xiên</h4>
                <div>
                  <span style={{color: '#333', fontWeight: 600, fontSize: '14px'}}>Tổng tiền đánh: {formatThousand(statisticsData.xienTotal)}</span>
                  {(xienFilterNumber || xienFilterSubtract || xienFilterPercent || Object.keys(topNXienSubtracts).length > 0) && (
                    <div style={{marginTop: '5px'}}>
                      <span style={{color: '#388e3c', fontWeight: 600, fontSize: '14px'}}>Tổng tiền sau khi lọc: {calculateFilteredXienTotal().toLocaleString('vi-VN').replace(/,/g, '.') + 'n'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bộ lọc Xiên */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 12px 0', flexWrap: 'wrap' }}>
                <button className="admin-stats-tab filter-toggle-btn" onClick={() => setShowXienFilter(prev => !prev)}>{showXienFilter ? 'Ẩn bộ lọc' : 'Bộ lọc'}</button>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input type="checkbox" checked={pinXienFilter} onChange={(e) => setPinXienFilter(e.target.checked)} />
                  <span>Ghim bộ lọc</span>
                </label>
                <button className="admin-stats-tab" onClick={handleRefreshXien}>Làm mới</button>
              </div>

              {showXienFilter && (
                <div className="panel" style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span>Chọn ra</span>
                    <input type="number" min="1" placeholder="vd: 5" value={topNXienCount} onChange={(e) => setTopNXienCount(e.target.value)} style={{ width: '80px' }} />
                    <span>mục có số tiền cao nhất</span>
                    <button className="admin-stats-tab" onClick={buildTopNXienSelection}>Chọn</button>
                  </div>

                  {topNXienSelection.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '6px 0 10px 0' }}>
                      {topNXienSelection.map(item => (
                        <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span>Lọc mục</span>
                          <input type="text" value={item.key} readOnly style={{ width: '160px', background: '#f0f0f0' }} />
                          <span>, đang có số tiền</span>
                          <input type="text" value={item.amount} readOnly style={{ width: '80px', background: '#f0f0f0' }} />
                          <span>, lọc đi</span>
                          <input type="number" min="0" placeholder="vd: 50" value={topNXienSubtracts[item.key] ?? ''} onChange={(e) => setTopNXienSubtracts(prev => ({ ...prev, [item.key]: e.target.value }))} style={{ width: '100px' }} />
                          <span>n</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span>Lọc mục</span>
                    <input type="text" placeholder="vd: 12-34" value={xienFilterNumber} onChange={(e) => setXienFilterNumber(e.target.value.trim())} style={{ width: '160px' }} />
                    <span>, số tiền là</span>
                    <input type="number" min="0" placeholder="vd: 50" value={xienFilterSubtract} onChange={(e) => setXienFilterSubtract(e.target.value)} style={{ width: '100px' }} />
                    <span>n</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <span>Lọc tất cả</span>
                    <input type="number" min="0" max="100" placeholder="vd: 50" value={xienFilterPercent} onChange={(e) => setXienFilterPercent(e.target.value)} style={{ width: '80px' }} />
                    <span>% số tiền</span>
                  </div>
                </div>
              )}

              <div className="admin-stats-bet-list">
                {Object.entries(betDataXien).map(([key, value]) => {
                  const adjusted = adjustXienAmountForDisplay(key, value);
                  return (
                    <div key={key} className="admin-stats-bet-item">
                      <span className="admin-stats-bet-number">{key}</span>
                      <span className="admin-stats-bet-amount">{adjusted}n</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );

        case 'xienquay':
          const betDataXienQuay = statisticsData['xienquay'];
          if (!betDataXienQuay || Object.keys(betDataXienQuay).length === 0) {
            return (
              <div className="admin-stats-no-data">
                <p>Không có dữ liệu cho xiên quay</p>
              </div>
            );
          }

          return (
            <div className="admin-stats-combined-table admin-filter-scope">
              <div className="admin-stats-combined-total">
                <h4>Tổng kết xiên quay</h4>
                <div>
                  <span style={{color: '#333', fontWeight: 600, fontSize: '14px'}}>Tổng tiền đánh: {formatThousand(statisticsData.xienquayTotal)}</span>
                  <div className="admin-stats-total-item">
                    <span style={{color: '#333', fontWeight: 600, fontSize: '14px'}} >Tổng tiền cược: {calculateFilteredXienQuayTotalNoMultiplier().toLocaleString('vi-VN').replace(/,/g, '.') + 'n'}</span>
                  </div>
                  {(xienQuayFilterNumber || xienQuayFilterSubtract || xienQuayFilterPercent || Object.keys(topNXienQuaySubtracts).length > 0) && (
                    <div style={{marginTop: '5px'}}>
                      <span style={{color: '#388e3c', fontWeight: 600, fontSize: '14px'}}>Tổng tiền sau khi lọc: {calculateFilteredXienQuayTotal().toLocaleString('vi-VN').replace(/,/g, '.') + 'n'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bộ lọc Xiên quay */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 12px 0', flexWrap: 'wrap' }}>
                <button className="admin-stats-tab filter-toggle-btn" onClick={() => setShowXienQuayFilter(prev => !prev)}>{showXienQuayFilter ? 'Ẩn bộ lọc' : 'Bộ lọc'}</button>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input type="checkbox" checked={pinXienQuayFilter} onChange={(e) => setPinXienQuayFilter(e.target.checked)} />
                  <span>Ghim bộ lọc</span>
                </label>
                <button className="admin-stats-tab" onClick={handleRefreshXienQuay}>Làm mới</button>
              </div>

              {showXienQuayFilter && (
                <div className="panel" style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span>Chọn ra</span>
                    <input type="number" min="1" placeholder="vd: 5" value={topNXienQuayCount} onChange={(e) => setTopNXienQuayCount(e.target.value)} style={{ width: '80px' }} />
                    <span>mục có số tiền cao nhất</span>
                    <button className="admin-stats-tab" onClick={buildTopNXienQuaySelection}>Chọn</button>
                  </div>

                  {topNXienQuaySelection.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '6px 0 10px 0' }}>
                      {topNXienQuaySelection.map(item => (
                        <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span>Lọc mục</span>
                          <input type="text" value={item.key} readOnly style={{ width: '160px', background: '#f0f0f0' }} />
                          <span>, đang có số tiền</span>
                          <input type="text" value={item.amount} readOnly style={{ width: '80px', background: '#f0f0f0' }} />
                          <span>, lọc đi</span>
                          <input type="number" min="0" placeholder="vd: 50" value={topNXienQuaySubtracts[item.key] ?? ''} onChange={(e) => setTopNXienQuaySubtracts(prev => ({ ...prev, [item.key]: e.target.value }))} style={{ width: '100px' }} />
                          <span>n</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span>Lọc mục</span>
                    <input type="text" placeholder="vd: 12-34-56" value={xienQuayFilterNumber} onChange={(e) => setXienQuayFilterNumber(e.target.value.trim())} style={{ width: '180px' }} />
                    <span>, số tiền là</span>
                    <input type="number" min="0" placeholder="vd: 50" value={xienQuayFilterSubtract} onChange={(e) => setXienQuayFilterSubtract(e.target.value)} style={{ width: '100px' }} />
                    <span>n</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <span>Lọc tất cả</span>
                    <input type="number" min="0" max="100" placeholder="vd: 50" value={xienQuayFilterPercent} onChange={(e) => setXienQuayFilterPercent(e.target.value)} style={{ width: '80px' }} />
                    <span>% số tiền</span>
                  </div>
                </div>
              )}

              <div className="admin-stats-bet-list">
                {Object.entries(betDataXienQuay).map(([key, value]) => {
                  const adjusted = adjustXienQuayAmountForDisplay(key, value);
                  return (
                    <div key={key} className="admin-stats-bet-item">
                      <span className="admin-stats-bet-number">{key}</span>
                      <span className="admin-stats-bet-amount">{adjusted}n</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );

        default:
          const betData = statisticsData[activeDetailTab];
          if (!betData || Object.keys(betData).length === 0) {
            return (
              <div className="admin-stats-no-data">
                <p>Không có dữ liệu cho loại cược này</p>
              </div>
            );
          }

          return (
            <div className="admin-stats-bet-list">
              {Object.entries(betData).map(([key, value]) => (
                <div key={key} className="admin-stats-bet-item">
                  <span className="admin-stats-bet-number">{key}</span>
                  <span className="admin-stats-bet-amount">{value}n</span>
                </div>
              ))}
            </div>
          );
      }
    };

    return (
      <div className="admin-stats-detail-section">
        <div className="admin-stats-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`admin-stats-tab ${activeDetailTab === tab.id ? 'admin-stats-tab-active' : ''}`}
              onClick={() => setActiveDetailTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="admin-stats-tab-content">
          {renderDetailContent()}
        </div>
      </div>
    );
  };

  return (
    <div className="admin-store-statistics">
      {/* Header */}
      <div className="admin-stats-header">
        <h3>Báo cáo tổng hợp - {user.name}</h3>
        <div className="admin-stats-date-controls">
          <label htmlFor="admin-stats-date">Chọn ngày:</label>
          <input id="admin-stats-date" type="date" value={selectedDate} onChange={handleDateChange} className="admin-stats-date-input" />
        </div>
      </div>

      {/* Main Tabs */}
      <div className="admin-stats-main-tabs">
        <button className={`admin-stats-main-tab ${activeTab === 'betting' ? 'admin-stats-main-tab-active' : ''}`} onClick={() => handleTabChange('betting')}>Thống kê cược</button>
        <button className={`admin-stats-main-tab ${activeTab === 'prizes' ? 'admin-stats-main-tab-active' : ''}`} onClick={() => handleTabChange('prizes')}>Thống kê thưởng</button>
      </div>

      {/* Content */}
      <div className="admin-stats-content">
        {activeTab === 'betting' ? (
          isLoading ? (
            <div className="admin-stats-loading"><p>Đang tải thống kê...</p></div>
          ) : statisticsData ? (
            <>
              {renderSummary()}
              {renderBettingStatistics()}
            </>
          ) : (
            <div className="admin-stats-no-data"><p>Không có dữ liệu thống kê cho ngày này</p></div>
          )
        ) : (
          <div className="admin-stats-prizes-placeholder"><p>Chưa có dữ liệu, hãy đợi nhân viên thống kê</p></div>
        )}
      </div>
    </div>
  );
};

export default AdminTotalStatistics;