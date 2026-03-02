import { getApiUrl } from '../config/api';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PrizeInterface.css';

const PrizeInterface = ({ onCalculatingChange }) => {
  const [winningInvoices, setWinningInvoices] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmStep, setConfirmStep] = useState(1);
  const [lotteryPreview, setLotteryPreview] = useState(null);
  const [hasCheckedResponsibility, setHasCheckedResponsibility] = useState(false);
  // Get current date in Vietnam timezone (UTC+7)
  const getCurrentVietnamDate = () => {
    const now = new Date();
    // Sử dụng Intl để lấy đúng ngày theo múi giờ Việt Nam
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    return parts; // format: YYYY-MM-DD
  };

  const [selectedDate, setSelectedDate] = useState(getCurrentVietnamDate());
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [paidFilter, setPaidFilter] = useState('all'); // 'all', 'paid', 'unpaid'
  const [searchInvoice, setSearchInvoice] = useState(''); // Tìm kiếm theo mã hóa đơn
  const [hasCalculatedToday, setHasCalculatedToday] = useState(false);
  const [hasLotteryResult, setHasLotteryResult] = useState(false);

  // Check if lottery results exist for this date
  const checkLotteryResult = async (dateStr) => {
    try {
      const token = localStorage.getItem('token');
      const url = getApiUrl(`/lottery/results?date=${dateStr}`);
      console.log('🔍 [checkLotteryResult] Checking date:', dateStr, 'URL:', url);
      const resp = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = resp.data?.lotteryResults || [];
      const hasResult = Array.isArray(list) && list.length > 0;
      console.log('🔍 [checkLotteryResult] Results:', list.length, 'hasResult:', hasResult);
      setHasLotteryResult(hasResult);
    } catch (error) {
      console.error('Lỗi kiểm tra kết quả xổ số:', error);
      setHasLotteryResult(false);
    }
  };

  // Effect để kiểm tra trạng thái đã tính thưởng khi thay đổi ngày và thiết lập socket
  useEffect(() => {
    const calculated = sessionStorage.getItem(`calculated_${selectedDate}`);
    setHasCalculatedToday(calculated === 'true');

    // Initial check
    checkLotteryResult(selectedDate);

    // Setup socket listener for real-time updates
    const { io } = require('socket.io-client');
    const baseUrl = getApiUrl('').replace('/api', '');
    const socket = io(baseUrl);

    socket.on('lottery_result_updated', (data) => {
      // Re-check lottery result when an update occurs
      // Even if another date was updated, it's safer to just re-check current selected date
      console.log('Lottery result updated event received:', data);
      checkLotteryResult(selectedDate);
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedDate]);

  // Lấy danh sách hóa đơn trúng thưởng
  const loadWinningInvoices = async (date = null, filterPaid = null) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      let url = date ? `/prize/winning-invoices?date=${date}` : '/prize/winning-invoices';

      // Thêm filter trạng thái trả thưởng
      if (filterPaid && filterPaid !== 'all') {
        const isPaidParam = filterPaid === 'paid' ? 'true' : 'false';
        url += (url.includes('?') ? '&' : '?') + `isPaid=${isPaidParam}`;
      }

      console.log('🔍 Loading winning invoices with URL:', getApiUrl(url));
      console.log('🔍 Token:', token ? 'Present' : 'Missing');

      const response = await axios.get(getApiUrl(url), {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Response:', response.data);
      setWinningInvoices(response.data);
    } catch (error) {
      console.error('❌ Lỗi tải danh sách thưởng:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      alert(`Lỗi khi tải danh sách hóa đơn trúng thưởng: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle trạng thái trả thưởng
  const togglePaidStatus = async (invoiceId) => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.put(
        getApiUrl(`/prize/winning-invoices/${invoiceId}/toggle-paid`),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Tải lại danh sách
      await loadWinningInvoices(selectedDate, paidFilter);

    } catch (error) {
      console.error('Lỗi toggle trạng thái:', error);
    }
  };

  // Tính thưởng cho ngày được chọn
  const calculatePrizes = async () => {
    // Định nghĩa event handlers
    let handleBeforeUnload;
    let handleVisibilityChange;

    try {
      setIsCalculating(true);
      // Thông báo cho parent component về trạng thái tính thưởng
      if (onCalculatingChange) {
        onCalculatingChange(true);
      }

      // Thêm event listener để ngăn chặn việc rời khỏi trang
      handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = 'Đang tính thưởng, vui lòng không đóng trang hoặc chuyển tab!';
        return 'Đang tính thưởng, vui lòng không đóng trang hoặc chuyển tab!';
      };

      handleVisibilityChange = () => {
        if (document.hidden) {
          alert('⚠️ Cảnh báo: Đang tính thưởng, vui lòng không chuyển tab khác để đảm bảo quá trình hoàn tất!');
        }
      };

      // Thêm event listeners
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      const token = localStorage.getItem('token');

      const response = await axios.post(getApiUrl('/prize/calculate'),
        { date: selectedDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`${response.data.message}`);

      // Đánh dấu đã tính thưởng cho ngày hôm nay
      setHasCalculatedToday(true);
      sessionStorage.setItem(`calculated_${selectedDate}`, 'true');

      // Tải lại danh sách sau khi tính thưởng
      await loadWinningInvoices(selectedDate, paidFilter);

    } catch (error) {
      console.error('Lỗi tính thưởng:', error);
      alert('Lỗi khi tính thưởng: ' + (error.response?.data?.message || error.message));
    } finally {
      // Xóa event listeners sau khi hoàn thành hoặc có lỗi
      if (handleBeforeUnload) {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
      if (handleVisibilityChange) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      setIsCalculating(false);
      // Thông báo cho parent component về trạng thái tính thưởng
      if (onCalculatingChange) {
        onCalculatingChange(false);
      }
    }
  };

  // Kiểm tra kết quả xổ số trước khi tính thưởng và hiển thị xác nhận
  const handleCalculateClick = async () => {
    try {
      const token = localStorage.getItem('token');
      const resp = await axios.get(getApiUrl(`/lottery/results?date=${selectedDate}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = resp.data?.lotteryResults || [];
      if (!Array.isArray(list) || list.length === 0) {
        const [y, m, d] = selectedDate.split('-');
        const displayDate = `${d}/${m}/${y}`;
        alert(`Chưa có kết quả xổ cho ngày ${displayDate}, vui lòng đợi trong giây lát.`);
        return;
      }
      // Có kết quả: mở modal xác nhận và hiển thị
      setLotteryPreview(list[0]);
      setConfirmStep(1);
      setHasCheckedResponsibility(false); // Reset checkbox
      setConfirmOpen(true);
    } catch (error) {
      console.error('Lỗi kiểm tra kết quả xổ số:', error);
      alert('Không kiểm tra được kết quả xổ số. Vui lòng thử lại sau.');
    }
  };

  // Format tiền tệ
  const formatMoney = (amount) => {
    if (!amount || amount === 0) return '0 đ';
    return Math.floor(amount).toLocaleString('vi-VN').replace(/,/g, '.') + ' đ';
  };

  // Format ngày giờ
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  };

  useEffect(() => {
    loadWinningInvoices(selectedDate, paidFilter);
  }, [selectedDate, paidFilter]);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    loadWinningInvoices(newDate, paidFilter);
  };

  const handlePaidFilterChange = (e) => {
    const newFilter = e.target.value;
    setPaidFilter(newFilter);
    loadWinningInvoices(selectedDate, newFilter);
  };

  // Lọc hóa đơn theo trạng thái và tìm kiếm
  const filteredInvoices = winningInvoices.filter(invoice => {
    // Lọc theo tìm kiếm mã hóa đơn hoặc tên khách hàng
    if (searchInvoice) {
      const invoiceId = (invoice.originalInvoiceId || invoice.invoiceId).toLowerCase();
      const customerName = (invoice.customerName || '').toLowerCase();
      const searchTerm = searchInvoice.toLowerCase();

      // Tìm kiếm theo số cuối, mã đầy đủ hoặc tên khách hàng
      if (!invoiceId.includes(searchTerm) && !customerName.includes(searchTerm)) {
        return false;
      }
    }
    return true;
  });

  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.totalPrizeAmount, 0);

  return (
    <div className="prize-interface">
      {/* Loading Overlay */}
      {isCalculating && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          <div style={{
            backgroundColor: 'white',
            color: '#333',
            padding: '30px 40px',
            borderRadius: '15px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            maxWidth: '400px',
            width: '90%'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px',
              animation: 'spin 2s linear infinite'
            }}>⏳</div>
            <div style={{
              fontSize: '20px',
              marginBottom: '15px',
              color: '#2c3e50'
            }}>Đang tính thưởng...</div>
            <div style={{
              fontSize: '14px',
              color: '#7f8c8d',
              lineHeight: '1.5'
            }}>
              ⚠️ Vui lòng không đóng trang hoặc chuyển tab khác<br />
              Quá trình này có thể mất vài phút
            </div>
            <div style={{
              marginTop: '20px',
              padding: '10px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#856404'
            }}>
              💡 Hệ thống đang xử lý tất cả hóa đơn và tính toán thưởng
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận tính thưởng với kết quả xổ số */}
      {confirmOpen && lotteryPreview && confirmStep === 1 && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.6)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: 20, maxWidth: 800, width: '95%', boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ marginTop: 0 }}>Kết quả xổ số ngày {lotteryPreview.turnNum}</h3>
            <div style={{ color: '#6c757d', marginBottom: 12 }}>Thời gian: {formatDateTime(lotteryPreview.openTime)}</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ width: 120, fontWeight: 700, padding: '6px 8px', borderBottom: '1px solid #eee' }}>G.ĐB</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>{lotteryPreview.results?.gdb || ''}</td>
                  </tr>
                  <tr>
                    <td style={{ width: 120, fontWeight: 700, padding: '6px 8px', borderBottom: '1px solid #eee' }}>G.1</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>{lotteryPreview.results?.g1 || ''}</td>
                  </tr>
                  <tr>
                    <td style={{ width: 120, fontWeight: 700, padding: '6px 8px', borderBottom: '1px solid #eee' }}>G.2</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>{(lotteryPreview.results?.g2 || []).join(', ')}</td>
                  </tr>
                  <tr>
                    <td style={{ width: 120, fontWeight: 700, padding: '6px 8px', borderBottom: '1px solid #eee' }}>G.3</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>{(lotteryPreview.results?.g3 || []).join(', ')}</td>
                  </tr>
                  <tr>
                    <td style={{ width: 120, fontWeight: 700, padding: '6px 8px', borderBottom: '1px solid #eee' }}>G.4</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>{(lotteryPreview.results?.g4 || []).join(', ')}</td>
                  </tr>
                  <tr>
                    <td style={{ width: 120, fontWeight: 700, padding: '6px 8px', borderBottom: '1px solid #eee' }}>G.5</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>{(lotteryPreview.results?.g5 || []).join(', ')}</td>
                  </tr>
                  <tr>
                    <td style={{ width: 120, fontWeight: 700, padding: '6px 8px', borderBottom: '1px solid #eee' }}>G.6</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #eee' }}>{(lotteryPreview.results?.g6 || []).join(', ')}</td>
                  </tr>
                  <tr>
                    <td style={{ width: 120, fontWeight: 700, padding: '6px 8px' }}>G.7</td>
                    <td style={{ padding: '6px 8px' }}>{(lotteryPreview.results?.g7 || []).join(', ')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{
              marginTop: 20,
              padding: '16px',
              backgroundColor: '#fff8f1',
              borderLeft: '4px solid #ff9800',
              borderRadius: '4px',
              color: '#5d4037',
              fontSize: '15px'
            }}>
              <strong>⚠️ LƯU Ý QUAN TRỌNG:</strong>
              <div style={{ marginTop: '8px', lineHeight: '1.5' }}>
                Hệ thống chuẩn bị tính toán trả thưởng dựa trên kết quả xổ số phía trên.
                Nếu kết quả sai lệch, hệ thống sẽ thực hiện <strong>trả thưởng sai toàn bộ hóa đơn</strong> và rất khó để khắc phục!
                Xin vui lòng đối chiếu cẩn thận với kết quả xổ số chính thức trước khi xác nhận.
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', alignItems: 'flex-start' }}>
              <input
                type="checkbox"
                id="responsibility-check"
                checked={hasCheckedResponsibility}
                onChange={(e) => setHasCheckedResponsibility(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer', marginRight: '10px', marginTop: '2px' }}
              />
              <label htmlFor="responsibility-check" style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ fontWeight: 'bold', color: '#d32f2f', fontSize: '15px' }}>
                  Tôi cam kết đã kiểm tra kỹ và chịu trách nhiệm bảo đảm kết quả này là chính xác
                </div>
                <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '4px', fontStyle: 'italic' }}>
                  (nếu đúng thì hãy click vào ô trống này)
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: '16px' }}>
              <button
                style={{
                  padding: '10px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#6c757d',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={() => setConfirmOpen(false)}
              >
                ❌ Bỏ qua / Đóng
              </button>
              <button
                style={{
                  padding: '10px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  background: hasCheckedResponsibility ? '#28a745' : '#8fdfa2',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: hasCheckedResponsibility ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s'
                }}
                disabled={!hasCheckedResponsibility}
                onClick={() => setConfirmStep(2)}
              >
                ✅ Tiếp tục xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Đồng ý tính thưởng */}
      {confirmOpen && lotteryPreview && confirmStep === 2 && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.6)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: 20, maxWidth: 500, width: '95%', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', textAlign: 'center'
          }}>
            <h3 style={{ marginTop: 0, color: '#dc3545' }}>Cảnh báo Tính Thưởng !!!</h3>

            <div style={{
              marginTop: 12,
              padding: '15px',
              backgroundColor: '#ffe8e8',
              border: '1px solid #ffb3b3',
              borderRadius: 8,
              color: '#b00020',
              fontWeight: 700,
              fontSize: '16px'
            }}>
              ⚠️ Bạn có chắc chắn muốn TÍNH THƯỞNG cho ngày {lotteryPreview.turnNum} không?
            </div>

            <div style={{ marginTop: 16, color: '#495057', fontStyle: 'italic', lineHeight: '1.5' }}>
              Hãy chắc chắn rằng kết quả xổ số đã được xác nhận chính xác. Nếu kết quả sai mà bạn ấn tính thưởng, hệ thống sẽ thực hiện trả thưởng sai và rất khó khắc phục!
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'center' }}>
              <button
                style={{ padding: '12px 20px', borderRadius: 8, border: 'none', background: '#28a745', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                onClick={async () => { setConfirmOpen(false); await calculatePrizes(); }}
              >
                ✅ Đồng ý tính thưởng
              </button>
              <button
                style={{ padding: '12px 20px', borderRadius: 8, border: 'none', background: '#6c757d', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                onClick={() => setConfirmStep(1)}
              >
                🔙 Quay lại
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="prize-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2>🏆 Quản lý thưởng</h2>
        <p>Tính toán và hiển thị các hóa đơn trúng thưởng</p>

        {hasLotteryResult && selectedDate === getCurrentVietnamDate() && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            border: '1px solid rgba(40, 167, 69, 0.3)',
            color: '#28a745',
            padding: '10px 24px',
            marginTop: '16px',
            borderRadius: '50px', // Viên nang tròn
            fontWeight: '600',
            fontSize: '15px',
            boxShadow: '0 2px 10px rgba(40, 167, 69, 0.1)',
            letterSpacing: '0.3px',
            width: 'fit-content' // Đảm bảo tự co giãn vừa đủ text thay vì tràn
          }}>
            <span style={{ marginRight: '8px', fontSize: '18px' }}>✨</span>
            <span>Đã có kết quả ngày {selectedDate.split('-').reverse().join('/')}, vui lòng kiểm tra kỹ trước khi bấm tính thưởng bạn nhé !</span>
            <span style={{ marginLeft: '8px', fontSize: '18px' }}>✨</span>
          </div>
        )}
      </div>

      <div className="prize-controls">
        <div className="date-selector">
          <label htmlFor="prize-date">Chọn ngày:</label>
          <input
            type="date"
            id="prize-date"
            value={selectedDate}
            onChange={handleDateChange}
            className="date-input"
          />
        </div>

        <div className="paid-filter">
          <label htmlFor="paid-filter">Trạng thái:</label>
          <select
            id="paid-filter"
            value={paidFilter}
            onChange={handlePaidFilterChange}
            className="filter-select"
          >
            <option value="all">Tất cả</option>
            <option value="paid">Đã trả thưởng</option>
            <option value="unpaid">Chưa trả thưởng</option>
          </select>
        </div>

        <div className="search-filter">
          <label htmlFor="search-invoice">Tìm hóa đơn:</label>
          <input
            id="search-invoice"
            type="text"
            value={searchInvoice}
            onChange={(e) => setSearchInvoice(e.target.value)}
            placeholder="Nhập mã hóa đơn hoặc tên khách hàng"
            className="search-input"
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              width: '250px'
            }}
          />
        </div>

        <div className="calculate-btn-container" style={{ position: 'relative', display: 'inline-block' }}>
          <button
            className="calculate-btn"
            onClick={handleCalculateClick}
            disabled={isCalculating}
          >
            {isCalculating ? '⏳ Đang tính...' : '🔄 Tính thưởng'}
          </button>
        </div>
      </div>

      <div className="prize-stats">
        <div className="stat-card">
          <div className="stat-number">{filteredInvoices.length}</div>
          <div className="stat-label">
            {paidFilter === 'paid' ? 'Đã trả thưởng' :
              paidFilter === 'unpaid' ? 'Chưa trả thưởng' : 'Hóa đơn trúng'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {formatMoney(totalAmount)}
          </div>
          <div className="stat-label">Tổng tiền thưởng</div>
        </div>
      </div>

      <div className="winning-invoices">
        <h3>📋 Danh sách hóa đơn trúng thưởng</h3>

        {isLoading ? (
          <div className="loading">⏳ Đang tải...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="no-data">
            <p>🎯 Không có hóa đơn trúng thưởng nào</p>
            <p>Hãy thử tính thưởng hoặc chọn ngày khác</p>
          </div>
        ) : (
          <>
            <table className="prize-table">
              <thead>
                <tr>
                  <th>Trả thưởng</th>
                  <th>Mã hóa đơn</th>
                  <th>Tên khách hàng</th>
                  <th>Tổng tiền thưởng</th>
                  <th>Chi tiết thưởng</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => {
                  const betTypeNames = {
                    'loto': 'Lô tô', '2s': '2 số', '3s': '3 số',
                    'tong': 'Tổng', 'kep': 'Kép', 'dau': 'Đầu', 'dit': 'Đít',
                    'bo': 'Bộ', 'xien': 'Xiên', 'xienquay': 'Xiên quay',
                    // Xiên 2, 3, 4
                    'xien2_full': 'Xiên 2 - Trúng cả 2 số',
                    'xien2_1hit': 'Xiên 2 - Trúng 1 số (≥2 nháy)',
                    'xien3_full': 'Xiên 3 - Trúng cả 3 số',
                    'xien3_2hit_both': 'Xiên 3 - Trúng 2 số (cả 2 ≥2 nháy)',
                    'xien3_2hit_one': 'Xiên 3 - Trúng 2 số (1 số ≥2 nháy)',
                    'xien4_full': 'Xiên 4 - Trúng cả 4 số',
                    'xien4_3hit_all': 'Xiên 4 - Trúng 3 số (cả 3 ≥2 nháy)',
                    'xien4_3hit_two': 'Xiên 4 - Trúng 3 số (2 số ≥2 nháy)',
                    'xien4_3hit_one': 'Xiên 4 - Trúng 3 số (1 số ≥2 nháy)',
                    // Xiên quay 4
                    'xienquay4_full': 'Xiên quay 4 - Trúng cả 4 con',
                    'xienquay4_3con': 'Xiên quay 4 - Trúng 3 con',
                    'xienquay4_2con': 'Xiên quay 4 - Trúng 2 con',
                    // Xiên quay 3
                    'xienquay3_full': 'Xiên quay 3 - Trúng cả 3 con',
                    'xienquay3_2con': 'Xiên quay 3 - Trúng 2 con',
                    // 3 số cụ thể
                    '3s_gdb_g1': '3 số trùng cả GĐB và G1',
                    '3s_gdb': '3 số trùng GĐB',
                    '3s_gdb2_g1': '2 số cuối GĐB và 3 số cuối G1',
                    '3s_g1': '3 số trùng G1',
                    '3s_g6': '3 số trùng G6'
                  };
                  const detail = invoice.winningItems
                    .map(it => {
                      // Ưu tiên dùng betTypeLabel từ backend, fallback to mapping, cuối cùng là betType
                      const label = it.betTypeLabel || betTypeNames[it.betType] || it.betType.toUpperCase();
                      return it.detailString || it.detailText || (it.numbers ? `${label}: ${it.numbers}` : label);
                    })
                    .join('\n');
                  return (
                    <tr key={invoice._id} className={invoice.isPaid ? 'paid-row' : 'unpaid-row'}>
                      <td className="checkbox-cell">
                        <button
                          onClick={() => togglePaidStatus(invoice._id)}
                          className={`paid-toggle-btn ${invoice.isPaid ? 'paid' : 'unpaid'}`}
                          title={invoice.isPaid ? 'Đã trả thưởng - Click để hủy' : 'Chưa trả thưởng - Click để đánh dấu đã trả'}
                        >
                          {invoice.isPaid ? '✅' : '⭕'}
                        </button>
                      </td>
                      <td className="code">{invoice.originalInvoiceId || invoice.invoiceId}</td>
                      <td className="customer-name">{invoice.customerName || 'Khách lẻ'}</td>
                      <td className="money">{formatMoney(invoice.totalPrizeAmount)}</td>
                      <td className="detail" style={{ whiteSpace: 'pre-line' }}>{detail}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="prize-summary-row">
              <div className="sum-item">
                <span className="sum-label">Tổng số đơn:</span>
                <span className="sum-value">{filteredInvoices.length}</span>
              </div>
              <div className="sum-item">
                <span className="sum-label">Tổng tiền thưởng:</span>
                <span className="sum-value money">{formatMoney(totalAmount)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PrizeInterface;