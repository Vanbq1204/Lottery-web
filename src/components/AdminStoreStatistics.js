import { getApiUrl } from '../config/api';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminStoreStatistics.css';
import AdminStoreDetailPrizeStats from './AdminStoreDetailPrizeStats';

const AdminStoreStatistics = ({ store, user }) => {
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

  // Scroll position preservation
  const scrollPositionRef = React.useRef(0);

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

  // UI và logic bộ lọc cho Xiên nháy
  const [showXienNhayFilter, setShowXienNhayFilter] = useState(false);
  const [xienNhayFilterRows, setXienNhayFilterRows] = useState([{ number: '', subtract: '' }]); // Mảng các dòng lọc
  const [xienNhayFilterPercent, setXienNhayFilterPercent] = useState('');
  const [xienNhayFilterRowCount, setXienNhayFilterRowCount] = useState('1'); // Số dòng lọc mặc định là 1
  const [topNXienNhayCount, setTopNXienNhayCount] = useState('');
  const [topNXienNhaySelection, setTopNXienNhaySelection] = useState([]);
  const [topNXienNhaySubtracts, setTopNXienNhaySubtracts] = useState({});
  const [pinXienNhayFilter, setPinXienNhayFilter] = useState(false);

  // localStorage keys độc lập cho AdminStoreStatistics (khác với AdminTotalStatistics)
  const getStoreLotoFilterStorageKey = () => `storeLotoFilter:${store?._id}:${selectedDate}`;
  const getStoreTwoSFilterStorageKey = () => `storeTwoSFilter:${store?._id}:${selectedDate}`;
  const getStoreThreeFilterStorageKey = () => `storeThreeFilter:${store?._id}:${selectedDate}`;
  const getStoreXienFilterStorageKey = () => `storeXienFilter:${store?._id}:${selectedDate}`;
  const getStoreXienQuayFilterStorageKey = () => `storeXienQuayFilter:${store?._id}:${selectedDate}`;
  const getStoreXienNhayFilterStorageKey = () => `storeXienNhayFilter:${store?._id}:${selectedDate}`;
  const getStoreCombinedFilterStorageKey = () => `storeCombinedFilter:${store?._id}:${selectedDate}`;

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

  const resetXienNhayFilters = () => {
    setShowXienNhayFilter(false);
    setXienNhayFilterRows([{ number: '', subtract: '' }]);
    setXienNhayFilterPercent('');
    setXienNhayFilterRowCount('1'); // Reset số dòng lọc về 1
    setTopNXienNhayCount('');
    setTopNXienNhaySelection([]);
    setTopNXienNhaySubtracts({});
  };

  const resetCombinedFilters = () => {
    setShowCombinedFilter(false);
    setCombinedFilterPercent('');
    setPinCombinedFilter(false);
  };

  const clearPersistedLotoFilters = () => { try { localStorage.removeItem(getStoreLotoFilterStorageKey()); } catch (e) { } };
  const clearPersistedTwoSFilters = () => { try { localStorage.removeItem(getStoreTwoSFilterStorageKey()); } catch (e) { } };
  const clearPersistedThreeFilters = () => { try { localStorage.removeItem(getStoreThreeFilterStorageKey()); } catch (e) { } };
  const clearPersistedXienFilters = () => { try { localStorage.removeItem(getStoreXienFilterStorageKey()); } catch (e) { } };
  const clearPersistedXienQuayFilters = () => { try { localStorage.removeItem(getStoreXienQuayFilterStorageKey()); } catch (e) { } };
  const clearPersistedXienNhayFilters = () => { try { localStorage.removeItem(getStoreXienNhayFilterStorageKey()); } catch (e) { } };
  const clearPersistedCombinedFilters = () => { try { localStorage.removeItem(getStoreCombinedFilterStorageKey()); } catch (e) { } };

  const handleRefreshLoto = async () => { clearPersistedLotoFilters(); resetLotoFilters(); await loadStatistics(); };
  const handleRefreshTwoS = async () => { clearPersistedTwoSFilters(); resetTwoSFilters(); await loadStatistics(); };
  const handleRefreshThree = async () => { clearPersistedThreeFilters(); resetThreeFilters(); await loadStatistics(); };
  const handleRefreshXien = async () => { clearPersistedXienFilters(); resetXienFilters(); await loadStatistics(); };
  const handleRefreshXienQuay = async () => { clearPersistedXienQuayFilters(); resetXienQuayFilters(); await loadStatistics(); };
  const handleRefreshXienNhay = async () => { clearPersistedXienNhayFilters(); resetXienNhayFilters(); await loadStatistics(); };
  const handleRefreshCombined = async () => { clearPersistedCombinedFilters(); resetCombinedFilters(); await loadStatistics(); };

  // Save filters to localStorage
  const saveLotoFiltersToStorage = () => {
    if (!pinLotoFilter) return;
    try {
      const payload = { showLotoFilter, lotoFilterRows, lotoFilterRowCount, lotoFilterPercent, topNCount, topNSubtracts, pinLotoFilter: true };
      localStorage.setItem(getStoreLotoFilterStorageKey(), JSON.stringify(payload));
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
      localStorage.setItem(getStoreTwoSFilterStorageKey(), JSON.stringify(payload));
    } catch (e) { }
  };

  const saveThreeFiltersToStorage = () => {
    if (!pinThreeFilter) return;
    try {
      const payload = { showThreeFilter, threeFilterRows, threeFilterRowCount, threeFilterPercent, topNThreeCount, topNThreeSubtracts, pinThreeFilter: true };
      localStorage.setItem(getStoreThreeFilterStorageKey(), JSON.stringify(payload));
    } catch (e) { }
  };

  const saveXienFiltersToStorage = () => {
    if (!pinXienFilter) return;
    try {
      const payload = { showXienFilter, xienFilterRows, xienFilterRowCount, xienFilterPercent, topNXienCount, topNXienSubtracts, pinXienFilter: true };
      localStorage.setItem(getStoreXienFilterStorageKey(), JSON.stringify(payload));
    } catch (e) { }
  };

  const saveXienQuayFiltersToStorage = () => {
    if (!pinXienQuayFilter) {
      // Nếu không ghim, xóa dữ liệu lưu trữ
      try {
        localStorage.removeItem(getStoreXienQuayFilterStorageKey());
      } catch (e) { }
      return;
    }
    try {
      const payload = { showXienQuayFilter, xienQuayFilterRows, xienQuayFilterRowCount, xienQuayFilterPercent, topNXienQuayCount, topNXienQuaySubtracts, pinXienQuayFilter: true };
      localStorage.setItem(getStoreXienQuayFilterStorageKey(), JSON.stringify(payload));
    } catch (e) { }
  };

  const saveXienNhayFiltersToStorage = () => {
    if (!pinXienNhayFilter) return;
    try {
      const payload = { showXienNhayFilter, xienNhayFilterRows, xienNhayFilterRowCount, xienNhayFilterPercent, topNXienNhayCount, topNXienNhaySubtracts, pinXienNhayFilter: true };
      localStorage.setItem(getStoreXienNhayFilterStorageKey(), JSON.stringify(payload));
    } catch (e) { }
  };

  const saveCombinedFiltersToStorage = () => {
    if (!pinCombinedFilter) return;
    try {
      const payload = { showCombinedFilter, combinedFilterPercent, pinCombinedFilter: true };
      localStorage.setItem(getStoreCombinedFilterStorageKey(), JSON.stringify(payload));
    } catch (e) { }
  };

  // Load filters from localStorage
  const loadLotoFiltersFromStorage = () => {
    try {
      const raw = localStorage.getItem(getStoreLotoFilterStorageKey());
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      setShowLotoFilter(!!data.showLotoFilter);

      if (data.lotoFilterRows) {
        setLotoFilterRows(data.lotoFilterRows);
      } else if (data.lotoFilterNumber !== undefined && data.lotoFilterSubtract !== undefined) {
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
      const raw = localStorage.getItem(getStoreTwoSFilterStorageKey());
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      setShowTwoSFilter(!!data.showTwoSFilter);

      if (data.twoSFilterRows) {
        setTwoSFilterRows(data.twoSFilterRows);
      } else if (data.twoSFilterNumber !== undefined || data.twoSFilterSubtract !== undefined) {
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
      const raw = localStorage.getItem(getStoreThreeFilterStorageKey());
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      setShowThreeFilter(!!data.showThreeFilter);

      if (data.threeFilterRows) {
        setThreeFilterRows(data.threeFilterRows);
      } else if (data.threeFilterNumber !== undefined || data.threeFilterSubtract !== undefined) {
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
      const raw = localStorage.getItem(getStoreXienFilterStorageKey());
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      setShowXienFilter(!!data.showXienFilter);

      if (data.xienFilterRows) {
        setXienFilterRows(data.xienFilterRows);
      } else if (data.xienFilterNumber !== undefined || data.xienFilterSubtract !== undefined) {
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
      const raw = localStorage.getItem(getStoreXienQuayFilterStorageKey());
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      setShowXienQuayFilter(!!data.showXienQuayFilter);

      if (data.xienQuayFilterRows) {
        setXienQuayFilterRows(data.xienQuayFilterRows);
      } else if (data.xienQuayFilterNumber !== undefined || data.xienQuayFilterSubtract !== undefined) {
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

  const loadXienNhayFiltersFromStorage = () => {
    try {
      const raw = localStorage.getItem(getStoreXienNhayFilterStorageKey());
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      setShowXienNhayFilter(!!data.showXienNhayFilter);

      if (data.xienNhayFilterRows) {
        setXienNhayFilterRows(data.xienNhayFilterRows);
      } else if (data.xienNhayFilterNumber !== undefined || data.xienNhayFilterSubtract !== undefined) {
        setXienNhayFilterRows([{ number: data.xienNhayFilterNumber ?? '', subtract: data.xienNhayFilterSubtract ?? '' }]);
      } else {
        setXienNhayFilterRows([{ number: '', subtract: '' }]);
      }

      setXienNhayFilterRowCount(data.xienNhayFilterRowCount ?? '1');
      setXienNhayFilterPercent(data.xienNhayFilterPercent ?? '');
      setTopNXienNhayCount(data.topNXienNhayCount ?? '');
      setTopNXienNhaySubtracts(data.topNXienNhaySubtracts ?? {});
      setPinXienNhayFilter(!!data.pinXienNhayFilter);
    } catch (e) { }
  };

  const loadCombinedFiltersFromStorage = () => {
    try {
      const raw = localStorage.getItem(getStoreCombinedFilterStorageKey());
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      setShowCombinedFilter(!!data.showCombinedFilter);
      setCombinedFilterPercent(data.combinedFilterPercent ?? '');
      setPinCombinedFilter(!!data.pinCombinedFilter);
    } catch (e) { }
  };

  // Adjust amount functions for display
  const adjustLotoAmountForDisplay = (numberStr, rawAmount) => {
    let adjusted = rawAmount || 0;

    // Trừ theo danh sách Top N (lô tô)
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
          const filterNumbers = numFilter.split(',').map(num => num.trim().padStart(2, '0'));
          if (filterNumbers.includes(numberStr)) {
            adjusted = Math.max(0, adjusted - subtractVal);
          }
        }
      });
    }

    // Trừ theo hệ số coefficient factor
    const coefficientFactor = parseFloat(twoSCoefficientFactor);
    if (!isNaN(coefficientFactor) && coefficientFactor > 0) {
      adjusted = Math.max(0, adjusted - coefficientFactor);
    }

    // Trừ theo danh sách min subtracts
    if (Array.isArray(twoSMinSubtracts) && twoSMinSubtracts.length > 0) {
      const minSubtract = Math.min(...twoSMinSubtracts.map(val => parseFloat(val) || 0));
      if (minSubtract > 0) {
        adjusted = Math.max(0, adjusted - minSubtract);
      }
    }

    const percentVal = parseInt(twoSFilterPercent, 10);
    if (!isNaN(percentVal) && percentVal > 0) {
      const clamped = Math.min(100, Math.max(0, percentVal));
      adjusted = adjusted * (100 - clamped) / 100;
    }

    return adjusted;
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

  // Hàm lọc cho tổng kép đầu đít bộ (chỉ lọc %)
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

  const adjustXienAmountForDisplay = (keyStr, rawAmount) => {
    // Không áp dụng lọc cho xiên nháy để tránh tràn sang tab khác
    if (keyStr.includes('(xiên nháy)')) {
      return 0; // Trả về 0 để không hiển thị xiên nháy trong tab xiên
    }

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

    // Trừ theo danh sách Top N (xiên quay)
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

    // Trừ theo % toàn bảng
    const percentVal = parseInt(xienQuayFilterPercent, 10);
    if (!isNaN(percentVal) && percentVal > 0) {
      const clamped = Math.min(100, Math.max(0, percentVal));
      adjusted = adjusted * (100 - clamped) / 100;
    }

    return adjusted;
  };

  const adjustXienNhayAmountForDisplay = (keyStr, rawAmount) => {
    // Chỉ áp dụng lọc cho xiên nháy
    if (!keyStr.includes('(xiên nháy)')) {
      return rawAmount || 0;
    }

    let adjusted = rawAmount || 0;

    const perKeySubtract = parseInt(topNXienNhaySubtracts[keyStr] ?? '', 10);
    if (!isNaN(perKeySubtract) && perKeySubtract > 0) {
      adjusted = Math.max(0, adjusted - perKeySubtract);
    }

    // Trừ theo một hoặc nhiều con cụ thể từ các dòng lọc
    if (Array.isArray(xienNhayFilterRows)) {
      xienNhayFilterRows.forEach(row => {
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

    const percentVal = parseInt(xienNhayFilterPercent, 10);
    if (!isNaN(percentVal) && percentVal > 0) {
      const clamped = Math.min(100, Math.max(0, percentVal));
      adjusted = adjusted * (100 - clamped) / 100;
    }

    return adjusted;
  };

  // Load statistics data
  const loadStatistics = async (date = selectedDate) => {
    setIsLoading(true);
    try {
      const response = await axios.get(getApiUrl('/admin/store-statistics'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          storeId: store._id,
          date: date
        }
      });

      if (response.data.success) {
        setStatisticsData(response.data.stats);
      }
    } catch (error) {
      console.error('Lỗi khi tải thống kê:', error);
      alert('Không thể tải dữ liệu thống kê');
    } finally {
      setIsLoading(false);
    }
  };

  // Socket.io listener for real-time updates
  useEffect(() => {
    const { io } = require('socket.io-client');
    const baseUrl = getApiUrl('').replace('/api', '');
    const socket = io(baseUrl);

    if (user) {
      socket.emit('join_admin', user.id);

      socket.on('new_invoice', (data) => {
        console.log('[AdminStoreStatistics] 📨 New invoice event received:', data);

        // Only reload if we are on betting tab AND the invoice belongs to this store
        console.log('[AdminStoreStatistics] Tab check - Current:', activeTab, 'Is betting:', activeTab === 'betting');

        if (activeTab === 'betting') {
          console.log('[AdminStoreStatistics] ✅ Tab condition passed');

          // Compare storeId (both converted to string for safety)
          const invoiceStoreId = String(data.invoice?.storeId || '');
          const currentStoreId = String(store._id || '');

          console.log('[AdminStoreStatistics] Store comparison:', {
            invoiceStoreId,
            currentStoreId,
            match: invoiceStoreId === currentStoreId,
            types: {
              invoice: typeof data.invoice?.storeId,
              store: typeof store._id
            }
          });

          if (invoiceStoreId && invoiceStoreId === currentStoreId) {
            console.log('[AdminStoreStatistics] ✅✅✅ STORE MATCH! Calling loadStatistics...');
            // Save container scroll position
            const container = document.querySelector('.admin-content-section');
            scrollPositionRef.current = container ? container.scrollTop : 0;
            console.log('[AdminStoreStatistics] 💾 Saved scroll:', scrollPositionRef.current);

            loadStatistics(selectedDate).then(() => {
              requestAnimationFrame(() => {
                if (container) {
                  container.scrollTop = scrollPositionRef.current;
                  console.log('[AdminStoreStatistics] 📌 Scroll restored');
                }
              });
            }).catch(() => { });
          } else {
            console.log('[AdminStoreStatistics] ❌ Store mismatch - not reloading');
          }
        } else {
          console.log('[AdminStoreStatistics] ❌ Tab condition failed - not reloading');
        }
      });

      socket.on('edit_invoice', (data) => {
        console.log('[AdminStoreStatistics] ✏️ Edit invoice event received:', data);
        if (activeTab === 'betting') {
          const invoiceStoreId = String(data.invoice?.storeId || '');
          const currentStoreId = String(store._id || '');
          if (invoiceStoreId === currentStoreId) {
            console.log('[AdminStoreStatistics] Reloading after edit...');
            const container = document.querySelector('.admin-content-section');
            scrollPositionRef.current = container ? container.scrollTop : 0;

            loadStatistics(selectedDate).then(() => {
              requestAnimationFrame(() => {
                if (container) container.scrollTop = scrollPositionRef.current;
              });
            }).catch(() => { });
          }
        }
      });

      socket.on('delete_invoice', (data) => {
        console.log('[AdminStoreStatistics] 🗑️ Delete invoice event received:', data);
        if (activeTab === 'betting') {
          const invoiceStoreId = String(data.data?.storeId || '');
          const currentStoreId = String(store._id || '');
          if (invoiceStoreId === currentStoreId) {
            console.log('[AdminStoreStatistics] Reloading after delete...');
            const container = document.querySelector('.admin-content-section');
            scrollPositionRef.current = container ? container.scrollTop : 0;

            loadStatistics(selectedDate).then(() => {
              requestAnimationFrame(() => {
                if (container) container.scrollTop = scrollPositionRef.current;
              });
            }).catch(() => { });
          }
        }
      });
    }

    return () => {
      socket.disconnect();
    };
  }, [user, store._id, selectedDate, activeTab]);

  // Load data when component mounts or date changes
  useEffect(() => {
    if (activeTab === 'betting') {
      loadStatistics();
    }
  }, [selectedDate, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load filters from localStorage when component mounts or dependencies change
  useEffect(() => {
    if (store?._id && selectedDate) {
      loadLotoFiltersFromStorage();
      loadTwoSFiltersFromStorage();
      loadThreeFiltersFromStorage();
      loadXienFiltersFromStorage();
      loadXienQuayFiltersFromStorage();
      loadCombinedFiltersFromStorage();
      loadXienNhayFiltersFromStorage();
    }
  }, [store?._id, selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save filters to localStorage when they change
  useEffect(() => {
    saveLotoFiltersToStorage();
  }, [lotoFilterRows, lotoFilterPercent, topNSubtracts, pinLotoFilter, topNCount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    saveTwoSFiltersToStorage();
  }, [twoSFilterRows, twoSFilterPercent, topNTwoSSubtracts, twoSMinSubtracts, twoSCoefficientFactor, pinTwoSFilter, topNTwoSCount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    saveThreeFiltersToStorage();
  }, [threeFilterRows, threeFilterPercent, topNThreeSubtracts, pinThreeFilter, topNThreeCount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    saveXienFiltersToStorage();
  }, [xienFilterRows, xienFilterPercent, topNXienSubtracts, pinXienFilter, topNXienCount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    saveXienQuayFiltersToStorage();
  }, [xienQuayFilterRows, xienQuayFilterPercent, topNXienQuaySubtracts, pinXienQuayFilter, topNXienQuayCount, showXienQuayFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    saveCombinedFiltersToStorage();
  }, [combinedFilterPercent, pinCombinedFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    saveXienNhayFiltersToStorage();
  }, [xienNhayFilterRows, xienNhayFilterPercent, topNXienNhaySubtracts, pinXienNhayFilter, topNXienNhayCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-apply top N filters when data is loaded and topN count is set
  useEffect(() => { buildTopNSelection(); /* eslint-disable-line */ }, [statisticsData, topNCount]);
  useEffect(() => { buildTopNTwoSSelection(); /* eslint-disable-line */ }, [statisticsData, topNTwoSCount]);
  useEffect(() => { buildTopNThreeSelection(); /* eslint-disable-line */ }, [statisticsData, topNThreeCount]);
  useEffect(() => { buildTopNXienSelection(); /* eslint-disable-line */ }, [statisticsData, topNXienCount]);
  useEffect(() => { buildTopNXienQuaySelection(); /* eslint-disable-line */ }, [statisticsData, topNXienQuayCount]);
  useEffect(() => { buildTopNXienNhaySelection(); /* eslint-disable-line */ }, [statisticsData, topNXienNhayCount]);

  // Auto-apply top N filters when data is loaded (even if topN count doesn't change)
  useEffect(() => {
    if (statisticsData && topNXienNhayCount) {
      buildTopNXienNhaySelection();
    }
  }, [statisticsData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-apply top N filters for xiên quay when data is loaded (even if topN count doesn't change)
  useEffect(() => {
    if (statisticsData && topNXienQuayCount) {
      buildTopNXienQuaySelection();
    }
  }, [statisticsData]); // eslint-disable-line react-hooks/exhaustive-deps

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
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Format tiền tệ
  const formatMoney = (amount) => {
    if (!amount || amount === 0) return '0 đ';
    return Math.floor(amount).toLocaleString('vi-VN').replace(/,/g, '.') + ' đ';
  };

  // Format nghìn đồng
  const formatThousand = (amount) => {
    if (!amount || amount === 0) return '0n';
    return Math.floor(amount).toLocaleString('vi-VN').replace(/,/g, '.') + 'n';
  };

  // Tính tổng tiền cược xiên nháy (tiền gốc)
  const calculateXienNhayBetTotal = () => {
    let total = 0;
    Object.entries(statisticsData.xien || {}).forEach(([key, amount]) => {
      if (key.includes('(xiên nháy)')) {
        total += amount;
      }
    });
    return total;
  };

  // Tính tổng tiền đánh xiên nháy (nhân với 1.2)
  const calculateXienNhayTotal = () => {
    return Math.round(calculateXienNhayBetTotal() * 1.2);
  };

  // Tính tổng tiền xiên thường (loại bỏ xiên nháy)
  const calculateXienTotal = () => {
    let total = 0;
    Object.entries(statisticsData.xien || {}).forEach(([key, amount]) => {
      if (!key.includes('(xiên nháy)')) {
        total += amount;
      }
    });
    return total;
  };

  // Build top N selection functions
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
      .filter(([key]) => !key.includes('(xiên nháy)')) // Lọc bỏ xiên nháy
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

    // Lọc và sắp xếp các mục xiên quay theo số tiền giảm dần
    // Tính toán số lượng số trong mỗi xiên quay để áp dụng hệ số
    const entries = Object.entries(statisticsData.xienquay)
      .map(([key, amount]) => {
        // Tính hệ số dựa trên số lượng số trong xiên quay
        const numberCount = key.split('-').length;
        let multiplier = 1;
        if (numberCount === 3) multiplier = 4;
        else if (numberCount === 4) multiplier = 11;

        // Tính toán số tiền thực tế sau khi nhân hệ số
        const adjustedAmount = amount * multiplier;

        return { key, amount, adjustedAmount, multiplier };
      })
      .sort((a, b) => b.adjustedAmount - a.adjustedAmount) // Sắp xếp theo số tiền đã nhân hệ số
      .filter(item => item.amount > 0)
      .slice(0, n);

    // Khởi tạo giá trị mặc định cho topNXienQuaySubtracts nếu chưa có
    const newSubtracts = { ...topNXienQuaySubtracts };
    entries.forEach(item => {
      if (newSubtracts[item.key] === undefined) {
        newSubtracts[item.key] = '';
      }
    });

    setTopNXienQuaySelection(entries);
    setTopNXienQuaySubtracts(newSubtracts);
  };

  const buildTopNXienNhaySelection = () => {
    const n = parseInt(topNXienNhayCount, 10);
    if (isNaN(n) || n <= 0 || !statisticsData?.xien) {
      setTopNXienNhaySelection([]);
      return;
    }
    const entries = Object.entries(statisticsData.xien)
      .filter(([key]) => key.includes('(xiên nháy)')) // Lọc chỉ lấy xiên nháy
      .map(([key, amount]) => ({ key, amount: amount || 0 }))
      .sort((a, b) => b.amount - a.amount)
      .filter(item => item.amount > 0)
      .slice(0, n);
    setTopNXienNhaySelection(entries);
  };

  // Generate loto statistics table data
  const generateLotoTableData = () => {
    const lotoData = statisticsData?.loto || {};
    const tableData = [];

    // Create 5 columns x 20 rows
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

    // Create 5 columns x 20 rows for 2s (00-99)
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
    // Calculate total for this group (áp dụng lọc cho tổng kép đầu đít bộ)
    const groupTotal = betTypes.reduce((sum, betType) => {
      const totalField = `${betType}Total`;
      const rawTotal = statisticsData[totalField] || 0;
      // Áp dụng lọc nếu là tổng kép đầu đít bộ
      const isCombinedGroup = betTypes.includes('tong') && betTypes.includes('kep') && betTypes.includes('dau') && betTypes.includes('dit') && betTypes.includes('bo');
      return sum + (isCombinedGroup ? adjustCombinedAmountForDisplay(rawTotal) : rawTotal);
    }, 0);

    // Get bet type names
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

    // Collect all data for the table
    const tableData = [];
    const isCombinedGroup = betTypes.includes('tong') && betTypes.includes('kep') && betTypes.includes('dau') && betTypes.includes('dit') && betTypes.includes('bo');

    betTypes.forEach(betType => {
      const betData = statisticsData[betType] || {};
      Object.entries(betData).forEach(([number, amount]) => {
        // Áp dụng lọc cho tổng kép đầu đít bộ
        const adjustedAmount = isCombinedGroup ? adjustCombinedAmountForDisplay(amount) : amount;
        tableData.push({
          betType: betTypeNames[betType],
          number,
          amount: adjustedAmount,
          rowClass: `admin-stats-row-${betType}`
        });
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
        <div className="admin-stats-combined-total">
          <h4>{title}</h4>
          <div>
            <span style={{ color: '#333', fontWeight: 600, fontSize: '14px' }}>Tổng tiền đánh: {formatThousand(groupTotal)}</span>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Loại cược</th>
              <th>Số</th>
              <th>Tiền đánh(n)</th>
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
          </tbody>
        </table>
      </div>
    );
  };

  // Render summary section
  const renderSummary = () => {
    if (!statisticsData) return null;

    return (
      <div className="admin-stats-summary">
        {/* Tổng doanh thu nổi bật */}
        <div className="admin-stats-total-revenue">
          <h3>Tổng doanh thu</h3>
          <span className="admin-stats-value">{formatMoney(statisticsData.totalRevenue)}</span>
        </div>

        {/* Chi tiết từng loại cược */}
        <div className="admin-stats-summary-grid">
          <div className="admin-stats-card">
            <h4>Lô tô</h4>
            <span className="admin-stats-value">{formatThousand(statisticsData.lotoTotal)}</span>
          </div>
          <div className="admin-stats-card">
            <h4>2 số</h4>
            <span className="admin-stats-value">{formatThousand(statisticsData['2sTotal'])}</span>
          </div>
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

          // Calculate filtered loto total
          const calculateFilteredLotoTotal = () => {
            let total = 0;
            Object.entries(statisticsData.loto || {}).forEach(([number, points]) => {
              const adjustedPoints = adjustLotoAmountForDisplay(number, points);
              total += adjustedPoints;
            });
            return total;
          };



          return (
            <div className="admin-stats-loto-table admin-filter-scope">
              <div className="admin-stats-loto-total">
                <h4>Tổng kết lô tô</h4>
                <div>
                  <span style={{ color: '#1976d2', fontWeight: 600, fontSize: '14px' }}>Tổng tiền đánh: {formatThousand(statisticsData.lotoTotal)}</span>
                  <br />
                  <span className="admin-stats-loto-total-value">Tổng điểm: {lotoTotalPoints}đ</span>
                  {((lotoFilterRows && lotoFilterRows.some(row => row.number || row.subtract)) || lotoFilterPercent || Object.keys(topNSubtracts).length > 0) && (
                    <div style={{ marginTop: '5px' }}>
                      <span style={{ color: '#388e3c', fontWeight: 600, fontSize: '14px' }}>Tổng điểm sau khi lọc: {calculateFilteredLotoTotal().toLocaleString('vi-VN').replace(/,/g, '.') + 'đ'}</span>
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
                    <input type="number" min="1" placeholder="vd: 5" value={topNCount} onChange={(e) => {
                      setTopNCount(e.target.value);
                      // Tự động áp dụng logic khi người dùng nhập số
                      setTimeout(() => {
                        const lotoData = statisticsData.loto || {};
                        const sortedEntries = Object.entries(lotoData)
                          .map(([number, points]) => ({ number, points }))
                          .sort((a, b) => b.points - a.points);

                        const n = parseInt(e.target.value, 10);
                        if (isNaN(n) || n <= 0) {
                          setTopNSelection([]);
                          return;
                        }

                        const selected = sortedEntries.slice(0, n);
                        setTopNSelection(selected);
                      }, 100);
                    }} style={{ width: '80px' }} />
                    <span>con có số điểm cao nhất của bảng</span>
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
                        const adjustedPoints = adjustLotoAmountForDisplay(cell.number, cell.points);
                        const hasFilter = ((lotoFilterRows && lotoFilterRows.some(row => row.number || row.subtract)) || lotoFilterPercent || Object.keys(topNSubtracts).length > 0);

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
                                  <div className="admin-stats-points">
                                    {Math.round(adjustedPoints)}đ
                                  </div>
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
          const twoSTotalAmount = Object.values(statisticsData['2s'] || {}).reduce((sum, amount) => sum + amount, 0);

          // Calculate filtered 2s total
          const calculateFiltered2sTotal = () => {
            let total = 0;
            Object.entries(statisticsData['2s'] || {}).forEach(([number, amount]) => {
              const adjustedAmount = adjustTwoSAmountForDisplay(number, amount);
              total += adjustedAmount;
            });
            return total;
          };



          return (
            <div className="admin-stats-2s-table admin-filter-scope">
              <div className="admin-stats-loto-total">
                <h4>Tổng kết 2 số</h4>
                <div>
                  <span style={{ color: '#1976d2', fontWeight: 600, fontSize: '14px' }}>Tổng tiền đánh: {formatThousand(statisticsData['2sTotal'])}</span>
                  <br />
                  {((twoSFilterRows && twoSFilterRows.some(row => row.number || row.subtract)) || twoSFilterPercent || Object.keys(topNTwoSSubtracts).length > 0 || twoSMinSubtracts.length > 0 || twoSCoefficientFactor) && (
                    <div style={{ marginTop: '5px' }}>
                      <span style={{ color: '#388e3c', fontWeight: 600, fontSize: '14px' }}>Tổng tiền sau khi lọc: {calculateFiltered2sTotal().toLocaleString('vi-VN').replace(/,/g, '.') + 'n'}</span>
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
                    <input type="number" min="1" placeholder="vd: 5" value={topNTwoSCount} onChange={(e) => {
                      setTopNTwoSCount(e.target.value);
                      // Tự động áp dụng logic khi người dùng nhập số
                      setTimeout(() => {
                        const twoSData = statisticsData['2s'] || {};
                        const sortedEntries = Object.entries(twoSData)
                          .map(([number, amount]) => ({ number, amount }))
                          .sort((a, b) => b.amount - a.amount);

                        const n = parseInt(e.target.value, 10);
                        if (isNaN(n) || n <= 0) {
                          setTopNTwoSSelection([]);
                          return;
                        }

                        const selected = sortedEntries.slice(0, n);
                        setTopNTwoSSelection(selected);
                      }, 100);
                    }} style={{ width: '80px' }} />
                    <span>con có số tiền cao nhất của bảng</span>
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
                          <span>nghìn</span>
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
                      value={twoSFilterRowCount}
                      onChange={(e) => {
                        const newCount = parseInt(e.target.value, 10) || 1;
                        setTwoSFilterRowCount(e.target.value);

                        // Cập nhật mảng dòng lọc khi thay đổi số dòng
                        const currentRows = [...twoSFilterRows];
                        if (newCount > currentRows.length) {
                          // Thêm dòng mới nếu tăng số dòng
                          const newRows = [...currentRows];
                          for (let i = currentRows.length; i < newCount; i++) {
                            newRows.push({ number: '', subtract: '' });
                          }
                          setTwoSFilterRows(newRows);
                        } else if (newCount < currentRows.length) {
                          // Bớt dòng nếu giảm số dòng
                          setTwoSFilterRows(currentRows.slice(0, newCount));
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
                        value={row.number}
                        onChange={(e) => {
                          const newRows = [...twoSFilterRows];
                          newRows[index].number = e.target.value;
                          setTwoSFilterRows(newRows);
                        }}
                        style={{ width: '120px' }}
                      />
                      <span>, số tiền là</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="vd: 50"
                        value={row.subtract}
                        onChange={(e) => {
                          const newRows = [...twoSFilterRows];
                          newRows[index].subtract = e.target.value;
                          setTwoSFilterRows(newRows);
                        }}
                        style={{ width: '100px' }}
                      />
                      <span>nghìn</span>
                    </div>
                  ))}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span>Hệ số trừ chung</span>
                    <input type="number" min="0" placeholder="vd: 10" value={twoSCoefficientFactor} onChange={(e) => setTwoSCoefficientFactor(e.target.value)} style={{ width: '80px' }} />
                    <span>nghìn</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span>Trừ theo số tiền thấp nhất (00-99)</span>
                    <input
                      type="text"
                      placeholder="vd: 5,10,15"
                      value={twoSMinSubtracts.join(',')}
                      onChange={(e) => {
                        const values = e.target.value.split(',').map(v => v.trim()).filter(v => v !== '');
                        setTwoSMinSubtracts(values);
                      }}
                      style={{ width: '120px' }}
                    />
                    <span>nghìn</span>
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
                        const hasFilter = ((twoSFilterRows && twoSFilterRows.some(row => row.number || row.subtract)) || twoSFilterPercent || Object.keys(topNTwoSSubtracts).length > 0 || twoSMinSubtracts.length > 0 || twoSCoefficientFactor);

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
                                  <div className="admin-stats-2s-amount">
                                    {Math.round(adjustedAmount)}n
                                  </div>
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
          // Tính tổng sau khi lọc cho tổng kép đầu đít bộ
          const calculateFilteredCombinedTotal = () => {
            const betTypes = ['tong', 'kep', 'dau', 'dit', 'bo'];
            return betTypes.reduce((sum, betType) => {
              const totalField = `${betType}Total`;
              const rawTotal = statisticsData[totalField] || 0;
              return sum + adjustCombinedAmountForDisplay(rawTotal);
            }, 0);
          };

          return (
            <div className="admin-stats-combined-table admin-filter-scope">
              <div className="admin-stats-combined-total">
                <h4>Tổng kết: Tổng, Kép, Đầu, Đít, Bộ</h4>
                <div>
                  <span style={{ color: '#333', fontWeight: 600, fontSize: '14px' }}>Tổng tiền đánh: {formatThousand(['tong', 'kep', 'dau', 'dit', 'bo'].reduce((sum, betType) => sum + (statisticsData[`${betType}Total`] || 0), 0))}</span>
                  {combinedFilterPercent && (
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
                {(combinedFilterPercent) && (
                  <span style={{ color: '#2e7d32', fontWeight: '600' }}>Đang áp dụng bộ lọc</span>
                )}
              </div>

              {showCombinedFilter && (
                <div className="admin-filter-container">
                  <div className="admin-filter-row">
                    <label>Trừ % toàn bảng:</label>
                    <input type="number" min="0" max="100" placeholder="vd: 50" value={combinedFilterPercent} onChange={(e) => setCombinedFilterPercent(e.target.value)} style={{ width: '80px' }} />
                    <span>%</span>
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

          // Calculate filtered 3s total
          const calculateFiltered3sTotal = () => {
            let total = 0;
            Object.entries(betData3s).forEach(([key, amount]) => {
              const adjustedAmount = adjustThreeAmountForDisplay(key, amount);
              total += adjustedAmount;
            });
            return total;
          };



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
                    <input type="number" min="1" placeholder="vd: 5" value={topNThreeCount} onChange={(e) => {
                      setTopNThreeCount(e.target.value);
                      // Tự động áp dụng logic khi người dùng nhập số
                      setTimeout(() => {
                        const sortedEntries = Object.entries(betData3s)
                          .map(([key, amount]) => ({ key, amount }))
                          .sort((a, b) => b.amount - a.amount);

                        const n = parseInt(e.target.value, 10);
                        if (isNaN(n) || n <= 0) {
                          setTopNThreeSelection([]);
                          return;
                        }

                        const selected = sortedEntries.slice(0, n);
                        setTopNThreeSelection(selected);
                      }, 100);
                    }} style={{ width: '80px' }} />
                    <span>mục có số tiền cao nhất</span>
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
                          <span>nghìn</span>
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
                      <span>nghìn</span>
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
                  const adjustedAmount = adjustThreeAmountForDisplay(key, value);

                  if (adjustedAmount <= 0) return null;

                  return (
                    <div key={key} className="admin-stats-bet-item">
                      <span className="admin-stats-bet-number">{key}</span>
                      <span className="admin-stats-bet-amount">
                        {Math.round(adjustedAmount)}n
                      </span>
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

          // Calculate filtered xien total
          const calculateFilteredXienTotal = () => {
            let total = 0;
            Object.entries(betDataXien)
              .filter(([key]) => !key.includes('(xiên nháy)'))
              .forEach(([key, amount]) => {
                const adjustedAmount = adjustXienAmountForDisplay(key, amount);
                total += adjustedAmount;
              });
            return total;
          };



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

              {(showXienFilter || pinXienFilter) && (
                <div className="panel" style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span>Chọn ra</span>
                    <input type="number" min="1" placeholder="vd: 5" value={topNXienCount} onChange={(e) => {
                      setTopNXienCount(e.target.value);
                      // Tự động áp dụng logic khi người dùng nhập số
                      setTimeout(() => {
                        const sortedEntries = Object.entries(betDataXien)
                          .filter(([key]) => !key.includes('(xiên nháy)')) // Lọc bỏ xiên nháy
                          .map(([key, amount]) => ({ key, amount }))
                          .sort((a, b) => b.amount - a.amount);

                        const n = parseInt(e.target.value, 10);
                        if (isNaN(n) || n <= 0) {
                          setTopNXienSelection([]);
                          return;
                        }

                        const selected = sortedEntries.slice(0, n);
                        setTopNXienSelection(selected);
                      }, 100);
                    }} style={{ width: '80px' }} />
                    <span>mục có số tiền cao nhất</span>
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
                    const adjustedAmount = adjustXienAmountForDisplay(key, value);

                    if (adjustedAmount <= 0) return null;

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
                          {Math.round(adjustedAmount)}n
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

          // Tính toán tổng sau khi lọc cho xiên nháy
          const calculateXienNhayFilteredTotal = () => {
            let total = 0;
            Object.entries(betDataXienNhay)
              .filter(([key]) => key.includes('(xiên nháy)'))
              .forEach(([key, value]) => {
                total += adjustXienNhayAmountForDisplay(key, value);
              });
            return total;
          };

          return (
            <div className="admin-stats-combined-table admin-filter-scope">
              {/* Bộ lọc Xiên nháy */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 12px 0', flexWrap: 'wrap' }}>
                <button className="admin-stats-tab filter-toggle-btn" onClick={() => setShowXienNhayFilter(prev => !prev)}>{showXienNhayFilter ? 'Ẩn bộ lọc' : 'Bộ lọc'}</button>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input type="checkbox" checked={pinXienNhayFilter} onChange={(e) => setPinXienNhayFilter(e.target.checked)} />
                  <span>Ghim bộ lọc</span>
                </label>
                <button className="admin-stats-tab" onClick={handleRefreshXienNhay}>Làm mới</button>
              </div>

              {(showXienNhayFilter || pinXienNhayFilter) && (
                <div className="panel" style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span>Chọn ra</span>
                    <input type="number" min="1" placeholder="vd: 5" value={topNXienNhayCount} onChange={(e) => {
                      setTopNXienNhayCount(e.target.value);
                      // Tự động áp dụng logic khi người dùng nhập số
                      setTimeout(() => {
                        const sortedEntries = Object.entries(betDataXienNhay)
                          .filter(([key]) => key.includes('(xiên nháy)'))
                          .map(([key, amount]) => ({ key, amount }))
                          .sort((a, b) => b.amount - a.amount);

                        const n = parseInt(e.target.value, 10);
                        if (isNaN(n) || n <= 0) {
                          setTopNXienNhaySelection([]);
                          return;
                        }

                        const selected = sortedEntries.slice(0, n);
                        setTopNXienNhaySelection(selected);
                      }, 100);
                    }} style={{ width: '80px' }} />
                    <span>mục có số tiền cao nhất</span>
                  </div>

                  {topNXienNhaySelection.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '6px 0 10px 0' }}>
                      {topNXienNhaySelection.map(item => (
                        <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span>Lọc mục</span>
                          <input type="text" value={item.key.replace(' (xiên nháy)', '')} readOnly style={{ width: '160px', background: '#f0f0f0' }} />
                          <span>, đang có số tiền</span>
                          <input type="text" value={item.amount} readOnly style={{ width: '80px', background: '#f0f0f0' }} />
                          <span>, lọc đi</span>
                          <input type="number" min="0" placeholder="vd: 50" value={topNXienNhaySubtracts[item.key] ?? ''} onChange={(e) => setTopNXienNhaySubtracts(prev => ({ ...prev, [item.key]: e.target.value }))} style={{ width: '100px' }} />
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
                      value={xienNhayFilterRowCount}
                      onChange={(e) => {
                        const count = parseInt(e.target.value, 10) || 1;
                        setXienNhayFilterRowCount(e.target.value);

                        // Điều chỉnh số dòng lọc
                        const currentRows = [...xienNhayFilterRows];
                        if (count > currentRows.length) {
                          // Thêm dòng mới
                          for (let i = currentRows.length; i < count; i++) {
                            currentRows.push({ number: '', subtract: '' });
                          }
                        } else if (count < currentRows.length) {
                          // Xóa dòng thừa
                          currentRows.splice(count);
                        }
                        setXienNhayFilterRows(currentRows);
                      }}
                      style={{ width: '60px' }}
                    />
                  </div>

                  {xienNhayFilterRows.map((row, index) => (
                    <div key={index} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Số xiên nháy"
                        value={row.number}
                        onChange={(e) => {
                          const newRows = [...xienNhayFilterRows];
                          newRows[index].number = e.target.value;
                          setXienNhayFilterRows(newRows);
                        }}
                        style={{ width: '120px' }}
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Trừ tiền"
                        value={row.subtract}
                        onChange={(e) => {
                          const newRows = [...xienNhayFilterRows];
                          newRows[index].subtract = e.target.value;
                          setXienNhayFilterRows(newRows);
                        }}
                        style={{ width: '80px' }}
                      />
                    </div>
                  ))}

                  <div style={{ marginTop: '10px' }}>
                    <span>Lọc tất cả </span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="vd: 50"
                      value={xienNhayFilterPercent}
                      onChange={(e) => setXienNhayFilterPercent(e.target.value)}
                      style={{ width: '80px' }}
                    />
                    <span> % số tiền</span>
                  </div>
                </div>
              )}

              <div className="admin-stats-combined-total">
                <h4>Tổng kết xiên nháy</h4>
                <div>
                  <span style={{ color: '#333', fontWeight: 600, fontSize: '14px' }}>Tổng tiền cược: {formatThousand(calculateXienNhayBetTotal())}</span>
                  <div style={{ marginTop: '5px' }}>
                    <span style={{ color: '#388e3c', fontWeight: 600, fontSize: '14px' }}>Tổng tiền đánh: {formatThousand(calculateXienNhayFilteredTotal())}</span>
                  </div>
                </div>
              </div>

              <div className="admin-stats-bet-list">
                {Object.entries(betDataXienNhay)
                  .filter(([key]) => key.includes('(xiên nháy)'))
                  .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                  .map(([key, value]) => {
                    const adjustedAmount = adjustXienNhayAmountForDisplay(key, value);

                    if (adjustedAmount <= 0) return null;

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
                          {Math.round(adjustedAmount)}n
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

          // Tính toán tổng sau khi lọc cho xiên quay
          const calculateXienQuayFilteredTotal = () => {
            let total = 0;
            Object.entries(betDataXienQuay).forEach(([key, value]) => {
              const adjustedAmount = adjustXienQuayAmountForDisplay(key, value);

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

          // Tính tổng xiên quay không nhân hệ số
          const calculateXienQuayFilteredTotalNoMultiplier = () => {
            let total = 0;
            Object.entries(betDataXienQuay).forEach(([key, value]) => {
              total += adjustXienQuayAmountForDisplay(key, value);
            });
            return total;
          };



          return (
            <div className="admin-stats-combined-table">
              <div className="admin-stats-combined-total">
                <h4>Tổng kết xiên quay</h4>
                <div>
                  <span style={{ color: '#333', fontWeight: 600, fontSize: '14px' }}>Tổng tiền đánh: {formatThousand(statisticsData.xienquayTotal)}</span>
                  <div style={{ marginTop: '5px' }}>
                    <span style={{ color: '#388e3c', fontWeight: 600, fontSize: '14px' }}>Tổng sau lọc (không nhân hệ số): {formatThousand(calculateXienQuayFilteredTotalNoMultiplier())}</span>
                  </div>
                  <div style={{ marginTop: '5px' }}>
                    <span style={{ color: '#388e3c', fontWeight: 600, fontSize: '14px' }}>Tổng sau lọc (có nhân hệ số): {formatThousand(calculateXienQuayFilteredTotal())}</span>
                  </div>
                </div>
              </div>

              {/* UI bộ lọc cho xiên quay */}

              <div className="filter-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 12px 0', flexWrap: 'wrap' }}>
                <button className="admin-stats-tab filter-toggle-btn" onClick={() => setShowXienQuayFilter(prev => !prev)}>{showXienQuayFilter ? 'Ẩn bộ lọc' : 'Bộ lọc'}</button>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input type="checkbox" checked={pinXienQuayFilter} onChange={(e) => setPinXienQuayFilter(e.target.checked)} />
                  <span>Ghim bộ lọc</span>
                </label>
                <button className="admin-stats-tab" onClick={handleRefreshXienQuay}>Làm mới</button>
              </div>

              {(showXienQuayFilter || pinXienQuayFilter) && (
                <div className="panel filter-panel" style={{ marginBottom: '12px' }}>
                  <div className="filter-row">
                    <span>Chọn ra</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="vd: 5"
                      value={topNXienQuayCount}
                      onChange={(e) => setTopNXienQuayCount(e.target.value)}
                      className="filter-input-small"
                    />
                    <span>mục cao nhất</span>
                    <button className="admin-stats-tab filter-button" onClick={buildTopNXienQuaySelection}>Chọn</button>
                  </div>

                  {topNXienQuaySelection.length > 0 && (
                    <div className="filter-selection-list">
                      {topNXienQuaySelection.map(item => (
                        <div key={item.key} className="filter-selection-item">
                          <div className="filter-selection-row">
                            <span>Lọc:</span>
                            <input type="text" value={item.key} readOnly className="filter-input-medium" style={{ background: '#f0f0f0' }} />
                          </div>
                          <div className="filter-selection-row">
                            <span>Số tiền:</span>
                            <input type="text" value={item.amount} readOnly className="filter-input-small" style={{ background: '#f0f0f0' }} />
                            <span>n</span>
                          </div>
                          <div className="filter-selection-row">
                            <span>Lọc đi:</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="vd: 50"
                              value={topNXienQuaySubtracts[item.key] ?? ''}
                              onChange={(e) => setTopNXienQuaySubtracts(prev => ({ ...prev, [item.key]: e.target.value }))}
                              className="filter-input-small"
                            />
                            <span>n</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="filter-row">
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
                      className="filter-input-small"
                    />
                  </div>

                  {/* Hiển thị số dòng lọc dựa trên giá trị nhập vào */}
                  {xienQuayFilterRows.map((row, index) => (
                    <div key={index} className="filter-row filter-item-row">
                      <div className="filter-item-group">
                        <span>Lọc mục:</span>
                        <input type="text" placeholder="vd: 12-34-56,23-45-67"
                          value={row.number || ''}
                          onChange={(e) => {
                            const newRows = [...xienQuayFilterRows];
                            newRows[index] = { ...newRows[index], number: e.target.value };
                            setXienQuayFilterRows(newRows);
                          }}
                          className="filter-input-medium" />
                      </div>
                      <div className="filter-item-group">
                        <span>Số tiền:</span>
                        <input type="number" min="0" placeholder="vd: 50"
                          value={row.subtract || ''}
                          onChange={(e) => {
                            const newRows = [...xienQuayFilterRows];
                            newRows[index] = { ...newRows[index], subtract: e.target.value };
                            setXienQuayFilterRows(newRows);
                          }}
                          className="filter-input-small" />
                        <span>n</span>
                      </div>
                    </div>
                  ))}

                  <div className="filter-row">
                    <span>Lọc tất cả</span>
                    <input type="number" min="0" max="100" placeholder="vd: 50" value={xienQuayFilterPercent} onChange={(e) => setXienQuayFilterPercent(e.target.value)} className="filter-input-small" />
                    <span>% số tiền</span>
                  </div>
                </div>
              )}

              <div className="admin-stats-bet-list">
                {Object.entries(betDataXienQuay).map(([key, value]) => {
                  const adjustedAmount = adjustXienQuayAmountForDisplay(key, value);

                  if (adjustedAmount <= 0) return null;

                  // Tính hệ số dựa trên số lượng số trong xiên quay
                  const numberCount = key.split('-').length;
                  let multiplier = 1;
                  if (numberCount === 3) multiplier = 4;
                  else if (numberCount === 4) multiplier = 11;

                  return (
                    <div key={key} className="admin-stats-bet-item">
                      <span className="admin-stats-bet-number">{key}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span className="admin-stats-bet-amount">{Math.round(adjustedAmount)}n</span>
                      </div>
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
        <h3>Thống kê cửa hàng: {store.name}</h3>
        <div className="admin-stats-date-controls">
          <label htmlFor="admin-stats-date">Chọn ngày:</label>
          <input
            id="admin-stats-date"
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="admin-stats-date-input"
          />
        </div>
      </div>

      {/* Main Tabs */}
      <div className="admin-stats-main-tabs">
        <button
          className={`admin-stats-main-tab ${activeTab === 'betting' ? 'admin-stats-main-tab-active' : ''}`}
          onClick={() => handleTabChange('betting')}
        >
          Thống kê cược
        </button>
        <button
          className={`admin-stats-main-tab ${activeTab === 'prizes' ? 'admin-stats-main-tab-active' : ''}`}
          onClick={() => handleTabChange('prizes')}
        >
          Thống kê thưởng
        </button>
      </div>

      {/* Content */}
      <div className="admin-stats-content">
        {activeTab === 'betting' ? (
          isLoading ? (
            <div className="admin-stats-loading">
              <p>Đang tải thống kê...</p>
            </div>
          ) : statisticsData ? (
            <>
              {renderSummary()}
              {renderBettingStatistics()}
            </>
          ) : (
            <div className="admin-stats-no-data">
              <p>Không có dữ liệu thống kê cho ngày này</p>
            </div>
          )
        ) : (
          <AdminStoreDetailPrizeStats
            storeId={store._id}
            storeName={store.name}
            onBack={() => handleTabChange('betting')}
          />
        )}
      </div>
    </div>
  );
};

export default AdminStoreStatistics;