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

  // Ref to track scroll position for restoration after reload
  const scrollPositionRef = React.useRef(0);
  const scrollContainerRef = React.useRef(null); // Ref to the scrollable container
  const shouldRestoreScroll = React.useRef(false);
  // UI và logic bộ lọc hiển thị cho bảng Lô tô (chỉ tác động giao diện)
  const [showLotoFilter, setShowLotoFilter] = useState(false);
  const [lotoFilterRows, setLotoFilterRows] = useState([{ number: '', subtract: '' }]); // Mảng các dòng lọc
  const [lotoFilterPercent, setLotoFilterPercent] = useState(''); // % áp dụng toàn bộ
  const [lotoFilterRowCount, setLotoFilterRowCount] = useState('1'); // Số dòng lọc mặc định là 1
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
  const [twoSFilterRows, setTwoSFilterRows] = useState([{ number: '', subtract: '' }]); // Mảng các dòng lọc
  const [twoSFilterPercent, setTwoSFilterPercent] = useState('');
  const [twoSFilterRowCount, setTwoSFilterRowCount] = useState('1'); // Số dòng lọc mặc định là 1
  // Top N - 2 số
  const [topNTwoSCount, setTopNTwoSCount] = useState('');
  const [topNTwoSSelection, setTopNTwoSSelection] = useState([]); // [{number, amount}]
  const [topNTwoSSubtracts, setTopNTwoSSubtracts] = useState({}); // { '10': '50', ... }
  // Ghim - 2 số
  const [pinTwoSFilter, setPinTwoSFilter] = useState(false);
  // Trừ theo số tiền thấp nhất (00-99) - hỗ trợ nhiều lần
  const [twoSMinSubtracts, setTwoSMinSubtracts] = useState([]); // string[] mỗi phần tử là một lần trừ
  // Hệ số cho phần trừ theo số tiền thấp nhất
  const [twoSCoefficientFactor, setTwoSCoefficientFactor] = useState('');

  // Hàm chuyển đổi chuỗi tiếng Việt có dấu thành không dấu
  const removeVietnameseAccents = (str) => {
    if (!str) return '';

    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
    str = str.replace(/đ/g, 'd');

    return str;
  };

  // UI và logic bộ lọc cho 3 số
  const [showThreeFilter, setShowThreeFilter] = useState(false);
  const [threeFilterRows, setThreeFilterRows] = useState([{ number: '', subtract: '' }]); // Mảng các dòng lọc
  const [threeFilterPercent, setThreeFilterPercent] = useState('');
  const [threeFilterRowCount, setThreeFilterRowCount] = useState('1'); // Số dòng lọc mặc định là 1
  const [topNThreeCount, setTopNThreeCount] = useState('');
  const [topNThreeSelection, setTopNThreeSelection] = useState([]); // [{key, amount}]
  const [topNThreeSubtracts, setTopNThreeSubtracts] = useState({});
  const [pinThreeFilter, setPinThreeFilter] = useState(false);

  // UI và logic bộ lọc cho Xiên
  const [showXienFilter, setShowXienFilter] = useState(false);
  const [xienFilterRows, setXienFilterRows] = useState([{ number: '', subtract: '' }]); // Mảng các dòng lọc
  const [xienFilterPercent, setXienFilterPercent] = useState('');
  const [xienFilterRowCount, setXienFilterRowCount] = useState('1'); // Số dòng lọc mặc định là 1
  const [topNXienCount, setTopNXienCount] = useState('');
  const [topNXienSelection, setTopNXienSelection] = useState([]);
  const [topNXienSubtracts, setTopNXienSubtracts] = useState({});
  const [pinXienFilter, setPinXienFilter] = useState(false);

  // UI và logic bộ lọc cho Xiên quay
  const [showXienQuayFilter, setShowXienQuayFilter] = useState(false);
  const [xienQuayFilterRows, setXienQuayFilterRows] = useState([{ number: '', subtract: '' }]); // Mảng các dòng lọc
  const [xienQuayFilterPercent, setXienQuayFilterPercent] = useState('');
  const [topNXienQuayCount, setTopNXienQuayCount] = useState('');
  const [topNXienQuaySelection, setTopNXienQuaySelection] = useState([]);
  const [topNXienQuaySubtracts, setTopNXienQuaySubtracts] = useState({});
  const [pinXienQuayFilter, setPinXienQuayFilter] = useState(false);
  const [xienQuayFilterRowCount, setXienQuayFilterRowCount] = useState('1'); // Số dòng lọc mặc định là 1

  // Bộ lọc cho tổng kép đầu đít bộ đã khai báo ở trên

  const getLotoFilterStorageKey = () => `lotoFilter:${user?.id}:${selectedDate}`;
  const getTwoSFilterStorageKey = () => `twoSFilter:${user?.id}:${selectedDate}`;
  const getThreeFilterStorageKey = () => `threeFilter:${user?.id}:${selectedDate}`;
  const getXienFilterStorageKey = () => `xienFilter:${user?.id}:${selectedDate}`;
  const getXienQuayFilterStorageKey = () => `xienQuayFilter:${user?.id}:${selectedDate}`;
  const getCombinedFilterStorageKey = () => `combinedFilter:${user?.id}:${selectedDate}`;

  const resetLotoFilters = () => {
    setShowLotoFilter(false);
    setLotoFilterRows([{ number: '', subtract: '' }]);
    setLotoFilterRowCount('1');
    setLotoFilterPercent('');
    setTopNCount('');
    setTopNSelection([]);
    setTopNSubtracts({});
  };

  const resetTwoSFilters = () => {
    setShowTwoSFilter(false);
    setTwoSFilterRows([{ number: '', subtract: '' }]);
    setTwoSFilterPercent('');
    setTwoSFilterRowCount('1'); // Reset số dòng lọc về 1
    setTopNTwoSCount('');
    setTopNTwoSSelection([]);
    setTopNTwoSSubtracts({});
    setTwoSMinSubtracts([]);
    setTwoSCoefficientFactor('');
  };

  const resetThreeFilters = () => {
    setShowThreeFilter(false);
    setThreeFilterRows([{ number: '', subtract: '' }]);
    setThreeFilterPercent('');
    setThreeFilterRowCount('1'); // Reset số dòng lọc về 1
    setTopNThreeCount('');
    setTopNThreeSelection([]);
    setTopNThreeSubtracts({});
  };

  const resetXienFilters = () => {
    setShowXienFilter(false);
    setXienFilterRows([{ number: '', subtract: '' }]);
    setXienFilterPercent('');
    setXienFilterRowCount('1'); // Reset số dòng lọc về 1
    setTopNXienCount('');
    setTopNXienSelection([]);
    setTopNXienSubtracts({});
  };

  const resetXienQuayFilters = () => {
    setShowXienQuayFilter(false);
    setXienQuayFilterRows([{ number: '', subtract: '' }]);
    setXienQuayFilterPercent('');
    setTopNXienQuayCount('');
    setTopNXienQuaySelection([]);
    setTopNXienQuaySubtracts({});
    setXienQuayFilterRowCount('1'); // Reset số dòng lọc về 1
  };

  const resetCombinedFilters = () => {
    setShowCombinedFilter(false);
    setCombinedFilterPercent('');
    setPinCombinedFilter(false);
  };

  const clearPersistedLotoFilters = () => { try { localStorage.removeItem(getLotoFilterStorageKey()); } catch (e) { } };
  const clearPersistedTwoSFilters = () => { try { localStorage.removeItem(getTwoSFilterStorageKey()); } catch (e) { } };
  const clearPersistedThreeFilters = () => { try { localStorage.removeItem(getThreeFilterStorageKey()); } catch (e) { } };
  const clearPersistedXienFilters = () => { try { localStorage.removeItem(getXienFilterStorageKey()); } catch (e) { } };
  const clearPersistedXienQuayFilters = () => { try { localStorage.removeItem(getXienQuayFilterStorageKey()); } catch (e) { } };
  const clearPersistedCombinedFilters = () => { try { localStorage.removeItem(getCombinedFilterStorageKey()); } catch (e) { } };

  const handleRefreshLoto = async () => { clearPersistedLotoFilters(); resetLotoFilters(); await loadStatistics(); };
  const handleRefreshTwoS = async () => { clearPersistedTwoSFilters(); resetTwoSFilters(); await loadStatistics(); };
  const handleRefreshThree = async () => { clearPersistedThreeFilters(); resetThreeFilters(); await loadStatistics(); };
  const handleRefreshXien = async () => { clearPersistedXienFilters(); resetXienFilters(); await loadStatistics(); };
  const handleRefreshXienQuay = async () => { clearPersistedXienQuayFilters(); resetXienQuayFilters(); await loadStatistics(); };
  const handleRefreshCombined = async () => { clearPersistedCombinedFilters(); resetCombinedFilters(); await loadStatistics(); };

  const saveLotoFiltersToStorage = () => {
    if (!pinLotoFilter) return;
    try {
      const payload = { showLotoFilter, lotoFilterRows, lotoFilterRowCount, lotoFilterPercent, topNCount, topNSubtracts, pinLotoFilter: true };
      localStorage.setItem(getLotoFilterStorageKey(), JSON.stringify(payload));
    } catch (e) { }
  };

  const saveTwoSFiltersToStorage = () => {
    if (!pinTwoSFilter) return;
    try {
      const payload = {
        showTwoSFilter,
        twoSFilterRows,
        twoSFilterRowCount,
        twoSFilterPercent,
        topNTwoSCount,
        topNTwoSSubtracts,
        twoSMinSubtracts,
        twoSCoefficientFactor,
        pinTwoSFilter: true
      };
      localStorage.setItem(getTwoSFilterStorageKey(), JSON.stringify(payload));
    } catch (e) { }
  };

  const saveThreeFiltersToStorage = () => {
    if (!pinThreeFilter) return;
    try {
      const payload = { showThreeFilter, threeFilterRows, threeFilterRowCount, threeFilterPercent, topNThreeCount, topNThreeSubtracts, pinThreeFilter: true };
      localStorage.setItem(getThreeFilterStorageKey(), JSON.stringify(payload));
    } catch (e) { }
  };

  const saveXienFiltersToStorage = () => {
    if (!pinXienFilter) return;
    try {
      const payload = { showXienFilter, xienFilterRows, xienFilterRowCount, xienFilterPercent, topNXienCount, topNXienSubtracts, pinXienFilter: true };
      localStorage.setItem(getXienFilterStorageKey(), JSON.stringify(payload));
    } catch (e) { }
  };

  const saveXienQuayFiltersToStorage = () => {
    if (!pinXienQuayFilter) return;
    try {
      const payload = { showXienQuayFilter, xienQuayFilterRows, xienQuayFilterRowCount, xienQuayFilterPercent, topNXienQuayCount, topNXienQuaySubtracts, pinXienQuayFilter: true };
      localStorage.setItem(getXienQuayFilterStorageKey(), JSON.stringify(payload));
    } catch (e) { }
  };

  const saveCombinedFiltersToStorage = () => {
    if (!pinCombinedFilter) return;
    try {
      const payload = { showCombinedFilter, combinedFilterPercent, pinCombinedFilter: true };
      localStorage.setItem(getCombinedFilterStorageKey(), JSON.stringify(payload));
    } catch (e) { }
  };

  const loadLotoFiltersFromStorage = () => {
    try {
      const raw = localStorage.getItem(getLotoFilterStorageKey());
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      setShowLotoFilter(!!data.showLotoFilter);

      // Xử lý tương thích ngược với dữ liệu cũ
      if (data.lotoFilterRows) {
        setLotoFilterRows(data.lotoFilterRows);
      } else if (data.lotoFilterNumber !== undefined && data.lotoFilterSubtract !== undefined) {
        // Chuyển đổi từ định dạng cũ sang định dạng mới
        setLotoFilterRows([{ number: data.lotoFilterNumber ?? '', subtract: data.lotoFilterSubtract ?? '' }]);
      } else {
        setLotoFilterRows([{ number: '', subtract: '' }]);
      }

      setLotoFilterRowCount(data.lotoFilterRowCount ?? '1');
      setLotoFilterPercent(data.lotoFilterPercent ?? '');
      setTopNCount(data.topNCount ?? '');
      setTopNSubtracts(data.topNSubtracts ?? {});
      setPinLotoFilter(!!data.pinLotoFilter);
    } catch (e) { }
  };

  const loadTwoSFiltersFromStorage = () => {
    try {
      const raw = localStorage.getItem(getTwoSFilterStorageKey());
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      setShowTwoSFilter(!!data.showTwoSFilter);

      // Xử lý tương thích ngược với dữ liệu cũ
      if (data.twoSFilterRows) {
        setTwoSFilterRows(data.twoSFilterRows);
      } else if (data.twoSFilterNumber !== undefined || data.twoSFilterSubtract !== undefined) {
        // Chuyển đổi từ định dạng cũ sang định dạng mới
        setTwoSFilterRows([{ number: data.twoSFilterNumber ?? '', subtract: data.twoSFilterSubtract ?? '' }]);
      } else {
        setTwoSFilterRows([{ number: '', subtract: '' }]);
      }

      setTwoSFilterRowCount(data.twoSFilterRowCount ?? '1');
      setTwoSFilterPercent(data.twoSFilterPercent ?? '');
      setTopNTwoSCount(data.topNTwoSCount ?? '');
      setTopNTwoSSubtracts(data.topNTwoSSubtracts ?? {});
      setTwoSMinSubtracts(Array.isArray(data.twoSMinSubtracts) ? data.twoSMinSubtracts : []);
      setTwoSCoefficientFactor(data.twoSCoefficientFactor ?? '');
      setPinTwoSFilter(!!data.pinTwoSFilter);
    } catch (e) { }
  };

  const loadThreeFiltersFromStorage = () => {
    try {
      const raw = localStorage.getItem(getThreeFilterStorageKey());
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      setShowThreeFilter(!!data.showThreeFilter);

      // Xử lý tương thích ngược với dữ liệu cũ
      if (data.threeFilterRows) {
        setThreeFilterRows(data.threeFilterRows);
      } else if (data.threeFilterNumber !== undefined || data.threeFilterSubtract !== undefined) {
        // Chuyển đổi từ định dạng cũ sang định dạng mới
        setThreeFilterRows([{ number: data.threeFilterNumber ?? '', subtract: data.threeFilterSubtract ?? '' }]);
      } else {
        setThreeFilterRows([{ number: '', subtract: '' }]);
      }

      setThreeFilterRowCount(data.threeFilterRowCount ?? '1');
      setThreeFilterPercent(data.threeFilterPercent ?? '');
      setTopNThreeCount(data.topNThreeCount ?? '');
      setTopNThreeSubtracts(data.topNThreeSubtracts ?? {});
      setPinThreeFilter(!!data.pinThreeFilter);
    } catch (e) { }
  };

  const loadXienFiltersFromStorage = () => {
    try {
      const raw = localStorage.getItem(getXienFilterStorageKey());
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      setShowXienFilter(!!data.showXienFilter);

      // Xử lý tương thích ngược với dữ liệu cũ
      if (data.xienFilterRows) {
        setXienFilterRows(data.xienFilterRows);
      } else if (data.xienFilterNumber !== undefined || data.xienFilterSubtract !== undefined) {
        // Chuyển đổi từ định dạng cũ sang định dạng mới
        setXienFilterRows([{ number: data.xienFilterNumber ?? '', subtract: data.xienFilterSubtract ?? '' }]);
      } else {
        setXienFilterRows([{ number: '', subtract: '' }]);
      }

      setXienFilterRowCount(data.xienFilterRowCount ?? '1');
      setXienFilterPercent(data.xienFilterPercent ?? '');
      setTopNXienCount(data.topNXienCount ?? '');
      setTopNXienSubtracts(data.topNXienSubtracts ?? {});
      setPinXienFilter(!!data.pinXienFilter);
    } catch (e) { }
  };

  const loadXienQuayFiltersFromStorage = () => {
    try {
      const raw = localStorage.getItem(getXienQuayFilterStorageKey());
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      setShowXienQuayFilter(!!data.showXienQuayFilter);

      // Xử lý tương thích ngược với dữ liệu cũ
      if (data.xienQuayFilterRows) {
        setXienQuayFilterRows(data.xienQuayFilterRows);
      } else if (data.xienQuayFilterNumber !== undefined || data.xienQuayFilterSubtract !== undefined) {
        // Chuyển đổi từ định dạng cũ sang định dạng mới
        setXienQuayFilterRows([{ number: data.xienQuayFilterNumber ?? '', subtract: data.xienQuayFilterSubtract ?? '' }]);
      } else {
        setXienQuayFilterRows([{ number: '', subtract: '' }]);
      }

      setXienQuayFilterRowCount(data.xienQuayFilterRowCount ?? '1');
      setXienQuayFilterPercent(data.xienQuayFilterPercent ?? '');
      setTopNXienQuayCount(data.topNXienQuayCount ?? '');
      setTopNXienQuaySubtracts(data.topNXienQuaySubtracts ?? {});
      setPinXienQuayFilter(!!data.pinXienQuayFilter);
    } catch (e) { }
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
    } catch (e) { }
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
      .filter(([key]) => !key.includes('(xiên nháy)')) // Loại bỏ xiên nháy khỏi lựa chọn top N
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

    // Trừ theo một hoặc nhiều con cụ thể từ các dòng lọc
    if (Array.isArray(lotoFilterRows)) {
      lotoFilterRows.forEach(row => {
        const numFilter = (row.number || '').trim();
        const subtractVal = parseInt(row.subtract, 10);

        if (numFilter !== '' && !isNaN(subtractVal) && subtractVal > 0) {
          // Tách các số được nhập, phân cách bằng dấu phẩy
          const filterNumbers = numFilter.split(',').map(num => num.trim().padStart(2, '0'));
          if (filterNumbers.includes(numberStr)) {
            adjusted = Math.max(0, adjusted - subtractVal);
          }
        }
      });
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

    // Trừ theo một hoặc nhiều con cụ thể từ các dòng lọc
    if (Array.isArray(twoSFilterRows)) {
      twoSFilterRows.forEach(row => {
        const numFilter = (row.number || '').trim();
        const subtractVal = parseInt(row.subtract, 10);

        if (numFilter !== '' && !isNaN(subtractVal) && subtractVal > 0) {
          // Tách các số được nhập, phân cách bằng dấu phẩy
          const filterNumbers = numFilter.split(',').map(num => num.trim().padStart(2, '0'));
          if (filterNumbers.includes(numberStr)) {
            adjusted = Math.max(0, adjusted - subtractVal);
          }
        }
      });
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

  // Tính toán kết quả với hệ số
  const calculateResultWithCoefficient = () => {
    if (!isMerged || !statisticsData) return 0;

    // Tổng tiền sau khi gộp
    const mergedTotal = calculateMergedTotal();

    // Tổng tiền sau khi lọc
    const filteredTotal = calculateFiltered2sTotal();

    // Tổng số tiền trừ mỗi con
    const totalMin = (twoSMinSubtracts || []).reduce((sum, v) => {
      const n = parseInt(v, 10); return sum + (isNaN(n) ? 0 : n);
    }, 0);

    // Hệ số người dùng nhập
    const coefficient = parseFloat(twoSCoefficientFactor) || 0;

    // Kết quả = Tổng tiền sau khi gộp - Tổng tiền sau khi lọc - (hệ số * tổng số tiền trừ mỗi con)
    const result = mergedTotal - filteredTotal - (coefficient * totalMin);

    return Math.max(0, result);
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

  // Áp dụng trừ theo số tiền thấp nhất nhiều lần liên tiếp
  const applyMultipleTwoSMinSubtract = (times) => {
    if (!times || times <= 0) return;

    // Thực hiện trừ lần đầu
    const { zeros: initialZeros, minPositive: initialMinPositive } = computeCurrentTwoSAdjusted();
    if (initialMinPositive === Infinity) {
      alert('Không có dữ liệu tiền cược dương để áp dụng lọc.');
      return;
    }

    // Kiểm tra xem có con nào đang có số tiền cược là 0 không
    if (initialZeros.length > 0) {
      const agree = window.confirm(`Các con ${initialZeros.join(', ')} đang có số tiền cược là 0. Bạn có đồng ý lọc trừ theo mức thấp nhất hiện tại (${initialMinPositive}n) không?`);
      if (!agree) return;
    }

    // Tạo mảng tạm để lưu các giá trị trừ
    const newSubtracts = [];
    let currentSubtracts = [...twoSMinSubtracts];

    // Thực hiện trừ nhiều lần
    for (let i = 0; i < times; i++) {
      // Tính toán giá trị minPositive dựa trên trạng thái hiện tại
      const twoSData = statisticsData?.['2s'] || {};
      const totalMin = [...currentSubtracts].reduce((sum, v) => {
        const n = parseInt(v, 10); return sum + (isNaN(n) ? 0 : n);
      }, 0);

      let minPositive = Infinity;
      for (let j = 0; j < 100; j++) {
        const num = j.toString().padStart(2, '0');
        const base = twoSData[num] || 0;
        const current = Math.max(0, base - totalMin);
        if (current > 0 && current < minPositive) minPositive = current;
      }

      // Nếu không còn giá trị dương nào để trừ thì dừng lại
      if (minPositive === Infinity) break;

      // Thêm giá trị trừ vào mảng tạm
      newSubtracts.push(String(minPositive));
      currentSubtracts = [...currentSubtracts, String(minPositive)];
    }

    // Cập nhật state với tất cả các giá trị trừ mới
    setTwoSMinSubtracts((prev) => [...prev, ...newSubtracts]);
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

    // Trừ theo một hoặc nhiều con cụ thể từ các dòng lọc
    if (Array.isArray(threeFilterRows)) {
      threeFilterRows.forEach(row => {
        const filterInput = (row.number || '').trim();
        const subtractVal = parseInt(row.subtract, 10);

        if (filterInput !== '' && !isNaN(subtractVal) && subtractVal > 0) {
          const filterNumbers = filterInput.split(',').map(num => num.trim());
          if (filterNumbers.some(num => keyStr === num)) {
            adjusted = Math.max(0, adjusted - subtractVal);
          }
        }
      });
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

    // Trừ theo một hoặc nhiều con cụ thể từ các dòng lọc
    if (Array.isArray(xienFilterRows)) {
      xienFilterRows.forEach(row => {
        const filterInput = (row.number || '').trim();
        const subtractVal = parseInt(row.subtract, 10);

        if (filterInput !== '' && !isNaN(subtractVal) && subtractVal > 0) {
          const filterNumbers = filterInput.split(',').map(num => num.trim());
          if (filterNumbers.some(num => keyStr === num)) {
            adjusted = Math.max(0, adjusted - subtractVal);
          }
        }
      });
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

    // Trừ theo một hoặc nhiều con cụ thể từ các dòng lọc
    if (Array.isArray(xienQuayFilterRows)) {
      xienQuayFilterRows.forEach(row => {
        const filterInput = (row.number || '').trim();
        const subtractVal = parseInt(row.subtract, 10);

        if (filterInput !== '' && !isNaN(subtractVal) && subtractVal > 0) {
          const filterNumbers = filterInput.split(',').map(num => num.trim());
          if (filterNumbers.some(num => keyStr === num)) {
            adjusted = Math.max(0, adjusted - subtractVal);
          }
        }
      });
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
  useEffect(() => { saveLotoFiltersToStorage(); /* eslint-disable-line */ }, [pinLotoFilter, showLotoFilter, lotoFilterRows, lotoFilterPercent, lotoFilterRowCount, topNCount, topNSubtracts, selectedDate]);
  useEffect(() => { saveTwoSFiltersToStorage(); /* eslint-disable-line */ }, [pinTwoSFilter, showTwoSFilter, twoSFilterRows, twoSFilterRowCount, twoSFilterPercent, topNTwoSCount, topNTwoSSubtracts, twoSMinSubtracts, twoSCoefficientFactor, selectedDate]);
  useEffect(() => { saveThreeFiltersToStorage(); /* eslint-disable-line */ }, [pinThreeFilter, showThreeFilter, threeFilterRows, threeFilterRowCount, threeFilterPercent, topNThreeCount, topNThreeSubtracts, selectedDate]);
  useEffect(() => { saveXienFiltersToStorage(); /* eslint-disable-line */ }, [pinXienFilter, showXienFilter, xienFilterRows, xienFilterRowCount, xienFilterPercent, topNXienCount, topNXienSubtracts, selectedDate]);
  useEffect(() => { saveXienQuayFiltersToStorage(); /* eslint-disable-line */ }, [pinXienQuayFilter, showXienQuayFilter, xienQuayFilterRows, xienQuayFilterRowCount, xienQuayFilterPercent, topNXienQuayCount, topNXienQuaySubtracts, selectedDate]);
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
      // Reset merge state when tab changes or data reloads
      setIsMerged(false);
      setOriginalTwoSData(null);
      setMergeStatus('');
    }
  }, [selectedDate, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps



  // Restore scroll position after data loads
  useEffect(() => {
    console.log('📊 StatisticsData changed, checking restore flag:', {
      shouldRestore: shouldRestoreScroll.current,
      hasData: !!statisticsData,
      savedPosition: scrollPositionRef.current
    });

    if (shouldRestoreScroll.current && statisticsData) {
      console.log('✅ Conditions met, restoring container scroll to:', scrollPositionRef.current);
      requestAnimationFrame(() => {
        const container = document.querySelector('.admin-content-section');
        if (container) {
          container.scrollTop = scrollPositionRef.current;
          console.log('📌 Container scroll restored! Current position:', container.scrollTop);
        }
        shouldRestoreScroll.current = false; // Reset flag
      });
    }
  }, [statisticsData]);

  // Reset activeDetailTab if 4s tab is hidden due to no data
  useEffect(() => {
    if (statisticsData && activeDetailTab === '4s') {
      const has4sData = statisticsData['4sTotal'] && statisticsData['4sTotal'] > 0;
      if (!has4sData) {
        setActiveDetailTab('loto');
      }
    }
  }, [statisticsData, activeDetailTab]);

  // Handle date change
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    // Reset merge state when date changes
    setIsMerged(false);
    setOriginalTwoSData(null);
    setMergeStatus('');
    setTwoSCoefficientFactor('');
  };

  // Handle tab change
  const handleTabChange = (tab) => { setActiveTab(tab); };

  // Load statistics data for all stores of admin
  const loadStatistics = async (date = selectedDate) => {
    setIsLoading(true);
    // Reset merge state when loading new statistics
    setIsMerged(false);
    setOriginalTwoSData(null);
    setMergeStatus('');

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
          deaATotal: rawStats.deaATotal || 0,
          loATotal: rawStats.loATotal || 0,
          '3sTotal': rawStats['3sTotal'] || 0,
          '4sTotal': rawStats['4sTotal'] || 0,
          tongTotal: rawStats.tongTotal || 0,
          kepTotal: rawStats.kepTotal || 0,
          dauTotal: rawStats.dauTotal || 0,
          ditTotal: rawStats.ditTotal || 0,
          dauATotal: rawStats.dauATotal || 0,
          ditATotal: rawStats.ditATotal || 0,
          boTotal: rawStats.boTotal || 0,
          tongKepDauDitBoTotal: rawStats.tongKepDauDitBoTotal || 0,
          xienTotal: rawStats.xienTotal || 0,
          xienquayTotal: rawStats.xienquayTotal || 0,

          loto: rawStats.loto,
          loA: rawStats.loA || {},
          '2s': rawStats['2s'],
          deaA: rawStats.deaA || {},
          '3s': transformGroupedData(rawStats['3s']),
          '4s': transformGroupedData(rawStats['4s']),
          tong: transformSimpleGroupedData(rawStats.grouped?.tong),
          kep: transformSimpleGroupedData(rawStats.grouped?.kep),
          dau: transformSimpleGroupedData(rawStats.grouped?.dau),
          dit: transformSimpleGroupedData(rawStats.grouped?.dit),
          dauA: transformSimpleGroupedData(rawStats.grouped?.daua),
          ditA: transformSimpleGroupedData(rawStats.grouped?.dita),
          bo: transformSimpleGroupedData(rawStats.grouped?.bo),
          xien: transformXienData(rawStats.xien),
          xienquay: transformXienData(rawStats.xienquay),

          lotoCalculationString: rawStats.lotoCalculationString,
          totalLotoRevenue: rawStats.totalLotoRevenue,
          lotoMultipliers: rawStats.lotoMultipliers,
          lotoPointsByStore: rawStats.lotoPointsByStore,
          // Bổ sung dữ liệu bộ động từ backend để gộp vào 2 số
          boCounts: rawStats.boCounts || {},
          boDefinitions: rawStats.boDefinitions || {}
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
          // Giữ nguyên key gốc từ backend (bao gồm cả '(xiên nháy)' nếu có)
          result[numbers] = details.totalAmount;
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

  // Generate De A statistics table data
  const generateDeATableData = () => {
    const deAData = statisticsData?.deaA || {};
    const tableData = [];
    for (let row = 0; row < 20; row++) {
      const rowData = [];
      for (let col = 0; col < 5; col++) {
        const number = (row + col * 20).toString().padStart(2, '0');
        const amount = deAData[number] || 0;
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
      'dauA': 'Đề Đầu A',
      'ditA': 'Đề Đít A',
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
                <td style={{ color: '#d32f2f', fontWeight: 600 }}>{item.amount}n</td>
              </tr>
            ))}

            <tr className="admin-stats-row-total">
              <td colSpan="2" style={{ textAlign: 'right', fontWeight: 600 }}>Tổng tiền cược:</td>
              <td style={{ color: '#d32f2f', fontWeight: 600 }}>{formatThousand(tableData.reduce((sum, item) => sum + parseFloat(item.amount), 0))}</td>
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
      if (!key.includes('(xiên nháy)')) {
        const adjustedAmount = adjustXienAmountForDisplay(key, amount);
        total += adjustedAmount;
      }
    });
    return total;
  };

  // Tính tổng tiền cược xiên nháy (tiền gốc - chia cho 1.2 vì backend đã nhân)
  const calculateXienNhayBetTotal = () => {
    if (!statisticsData || !statisticsData.xien) return 0;

    let total = 0;
    Object.entries(statisticsData.xien || {}).forEach(([key, amount]) => {
      if (key.includes('(xiên nháy)')) {
        total += Math.round(amount / 1.2);
      }
    });
    return total;
  };

  // Tính tổng tiền đánh xiên nháy (nhân với 1.2)
  const calculateXienNhayTotal = () => {
    return Math.round(calculateXienNhayBetTotal() * 1.2);
  };

  // Tính tổng tiền xiên nháy sau khi lọc (nhân với 1.2)
  const calculateFilteredXienNhayTotal = () => {
    if (!statisticsData || !statisticsData.xien) return 0;

    let total = 0;
    Object.entries(statisticsData.xien || {}).forEach(([key, amount]) => {
      if (key.includes('(xiên nháy)')) {
        const adjustedAmount = adjustXienAmountForDisplay(key, amount);
        total += adjustedAmount;
      }
    });
    return Math.round(total * 1.2);
  };

  // Tính tổng tiền xiên thường riêng biệt
  const calculateXienTotal = () => {
    if (!statisticsData || !statisticsData.xien) return 0;

    let total = 0;
    Object.entries(statisticsData.xien || {}).forEach(([key, amount]) => {
      if (!key.includes('(xiên nháy)')) {
        total += amount;
      }
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
    'chanchan': [0, 2, 4, 6, 8, 20, 22, 24, 26, 28, 40, 42, 44, 46, 48, 60, 62, 64, 66, 68, 80, 82, 84, 86, 88],
    // Các bộ chạm
    'chamkhong': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 90, 80, 70, 60, 50, 40, 30, 20, 10],
    'chammot': [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 91, 81, 71, 61, 51, 41, 31, 21, 1],
    'chamhai': [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 92, 82, 72, 62, 52, 42, 32, 12, 2],
    'chamba': [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 93, 83, 73, 63, 53, 43, 23, 13, 3],
    'chambon': [40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 94, 84, 74, 64, 54, 34, 24, 14, 4],
    'chamnam': [50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 95, 85, 75, 65, 45, 35, 25, 15, 5],
    'chamsau': [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 96, 86, 76, 56, 46, 36, 26, 16, 6],
    'chambay': [70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 97, 87, 67, 57, 47, 37, 27, 17, 7],
    'chamtam': [80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 98, 78, 68, 58, 48, 38, 28, 18, 8],
    'chamchin': [90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 89, 79, 69, 59, 49, 39, 29, 19, 9]
  };

  // Tính tổng tiền tổng kép đầu đít bộ sau khi lọc
  const calculateFilteredCombinedTotal = () => {
    if (!statisticsData) return 0;

    let total = 0;
    const betTypes = ['tong', 'kep', 'dau', 'dit', 'dauA', 'ditA', 'bo'];

    betTypes.forEach(betType => {
      const betData = statisticsData[betType] || {};
      Object.entries(betData).forEach(([number, amount]) => {
        const adjustedAmount = adjustCombinedAmountForDisplay(amount);
        // Áp dụng hệ số tương ứng với từng loại cược
        if (betType === 'tong' || betType === 'kep' || betType === 'dau' || betType === 'dit' || betType === 'dauA' || betType === 'ditA') {
          total += parseFloat(adjustedAmount) * 10;
        } else if (betType === 'bo') {
          // Lấy số lượng số thực tế của bộ từ dữ liệu động (nếu có), fallback BO_DATA
          const dynamicSize = statisticsData.boCounts ? statisticsData.boCounts[number] : undefined;
          const boSize = (typeof dynamicSize === 'number') ? dynamicSize : (Array.isArray(BO_DATA[number]) ? BO_DATA[number].length : 0);
          total += parseFloat(adjustedAmount) * boSize;
        }
      });
    });

    return total;
  };

  // Tính tổng tiền sau khi gộp tổng, kép, đầu, đít, bộ vào bảng 2 số
  const calculateMergedTotal = () => {
    if (!statisticsData || !isMerged) return 0;

    let total = 0;
    const twoSData = statisticsData['2s'] || {};

    // Tính tổng tiền từ dữ liệu 2 số đã gộp
    Object.values(twoSData).forEach(amount => {
      total += parseFloat(amount);
    });

    return total;
  };

  // State để hiển thị thông báo khi gộp dữ liệu thành công
  const [mergeStatus, setMergeStatus] = useState('');

  // State để kiểm soát việc đã gộp hay chưa
  const [isMerged, setIsMerged] = useState(false);

  // State để lưu dữ liệu 2 số ban đầu trước khi gộp
  const [originalTwoSData, setOriginalTwoSData] = useState(null);

  // Hàm xử lý gộp dữ liệu từ tổng, kép, đầu, đít, bộ vào bảng 2 số
  const handleMergeTongKepDauDitBo = () => {
    if (!statisticsData) return;

    // Nếu đã gộp rồi thì không gộp nữa
    if (isMerged) {
      setMergeStatus('Dữ liệu đã được gộp trước đó!');
      setTimeout(() => {
        setMergeStatus('');
      }, 5000);
      return;
    }

    // Lưu dữ liệu 2 số ban đầu trước khi gộp
    setOriginalTwoSData({ ...statisticsData['2s'] });

    // Tạo bản sao của dữ liệu 2 số hiện tại
    const mergedTwoSData = { ...statisticsData['2s'] || {} };

    // Xử lý dữ liệu tổng
    if (statisticsData.tong) {
      Object.entries(statisticsData.tong).forEach(([tongNumber, details]) => {
        const amount = details.totalAmount || details;

        // Chuyển đổi tongNumber thành không dấu để so sánh
        const normalizedTongNumber = removeVietnameseAccents(tongNumber);

        // Định nghĩa tổng từ 0-9 theo thông tin mới
        const tongDefinitions = {
          '0': ['00', '19', '28', '37', '46', '55', '64', '73', '82', '91'],
          '1': ['01', '10', '29', '38', '47', '56', '65', '74', '83', '92'],
          '2': ['02', '11', '20', '39', '48', '57', '66', '75', '84', '93'],
          '3': ['03', '12', '21', '30', '49', '58', '67', '76', '85', '94'],
          '4': ['04', '13', '22', '31', '40', '59', '68', '77', '86', '95'],
          '5': ['05', '14', '23', '32', '41', '50', '69', '78', '87', '96'],
          '6': ['06', '15', '24', '33', '42', '51', '60', '79', '88', '97'],
          '7': ['07', '16', '25', '34', '43', '52', '61', '70', '89', '98'],
          '8': ['08', '17', '26', '35', '44', '53', '62', '71', '80', '99'],
          '9': ['09', '18', '27', '36', '45', '54', '63', '72', '81', '90']
        };

        // Xử lý trường hợp tongNumber là 'tổng' hoặc 'tong' với một số
        let tongValue = parseInt(tongNumber, 10);
        let actualTongNumber = tongNumber;

        // Kiểm tra nếu tongNumber có dạng 'tổng X' hoặc 'tong X'
        if (isNaN(tongValue)) {
          const tongMatch = tongNumber.match(/t[oố]ng\s*(\d+)/i);
          if (tongMatch && tongMatch[1]) {
            actualTongNumber = tongMatch[1];
            tongValue = parseInt(actualTongNumber, 10);
          }
        }

        // Nếu tổng từ 0-9, sử dụng định nghĩa mới
        if (tongValue >= 0 && tongValue <= 9 && tongDefinitions[actualTongNumber]) {
          tongDefinitions[actualTongNumber].forEach(twoSNumber => {
            mergedTwoSData[twoSNumber] = (mergedTwoSData[twoSNumber] || 0) + amount;
          });
        }
        // Trường hợp cũ (nếu có): tổng là tổng của 2 chữ số
        else if (tongValue >= 0 && tongValue <= 18) {
          // Tạo tất cả các cặp số có tổng bằng tongValue
          for (let i = 0; i <= 9; i++) {
            const j = tongValue - i;
            if (j >= 0 && j <= 9) {
              const twoSNumber = `${i}${j}`;
              mergedTwoSData[twoSNumber] = (mergedTwoSData[twoSNumber] || 0) + amount;
            }
          }
        }
      });
    }

    // Xử lý dữ liệu kép
    if (statisticsData.kep) {
      Object.entries(statisticsData.kep).forEach(([kepType, details]) => {
        const amount = details.totalAmount || details;

        // Chuyển đổi kepType thành không dấu để so sánh
        const normalizedKepType = removeVietnameseAccents(kepType);

        // Kép bằng: 00 11 22 33 44 55 66 77 88 99
        if (normalizedKepType === 'bang' || normalizedKepType === 'kep_bang' ||
          kepType === 'bằng' || kepType === 'kép_bằng' ||
          kepType === 'kep bang' || kepType === 'kép bằng') {
          for (let i = 0; i <= 9; i++) {
            const twoSNumber = `${i}${i}`;
            mergedTwoSData[twoSNumber] = (mergedTwoSData[twoSNumber] || 0) + amount;
          }
        }
        // Kép lệch: 05 50 16 61 27 72 38 83 49 94
        else if (normalizedKepType === 'lech' || normalizedKepType === 'kep_lech' ||
          kepType === 'lệch' || kepType === 'kép_lệch' ||
          kepType === 'kep lech' || kepType === 'kép lệch') {
          const kepLechPairs = ['05', '50', '16', '61', '27', '72', '38', '83', '49', '94'];
          kepLechPairs.forEach(pair => {
            mergedTwoSData[pair] = (mergedTwoSData[pair] || 0) + amount;
          });
        }
        // Trường hợp cũ (nếu có): kép là 2 số giống nhau
        else if (kepType.length === 1) {
          const twoSNumber = `${kepType}${kepType}`;
          mergedTwoSData[twoSNumber] = (mergedTwoSData[twoSNumber] || 0) + amount;
        }
        // Trường hợp khác: kiểm tra nếu kepType là 'kép' hoặc 'kep'
        else if (normalizedKepType === 'kep' || kepType === 'kép') {
          // Xử lý tất cả các số kép (cả bằng và lệch)
          // Kép bằng
          for (let i = 0; i <= 9; i++) {
            const twoSNumber = `${i}${i}`;
            mergedTwoSData[twoSNumber] = (mergedTwoSData[twoSNumber] || 0) + amount;
          }
          // Kép lệch
          const kepLechPairs = ['05', '50', '16', '61', '27', '72', '38', '83', '49', '94'];
          kepLechPairs.forEach(pair => {
            mergedTwoSData[pair] = (mergedTwoSData[pair] || 0) + amount;
          });
        }
      });
    }

    // Xử lý dữ liệu đầu
    if (statisticsData.dau) {
      Object.entries(statisticsData.dau).forEach(([dauNumber, details]) => {
        const amount = details.totalAmount || details;

        // Chuyển đổi dauNumber thành không dấu để so sánh
        const normalizedDauNumber = removeVietnameseAccents(dauNumber);

        // Xử lý trường hợp dauNumber là 'đầu' hoặc 'dau' với một số
        let actualDauNumber = dauNumber;

        // Kiểm tra nếu dauNumber có dạng 'đầu X' hoặc 'dau X'
        if (dauNumber.length > 1) {
          const dauMatch = dauNumber.match(/[đd][aâầ]u\s*(\d+)/i);
          if (dauMatch && dauMatch[1]) {
            actualDauNumber = dauMatch[1];
          }
        }

        // Đầu là chữ số đầu tiên, ví dụ đầu 3 là 30, 31, 32, 33, 34, 35, 36, 37, 38, 39
        if (actualDauNumber.length === 1) {
          for (let i = 0; i <= 9; i++) {
            const twoSNumber = `${actualDauNumber}${i}`;
            mergedTwoSData[twoSNumber] = (mergedTwoSData[twoSNumber] || 0) + amount;
          }
        }
      });
    }

    // Xử lý dữ liệu đít
    if (statisticsData.dit) {
      Object.entries(statisticsData.dit).forEach(([ditNumber, details]) => {
        const amount = details.totalAmount || details;

        // Chuyển đổi ditNumber thành không dấu để so sánh
        const normalizedDitNumber = removeVietnameseAccents(ditNumber);

        // Xử lý trường hợp ditNumber là 'đít' hoặc 'dit' với một số
        let actualDitNumber = ditNumber;

        // Kiểm tra nếu ditNumber có dạng 'đít X' hoặc 'dit X'
        if (ditNumber.length > 1) {
          const ditMatch = ditNumber.match(/[đd][iíị]t\s*(\d+)/i);
          if (ditMatch && ditMatch[1]) {
            actualDitNumber = ditMatch[1];
          }
        }

        // Đít là chữ số cuối cùng, ví dụ đít 3 là 03, 13, 23, 33, 43, 53, 63, 73, 83, 93
        if (actualDitNumber.length === 1) {
          for (let i = 0; i <= 9; i++) {
            const twoSNumber = `${i}${actualDitNumber}`;
            mergedTwoSData[twoSNumber] = (mergedTwoSData[twoSNumber] || 0) + amount;
          }
        }
      });
    }

    // Xử lý dữ liệu bộ
    if (statisticsData.bo) {
      Object.entries(statisticsData.bo).forEach(([boNumber, details]) => {
        const amount = details.totalAmount || details;

        // Chuyển đổi boNumber thành không dấu để so sánh
        const normalizedBoNumber = removeVietnameseAccents(boNumber);

        // Xử lý trường hợp boNumber là 'bộ' hoặc 'bo' với một số
        let actualBoNumber = boNumber;

        // Kiểm tra nếu boNumber có dạng 'bộ X' hoặc 'bo X'
        if (boNumber.length > 2) {
          const boMatch = boNumber.match(/b[oộ]\s*(\d+)/i);
          if (boMatch && boMatch[1]) {
            actualBoNumber = boMatch[1];
          }
        }

        // Bộ là tập hợp các số: ưu tiên dữ liệu động từ backend, fallback BO_DATA
        const dynamicDef = statisticsData.boDefinitions ? statisticsData.boDefinitions[actualBoNumber] : undefined;
        const definitionList = Array.isArray(dynamicDef) ? dynamicDef : (Array.isArray(BO_DATA[actualBoNumber]) ? BO_DATA[actualBoNumber] : []);
        if (definitionList.length > 0) {
          definitionList.forEach(num => {
            const twoSNumber = num.toString().padStart(2, '0');
            mergedTwoSData[twoSNumber] = (mergedTwoSData[twoSNumber] || 0) + amount;
          });
        }
      });
    }

    // Cập nhật dữ liệu 2 số với dữ liệu đã gộp
    const updatedStats = {
      ...statisticsData,
      '2s': mergedTwoSData
    };

    setStatisticsData(updatedStats);
    setIsMerged(true);
    setMergeStatus('Đã gộp dữ liệu tổng, kép, đầu, đít, bộ vào bảng 2 số!');

    // Tự động ẩn thông báo sau 5 giây
    setTimeout(() => {
      setMergeStatus('');
    }, 5000);
  };

  // Hàm xử lý xóa gộp và khôi phục dữ liệu ban đầu
  const handleUnmergeTongKepDauDitBo = () => {
    if (!isMerged || !originalTwoSData) {
      setMergeStatus('Không có dữ liệu gộp để xóa!');
      setTimeout(() => {
        setMergeStatus('');
      }, 5000);
      return;
    }

    // Khôi phục dữ liệu 2 số ban đầu
    const updatedStats = {
      ...statisticsData,
      '2s': originalTwoSData
    };

    setStatisticsData(updatedStats);
    setIsMerged(false);
    setOriginalTwoSData(null);
    setMergeStatus('Đã xóa gộp và khôi phục dữ liệu ban đầu!');

    // Tự động ẩn thông báo sau 5 giây
    setTimeout(() => {
      setMergeStatus('');
    }, 5000);
  };

  // Format tiền tệ
  const formatMoney = (amount) => { if (!amount || amount === 0) return '0 đ'; return Math.floor(amount).toLocaleString('vi-VN').replace(/,/g, '.') + ' đ'; };
  // Format nghìn đồng
  const formatThousand = (amount) => { if (!amount || amount === 0) return '0n'; return amount.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).replace(/,/g, '.') + 'n'; };

  // Render summary section
  const renderSummary = () => {
    if (!statisticsData) return null;

    const lotoTotalPoints = Object.values(statisticsData.loto || {}).reduce((sum, points) => sum + points, 0);
    const lotoRevenue = statisticsData.totalLotoRevenue || (lotoTotalPoints * 22.5);

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
          </div>
          <div className="admin-stats-card">
            <h4>2 số</h4>
            <span className="admin-stats-value">{formatThousand(statisticsData['2sTotal'])}</span>
          </div>
          {statisticsData.loATotal > 0 && (
            <div className="admin-stats-card">
              <h4>Lô A</h4>
              <span className="admin-stats-value">{formatThousand(statisticsData.loATotal)}</span>
            </div>
          )}
          {statisticsData.deaATotal > 0 && (
            <div className="admin-stats-card">
              <h4>Đề A</h4>
              <span className="admin-stats-value">{formatThousand(statisticsData.deaATotal)}</span>
            </div>
          )}


          <div className="admin-stats-card">
            <h4>3 số</h4>
            <span className="admin-stats-value">{formatThousand(statisticsData['3sTotal'])}</span>
          </div>
          {/* Chỉ hiển thị khối 4 số khi có dữ liệu */}
          {statisticsData['4sTotal'] > 0 && (
            <div className="admin-stats-card">
              <h4>4 số</h4>
              <span className="admin-stats-value">{formatThousand(statisticsData['4sTotal'])}</span>
            </div>
          )}
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
          {statisticsData.dauATotal > 0 && (
            <div className="admin-stats-card">
              <h4>Đề Đầu A</h4>
              <span className="admin-stats-value">{formatThousand(statisticsData.dauATotal)}</span>
            </div>
          )}
          {statisticsData.ditATotal > 0 && (
            <div className="admin-stats-card">
              <h4>Đề Đít A</h4>
              <span className="admin-stats-value">{formatThousand(statisticsData.ditATotal)}</span>
            </div>
          )}
          <div className="admin-stats-card">
            <h4>Bộ</h4>
            <span className="admin-stats-value">{formatThousand(statisticsData.boTotal)}</span>
          </div>
          <div className="admin-stats-card">
            <h4>Xiên</h4>
            <span className="admin-stats-value">{formatThousand(calculateXienTotal())}</span>
          </div>
          <div className="admin-stats-card">
            <h4>Xiên nháy</h4>
            <span className="admin-stats-value">{formatThousand(calculateXienNhayTotal())}</span>
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
      ...(statisticsData.loATotal > 0 ? [{ id: 'loA', label: 'Lô A' }] : []),
      ...(statisticsData.deaATotal > 0 ? [{ id: 'deaA', label: 'Đề A' }] : []),
      ...(statisticsData.dauATotal > 0 ? [{ id: 'dauA', label: 'Đề Đầu A' }] : []),
      ...(statisticsData.ditATotal > 0 ? [{ id: 'ditA', label: 'Đề Đít A' }] : []),
      { id: '3s', label: '3 số' },
      { id: 'combined-basic', label: 'Tổng, Kép, Đầu, Đít, Bộ' },
      { id: 'xien', label: 'Xiên' },
      { id: 'xiennhay', label: 'Xiên nháy' },
      { id: 'xienquay', label: 'Xiên quay' }
    ];

    // Thêm tab 4s chỉ khi có dữ liệu
    const has4sData = statisticsData['4sTotal'] && statisticsData['4sTotal'] > 0;
    if (has4sData) {
      tabs.splice(3, 0, { id: '4s', label: '4 số' });
    }

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

                  <span style={{ color: '#1976d2', fontWeight: 600, fontSize: '14px' }}>
                    Tổng tiền đánh: {formatThousand(statisticsData.totalLotoRevenue || (lotoTotalPoints * 22.5))}
                  </span>

                  <br />
                  <span className="admin-stats-loto-total-value">Tổng điểm: {lotoTotalPoints}đ</span>
                  {((lotoFilterRows && lotoFilterRows.some(row => row.number || row.subtract)) || lotoFilterPercent || Object.keys(topNSubtracts).length > 0) && (
                    <div style={{ marginTop: '5px' }}>
                      <span style={{ color: '#388e3c', fontWeight: 600, fontSize: '14px' }}>Tổng điểm sau khi lọc: {calculateFilteredLotoTotal().toLocaleString('vi-VN').replace(/,/g, '.') + 'n'}</span>
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
                    <span>Số dòng lọc</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="vd: 2"
                      value={lotoFilterRowCount}
                      onChange={(e) => {
                        const newCount = parseInt(e.target.value, 10) || 1;
                        setLotoFilterRowCount(e.target.value);

                        // Cập nhật mảng dòng lọc khi thay đổi số dòng
                        const currentRows = [...lotoFilterRows];
                        if (newCount > currentRows.length) {
                          // Thêm dòng mới nếu tăng số dòng
                          const newRows = [...currentRows];
                          for (let i = currentRows.length; i < newCount; i++) {
                            newRows.push({ number: '', subtract: '' });
                          }
                          setLotoFilterRows(newRows);
                        } else if (newCount < currentRows.length) {
                          // Bớt dòng nếu giảm số dòng
                          setLotoFilterRows(currentRows.slice(0, newCount));
                        }
                      }}
                      style={{ width: '60px' }}
                    />
                  </div>

                  {/* Hiển thị số dòng lọc dựa trên giá trị nhập vào */}
                  {lotoFilterRows.map((row, index) => (
                    <div key={index} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <span>Lọc con</span>
                      <input
                        type="text"
                        placeholder="12,23,45"
                        value={row.number}
                        onChange={(e) => {
                          const newRows = [...lotoFilterRows];
                          newRows[index].number = e.target.value;
                          setLotoFilterRows(newRows);
                        }}
                        style={{ width: '120px' }}
                      />
                      <span>, số điểm là</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="vd: 100"
                        value={row.subtract}
                        onChange={(e) => {
                          const newRows = [...lotoFilterRows];
                          newRows[index].subtract = e.target.value;
                          setLotoFilterRows(newRows);
                        }}
                        style={{ width: '100px' }}
                      />
                    </div>
                  ))}

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

        case 'loA':
          return (
            <div className="admin-stats-loto-table">
              <div className="admin-stats-loto-total">
                <h4>Tổng kết Lô A</h4>
                <div>
                  <span style={{ color: '#1976d2', fontWeight: 600, fontSize: '14px' }}>
                    Tổng tiền đánh: {formatThousand(statisticsData.loATotal || 0)}
                  </span>
                  <br />
                  <span className="admin-stats-loto-total-value">Tổng điểm: {Object.values(statisticsData.loA || {}).reduce((sum, p) => sum + p, 0)}đ</span>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Lô A</th><th>Điểm (đ)</th><th>Lô A</th><th>Điểm (đ)</th><th>Lô A</th><th>Điểm (đ)</th><th>Lô A</th><th>Điểm (đ)</th><th>Lô A</th><th>Điểm (đ)</th>
                  </tr>
                </thead>
                <tbody>
                  {generateLotoTableData().map((row, rowIndex) => (
                    <tr key={`loa-row-${rowIndex}`}>
                      {row.map((cell, colIndex) => (
                        <>
                          <td key={`loa-num-${rowIndex}-${colIndex}`} className="admin-stats-loto-number">{cell.number}</td>
                          <td key={`loa-pts-${rowIndex}-${colIndex}`} className={`admin-stats-loto-points ${((statisticsData?.loA || {})[cell.number] > 0) ? 'admin-stats-2s-has-bet' : ''}`}>
                            {((statisticsData?.loA || {})[cell.number] > 0) ? `${(statisticsData.loA || {})[cell.number]}đ` : ''}
                          </td>
                        </>
                      ))}
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
                  <span style={{ color: '#1976d2', fontWeight: 600, fontSize: '14px' }}>Tổng tiền đánh: {formatThousand(statisticsData['2sTotal'])}</span>
                  <br />
                  {isMerged && (
                    <div style={{ marginTop: '5px' }}>
                      <span style={{ color: '#d32f2f', fontWeight: 600, fontSize: '14px' }}>Tổng tiền sau khi gộp tổng, kép, đầu, đít, bộ: {formatThousand(calculateMergedTotal())}</span>
                    </div>
                  )}
                  {((twoSFilterRows && twoSFilterRows.some(row => row.number || row.subtract)) || twoSFilterPercent || Object.keys(topNTwoSSubtracts).length > 0 || twoSMinSubtracts.length > 0) && (
                    <div style={{ marginTop: '5px' }}>
                      <span style={{ color: '#388e3c', fontWeight: 600, fontSize: '14px' }}>Tổng tiền sau khi lọc: {calculateFiltered2sTotal().toLocaleString('vi-VN').replace(/,/g, '.') + 'n'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bộ lọc hiển thị bảng 2 số */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 12px 0', flexWrap: 'wrap' }}>                <button className="admin-stats-tab filter-toggle-btn" onClick={() => setShowTwoSFilter(prev => !prev)}>{showTwoSFilter ? 'Ẩn bộ lọc' : 'Bộ lọc'}</button>                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>                  <input type="checkbox" checked={pinTwoSFilter} onChange={(e) => setPinTwoSFilter(e.target.checked)} />                  <span>Ghim bộ lọc</span>                </label>                <button className="admin-stats-tab" onClick={handleRefreshTwoS}>Làm mới</button>                <button className="admin-stats-tab" onClick={handleMergeTongKepDauDitBo}>Gộp tổng, kép, đầu, đít, bộ</button>                {isMerged && <button className="admin-stats-tab" onClick={handleUnmergeTongKepDauDitBo}>Xóa gộp</button>}                {mergeStatus && <span style={{ color: '#388e3c', fontWeight: 600, marginLeft: '10px' }}>{mergeStatus}</span>}              </div>

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
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                      <button className="admin-stats-tab" onClick={applyTwoSMinSubtract}>Trừ theo số tiền thấp nhất (00-99)</button>
                      <span>Số lần trừ:</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="vd: 4"
                        style={{ width: '60px' }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const times = parseInt(e.target.value, 10);
                            if (!isNaN(times) && times > 0) {
                              applyMultipleTwoSMinSubtract(times);
                              e.target.value = '';
                            }
                          }
                        }}
                      />
                      <button
                        className="admin-stats-tab"
                        onClick={(e) => {
                          const input = e.target.previousElementSibling;
                          const times = parseInt(input.value, 10);
                          if (!isNaN(times) && times > 0) {
                            applyMultipleTwoSMinSubtract(times);
                            input.value = '';
                          }
                        }}
                      >
                        Áp dụng
                      </button>
                    </div>
                    {twoSMinSubtracts.length > 0 && (
                      <>
                        <span>Đang trừ mỗi con:</span>
                        {twoSMinSubtracts.map((v, idx) => (
                          <input key={idx} type="text" readOnly value={v} style={{ width: '60px', background: '#f0f0f0' }} />
                        ))}
                        <span>n</span>
                        <button className="admin-stats-tab" onClick={clearTwoSMinSubtractLast}>Xóa lần cuối</button>
                        <button className="admin-stats-tab" onClick={clearTwoSMinSubtractAll}>Xóa tất cả</button>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginTop: '8px', width: '100%' }}>
                          <span>Với hệ số trả thưởng 2 số</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="vd: 85"
                            value={twoSCoefficientFactor}
                            onChange={(e) => setTwoSCoefficientFactor(e.target.value)}
                            style={{ width: '80px' }}
                          />
                          <span>thì hiện tại bạn sẽ được ít nhất: {formatThousand(calculateResultWithCoefficient())}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span>Số dòng lọc</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="vd: 2"
                      value={twoSFilterRowCount}
                      onChange={(e) => {
                        const newCount = parseInt(e.target.value, 10);
                        setTwoSFilterRowCount(e.target.value);

                        // Tự động điều chỉnh số dòng lọc dựa trên giá trị nhập vào
                        if (!isNaN(newCount) && newCount > 0) {
                          const currentRows = [...twoSFilterRows];
                          if (newCount > currentRows.length) {
                            // Thêm dòng mới nếu số dòng tăng
                            const rowsToAdd = newCount - currentRows.length;
                            const newRows = [...currentRows];
                            for (let i = 0; i < rowsToAdd; i++) {
                              newRows.push({ number: '', subtract: '' });
                            }
                            setTwoSFilterRows(newRows);
                          } else if (newCount < currentRows.length) {
                            // Xóa dòng nếu số dòng giảm
                            setTwoSFilterRows(currentRows.slice(0, newCount));
                          }
                        }
                      }}
                      style={{ width: '60px' }}
                    />
                  </div>

                  {/* Hiển thị số dòng lọc dựa trên giá trị nhập vào */}
                  {twoSFilterRows.map((row, index) => (
                    <div key={index} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <span>Lọc con</span>
                      <input
                        type="text"
                        placeholder="12,23,45"
                        value={row.number || ''}
                        onChange={(e) => {
                          const newRows = [...twoSFilterRows];
                          newRows[index] = { ...newRows[index], number: e.target.value };
                          setTwoSFilterRows(newRows);
                        }}
                        style={{ width: '120px' }}
                      />
                      <span>, số tiền là</span>
                      <input type="number" min="0" placeholder="vd: 50" value={row.subtract || ''} onChange={(e) => {
                        const newRows = [...twoSFilterRows];
                        newRows[index] = { ...newRows[index], subtract: e.target.value };
                        setTwoSFilterRows(newRows);
                      }} style={{ width: '100px' }} />
                      <span>n</span>
                    </div>
                  ))}

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

        case 'deaA':
          const deaTableData = generateDeATableData();
          return (
            <div className="admin-stats-2s-table admin-filter-scope">
              <div className="admin-stats-loto-total">
                <h4>Tổng kết Đề A</h4>
                <div>
                  <span style={{ color: '#1976d2', fontWeight: 600, fontSize: '14px' }}>Tổng tiền đánh: {formatThousand(statisticsData.deaATotal || 0)}</span>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Đề A</th><th>Tiền (n)</th><th>Đề A</th><th>Tiền (n)</th><th>Đề A</th><th>Tiền (n)</th><th>Đề A</th><th>Tiền (n)</th><th>Đề A</th><th>Tiền (n)</th>
                  </tr>
                </thead>
                <tbody>
                  {deaTableData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, colIndex) => (
                        <>
                          <td key={`dea-num-${rowIndex}-${colIndex}`} className={cell.amount > 0 ? 'admin-stats-2s-has-bet' : ''}>
                            <div className="admin-stats-2s-cell">
                              <div className="admin-stats-2s-number">{cell.number}</div>
                            </div>
                          </td>
                          <td key={`dea-amount-${rowIndex}-${colIndex}`} className={cell.amount > 0 ? 'admin-stats-2s-has-bet' : ''}>
                            <div className="admin-stats-2s-cell">
                              {cell.amount > 0 && (
                                <div className="admin-stats-2s-amount">{Math.round(cell.amount)}n</div>
                              )}
                            </div>
                          </td>
                        </>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );

        case 'dauA':
          return (
            <div className="admin-stats-combined-table admin-filter-scope">
              <div className="admin-stats-combined-total">
                <h4>Đề Đầu A</h4>
                <div>
                  <span style={{ color: '#333', fontWeight: 600, fontSize: '14px' }}>Tổng tiền đánh: {formatThousand(statisticsData.dauATotal || 0)}</span>
                </div>
              </div>
              <table>
                <thead>
                  <tr><th>Số đầu</th><th>Tiền (n)</th></tr>
                </thead>
                <tbody>
                  {Object.entries(statisticsData?.dauA || {}).sort(([a], [b]) => a.localeCompare(b)).map(([num, amt]) => (
                    <tr key={`dauA-${num}`}><td>{num}</td><td>{amt}n</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          );

        case 'ditA':
          return (
            <div className="admin-stats-combined-table admin-filter-scope">
              <div className="admin-stats-combined-total">
                <h4>Đề Đít A</h4>
                <div>
                  <span style={{ color: '#333', fontWeight: 600, fontSize: '14px' }}>Tổng tiền đánh: {formatThousand(statisticsData.ditATotal || 0)}</span>
                </div>
              </div>
              <table>
                <thead>
                  <tr><th>Số đít</th><th>Tiền (n)</th></tr>
                </thead>
                <tbody>
                  {Object.entries(statisticsData?.ditA || {}).sort(([a], [b]) => a.localeCompare(b)).map(([num, amt]) => (
                    <tr key={`ditA-${num}`}><td>{num}</td><td>{amt}n</td></tr>
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
                  <span style={{ color: '#333', fontWeight: 600, fontSize: '14px' }}>Tổng tiền đánh: {formatThousand((statisticsData.tongKepDauDitBoTotal || 0))}</span>
                  {(combinedFilterPercent) && (
                    <div style={{ marginTop: '5px' }}>
                      <span style={{ color: '#388e3c', fontWeight: 600, fontSize: '14px' }}>Tổng tiền sau khi lọc: {calculateFilteredCombinedTotal().toLocaleString('vi-VN').replace(/,/g, '.') + 'n'}</span>
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
                  <span style={{ color: '#333', fontWeight: 600, fontSize: '14px' }}>Tổng tiền đánh: {formatThousand(statisticsData['3sTotal'])}</span>
                  {((threeFilterRows && threeFilterRows.some(row => row.number || row.subtract)) || threeFilterPercent || Object.keys(topNThreeSubtracts).length > 0) && (
                    <div style={{ marginTop: '5px' }}>
                      <span style={{ color: '#388e3c', fontWeight: 600, fontSize: '14px' }}>Tổng tiền sau khi lọc: {calculateFiltered3sTotal().toLocaleString('vi-VN').replace(/,/g, '.') + 'n'}</span>
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
                    <span>Số dòng lọc</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="vd: 2"
                      value={threeFilterRowCount}
                      onChange={(e) => {
                        const newCount = parseInt(e.target.value, 10);
                        setThreeFilterRowCount(e.target.value);

                        // Tự động điều chỉnh số dòng lọc dựa trên giá trị nhập vào
                        if (!isNaN(newCount) && newCount > 0) {
                          const currentRows = [...threeFilterRows];
                          if (newCount > currentRows.length) {
                            // Thêm dòng mới nếu số dòng tăng
                            const rowsToAdd = newCount - currentRows.length;
                            const newRows = [...currentRows];
                            for (let i = 0; i < rowsToAdd; i++) {
                              newRows.push({ number: '', subtract: '' });
                            }
                            setThreeFilterRows(newRows);
                          } else if (newCount < currentRows.length) {
                            // Xóa dòng nếu số dòng giảm
                            setThreeFilterRows(currentRows.slice(0, newCount));
                          }
                        }
                      }}
                      style={{ width: '60px' }}
                    />
                  </div>

                  {/* Hiển thị số dòng lọc dựa trên giá trị nhập vào */}
                  {threeFilterRows.map((row, index) => (
                    <div key={index} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <span>Lọc mục</span>
                      <input type="text" placeholder="vd: 123,456,789"
                        value={row.number || ''}
                        onChange={(e) => {
                          const newRows = [...threeFilterRows];
                          newRows[index] = { ...newRows[index], number: e.target.value };
                          setThreeFilterRows(newRows);
                        }}
                        style={{ width: '180px' }} />
                      <span>, số tiền là</span>
                      <input type="number" min="0" placeholder="vd: 50"
                        value={row.subtract || ''}
                        onChange={(e) => {
                          const newRows = [...threeFilterRows];
                          newRows[index] = { ...newRows[index], subtract: e.target.value };
                          setThreeFilterRows(newRows);
                        }}
                        style={{ width: '100px' }} />
                      <span>n</span>
                    </div>
                  ))}

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

        case '4s':
          const betData4s = statisticsData['4s'];
          if (!betData4s || Object.keys(betData4s).length === 0) {
            return (
              <div className="admin-stats-no-data">
                <p>Không có dữ liệu cho 4 số</p>
              </div>
            );
          }

          return (
            <div className="admin-stats-combined-table">
              <div className="admin-stats-combined-total">
                <h4>Tổng kết 4 số</h4>
                <div>
                  <span style={{ color: '#333', fontWeight: 600, fontSize: '14px' }}>Tổng tiền đánh: {formatThousand(statisticsData['4sTotal'])}</span>
                </div>
              </div>
              <div className="admin-stats-bet-list">
                {Object.entries(betData4s).map(([key, value]) => (
                  <div key={key} className="admin-stats-bet-item">
                    <span className="admin-stats-bet-number">{key}</span>
                    <span className="admin-stats-bet-amount">{value}n</span>
                  </div>
                ))}
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
                  <span style={{ color: '#333', fontWeight: 600, fontSize: '14px' }}>Tổng tiền đánh: {formatThousand(calculateXienTotal())}</span>
                  {((xienFilterRows && xienFilterRows.some(row => row.number || row.subtract)) || xienFilterPercent || Object.keys(topNXienSubtracts).length > 0) && (
                    <div style={{ marginTop: '5px' }}>
                      <span style={{ color: '#388e3c', fontWeight: 600, fontSize: '14px' }}>Tổng tiền sau khi lọc: {calculateFilteredXienTotal().toLocaleString('vi-VN').replace(/,/g, '.') + 'n'}</span>
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
                    <span>Số dòng lọc</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="vd: 2"
                      value={xienFilterRowCount}
                      onChange={(e) => {
                        const newCount = parseInt(e.target.value, 10);
                        setXienFilterRowCount(e.target.value);

                        // Tự động điều chỉnh số dòng lọc dựa trên giá trị nhập vào
                        if (!isNaN(newCount) && newCount > 0) {
                          const currentRows = [...xienFilterRows];
                          if (newCount > currentRows.length) {
                            // Thêm dòng mới nếu số dòng tăng
                            const rowsToAdd = newCount - currentRows.length;
                            const newRows = [...currentRows];
                            for (let i = 0; i < rowsToAdd; i++) {
                              newRows.push({ number: '', subtract: '' });
                            }
                            setXienFilterRows(newRows);
                          } else if (newCount < currentRows.length) {
                            // Xóa dòng nếu số dòng giảm
                            setXienFilterRows(currentRows.slice(0, newCount));
                          }
                        }
                      }}
                      style={{ width: '60px' }}
                    />
                  </div>

                  {/* Hiển thị số dòng lọc dựa trên giá trị nhập vào */}
                  {xienFilterRows.map((row, index) => (
                    <div key={index} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <span>Lọc mục</span>
                      <input type="text" placeholder="vd: 12-34,56-78"
                        value={row.number || ''}
                        onChange={(e) => {
                          const newRows = [...xienFilterRows];
                          newRows[index] = { ...newRows[index], number: e.target.value };
                          setXienFilterRows(newRows);
                        }}
                        style={{ width: '180px' }} />
                      <span>, số tiền là</span>
                      <input type="number" min="0" placeholder="vd: 50"
                        value={row.subtract || ''}
                        onChange={(e) => {
                          const newRows = [...xienFilterRows];
                          newRows[index] = { ...newRows[index], subtract: e.target.value };
                          setXienFilterRows(newRows);
                        }}
                        style={{ width: '100px' }} />
                      <span>n</span>
                    </div>
                  ))}

                  <div style={{ marginBottom: '12px' }}>
                    <button
                      onClick={() => {
                        setXienFilterRows([...xienFilterRows, { number: '', subtract: '' }]);
                        setXienFilterRowCount(parseInt(xienFilterRowCount, 10) + 1);
                      }}
                      style={{ padding: '2px 8px' }}
                    >
                      Thêm dòng lọc
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <span>Lọc tất cả</span>
                    <input type="number" min="0" max="100" placeholder="vd: 50" value={xienFilterPercent} onChange={(e) => setXienFilterPercent(e.target.value)} style={{ width: '80px' }} />
                    <span>% số tiền</span>
                  </div>
                </div>
              )}

              <div className="admin-stats-bet-list">
                {Object.entries(betDataXien)
                  .filter(([key]) => !key.includes('(xiên nháy)'))
                  .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                  .map(([key, value]) => {
                    const adjusted = adjustXienAmountForDisplay(key, value);
                    return (
                      <div key={key} className="admin-stats-bet-item" style={{ padding: '8px' }}>
                        <span className="admin-stats-bet-number">
                          {key}
                        </span>
                        <span className="admin-stats-bet-amount" style={{
                          background: 'gray',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '12px',
                          fontWeight: '600',
                          marginTop: '4px'
                        }}>
                          {adjusted}n
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          );

        case 'xiennhay':
          const betDataXienNhay = statisticsData['xien'];
          if (!betDataXienNhay || Object.keys(betDataXienNhay).length === 0) {
            return (
              <div className="admin-stats-no-data">
                <p>Không có dữ liệu cho xiên nháy</p>
              </div>
            );
          }

          return (
            <div className="admin-stats-combined-table admin-filter-scope">
              <div className="admin-stats-combined-total">
                <h4>Tổng kết xiên nháy</h4>
                <div>
                  <span style={{ color: '#333', fontWeight: 600, fontSize: '14px' }}>Tổng tiền cược: {formatThousand(calculateXienNhayBetTotal())}</span>
                  <div style={{ marginTop: '5px' }}>
                    <span style={{ color: '#388e3c', fontWeight: 600, fontSize: '14px' }}>Tổng tiền đánh: {formatThousand(calculateXienNhayTotal())}</span>
                  </div>
                </div>
              </div>

              <div className="admin-stats-bet-list">
                {Object.entries(betDataXienNhay)
                  .filter(([key]) => key.includes('(xiên nháy)'))
                  .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                  .map(([key, value]) => {
                    // Hiển thị tiền cược gốc cho xiên nháy (chia cho 1.2 vì data từ backend đã nhân)
                    const displayAmount = Math.round(value / 1.2);
                    return (
                      <div key={key} className="admin-stats-bet-item" style={{ padding: '8px' }}>
                        <span className="admin-stats-bet-number">
                          {key.replace(' (xiên nháy)', '')}
                          <span style={{ color: 'red' }}> nháy</span>
                        </span>
                        <span className="admin-stats-bet-amount" style={{
                          background: 'gray',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '12px',
                          fontWeight: '600',
                          marginTop: '4px'
                        }}>
                          {displayAmount}n
                        </span>
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
                  <span style={{ color: '#333', fontWeight: 600, fontSize: '14px' }}>Tổng tiền đánh: {formatThousand(statisticsData.xienquayTotal)}</span>
                  <div className="admin-stats-total-item">
                    <span style={{ color: '#333', fontWeight: 600, fontSize: '14px' }} >Tổng tiền cược: {calculateFilteredXienQuayTotalNoMultiplier().toLocaleString('vi-VN').replace(/,/g, '.') + 'n'}</span>
                  </div>
                  {((xienQuayFilterRows && xienQuayFilterRows.some(row => row.number || row.subtract)) || xienQuayFilterPercent || Object.keys(topNXienQuaySubtracts).length > 0) && (
                    <div style={{ marginTop: '5px' }}>
                      <span style={{ color: '#388e3c', fontWeight: 600, fontSize: '14px' }}>Tổng tiền sau khi lọc: {calculateFilteredXienQuayTotal().toLocaleString('vi-VN').replace(/,/g, '.') + 'n'}</span>
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
                    <span>Số dòng lọc</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="vd: 2"
                      value={xienQuayFilterRowCount}
                      onChange={(e) => {
                        const newCount = parseInt(e.target.value, 10);
                        setXienQuayFilterRowCount(e.target.value);

                        // Tự động điều chỉnh số dòng lọc dựa trên giá trị nhập vào
                        if (!isNaN(newCount) && newCount > 0) {
                          const currentRows = [...xienQuayFilterRows];
                          if (newCount > currentRows.length) {
                            // Thêm dòng mới nếu số dòng tăng
                            const rowsToAdd = newCount - currentRows.length;
                            const newRows = [...currentRows];
                            for (let i = 0; i < rowsToAdd; i++) {
                              newRows.push({ number: '', subtract: '' });
                            }
                            setXienQuayFilterRows(newRows);
                          } else if (newCount < currentRows.length) {
                            // Xóa dòng nếu số dòng giảm
                            setXienQuayFilterRows(currentRows.slice(0, newCount));
                          }
                        }
                      }}
                      style={{ width: '60px' }}
                    />
                  </div>

                  {/* Hiển thị số dòng lọc dựa trên giá trị nhập vào */}
                  {xienQuayFilterRows.map((row, index) => (
                    <div key={index} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <span>Lọc mục</span>
                      <input type="text" placeholder="vd: 12-34-56,23-45-67"
                        value={row.number || ''}
                        onChange={(e) => {
                          const newRows = [...xienQuayFilterRows];
                          newRows[index] = { ...newRows[index], number: e.target.value };
                          setXienQuayFilterRows(newRows);
                        }}
                        style={{ width: '200px' }} />
                      <span>, số tiền là</span>
                      <input type="number" min="0" placeholder="vd: 50"
                        value={row.subtract || ''}
                        onChange={(e) => {
                          const newRows = [...xienQuayFilterRows];
                          newRows[index] = { ...newRows[index], subtract: e.target.value };
                          setXienQuayFilterRows(newRows);
                        }}
                        style={{ width: '100px' }} />
                      <span>n</span>
                    </div>
                  ))}

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
