import { getApiUrl } from '../config/api';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './EmployeeInterface.css';
import Statistics from './Statistics';
import PrizeInterface from './PrizeInterface';
import PrizeSettings from './PrizeSettings';
import PrizeStatistics from './PrizeStatistics';
import LotoMultiplierSettings from './LotoMultiplierSettings';
import QuantityControls from './QuantityControls';

const EmployeeInterface = ({ user }) => {
  const [activeMenu, setActiveMenu] = useState('betting');
  const [storeInfo, setStoreInfo] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerGive, setCustomerGive] = useState('');
  
  // Invoice ID state - tạo một lần và giữ nguyên
  const [currentInvoiceId, setCurrentInvoiceId] = useState('');
  
  // Edit invoice states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editInvoiceId, setEditInvoiceId] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // History state
  const [invoiceHistory, setInvoiceHistory] = useState([]);
  
  // Invoice list states
  const [invoiceList, setInvoiceList] = useState([]);
  // Get current date in Vietnam timezone (UTC+7)
  const getCurrentVietnamDate = () => {
    const now = new Date();
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // Add 7 hours
    return vietnamTime.toISOString().split('T')[0];
  };
  
  const [selectedDate, setSelectedDate] = useState(getCurrentVietnamDate()); // Today's date in Vietnam
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [searchInvoiceList, setSearchInvoiceList] = useState(''); // Tìm kiếm hóa đơn trong danh sách
  
  // Lottery results states
  const [lotteryResults, setLotteryResults] = useState([]);
  const [selectedLotteryDate, setSelectedLotteryDate] = useState('');
  const [currentLotteryResult, setCurrentLotteryResult] = useState(null);
  const [isLoadingLottery, setIsLoadingLottery] = useState(false);
  const [editableCells, setEditableCells] = useState({});
  
  // Hệ số lô động - load từ API
  const [lotoMultiplier, setLotoMultiplier] = useState(22);

  // Bộ data - 100 bộ với định nghĩa các số
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
    '99': [99, 94, 49, 44]
  };

  // Bet data for each type with dynamic rows
  const [betData, setBetData] = useState({
    loto: { 
      quantity: 1, 
      rows: [{ numbers: '', points: '' }]
    },
    '2s': { 
      quantity: 1, 
      rows: [{ numbers: '', amount: '' }]
    },
    '3s': { 
      quantity: 1, 
      rows: [{ numbers: '', amount: '' }]
    },
    tong: { 
      quantity: 1, 
      rows: [{ numbers: '', amount: '' }]
    },
    kep: { 
      quantity: 1, 
      rows: [{ numbers: '', amount: '' }]
    },
    dau: { 
      quantity: 1, 
      rows: [{ numbers: '', amount: '' }]
    },
    dit: { 
      quantity: 1, 
      rows: [{ numbers: '', amount: '' }]
    },
    xien: { 
      quantity: 1, 
      rows: [{ numbers: '', amount: '' }]
    },
    xienquay: { 
      quantity: 1, 
      rows: [{ numbers: '', amount: '' }]
    },
    bo: { 
      quantity: 1, 
      rows: [{ boName: '', count: '', amount: '' }]
    }
  });

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({});
  
  // Refs for input focus management
  const inputRefs = useRef({});

  // Load thông tin cửa hàng và hệ số lô
  useEffect(() => {
    loadStoreInfo();
    loadLotoMultiplier();
  }, [user.storeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track unsaved changes and warn before leaving
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isEditMode && hasUnsavedChanges) {
        const message = 'Bạn có thay đổi chưa lưu. Bạn có chắc muốn thoát?';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isEditMode && hasUnsavedChanges) {
        console.log('⚠️ Tab hidden with unsaved changes - setting flag');
        localStorage.setItem('unsavedEditMode', 'true');
      }
    };

    if (isEditMode) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [isEditMode, hasUnsavedChanges]);

  // Check for unsaved edit mode on component mount and force reload page
  useEffect(() => {
    const unsavedEditMode = localStorage.getItem('unsavedEditMode');
    if (unsavedEditMode === 'true') {
      // Xóa flag TRƯỚC KHI reload để tránh infinite loop
      localStorage.removeItem('unsavedEditMode');
      
      // Thực sự reload trang để đảm bảo trạng thái hoàn toàn mới
      console.log('🔄 Force reloading page due to unsaved changes');
      
      // Thêm timeout nhỏ để đảm bảo localStorage đã được clear
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
      return; // Không cần thực hiện gì thêm vì trang sẽ reload
    }
  }, []); // Chạy ngay khi component mount, không phụ thuộc storeInfo

  // Generate unique invoice ID when component mounts or when new invoice needed
  useEffect(() => {
    if (storeInfo && !currentInvoiceId) {
      const newInvoiceId = generateUniqueInvoiceId();
      setCurrentInvoiceId(newInvoiceId);
    }
  }, [storeInfo, currentInvoiceId]);

  // Auto load data when switching to invoice list tab
  useEffect(() => {
    if (activeMenu === 'invoices') {
      loadInvoiceList(selectedDate);
    } else if (activeMenu === 'history') {
      loadInvoiceHistory();
    } else if (activeMenu === 'lottery') {
      loadLotteryResults();
    } else if (activeMenu === 'betting') {
      // Reload hệ số lô khi quay lại tab betting
      loadLotoMultiplier();
    }
  }, [activeMenu]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadStoreInfo = async () => {
    try {
      const response = await axios.get(getApiUrl(`/auth/store/${user.storeId}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setStoreInfo(response.data.store);
    } catch (error) {
      console.error('Lỗi khi tải thông tin cửa hàng:', error);
    }
  };

  // Load hệ số lô
  const loadLotoMultiplier = async () => {
    try {
      const response = await fetch(getApiUrl('/employee/loto-multiplier'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setLotoMultiplier(data.data.multiplier);
      }
    } catch (error) {
      console.error('Lỗi khi tải hệ số lô:', error);
      // Giữ giá trị mặc định 22 nếu có lỗi
    }
  };

  // Generate unique invoice ID: HD + admin initials + store initials + 4 digits
  const generateUniqueInvoiceId = () => {
    if (!storeInfo) return '';
    
    // Get admin initials (first letter of each word)
    const adminInitials = storeInfo.adminId?.name 
      ? storeInfo.adminId.name.split(' ').map(word => word[0]).join('').toUpperCase()
      : 'AD';
    
    // Get store initials (first letter of each word)
    const storeInitials = storeInfo.name
      ? storeInfo.name.split(' ').map(word => word[0]).join('').toUpperCase()
      : 'ST';
    
    // Generate 4 random digits
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    
    // Combine: HD + admin + store + digits
    return `HD${adminInitials}${storeInitials}${randomDigits}`;
  };

  // Reset invoice ID for new invoice
  const generateNewInvoiceId = () => {
    const newInvoiceId = generateUniqueInvoiceId();
    setCurrentInvoiceId(newInvoiceId);
    return newInvoiceId;
  };

  // Calculate lô amount: số con x điểm x hệ số 22 (hỗ trợ thập phân)
  const calculateLoAmount = (numbersStr, points) => {
    if (!numbersStr || !points) return 0;
    
    // Split numbers by spaces and commas, filter out empty strings
    const numbers = numbersStr.trim().split(/[\s,]+/).filter(n => n.length > 0);
    const numCount = numbers.length;
    const pointsValue = parseFloat(points);
    
    // Lô calculation: số con x điểm x 22 (hỗ trợ thập phân)
    // Use precise calculation to avoid floating point errors
    const result = numCount * pointsValue * lotoMultiplier;
    return Math.round(result * 100) / 100; // Round to 2 decimal places, then return as number
  };

  // Calculate 2S amount: số con x tiền
  const calculate2SAmount = (numbersStr, amount) => {
    if (!numbersStr || !amount) return 0;
    
    const numbers = numbersStr.trim().split(/[\s,]+/).filter(n => n.length > 0);
    const numCount = numbers.length;
    const amountValue = parseFloat(amount);
    
    return numCount * amountValue;
  };

  // Calculate 3S amount: số con x tiền
  const calculate3SAmount = (numbersStr, amount) => {
    if (!numbersStr || !amount) return 0;
    
    const numbers = numbersStr.trim().split(/[\s,]+/).filter(n => n.length > 0);
    const numCount = numbers.length;
    const amountValue = parseFloat(amount);
    
    return numCount * amountValue;
  };

  // Calculate Tổng amount: tiền x 10 (mỗi tổng có 10 con đề)
  const calculateTongAmount = (amount) => {
    if (!amount) return 0;
    return parseFloat(amount) * 10;
  };

  // Calculate Kép amount: tiền x 10 (mỗi kép có 10 con đề)
  const calculateKepAmount = (amount) => {
    if (!amount) return 0;
    return parseFloat(amount) * 10;
  };

  // Calculate Đầu/Đít amount: tiền x 10 (mỗi đầu/đít có 10 con đề)
  const calculateDauDitAmount = (amount) => {
    if (!amount) return 0;
    return parseFloat(amount) * 10;
  };

  // Calculate Xiên amount
  const calculateXienAmount = (numbersStr, amount) => {
    if (!numbersStr || !amount) return 0;
    
    // Split by spaces/commas to get individual xiên combinations
    const xienCombinations = numbersStr.trim().split(/[\s,]+/).filter(x => x.length > 0);
    const numXien = xienCombinations.length;
    const amountValue = parseFloat(amount);
    
    // Each xiên combination costs the specified amount
    return numXien * amountValue;
  };

  // Calculate Xiên Quay amount
  const calculateXienQuayAmount = (numbersStr, amount) => {
    if (!numbersStr || !amount) return 0;
    
    // Split by spaces/commas to get individual xiên quay combinations
    const xienQuayCombinations = numbersStr.trim().split(/[\s,]+/).filter(x => x.length > 0);
    const amountValue = parseFloat(amount);
    
    let totalAmount = 0;
    
    xienQuayCombinations.forEach(combination => {
      const numbers = combination.split('-');
      if (numbers.length === 3) {
        // Xiên quay 3: tiền x 4
        totalAmount += amountValue * 4;
      } else if (numbers.length === 4) {
        // Xiên quay 4: tiền x 11
        totalAmount += amountValue * 11;
      }
    });
    
    return totalAmount;
  };

  // Calculate Bo amount
  const calculateBoAmount = (boName, count, amount) => {
    if (!boName || !count || !amount) return 0;
    
    const countValue = parseInt(count);
    const amountValue = parseFloat(amount);
    
    return countValue * amountValue;
  };

  // Validation functions
  const validateNumbers = (betType, numbersStr, isBlurValidation = false) => {
    if (!numbersStr.trim()) return { isValid: true, message: '' };
    
    const numbers = numbersStr.trim().split(/[\s,]+/).filter(n => n.length > 0);
    
    // Check for duplicates within the input (only on blur)
    if (isBlurValidation) {
      const uniqueNumbers = [...new Set(numbers)];
      if (uniqueNumbers.length !== numbers.length) {
        // Find duplicated numbers
        const duplicates = numbers.filter((num, index) => numbers.indexOf(num) !== index);
        const uniqueDuplicates = [...new Set(duplicates)];
        return { isValid: false, message: `Số ${uniqueDuplicates.join(', ')} bị trùng lặp` };
      }
    }
    
    switch(betType) {
      case 'loto':
      case '2s':
        // Validate 2-digit numbers (00-99)
        for (let num of numbers) {
          // For blur validation, be strict. For real-time, be lenient
          if (isBlurValidation) {
            if (!/^\d{2}$/.test(num) || parseInt(num) > 99) {
              return { isValid: false, message: 'Chỉ được nhập số từ 00 đến 99' };
            }
          }
        }
        break;
        
      case '3s':
        // Validate 3-digit numbers (000-999)
        for (let num of numbers) {
          if (isBlurValidation) {
            if (!/^\d{3}$/.test(num) || parseInt(num) > 999) {
              return { isValid: false, message: 'Chỉ được nhập số từ 000 đến 999' };
            }
          }
        }
        break;
        
      case 'tong':
        // Validate tổng (0-9) - only on blur
        if (isBlurValidation) {
          for (let num of numbers) {
            const cleanNum = num.toLowerCase().replace(/^tổng\s*/, '');
            if (!/^[0-9]$/.test(cleanNum)) {
              return { isValid: false, message: 'Chỉ được nhập tổng từ 0 đến 9' };
            }
          }
        }
        break;
        
      case 'kep':
        // Validate kép (bằng/lệch) - only on blur
        if (isBlurValidation) {
          for (let item of numbers) {
            if (!['bằng', 'bang', 'lệch', 'lech'].includes(item.toLowerCase())) {
              return { isValid: false, message: 'Chỉ được nhập "bằng" hoặc "lệch"' };
            }
          }
        }
        break;
        
      case 'dau':
        // Validate đầu (0-9) - only on blur
        if (isBlurValidation) {
          for (let num of numbers) {
            const cleanNum = num.toLowerCase().replace(/^đầu\s*/, '');
            if (!/^[0-9]$/.test(cleanNum)) {
              return { isValid: false, message: 'Chỉ được nhập đầu từ 0 đến 9' };
            }
          }
        }
        break;
        
      case 'dit':
        // Validate đít (0-9) - only on blur
        if (isBlurValidation) {
          for (let num of numbers) {
            const cleanNum = num.toLowerCase().replace(/^đít\s*/, '');
            if (!/^[0-9]$/.test(cleanNum)) {
              return { isValid: false, message: 'Chỉ được nhập đít từ 0 đến 9' };
            }
          }
        }
        break;
        
      case 'xien':
        // Validate xiên - only on blur
        if (isBlurValidation) {
          for (let xienStr of numbers) {
            const xienNumbers = xienStr.split('-');
            
            // Check if it's xiên 2, 3, or 4
            if (xienNumbers.length < 2 || xienNumbers.length > 4) {
              return { isValid: false, message: 'Xiên chỉ được phép nhập xiên 2, xiên 3, hoặc xiên 4' };
            }
            
            // Validate each number in the xiên (00-99)
            for (let num of xienNumbers) {
              if (!/^\d{2}$/.test(num) || parseInt(num) > 99) {
                return { isValid: false, message: 'Số trong xiên chỉ được nhập từ 00 đến 99' };
              }
            }
            
            // Check for duplicates within the xiên
            const uniqueXienNumbers = [...new Set(xienNumbers)];
            if (uniqueXienNumbers.length !== xienNumbers.length) {
              const duplicates = xienNumbers.filter((num, index) => xienNumbers.indexOf(num) !== index);
              const uniqueDuplicates = [...new Set(duplicates)];
              return { isValid: false, message: `Số ${uniqueDuplicates.join(', ')} bị trùng trong xiên` };
            }
          }
          
          // Check if all xiên in the same row have the same type (2, 3, or 4)
          const xienTypes = numbers.map(xienStr => xienStr.split('-').length);
          const uniqueTypes = [...new Set(xienTypes)];
          if (uniqueTypes.length > 1) {
            return { isValid: false, message: 'Một hàng chỉ được phép nhập một loại xiên (2, 3, hoặc 4)' };
          }
        }
        break;
        
      case 'xienquay':
        // Validate xiên quay - only on blur
        if (isBlurValidation) {
          for (let xienQuayStr of numbers) {
            const xienQuayNumbers = xienQuayStr.split('-');
            
            // Check if it's xiên quay 3 or 4
            if (xienQuayNumbers.length !== 3 && xienQuayNumbers.length !== 4) {
              return { isValid: false, message: 'Xiên quay chỉ được phép nhập xiên quay 3 hoặc xiên quay 4' };
            }
            
            // Validate each number in the xiên quay (00-99)
            for (let num of xienQuayNumbers) {
              if (!/^\d{2}$/.test(num) || parseInt(num) > 99) {
                return { isValid: false, message: 'Số trong xiên quay chỉ được nhập từ 00 đến 99' };
              }
            }
          }
          
          // Check if all xiên quay in the same row have the same type (3 or 4)
          const xienQuayTypes = numbers.map(xienQuayStr => xienQuayStr.split('-').length);
          const uniqueTypes = [...new Set(xienQuayTypes)];
          if (uniqueTypes.length > 1) {
            return { isValid: false, message: 'Một hàng chỉ được phép nhập một loại xiên quay (3 hoặc 4)' };
          }
        }
        break;
        
      default:
        break;
    }
    
    return { isValid: true, message: '' };
  };

  // Check for duplicates across all rows of same bet type
  const checkDuplicatesAcrossRows = (betType, currentRowIndex, newValue) => {
    const bet = betData[betType];
    const allNumbers = [];
    
    bet.rows.forEach((row, index) => {
      if (index === currentRowIndex) {
        // Use the new value for current row
        if (newValue.trim()) {
          const numbers = newValue.trim().split(/[\s,]+/).filter(n => n.length > 0);
          allNumbers.push(...numbers);
        }
      } else {
        // Use existing value for other rows
        if (row.numbers.trim()) {
          const numbers = row.numbers.trim().split(/[\s,]+/).filter(n => n.length > 0);
          allNumbers.push(...numbers);
        }
      }
    });
    
    const uniqueNumbers = [...new Set(allNumbers)];
    return uniqueNumbers.length === allNumbers.length;
  };

  // Handle quantity change - adjust rows accordingly with data protection
  const handleQuantityChange = (betType, newQuantity) => {
    const quantity = parseInt(newQuantity) || 1;
    const currentBet = betData[betType];
    const currentRows = currentBet.rows;
    
    // If reducing quantity, check if any rows beyond the new quantity have data
    if (quantity < currentRows.length) {
      // Check rows that would be removed
      const rowsToRemove = currentRows.slice(quantity);
      const hasDataInRemovedRows = rowsToRemove.some(row => 
        row.numbers.trim() !== '' || (row.points && row.points.trim() !== '') || (row.amount && row.amount.trim() !== '')
      );
      
      if (hasDataInRemovedRows) {
        alert('Không thể giảm số lượng hàng vì có hàng chứa dữ liệu. Vui lòng xóa dữ liệu trước.');
        return; // Don't update quantity
      }
    }
    
    setBetData(prev => {
      let newRows = [...currentRows];
      
      if (quantity > currentRows.length) {
        // Add new empty rows
        const rowsToAdd = quantity - currentRows.length;
        const emptyRow = betType === 'loto' 
          ? { numbers: '', points: '' }
          : { numbers: '', amount: '' };
        
        for (let i = 0; i < rowsToAdd; i++) {
          newRows.push({ ...emptyRow });
        }
      } else if (quantity < currentRows.length) {
        // Remove excess rows (we already checked they're empty)
        newRows = newRows.slice(0, quantity);
        
        // Clear validation errors for removed rows
        setValidationErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          for (let i = quantity; i < currentRows.length; i++) {
            delete newErrors[`${betType}-${i}`];
          }
          return newErrors;
        });
      }
      
      return {
        ...prev,
        [betType]: {
          quantity,
          rows: newRows
        }
      };
    });
  };

  // Handle row data change
  const handleRowChange = (betType, rowIndex, field, value) => {
    // Track changes if in edit mode
    if (isEditMode) {
      console.log('📝 Row change detected in edit mode:', { betType, rowIndex, field, value });
      setHasUnsavedChanges(true);
    }
    
    // Real-time validation for numbers field
    if (field === 'numbers') {
      const errorKey = `${betType}-${rowIndex}`;
      
      // Check for duplicates within the input (real-time)
      if (value.trim()) {
        const numbers = value.trim().split(/[\s,]+/).filter(n => n.length > 0);
        const uniqueNumbers = [...new Set(numbers)];
        
        if (uniqueNumbers.length !== numbers.length) {
          // Find duplicated numbers
          const duplicates = numbers.filter((num, index) => numbers.indexOf(num) !== index);
          const uniqueDuplicates = [...new Set(duplicates)];
          setValidationErrors(prev => ({
            ...prev,
            [errorKey]: `Số ${uniqueDuplicates.join(', ')} bị trùng lặp`
          }));
        } else {
          // Check for duplicates across rows (real-time)
          if (!checkDuplicatesAcrossRows(betType, rowIndex, value)) {
            // Find which numbers are duplicated
            const currentNumbers = value.trim().split(/[\s,]+/).filter(n => n.length > 0);
            const bet = betData[betType];
            const duplicates = [];
            
            bet.rows.forEach((row, index) => {
              if (index !== rowIndex && row.numbers.trim()) {
                const existingNumbers = row.numbers.trim().split(/[\s,]+/).filter(n => n.length > 0);
                const commonNumbers = currentNumbers.filter(num => existingNumbers.includes(num));
                duplicates.push(...commonNumbers);
              }
            });
            
            const uniqueDuplicates = [...new Set(duplicates)];
            if (uniqueDuplicates.length > 0) {
              setValidationErrors(prev => ({
                ...prev,
                [errorKey]: `Số ${uniqueDuplicates.join(', ')} bị nhập trùng lặp`
              }));
            } else {
              // Clear error if no duplicates
              setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[errorKey];
                return newErrors;
              });
            }
          } else {
            // Clear error if no duplicates
            setValidationErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors[errorKey];
              return newErrors;
            });
          }
        }
      } else {
        // Clear error if input is empty
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[errorKey];
          return newErrors;
        });
      }
    }
    
    setBetData(prev => {
      const newRows = [...prev[betType].rows];
      newRows[rowIndex] = {
        ...newRows[rowIndex],
        [field]: value
      };
      
      return {
        ...prev,
        [betType]: {
          ...prev[betType],
          rows: newRows
        }
      };
    });
  };

  // Handle bo name change - special handler for bo bet type
  const handleBoNameChange = (betType, rowIndex, value) => {
    setBetData(prev => {
      const newRows = [...prev[betType].rows];
      
      // Update bo name
      newRows[rowIndex] = {
        ...newRows[rowIndex],
        boName: value
      };
      
      return {
        ...prev,
        [betType]: {
          ...prev[betType],
          rows: newRows
        }
      };
    });
  };

  // Handle bo name blur - validate and update count
  const handleBoNameBlur = (betType, rowIndex, value, event) => {
    const trimmedValue = value.trim();
    
    if (!trimmedValue) {
      // Clear count if no bo name
      setBetData(prev => {
        const newRows = [...prev[betType].rows];
        newRows[rowIndex] = {
          ...newRows[rowIndex],
          count: ''
        };
        
        return {
          ...prev,
          [betType]: {
            ...prev[betType],
            rows: newRows
          }
        };
      });
      return;
    }

    // Validate bo name format (00-99)
    if (!/^\d{2}$/.test(trimmedValue)) {
      const errorKey = `${betType}-${rowIndex}`;
      setValidationErrors(prev => ({
        ...prev,
        [errorKey]: 'Tên bộ phải là số từ 00 đến 99'
      }));
      
      setTimeout(() => {
        const inputRef = inputRefs.current[errorKey];
        if (inputRef) {
          inputRef.focus();
          inputRef.select();
        }
      }, 100);
      return;
    }

    // Check if bo exists
    if (!BO_DATA[trimmedValue]) {
      const errorKey = `${betType}-${rowIndex}`;
      setValidationErrors(prev => ({
        ...prev,
        [errorKey]: `Bộ ${trimmedValue} không tồn tại`
      }));
      
      setTimeout(() => {
        const inputRef = inputRefs.current[errorKey];
        if (inputRef) {
          inputRef.focus();
          inputRef.select();
        }
      }, 100);
      return;
    }

    // Clear validation errors and update count
    const errorKey = `${betType}-${rowIndex}`;
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[errorKey];
      return newErrors;
    });

    // Update count based on bo data
    const boNumbers = BO_DATA[trimmedValue];
    setBetData(prev => {
      const newRows = [...prev[betType].rows];
      newRows[rowIndex] = {
        ...newRows[rowIndex],
        count: boNumbers.length
      };
      
      return {
        ...prev,
        [betType]: {
          ...prev[betType],
          rows: newRows
        }
      };
    });
  };

  // Handle input blur - validate when user leaves the input field
  const handleInputBlur = (betType, rowIndex, field, value, event) => {
    if (field === 'numbers') {
      // Validate the input
      const validation = validateNumbers(betType, value, true);
      const errorKey = `${betType}-${rowIndex}`;
      
      if (!validation.isValid) {
        setValidationErrors(prev => ({
          ...prev,
          [errorKey]: validation.message
        }));
        
        // Focus back to the input with error
        setTimeout(() => {
          const inputRef = inputRefs.current[errorKey];
          if (inputRef) {
            inputRef.focus();
            inputRef.select(); // Select all text for easy correction
          }
        }, 100);
        return;
      }
      
      // Check for duplicates across rows
      if (!checkDuplicatesAcrossRows(betType, rowIndex, value)) {
        // Find which numbers are duplicated
        const currentNumbers = value.trim().split(/[\s,]+/).filter(n => n.length > 0);
        const bet = betData[betType];
        const duplicates = [];
        
        bet.rows.forEach((row, index) => {
          if (index !== rowIndex && row.numbers.trim()) {
            const existingNumbers = row.numbers.trim().split(/[\s,]+/).filter(n => n.length > 0);
            const commonNumbers = currentNumbers.filter(num => existingNumbers.includes(num));
            duplicates.push(...commonNumbers);
          }
        });
        
        // Check for duplicates within the same input
        const uniqueCurrentNumbers = [...new Set(currentNumbers)];
        if (uniqueCurrentNumbers.length !== currentNumbers.length) {
          const duplicatesInSame = currentNumbers.filter((num, index) => currentNumbers.indexOf(num) !== index);
          duplicates.push(...duplicatesInSame);
        }
        
        const uniqueDuplicates = [...new Set(duplicates)];
        const errorMessage = uniqueDuplicates.length > 0 
          ? `Số ${uniqueDuplicates.join(', ')} bị nhập trùng lặp`
          : 'Số đã được nhập ở hàng khác';
          
        setValidationErrors(prev => ({
          ...prev,
          [errorKey]: errorMessage
        }));
        
        // Focus back to the input with error
        setTimeout(() => {
          const inputRef = inputRefs.current[errorKey];
          if (inputRef) {
            inputRef.focus();
            inputRef.select(); // Select all text for easy correction
          }
        }, 100);
        return;
      }
      
      // Clear validation error if input is valid
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // Format numbers with commas for better readability in invoice
  const formatNumbersForInvoice = (numbersStr, betType) => {
    if (!numbersStr.trim()) return '';
    
    if (betType === 'xien' || betType === 'xienquay') {
      // For xiên and xiên quay, keep the dash format but add commas between combinations
      const combinations = numbersStr.trim().split(/[\s,]+/).filter(n => n.length > 0);
      return combinations.join(', ');
    } else {
      // For other bet types, split numbers and join with commas
      const numbers = numbersStr.trim().split(/[\s,]+/).filter(n => n.length > 0);
      return numbers.join(', ');
    }
  };

  // Generate invoice items automatically from betData
  const generateInvoiceItems = () => {
    const items = [];
    const betLabels = {
      loto: 'Lô tô',
      '2s': '2 số',
      '3s': '3 số',
      tong: 'Tổng',
      kep: 'Kép',
      dau: 'Đầu',
      dit: 'Đít',
      bo: 'Bộ',
      xien: 'Xiên',
      xienquay: 'Xiên quay'
    };

    Object.entries(betData).forEach(([betType, bet]) => {
      bet.rows.forEach((row, index) => {
        // Special check for bo type
        const hasValidData = betType === 'bo' 
          ? (row.boName && row.count && row.amount)
          : (row.numbers && (row.points || row.amount));
          
        if (hasValidData) {
          let totalAmount = 0;
          let displayNumbers = '';

          if (betType === 'loto') {
            // Lô calculation
            totalAmount = calculateLoAmount(row.numbers, row.points);
            displayNumbers = `${formatNumbersForInvoice(row.numbers, betType)} (x${row.points}đ)`;
          } else if (betType === '2s') {
            // 2S calculation
            totalAmount = calculate2SAmount(row.numbers, row.amount);
            displayNumbers = `${formatNumbersForInvoice(row.numbers, betType)} (x${row.amount}n)`;
          } else if (betType === '3s') {
            // 3S calculation
            totalAmount = calculate3SAmount(row.numbers, row.amount);
            displayNumbers = `${formatNumbersForInvoice(row.numbers, betType)} (x${row.amount}n)`;
          } else if (betType === 'tong') {
            // Tổng calculation
            totalAmount = calculateTongAmount(row.amount);
            displayNumbers = `${formatNumbersForInvoice(row.numbers, betType)} (x${row.amount}n)`;
          } else if (betType === 'kep') {
            // Kép calculation
            totalAmount = calculateKepAmount(row.amount);
            displayNumbers = `${formatNumbersForInvoice(row.numbers, betType)} (x${row.amount}n)`;
          } else if (betType === 'dau' || betType === 'dit') {
            // Đầu/Đít calculation
            totalAmount = calculateDauDitAmount(row.amount);
            displayNumbers = `${formatNumbersForInvoice(row.numbers, betType)} (x${row.amount}n)`;
          } else if (betType === 'bo') {
            // Bộ calculation
            totalAmount = calculateBoAmount(row.boName, row.count, row.amount);
            displayNumbers = `Bộ ${row.boName} (${row.count} số x ${row.amount}n)`;
          } else if (betType === 'xien') {
            // Xiên calculation
            totalAmount = calculateXienAmount(row.numbers, row.amount);
            displayNumbers = `${formatNumbersForInvoice(row.numbers, betType)} (x${row.amount}n)`;
          } else if (betType === 'xienquay') {
            // Xiên quay calculation
            totalAmount = calculateXienQuayAmount(row.numbers, row.amount);
            displayNumbers = `${formatNumbersForInvoice(row.numbers, betType)} (x${row.amount}n)`;
          }

          if (totalAmount > 0) {
            items.push({
              id: `${betType}-${index}`,
              type: betType,
              typeLabel: betLabels[betType],
              displayNumbers: displayNumbers,
              totalAmount: totalAmount
            });
          }
        }
      });
    });

    return items;
  };

  const invoiceItems = generateInvoiceItems();

  const calculateTotal = () => {
    return invoiceItems.reduce((total, item) => total + item.totalAmount, 0);
  };

  const calculateChange = () => {
    const give = parseFloat(customerGive || 0);
    const total = calculateTotal();
    return Math.max(0, give - total); // Ensure non-negative change
  };

  // Convert amount to exact format (no conversion)
  const convertToShortFormat = (amount) => {
    const numAmount = typeof amount === 'string' ? 
      parseFloat(amount.replace(/[^0-9.-]+/g, '')) : amount;
    
    // Return 0 for negative amounts (change calculation)
    if (numAmount < 0) {
      return '0';
    }
    
    // Return exact amount without conversion
    return Math.floor(numAmount).toString();
  };

  // Create printable invoice
  const createPrintableInvoice = (customerName, invoiceId) => {
    const date = new Date().toLocaleDateString('vi-VN');
    
    // Get current time
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    
    // Convert amounts to exact format (no conversion)
    const totalAmount = Math.floor(calculateTotal()).toString();
    const customerGiveAmount = parseFloat(customerGive || calculateTotal());
    const customerPaid = Math.floor(customerGiveAmount).toString();
    const changeAmountValue = Math.max(0, customerGiveAmount - calculateTotal()); // Ensure non-negative
    const changeAmount = Math.floor(changeAmountValue).toString();
    
    // Create iframe for printing
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);
    
    // Get iframe document
    const frameDoc = printFrame.contentWindow.document;
    
    // Create invoice table rows
    const invoiceTableRows = invoiceItems.map(item => {
      const formattedAmount = Math.floor(item.totalAmount).toString() + 'n';
      return `
        <tr>
          <td style="padding: 1px; text-align: left; font-size: 15px; border-bottom: 1px solid #000; width: 22%;">${item.typeLabel}</td>
          <td style="padding: 1px; text-align: left; font-size: 15px; border-bottom: 1px solid #000; width: 45%;">${item.displayNumbers}</td>
          <td style="padding: 1px; text-align: right; font-size: 15px; border-bottom: 1px solid #000; width: 33%;">${formattedAmount}</td>
        </tr>
      `;
    }).join('');
    
    // Create HTML for small invoice
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>In Hóa Đơn</title>
        <style>
          @page {
            size: 70mm auto;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            max-width: 70mm;
            width: 70mm;
            font-size: 15px;
            background-color: white;
          }
          .receipt {
            width: 70mm;
            padding: 0.5mm;
            box-sizing: border-box;
            margin: 0;
          }
          .header {
            text-align: center;
            margin-bottom: 3px;
          }
          .title {
            font-size: 13px;
            font-weight: bold;
            margin: 2px 0;
          }
          .info {
            text-align: left;
            margin-bottom: 3px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 1px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          th {
            text-align: left;
            font-size: 15px;
            padding: 1px;
            border-bottom: 1px solid #000;
          }
          th:first-child {
            width: 22%;
          }
          th:nth-child(2) {
            width: 45%;
          }
          th:last-child {
            width: 33%;
            text-align: right;
          }
          td {
            overflow-wrap: break-word;
            word-wrap: break-word;
            word-break: break-word;
            max-width: 100%;
            font-size: 15px;
          }
          .footer {
            text-align: center;
            margin-top: 3px;
            font-size: 11px;
            padding-bottom: 5px;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 2px 0;
            font-size: 15px;
          }
          .total-section {
            margin: 2px 0;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 1px 0;
            font-weight: bold;
          }
          @media print {
            html, body {
              width: 70mm;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              font-size: 14px;
            }
            .receipt {
              width: 70mm;
              page-break-inside: avoid;
            }
            .no-break {
              page-break-inside: avoid;
            }
            table {
              font-size: 15px;
            }
            th, td {
              font-size: 15px;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="title">${storeInfo?.name || '92 NGUYỄN AN NINH'}</div>
            <div>----------------------</div>
          </div>
          
          <div class="info">
            <div class="info-row">
              <span>Mã HĐ:</span>
              <span>${invoiceId}</span>
            </div>
            <div class="info-row">
              <span>Khách hàng:</span>
              <span>${customerName || 'Khách lẻ'}</span>
            </div>
            <div class="info-row">
              <span>Ngày lập:</span>
              <span>${date} ${currentTime}</span>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 22%;">Loại</th>
                <th style="width: 45%;">Chi tiết</th>
                <th style="width: 33%; text-align: right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceTableRows}
            </tbody>
          </table>
          
          <div class="total-section no-break">
            <div class="total-row">
              <span>Tổng tiền:</span>
              <span>${totalAmount}n</span>
            </div>
            <div class="total-row">
              <span>Tiền khách đưa:</span>
              <span>${customerPaid}n</span>
            </div>
            <div class="total-row">
              <span>Trả lại:</span>
              <span>${changeAmount}n</span>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="footer no-break">
            <p>Quý khách vui lòng kiểm tra lại toàn bộ nội dung cược trước khi rời cửa hàng và mang theo hóa đơn khi lấy thưởng tại cửa hàng!</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              if (window.parent && window.parent.closeInvoicePrint) {
                window.parent.closeInvoicePrint();
              }
            }, 1000);
          };
        </script>
      </body>
      </html>
    `;
    
    // Write content to iframe
    frameDoc.open();
    frameDoc.write(invoiceHTML);
    frameDoc.close();
    
    // Add cleanup function to window
    window.closeInvoicePrint = function() {
      document.body.removeChild(printFrame);
      delete window.closeInvoicePrint;
    };
  };

  // Load invoice for editing
  const loadInvoiceForEdit = async (invoiceId) => {
    try {
      const response = await axios.get(getApiUrl(`/invoice/detail/${invoiceId}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        const invoice = response.data.invoice;
        
        // Set customer info
        setCustomerName(invoice.customerName);
        setCustomerGive(invoice.customerPaid.toString());
        
        // Set edit mode
        setIsEditMode(true);
        setEditInvoiceId(invoiceId);
        setCurrentInvoiceId(invoiceId);
        
        // Convert invoice items back to betData format
        const newBetData = {
          loto: { quantity: 1, rows: [{ numbers: '', points: '' }] },
          '2s': { quantity: 1, rows: [{ numbers: '', amount: '' }] },
          '3s': { quantity: 1, rows: [{ numbers: '', amount: '' }] },
          tong: { quantity: 1, rows: [{ numbers: '', amount: '' }] },
          kep: { quantity: 1, rows: [{ numbers: '', amount: '' }] },
          dau: { quantity: 1, rows: [{ numbers: '', amount: '' }] },
          dit: { quantity: 1, rows: [{ numbers: '', amount: '' }] },
          xien: { quantity: 1, rows: [{ numbers: '', amount: '' }] },
          xienquay: { quantity: 1, rows: [{ numbers: '', amount: '' }] },
          bo: { quantity: 1, rows: [{ boName: '', count: '', amount: '' }] }
        };

        // Group items by bet type
        const itemsByType = {};
        invoice.items.forEach(item => {
          if (!itemsByType[item.betType]) {
            itemsByType[item.betType] = [];
          }
          itemsByType[item.betType].push(item);
        });

        // Convert back to betData format
        Object.entries(itemsByType).forEach(([betType, items]) => {
          if (betType === 'bo') {
            // Special handling for "bộ" type
            newBetData[betType] = {
              quantity: items.length,
              rows: items.map(item => {
                // Parse "Bộ 12" to get boName "12"
                const boMatch = item.numbers ? item.numbers.match(/Bộ (\d+)/) : null;
                const boName = boMatch ? boMatch[1] : '';
                const count = boName && BO_DATA[boName] ? BO_DATA[boName].length.toString() : '';
                
                return {
                  boName: boName,
                  count: count,
                  amount: item.amount ? item.amount.toString() : ''
                };
              })
            };
          } else if (betType === 'loto') {
            // Special handling for "loto" type
          newBetData[betType] = {
            quantity: items.length,
            rows: items.map(item => ({
              numbers: item.numbers,
              points: item.points || '',
              amount: item.amount || ''
            }))
          };
          } else {
            // Standard handling for other types
            newBetData[betType] = {
              quantity: items.length,
              rows: items.map(item => ({
                numbers: item.numbers,
                points: item.points || '',
                amount: item.amount || ''
              }))
            };
          }
        });

        setBetData(newBetData);
        alert('Đã tải hóa đơn thành công. Bạn có thể chỉnh sửa.');
        
      } else {
        alert('Lỗi: ' + response.data.message);
      }
    } catch (error) {
      console.error('Load invoice error:', error);
      alert('Không thể tải hóa đơn: ' + error.message);
    }
  };

  // Save edited invoice
  const saveEditedInvoice = async () => {
    try {
      if (!editInvoiceId) {
        alert('Không có hóa đơn để sửa');
        return;
      }

      const totalAmount = calculateTotal();
      const customerGiveAmount = parseFloat(customerGive || totalAmount);
      const changeAmountValue = Math.max(0, customerGiveAmount - totalAmount);

      // Prepare items data
      const itemsForDB = invoiceItems.map(item => {
        let numbers = '';
        let points = null;
        let amount = null;

        if (item.type === 'bo') {
          // For bo type: "Bộ 03 (8 số x 12n)"
          const boMatch = item.displayNumbers.match(/Bộ (\d+) \((\d+) số x (\d+\.?\d*)n\)/);
          if (boMatch) {
            numbers = `Bộ ${boMatch[1]}`;
            amount = parseFloat(boMatch[3]);
          }
        } else if (item.type === 'loto') {
          // For loto type: "12, 13 (x20đ)"
          numbers = item.displayNumbers.split(' (x')[0];
          const pointsMatch = item.displayNumbers.match(/\(x(\d+\.?\d*)đ\)/);
          points = pointsMatch ? parseFloat(pointsMatch[1]) : null;
        } else {
          // For other types: "12, 13 (x20n)"
          numbers = item.displayNumbers.split(' (x')[0];
          const amountMatch = item.displayNumbers.match(/\(x(\d+\.?\d*)n\)/);
          amount = amountMatch ? parseFloat(amountMatch[1]) : null;
        }

        return {
        betType: item.type,
        betTypeLabel: item.typeLabel,
          numbers: numbers,
        displayNumbers: item.displayNumbers,
          points: points,
          amount: amount,
        totalAmount: item.totalAmount
        };
      });

      const reason = prompt('Nhập lý do sửa hóa đơn (không bắt buộc):') || 'Cập nhật hóa đơn';

      const response = await axios.put(getApiUrl(`/invoice/edit/${editInvoiceId}`), {
        customerName: customerName || 'Khách lẻ',
        items: itemsForDB,
        totalAmount,
        customerPaid: customerGiveAmount,
        changeAmount: changeAmountValue,
        reason
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        alert('Cập nhật hóa đơn thành công!');
        
        // Reset edit mode and create new invoice
        setIsEditMode(false);
        setEditInvoiceId('');
        clearInvoice();
      } else {
        alert('Lỗi: ' + response.data.message);
      }
    } catch (error) {
      console.error('Save edited invoice error:', error);
      
      const errorData = error.response?.data;
      
      // Xử lý lỗi thời gian đặc biệt
      if (errorData?.code === 'BETTING_TIME_EXPIRED') {
        alert(`⏰ THỜI GIAN ĐÃ HẾT!\n\n${errorData.message}\n\nVui lòng liên hệ admin để điều chỉnh thời gian nếu cần thiết.`);
      } else {
        alert('Lỗi khi cập nhật hóa đơn: ' + (errorData?.message || error.message));
      }
    }
  };

  // Delete invoice
  const deleteInvoice = async () => {
    const invoiceIdToDelete = prompt('Nhập mã hóa đơn cần xóa (có thể nhập 4 số cuối, vd: 7710):');
    if (!invoiceIdToDelete) return;

    let finalInvoiceId = invoiceIdToDelete.trim();
    
    // Nếu chỉ là số và ngắn hơn 10 ký tự, tìm hóa đơn theo số cuối
    if (/^\d+$/.test(finalInvoiceId) && finalInvoiceId.length < 10) {
      // Tìm hóa đơn trong danh sách hiện tại theo số cuối
      const foundInvoice = invoiceList.find(invoice => 
        invoice.invoiceId.endsWith(finalInvoiceId)
      );
      
      if (foundInvoice) {
        finalInvoiceId = foundInvoice.invoiceId;
      } else {
        // Nếu không tìm thấy, thêm prefix mặc định
        finalInvoiceId = `HDAS1CHXSS${finalInvoiceId}`;
      }
    }

    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`Bạn có chắc chắn muốn xóa hóa đơn ${finalInvoiceId}?`)) {
      return;
    }

    const reason = prompt('Nhập lý do xóa hóa đơn:') || 'Xóa hóa đơn';

    try {
      const response = await axios.delete(getApiUrl(`/invoice/delete/${finalInvoiceId}`), {
        data: { reason },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        alert('Xóa hóa đơn thành công!');
        // Reload invoice list after deletion
        loadInvoiceList();
      } else {
        alert('Lỗi: ' + response.data.message);
      }
    } catch (error) {
      console.error('Delete invoice error:', error);
      alert('Lỗi khi xóa hóa đơn: ' + error.message);
    }
  };

  // Load invoice history
  const loadInvoiceHistory = async () => {
    try {
      const response = await axios.get(getApiUrl('/invoice/history'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setInvoiceHistory(response.data.histories);
      }
    } catch (error) {
      console.error('Load history error:', error);
    }
  };

  // Load invoice list by date
  const loadInvoiceList = async (date = selectedDate) => {
    setIsLoadingInvoices(true);
    try {
      const response = await axios.get(getApiUrl('/invoice/store'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          startDate: date,
          endDate: date,
          limit: 100 // Load nhiều hóa đơn hơn
        }
      });
      
      if (response.data.success) {
        setInvoiceList(response.data.invoices);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách hóa đơn:', error);
      alert('Không thể tải danh sách hóa đơn');
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  // Load lottery results from API
  const loadLotteryResults = async () => {
    setIsLoadingLottery(true);
    try {
      const response = await axios.get('https://xoso188.net/api/front/open/lottery/history/list/5/miba');
      
      if (response.data.success) {
        const results = response.data.t.issueList;
        setLotteryResults(results);
        
        // Set the most recent result as default
        if (results.length > 0) {
          const latestResult = results[0];
          setCurrentLotteryResult(latestResult);
          setSelectedLotteryDate(latestResult.turnNum);
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải kết quả xổ số:', error);
      alert('Không thể tải kết quả xổ số từ API');
    } finally {
      setIsLoadingLottery(false);
    }
  };

  // Parse lottery detail string into prizes
  const parseLotteryDetail = (detailString) => {
    try {
      const detail = JSON.parse(detailString);
      return {
        gdb: detail[0] || '', // Giải đặc biệt
        g1: detail[1] || '', // Giải nhất
        g2: detail[2] ? detail[2].split(',') : [], // Giải nhì
        g3: detail[3] ? detail[3].split(',') : [], // Giải ba
        g4: detail[4] ? detail[4].split(',') : [], // Giải tư
        g5: detail[5] ? detail[5].split(',') : [], // Giải năm
        g6: detail[6] ? detail[6].split(',') : [], // Giải sáu
        g7: detail[7] ? detail[7].split(',') : []  // Giải bảy
      };
    } catch (error) {
      console.error('Lỗi parse lottery detail:', error);
      return {
        gdb: '', g1: '', g2: [], g3: [], g4: [], g5: [], g6: [], g7: []
      };
    }
  };

  // Handle cell edit
  const handleCellEdit = (prizeType, index, newValue) => {
    if (!currentLotteryResult) return;
    
    const parsed = parseLotteryDetail(currentLotteryResult.detail);
    
    if (prizeType === 'gdb' || prizeType === 'g1') {
      parsed[prizeType] = newValue;
    } else {
      if (parsed[prizeType][index] !== undefined) {
        parsed[prizeType][index] = newValue;
      }
    }
    
    // Update current lottery result
    const newDetail = JSON.stringify([
      parsed.gdb,
      parsed.g1,
      parsed.g2.join(','),
      parsed.g3.join(','),
      parsed.g4.join(','),
      parsed.g5.join(','),
      parsed.g6.join(','),
      parsed.g7.join(',')
    ]);
    
    const updatedResult = {
      ...currentLotteryResult,
      detail: newDetail
    };
    
    setCurrentLotteryResult(updatedResult);
  };

  // Save lottery results to database
  const saveLotteryResults = async () => {
    if (!currentLotteryResult) {
      alert('Không có kết quả nào để lưu');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Vui lòng đăng nhập lại để lưu kết quả xổ số');
        return;
      }

      const parsed = parseLotteryDetail(currentLotteryResult.detail);
      const lotteryData = {
        turnNum: currentLotteryResult.turnNum,
        openTime: currentLotteryResult.openTime,
        openNum: currentLotteryResult.openNum,
        results: {
          gdb: parsed.gdb || '',
          g1: parsed.g1 || '',
          g2: parsed.g2 || [],
          g3: parsed.g3 || [],
          g4: parsed.g4 || [],
          g5: parsed.g5 || [],
          g6: parsed.g6 || [],
          g7: parsed.g7 || []
        }
      };

      console.log('Saving lottery data:', lotteryData);

      const response = await axios.post(getApiUrl('/lottery/save'), lotteryData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        alert('Lưu kết quả xổ số thành công!');
      } else {
        alert('Lỗi: ' + (response.data.message || 'Không thể lưu kết quả xổ số'));
      }
    } catch (error) {
      console.error('Lỗi khi lưu kết quả xổ số:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Không thể lưu kết quả xổ số';
      alert('Lỗi: ' + errorMessage);
    }
  };

  // Handle menu change with unsaved changes warning
  const handleMenuChange = (menuId) => {
    console.log('🔄 Menu change attempt:', { 
      menuId, 
      isEditMode, 
      hasUnsavedChanges,
      currentMenu: activeMenu 
    });
    
          if (isEditMode && hasUnsavedChanges) {
        const confirmLeave = window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn thoát?');
        if (!confirmLeave) {
          console.log('❌ User cancelled menu change');
          return;
        }
        console.log('✅ User confirmed, reloading page...');
        // Tự động reload trang ngay sau khi user confirm
        window.location.reload();
        return;
      }
    setActiveMenu(menuId);
  };

  // Save and print invoice function (for edit mode)
  const saveAndPrintInvoice = async () => {
    try {
      // First save the invoice
      await saveEditedInvoice();
      
      // Then print it
      setTimeout(() => {
        createPrintableInvoice(customerName, currentInvoiceId);
        alert('Hóa đơn đã được cập nhật và in thành công!');
      }, 500);
      
    } catch (error) {
      console.error('Lỗi khi lưu và in hóa đơn:', error);
      alert('Có lỗi xảy ra khi lưu và in hóa đơn');
    }
  };

  // Edit invoice function
  const editInvoice = () => {
    const invoiceIdInput = prompt('Nhập mã hóa đơn cần sửa (có thể nhập 4 số cuối, vd: 7710):');
    if (invoiceIdInput) {
      let invoiceIdToEdit = invoiceIdInput.trim();
      
      // Nếu chỉ là số và ngắn hơn 10 ký tự, tìm hóa đơn theo số cuối
      if (/^\d+$/.test(invoiceIdToEdit) && invoiceIdToEdit.length < 10) {
        // Tìm hóa đơn trong danh sách hiện tại theo số cuối
        const foundInvoice = invoiceList.find(invoice => 
          invoice.invoiceId.endsWith(invoiceIdToEdit)
        );
        
        if (foundInvoice) {
          invoiceIdToEdit = foundInvoice.invoiceId;
        } else {
          // Nếu không tìm thấy, thêm prefix mặc định
          invoiceIdToEdit = `HDAS1CHXSS${invoiceIdToEdit}`;
        }
      }
      
      loadInvoiceForEdit(invoiceIdToEdit);
    }
  };

  // Save invoice to database
  const saveInvoiceToDatabase = async (invoiceData) => {
    try {
      const response = await axios.post(getApiUrl('/invoice/save'), invoiceData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        console.log('Hóa đơn đã được lưu thành công:', response.data.invoice);
        return { success: true, invoice: response.data.invoice };
      } else {
        console.error('Lỗi lưu hóa đơn:', response.data.message);
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      console.error('Lỗi khi lưu hóa đơn:', error);
      
      const errorData = error.response?.data;
      
      // Xử lý lỗi thời gian đặc biệt
      if (errorData?.code === 'BETTING_TIME_EXPIRED') {
        return { 
          success: false, 
          error: `⏰ THỜI GIAN ĐÃ HẾT!\n\n${errorData.message}\n\nVui lòng liên hệ admin để điều chỉnh thời gian nếu cần thiết.`,
          isTimeExpired: true
        };
      }
      
      return { success: false, error: errorData?.message || error.message };
    }
  };

  const printInvoice = async () => {
    // Check for validation errors
    if (Object.keys(validationErrors).length > 0) {
      alert('Vui lòng sửa các lỗi nhập liệu trước khi in hóa đơn');
      return;
    }
    
    if (invoiceItems.length === 0) {
      alert('Chưa có cược nào để in');
      return;
    }

    try {
      // Prepare invoice data for database
      const invoiceId = currentInvoiceId; // Use existing invoice ID
      const totalAmount = calculateTotal();
      const customerGiveAmount = parseFloat(customerGive || totalAmount);
      const changeAmountValue = Math.max(0, customerGiveAmount - totalAmount);

      // Prepare items data for database
      const itemsForDB = invoiceItems.map(item => {
        let numbers = '';
        let points = null;
        let amount = null;

        if (item.type === 'bo') {
          // For bo type: "Bộ 12 (8 số x 20n)"
          const boMatch = item.displayNumbers.match(/Bộ (\d+) \((\d+) số x (\d+)n\)/);
          if (boMatch) {
            numbers = `Bộ ${boMatch[1]}`;
            amount = parseFloat(boMatch[3]);
          }
        } else if (item.type === 'loto') {
          // For loto type: "12, 13 (x20đ)"
          numbers = item.displayNumbers.split(' (x')[0];
          const pointsMatch = item.displayNumbers.match(/\(x(\d+\.?\d*)đ\)/);
          points = pointsMatch ? parseFloat(pointsMatch[1]) : null;
        } else {
          // For other types: "12, 13 (x20n)"
          numbers = item.displayNumbers.split(' (x')[0];
          const amountMatch = item.displayNumbers.match(/\(x(\d+\.?\d*)n\)/);
          amount = amountMatch ? parseFloat(amountMatch[1]) : null;
        }

        return {
          betType: item.type,
          betTypeLabel: item.typeLabel,
          numbers: numbers,
          displayNumbers: item.displayNumbers,
          points: points,
          amount: amount,
          totalAmount: item.totalAmount
        };
      });

      const invoiceData = {
        invoiceId,
        customerName: customerName || 'Khách lẻ',
        items: itemsForDB,
        totalAmount,
        customerPaid: customerGiveAmount,
        changeAmount: changeAmountValue
      };

      // Save to database first
      const saveResult = await saveInvoiceToDatabase(invoiceData);
      
      if (!saveResult.success) {
        alert('Lỗi khi lưu hóa đơn: ' + saveResult.error);
        return;
      }

      // Create and print the invoice after successful save
      createPrintableInvoice(customerName, invoiceId);
      
      // Show success message
              // Hóa đơn đã được lưu và in thành công
      
      // Reset unsaved changes flag
      setHasUnsavedChanges(false);
      
      // Reset form and generate new invoice ID after successful print
      setTimeout(() => {
        setCustomerName('');
        setCustomerGive('');
        setValidationErrors({}); // Clear validation errors
        setBetData({
          loto: { 
            quantity: 1, 
            rows: [{ numbers: '', points: '' }]
          },
          '2s': { 
            quantity: 1, 
            rows: [{ numbers: '', amount: '' }]
          },
          '3s': { 
            quantity: 1, 
            rows: [{ numbers: '', amount: '' }]
          },
          tong: { 
            quantity: 1, 
            rows: [{ numbers: '', amount: '' }]
          },
          kep: { 
            quantity: 1, 
            rows: [{ numbers: '', amount: '' }]
          },
          dau: { 
            quantity: 1, 
            rows: [{ numbers: '', amount: '' }]
          },
          dit: { 
            quantity: 1, 
            rows: [{ numbers: '', amount: '' }]
          },
          xien: { 
            quantity: 1, 
            rows: [{ numbers: '', amount: '' }]
          },
          xienquay: { 
            quantity: 1, 
            rows: [{ numbers: '', amount: '' }]
          },
          bo: { 
            quantity: 1, 
            rows: [{ boName: '', count: '', amount: '' }]
          }
        });
        
        // Generate new invoice ID for next transaction
        generateNewInvoiceId();
      }, 1500); // Wait a bit for print dialog to appear

    } catch (error) {
      console.error('Lỗi khi in hóa đơn:', error);
      alert('Có lỗi xảy ra khi in hóa đơn: ' + error.message);
    }
  };

  const clearInvoice = () => {
    setCustomerName('');
    setCustomerGive('');
    setValidationErrors({}); // Clear validation errors
    setBetData({
      loto: { 
        quantity: 1, 
        rows: [{ numbers: '', points: '' }]
      },
      '2s': { 
        quantity: 1, 
        rows: [{ numbers: '', amount: '' }]
      },
      '3s': { 
        quantity: 1, 
        rows: [{ numbers: '', amount: '' }]
      },
      tong: { 
        quantity: 1, 
        rows: [{ numbers: '', amount: '' }]
      },
      kep: { 
        quantity: 1, 
        rows: [{ numbers: '', amount: '' }]
      },
      dau: { 
        quantity: 1, 
        rows: [{ numbers: '', amount: '' }]
      },
      dit: { 
        quantity: 1, 
        rows: [{ numbers: '', amount: '' }]
      },
      xien: { 
        quantity: 1, 
        rows: [{ numbers: '', amount: '' }]
      },
      xienquay: { 
        quantity: 1, 
        rows: [{ numbers: '', amount: '' }]
      }
    });
    
    // Generate new invoice ID
    generateNewInvoiceId();
  };

  const deleteInvoiceByDate = () => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('Bạn có chắc chắn muốn xóa tất cả hóa đơn theo ngày?')) {
      clearInvoice();
      alert('Đã xóa tất cả hóa đơn theo ngày');
    }
  };

  // Format history changes for better display
  const formatHistoryChange = (field, change) => {
    switch(field) {
      case 'customerName':
        return `Tên khách hàng: "${change.from}" → "${change.to}"`;
      case 'totalAmount':
        return `Tổng tiền: ${change.from?.toLocaleString()} → ${change.to?.toLocaleString()} VNĐ`;
      case 'customerPaid':
        return `Khách đưa: ${change.from?.toLocaleString()} → ${change.to?.toLocaleString()} VNĐ`;
      case 'changeAmount':
        return `Tiền thừa: ${change.from?.toLocaleString()} → ${change.to?.toLocaleString()} VNĐ`;
      case 'items':
        const fromCount = Array.isArray(change.from) ? change.from.length : 0;
        const toCount = Array.isArray(change.to) ? change.to.length : 0;
        
        // Show summary of bet types changed
        const fromSummary = formatItemsSummary(change.from);
        const toSummary = formatItemsSummary(change.to);
        
        return `Cược: ${fromSummary} → ${toSummary}`;
      default:
        // For other fields, try to show a simplified version
        if (typeof change.from === 'object' || typeof change.to === 'object') {
          return `${field}: Đã thay đổi nội dung`;
        }
        return `${field}: "${change.from}" → "${change.to}"`;
    }
  };

  // Format items summary for history
  const formatItemsSummary = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
      return 'Không có cược';
    }

    const betTypes = {};
    items.forEach(item => {
      const type = item.betTypeLabel || item.betType || 'Khác';
      if (!betTypes[type]) {
        betTypes[type] = { count: 0, total: 0 };
      }
      betTypes[type].count++;
      betTypes[type].total += item.totalAmount || 0;
    });

    const summary = Object.entries(betTypes)
      .map(([type, data]) => `${type}(${data.count})`)
      .join(', ');

    return summary || 'Không có cược';
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  const menuItems = [
    { id: 'betting', label: 'Nhập cược', icon: '📝' },
    { id: 'statistics', label: 'Thống kê cược', icon: '📊' },
    { id: 'lottery', label: 'Kết quả xổ số', icon: '🎯' },
    { id: 'prizes', label: 'Tính thưởng', icon: '🏆' },
    { id: 'prize-statistics', label: 'Thống kê thưởng', icon: '💰' },
    { id: 'prize-settings', label: 'Hệ số thưởng', icon: '⚙️' },
    { id: 'loto-multiplier', label: 'Hệ số lô', icon: '🎯' },
    { id: 'invoices', label: 'Danh sách hóa đơn', icon: '📋' },
    { id: 'history', label: 'Lịch sử sửa đổi', icon: '📚' }
  ];

  const getPlaceholderText = (betType) => {
    switch(betType) {
      case 'loto':
        return "VD: 12, 13, 23, 44, 22, 33";
      case '2s':
        return "VD: 12, 14, 16 (00-99)";
      case '3s':
        return "VD: 112, 430, 223 (000-999)";
      case 'tong':
        return "VD: 3 hoặc tổng 3 (0-9)";
      case 'kep':
        return "VD: bằng hoặc lệch";
      case 'dau':
        return "VD: 3 hoặc đầu 3 (0-9)";
      case 'dit':
        return "VD: 3 hoặc đít 3 (0-9)";
      case 'xien':
        return "VD: 12-13, 14-23-45 (xiên 2,3,4)";
      case 'xienquay':
        return "VD: 12-13-14, 12-13-14-15 (xiên quay 3,4)";
      case 'bo':
        return "VD: 12, 00, 05 (Tên bộ 00-99)";
      default:
        return "VD: 12";
    }
  };

  const getAmountPlaceholder = (betType) => {
    if (betType === 'loto') {
      return "Điểm (VD: 20)";
    }
    return "Tiền (VD: 30)";
  };

  const getCalculationPreview = (betType, row) => {
    // Special check for bo type
    if (betType === 'bo') {
      if (!row.boName || !row.count || !row.amount) return null;
    } else {
      if (!row.numbers || (!row.points && !row.amount)) return null;
    }

    let preview = '';
    switch(betType) {
      case 'loto':
        const loCount = row.numbers.trim().split(/[\s,]+/).filter(n => n.length > 0).length;
        preview = `${loCount} con x ${row.points} điểm x ${lotoMultiplier} = ${calculateLoAmount(row.numbers, row.points).toLocaleString()} VNĐ`;
        break;
      case '2s':
        const count2s = row.numbers.trim().split(/[\s,]+/).filter(n => n.length > 0).length;
        preview = `${count2s} con x ${row.amount} = ${calculate2SAmount(row.numbers, row.amount).toLocaleString()} VNĐ`;
        break;
      case '3s':
        const count3s = row.numbers.trim().split(/[\s,]+/).filter(n => n.length > 0).length;
        preview = `${count3s} con x ${row.amount} = ${calculate3SAmount(row.numbers, row.amount).toLocaleString()} VNĐ`;
        break;
      case 'tong':
        preview = `Tổng x ${row.amount} = ${calculateTongAmount(row.amount).toLocaleString()} VNĐ`;
        break;
      case 'kep':
        preview = `Kép x ${row.amount} = ${calculateKepAmount(row.amount).toLocaleString()} VNĐ`;
        break;
      case 'dau':
        preview = `Đầu x ${row.amount} = ${calculateDauDitAmount(row.amount).toLocaleString()} VNĐ`;
        break;
      case 'dit':
        preview = `Đít x ${row.amount} = ${calculateDauDitAmount(row.amount).toLocaleString()} VNĐ`;
        break;
      case 'xien':
        const xienCount = row.numbers.trim().split(/[\s,]+/).filter(x => x.length > 0).length;
        preview = `${xienCount} xiên x ${row.amount} = ${calculateXienAmount(row.numbers, row.amount).toLocaleString()} VNĐ`;
        break;
      case 'xienquay':
        const xienQuayItems = row.numbers.trim().split(/[\s,]+/).filter(x => x.length > 0);
        let xienQuayDetail = '';
        let totalMultiplier = 0;
        
        xienQuayItems.forEach(item => {
          const numbers = item.split('-');
          if (numbers.length === 3) {
            totalMultiplier += 4;
            xienQuayDetail += (xienQuayDetail ? ' + ' : '') + `${item}(x4)`;
          } else if (numbers.length === 4) {
            totalMultiplier += 11;
            xienQuayDetail += (xienQuayDetail ? ' + ' : '') + `${item}(x11)`;
          }
        });
        
        preview = `${xienQuayDetail} = ${row.amount} x ${totalMultiplier} = ${calculateXienQuayAmount(row.numbers, row.amount).toLocaleString()} VNĐ`;
        break;
      case 'bo':
        if (row.boName && row.count && row.amount) {
          const totalAmount = parseInt(row.amount) * parseInt(row.count);
          preview = `Bộ ${row.boName} x ${row.count} số x ${row.amount} = ${totalAmount.toLocaleString()} VNĐ`;
        }
        break;
      default:
        break;
    }
    return preview;
  };

  const renderBetTypeRows = (betType) => {
    const bet = betData[betType];
    const isLoto = betType === 'loto';
    const isBo = betType === 'bo';
    
    // Safety check - if bet data doesn't exist, return null
    if (!bet) {
      console.error(`Bet data not found for type: ${betType}`);
      return null;
    }
    
    return (
      <>
        {/* Header row with bet type name and quantity */}
        <tr>
          <td className="bet-type-name">{betType === 'loto' ? 'Loto' : betType.toUpperCase()}</td>
          <td className="quantity-cell">
            <QuantityControls
              value={bet.quantity}
              onChange={(value) => handleQuantityChange(betType, value)}
              min={1}
              max={20}
              step={1}
            />
          </td>
          <td></td>
        </tr>
        
        {/* Dynamic rows based on quantity */}
        {bet.rows.map((row, index) => (
          <tr key={`${betType}-${index}`} className="bet-inputs-row">
            <td colSpan="3">
              <div className="bet-inputs">
                {isBo ? (
                  // Special layout for Bộ with 3 inputs
                  <>
                    <input
                      type="text"
                      value={row.boName}
                      onChange={(e) => handleBoNameChange(betType, index, e.target.value)}
                      onBlur={(e) => handleBoNameBlur(betType, index, e.target.value, e)}
                      placeholder="Tên bộ (VD: 12, 00)"
                      className={`bo-name-input ${validationErrors[`${betType}-${index}`] ? 'error' : ''}`}
                      ref={el => inputRefs.current[`${betType}-${index}`] = el}
                    />
                    <input
                      type="text"
                      value={row.count}
                      readOnly
                      placeholder="Số lượng"
                      className="bo-count-input"
                    />
                    <input
                      type="text"
                      value={row.amount}
                      onChange={(e) => handleRowChange(betType, index, 'amount', e.target.value)}
                      onBlur={(e) => handleInputBlur(betType, index, 'amount', e.target.value, e)}
                      placeholder="Tiền (VD: 30)"
                      className="amount-input"
                    />
                  </>
                ) : (
                  // Normal layout for other bet types
                  <>
                    <input
                      type="text"
                      value={row.numbers}
                      onChange={(e) => handleRowChange(betType, index, 'numbers', e.target.value)}
                      onBlur={(e) => handleInputBlur(betType, index, 'numbers', e.target.value, e)}
                      placeholder={getPlaceholderText(betType)}
                      className={`numbers-input ${validationErrors[`${betType}-${index}`] ? 'error' : ''}`}
                      ref={el => inputRefs.current[`${betType}-${index}`] = el}
                    />
                    <input
                      type="text"
                      value={isLoto ? row.points : row.amount}
                      onChange={(e) => handleRowChange(betType, index, isLoto ? 'points' : 'amount', e.target.value)}
                      onBlur={(e) => handleInputBlur(betType, index, isLoto ? 'points' : 'amount', e.target.value, e)}
                      placeholder={getAmountPlaceholder(betType)}
                      className="amount-input"
                    />
                  </>
                )}
              </div>
              {getCalculationPreview(betType, row) && (
                <div className="calculation-preview">
                  {getCalculationPreview(betType, row)}
                </div>
              )}
              {validationErrors[`${betType}-${index}`] && (
                <div className="validation-error">{validationErrors[`${betType}-${index}`]}</div>
              )}
            </td>
          </tr>
        ))}
      </>
    );
  };

  const renderBettingInterface = () => (
    <div className="betting-main-container">
      {/* Left side - Betting Form */}
      <div className="betting-form-section">
        <div className="form-header-info">
          <div className="bill-info">
            <div><strong>Mã hóa đơn:</strong> {currentInvoiceId}</div>
            <div><strong>Ngày:</strong> {new Date().toLocaleDateString('vi-VN')}</div>
          </div>
          <div className="customer-section">
            <label><strong>Khách hàng:</strong></label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                if (isEditMode) {
                  console.log('📝 Customer name changed in edit mode:', e.target.value);
                  setHasUnsavedChanges(true);
                }
              }}
              placeholder="Nhập tên khách hàng"
              className="customer-name-input"
            />
          </div>
        </div>

        <div className="betting-table-container">
          <table className="betting-table">
            <tbody>
              {/* Loto section */}
              {renderBetTypeRows('loto')}
              
              {/* Other bet types */}
              {['2s', '3s', 'tong', 'kep', 'dau', 'dit', 'bo', 'xien', 'xienquay'].map(betType => 
                renderBetTypeRows(betType)
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right side - Invoice */}
      <div className="invoice-section">
        <div className="invoice-header">
          <div className="store-name">{storeInfo?.name || user.storeName}</div>
          <div className="invoice-details">
            <div><strong>Mã hóa đơn:</strong> {currentInvoiceId}</div>
            <div><strong>Chi tiết cược</strong></div>
            {isEditMode && hasUnsavedChanges && (
              <div style={{color: '#e74c3c', fontSize: '12px', marginTop: '4px'}}>
                ⚠️ Có thay đổi chưa lưu
              </div>
            )}
          </div>
        </div>

        <div className="invoice-content">
          <div className="invoice-table-section">
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Loại cược</th>
                  <th>Số đã đánh</th>
                  <th>Tổng tiền</th>
                </tr>
              </thead>
              <tbody>
                {invoiceItems.map((item) => (
                  <tr key={item.id}>
                    <td className="bet-type-label">{item.typeLabel}</td>
                    <td className="bet-numbers-cell">{item.displayNumbers}</td>
                    <td className="bet-total-cell">
                      <span>{item.totalAmount.toLocaleString()}n</span>
                    </td>
                  </tr>
                ))}
                {invoiceItems.length === 0 && (
                  <tr>
                    <td colSpan="3" className="empty-invoice-message">
                      Chưa có cược nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="invoice-summary">
            <div className="total-amount-row">
              <strong>Tổng tiền: {calculateTotal().toLocaleString()}n</strong>
            </div>
          </div>

          <div className="payment-info">
            <div className="payment-row">
              <span>Khách phải trả:</span>
              <span>{calculateTotal().toLocaleString()}n</span>
            </div>
            <div className="payment-row">
              <span>Khách đưa:</span>
              <div className="customer-give-section">
                <input
                  type="text"
                  value={customerGive}
                  onChange={(e) => {
                    setCustomerGive(e.target.value);
                    if (isEditMode) setHasUnsavedChanges(true);
                  }}
                  placeholder="Nhập số tiền"
                  className="customer-give-input"
                />
                <span>n</span>
              </div>
            </div>
            <div className="payment-row">
              <span>Trả lại:</span>
              <span className={calculateChange() < 0 ? 'negative-amount' : 'positive-amount'}>
                {calculateChange().toLocaleString()}n
              </span>
            </div>
          </div>

          <div className="notice-text">
            Quý khách vui lòng kiểm tra lại toàn bộ nội dung cược trước khi rời cửa hàng và mang theo hóa đơn khi lấy thưởng tại cửa hàng!
          </div>

          <div className="invoice-actions">
            <div className="main-actions">
              {isEditMode ? (
                <>
            <button 
                    onClick={saveEditedInvoice} 
              className="btn btn-print"
            >
                    Cập Nhật Hóa Đơn
            </button>
                  <button 
                    onClick={saveAndPrintInvoice} 
                    className="btn btn-save-print"
                  >
                    Lưu và In Hóa Đơn
                  </button>
                </>
              ) : (
                <button 
                  onClick={printInvoice} 
                  className="btn btn-print"
                >
                  In Hóa Đơn
                </button>
              )}
            </div>
            
            <div className="secondary-actions">
            <button onClick={editInvoice} className="btn btn-edit">
              Sửa Hóa Đơn
            </button>
            <button onClick={deleteInvoice} className="btn btn-delete">
              Xóa Hóa Đơn
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistoryInterface = () => (
    <div className="history-container">
      <div className="history-header">
        <h3>Lịch sử sửa đổi hóa đơn</h3>
        <button onClick={loadInvoiceHistory} className="btn btn-refresh">
          Tải lại
        </button>
      </div>
      
      <div className="history-content">
        {invoiceHistory.length === 0 ? (
          <div className="no-history">
            <p>Chưa có lịch sử sửa đổi nào</p>
          </div>
        ) : (
          <div className="history-list">
            {invoiceHistory.map((history, index) => (
              <div key={index} className="history-item">
                <div className="history-header-info">
                  <div className="history-invoice-id">
                    <strong>Mã HĐ: {history.invoiceId}</strong>
                  </div>
                  <div className="history-action">
                    <span className={`action-badge ${history.action}`}>
                      {history.action === 'edit' ? 'Sửa' : 'Xóa'}
                    </span>
                  </div>
                  <div className="history-date">
                    {new Date(history.actionDate).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                  </div>
                </div>
                
                <div className="history-details">
                  <div className="history-employee">
                    <strong>Nhân viên:</strong> {history.employeeId?.name || 'N/A'}
                  </div>
                  <div className="history-reason">
                    <strong>Lý do:</strong> {history.reason || 'Không có'}
                  </div>
                  
                  {history.action === 'edit' && Object.keys(history.changes).length > 0 && (
                    <div className="history-changes">
                      <strong>Thay đổi:</strong>
                      <ul>
                        {Object.entries(history.changes).map(([field, change]) => (
                          <li key={field}>
                            {formatHistoryChange(field, change)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const formatBetDetails = (items) => {
    const betGroups = {};
    
    items.forEach(item => {
      if (!betGroups[item.betType]) {
        betGroups[item.betType] = [];
      }
      betGroups[item.betType].push(item);
    });

    return Object.entries(betGroups).map(([betType, betItems]) => {
      const label = betItems[0].betTypeLabel;
      const details = betItems.map(item => {
        const numbers = item.numbers || '';
        const amount = item.points || item.amount || 0;
        const total = item.totalAmount || 0;
        return `${numbers} (${amount}${betType === 'loto' ? 'đ' : 'n'}) = ${total.toLocaleString()}`;
      }).join(', ');
      
      return `${label}: ${details}`;
    }).join(' | ');
  };

  const renderInvoiceListInterface = () => (
    <div className="invoice-list-container">
      <div className="invoice-list-header">
        <h3>Danh sách hóa đơn</h3>
        <div className="controls-row">
        <div className="date-filter">
          <label htmlFor="invoice-date">Chọn ngày:</label>
          <input
            id="invoice-date"
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              loadInvoiceList(e.target.value);
            }}
            className="date-input"
          />
          <button onClick={() => loadInvoiceList(selectedDate)} className="btn btn-refresh">
            Làm mới
          </button>
          </div>
          
          <div className="search-filter">
            <label htmlFor="search-invoice-list">Tìm hóa đơn:</label>
            <input 
              id="search-invoice-list"
              type="text" 
              value={searchInvoiceList}
              onChange={(e) => setSearchInvoiceList(e.target.value)}
              placeholder="Nhập số cuối hóa đơn (vd: 17710)"
              className="search-input"
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                width: '200px'
              }}
            />
          </div>
        </div>
      </div>

      {isLoadingInvoices ? (
        <div className="loading">
          <p>Đang tải danh sách hóa đơn...</p>
        </div>
      ) : invoiceList.length === 0 ? (
        <div className="no-invoices">
          <p>Không có hóa đơn nào trong ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}</p>
        </div>
      ) : (
        <div className="invoice-list">
          {(() => {
            // Lọc hóa đơn theo tìm kiếm
            const filteredInvoices = invoiceList.filter(invoice => {
              if (searchInvoiceList) {
                const invoiceId = invoice.invoiceId.toLowerCase();
                const searchTerm = searchInvoiceList.toLowerCase();
                return invoiceId.includes(searchTerm);
              }
              return true;
            });
            
            return (
              <>
          <div className="invoice-summary">
                  <p><strong>Tổng số hóa đơn:</strong> {filteredInvoices.length} {searchInvoiceList && `(lọc từ ${invoiceList.length})`}</p>
                  <p><strong>Tổng tiền:</strong> {filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toLocaleString()} VNĐ</p>
          </div>
          
          <div className="invoice-table-container">
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Mã HĐ</th>
                  <th>Khách hàng</th>
                  <th>Chi tiết cược</th>
                  <th>Tổng tiền</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice._id} className="invoice-row">
                    <td className="invoice-id-cell">
                      <strong>{invoice.invoiceId}</strong>
                    </td>
                    <td className="customer-cell">
                      {invoice.customerName}
                    </td>
                    <td className="bet-details-cell">
                      <div className="bet-details">
                        {formatBetDetails(invoice.items)}
                      </div>
                    </td>
                    <td className="amount-cell">
                      <strong>{invoice.totalAmount.toLocaleString()} VNĐ</strong>
                    </td>
                    <td className="time-cell">
                      {new Date(invoice.printedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );

  const renderEditableCell = (value, prizeType, index = null) => {
    const cellKey = `${prizeType}-${index || 0}`;
    
    return (
      <div 
        className="editable-cell"
        onClick={() => setEditableCells({...editableCells, [cellKey]: true})}
      >
        {editableCells[cellKey] ? (
          <input
            type="text"
            value={value}
            onChange={(e) => handleCellEdit(prizeType, index, e.target.value)}
            onBlur={() => setEditableCells({...editableCells, [cellKey]: false})}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                setEditableCells({...editableCells, [cellKey]: false});
              }
            }}
            autoFocus
            className="cell-input"
          />
        ) : (
          <span className="cell-value">{value || '---'}</span>
        )}
      </div>
    );
  };

  const renderLotteryInterface = () => {
    if (isLoadingLottery) {
      return (
        <div className="lottery-loading">
          <p>Đang tải kết quả xổ số...</p>
        </div>
      );
    }

    if (!currentLotteryResult) {
      return (
        <div className="no-lottery-data">
          <p>Không có dữ liệu kết quả xổ số</p>
          <button onClick={loadLotteryResults} className="btn btn-refresh">
            Tải lại
          </button>
        </div>
      );
    }

    const parsed = parseLotteryDetail(currentLotteryResult.detail);

    return (
      <div className="lottery-container">
        <div className="lottery-header">
          <h3>Kết quả xổ số Miền Bắc</h3>
          <div className="lottery-controls">
            <select
              value={selectedLotteryDate}
              onChange={(e) => {
                const selected = lotteryResults.find(r => r.turnNum === e.target.value);
                if (selected) {
                  setCurrentLotteryResult(selected);
                  setSelectedLotteryDate(e.target.value);
                  setEditableCells({});
                }
              }}
              className="date-select"
            >
              {lotteryResults.map(result => (
                <option key={result.turnNum} value={result.turnNum}>
                  {result.turnNum} - {new Date(result.openTime).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                </option>
              ))}
            </select>
            <button onClick={loadLotteryResults} className="btn btn-refresh">
              Làm mới
            </button>
          </div>
        </div>

        <div className="lottery-table-container">
          <table className="lottery-table">
            <tbody>
              <tr className="gdb-row">
                <td className="prize-label gdb-label">G.ĐB</td>
                <td className="prize-numbers gdb-numbers" colSpan="4">
                  {renderEditableCell(parsed.gdb, 'gdb')}
                </td>
              </tr>
              
              <tr>
                <td className="prize-label">G.1</td>
                <td className="prize-numbers" colSpan="4">
                  {renderEditableCell(parsed.g1, 'g1')}
                </td>
              </tr>
              
              <tr>
                <td className="prize-label">G.2</td>
                {parsed.g2.slice(0, 2).map((num, idx) => (
                  <td key={idx} className="prize-numbers">
                    {renderEditableCell(num, 'g2', idx)}
                  </td>
                ))}
                {/* Fill empty cells to make exactly 2 cells for G.2 */}
                {Array.from({length: Math.max(0, 2 - parsed.g2.length)}).map((_, idx) => (
                  <td key={`empty-g2-${idx}`} className="prize-numbers">
                    {renderEditableCell('', 'g2', parsed.g2.length + idx)}
                  </td>
                ))}
                {/* Fill remaining 2 cells to complete the row */}
                <td className="prize-numbers empty-cell" colSpan="2"></td>
              </tr>
              
              <tr>
                <td className="prize-label">G.3</td>
                <td className="prize-numbers" colSpan="4">
                  <div className="multi-numbers">
                    {parsed.g3.map((num, idx) => (
                      <div key={idx} className="number-item">
                        {renderEditableCell(num, 'g3', idx)}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
              
              <tr>
                <td className="prize-label">G.4</td>
                {parsed.g4.map((num, idx) => (
                  <td key={idx} className="prize-numbers">
                    {renderEditableCell(num, 'g4', idx)}
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="prize-label">G.5</td>
                <td className="prize-numbers" colSpan="4">
                  <div className="multi-numbers">
                    {parsed.g5.map((num, idx) => (
                      <div key={idx} className="number-item">
                        {renderEditableCell(num, 'g5', idx)}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
              
              <tr>
                <td className="prize-label">G.6</td>
                {parsed.g6.map((num, idx) => (
                  <td key={idx} className="prize-numbers">
                    {renderEditableCell(num, 'g6', idx)}
                  </td>
                ))}
              </tr>
              
              <tr>
                <td className="prize-label">G.7</td>
                {parsed.g7.map((num, idx) => (
                  <td key={idx} className="prize-numbers">
                    {renderEditableCell(num, 'g7', idx)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="lottery-actions">
          <button onClick={saveLotteryResults} className="btn btn-save">
            💾 Lưu kết quả
          </button>
          <div className="lottery-info">
            <p><strong>Ngày:</strong> {currentLotteryResult.turnNum}</p>
            <p><strong>Thời gian:</strong> {new Date(currentLotteryResult.openTime).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch(activeMenu) {
      case 'betting':
        return renderBettingInterface();
      case 'statistics':
        return <Statistics />;
      case 'lottery':
        return renderLotteryInterface();
      case 'prizes':
        return <PrizeInterface />;
      case 'prize-statistics':
        return <PrizeStatistics />;
      case 'prize-settings':
        return <PrizeSettings />;
      case 'loto-multiplier':
        return <LotoMultiplierSettings />;
      case 'invoices':
        return renderInvoiceListInterface();
      case 'history':
        return renderHistoryInterface();
      default:
        return renderBettingInterface();
    }
  };

  return (
    <div className="employee-interface">
      {/* Sidebar Menu */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="store-info">
            <h3>{storeInfo?.name || user.storeName}</h3>
            <div className="store-details">
              <div>Mã hóa đơn: {currentInvoiceId}</div>
              <div>Chi tiết cược</div>
            </div>
          </div>
        </div>

        <div className="sidebar-menu">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`menu-item ${activeMenu === item.id ? 'active' : ''}`}
              onClick={() => handleMenuChange(item.id)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div className="user-details">
              <div className="user-name">{user.name}</div>
              <div className="user-role">Nhân viên</div>
            </div>
          </div>
          <button onClick={logout} className="logout-btn">Đăng xuất</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-header">
          <h2>{storeInfo?.name || user.storeName}</h2>
          <div className="store-info-header">
            {storeInfo && (
              <>
                <div>Địa chỉ: {storeInfo.address}</div>
                <div>SĐT: {storeInfo.phone}</div>
              </>
            )}
          </div>
        </div>

        <div className="content-body">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default EmployeeInterface; 