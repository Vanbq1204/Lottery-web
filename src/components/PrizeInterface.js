import { getApiUrl } from '../config/api';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PrizeInterface.css';

const PrizeInterface = () => {
  const [winningInvoices, setWinningInvoices] = useState([]);
  // Get current date in Vietnam timezone (UTC+7)
  const getCurrentVietnamDate = () => {
    const now = new Date();
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // Add 7 hours
    return vietnamTime.toISOString().split('T')[0];
  };
  
  const [selectedDate, setSelectedDate] = useState(getCurrentVietnamDate());
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [paidFilter, setPaidFilter] = useState('all'); // 'all', 'paid', 'unpaid'
  const [searchInvoice, setSearchInvoice] = useState(''); // Tìm kiếm theo mã hóa đơn

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
    try {
      setIsCalculating(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(getApiUrl('/prize/calculate'), 
        { date: selectedDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(`${response.data.message}`);
      
      // Tải lại danh sách sau khi tính thưởng
      await loadWinningInvoices(selectedDate, paidFilter);
      
    } catch (error) {
      console.error('Lỗi tính thưởng:', error);
      alert('Lỗi khi tính thưởng: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsCalculating(false);
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
    // Lọc theo tìm kiếm mã hóa đơn
    if (searchInvoice) {
      const invoiceId = (invoice.originalInvoiceId || invoice.invoiceId).toLowerCase();
      const searchTerm = searchInvoice.toLowerCase();
      
      // Tìm kiếm theo số cuối hoặc mã đầy đủ
      if (!invoiceId.includes(searchTerm)) {
        return false;
      }
    }
    return true;
  });
  
  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.totalPrizeAmount, 0);

  return (
    <div className="prize-interface">
      <div className="prize-header">
        <h2>🏆 Quản lý thưởng</h2>
        <p>Tính toán và hiển thị các hóa đơn trúng thưởng</p>
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
        
        <button 
          className="calculate-btn"
          onClick={calculatePrizes}
          disabled={isCalculating}
        >
          {isCalculating ? '⏳ Đang tính...' : '🔄 Tính thưởng'}
        </button>
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
                      <td className="money">{formatMoney(invoice.totalPrizeAmount)}</td>
                      <td className="detail" style={{whiteSpace: 'pre-line'}}>{detail}</td>
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