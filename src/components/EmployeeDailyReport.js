import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import './EmployeeDailyReport.css';

const EmployeeDailyReport = () => {
  const getCurrentVietnamDate = () => {
    const now = new Date();
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
  };
  const [date, setDate] = useState(getCurrentVietnamDate());
  const [reportData, setReportData] = useState({
    currentRevenue: 0,
    currentPayout: 0,
    expenses: [{ name: '', amount: '' }],
    netIncome: 0
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchReport();
  }, [date]);

  const fetchReport = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(getApiUrl('/daily-report'), {
        params: { date },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const { report, currentRevenue, currentPayout } = response.data.data;
        
        let expenses = [{ name: '', amount: '' }];
        if (report && report.expenses && report.expenses.length > 0) {
          expenses = report.expenses;
        }

        // Always use the live calculated revenue/payout from server
        setReportData({
          currentRevenue: currentRevenue || 0,
          currentPayout: currentPayout || 0,
          expenses,
          netIncome: report ? report.netIncome : 0
        });
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      setMessage({ type: 'error', text: 'Không thể tải báo cáo' });
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseChange = (index, field, value) => {
    const newExpenses = [...reportData.expenses];
    newExpenses[index][field] = value;
    setReportData({ ...reportData, expenses: newExpenses });
  };

  const addExpense = () => {
    setReportData({
      ...reportData,
      expenses: [...reportData.expenses, { name: '', amount: '' }]
    });
  };

  const removeExpense = (index) => {
    const newExpenses = reportData.expenses.filter((_, i) => i !== index);
    setReportData({ ...reportData, expenses: newExpenses });
  };

  const calculateTotalExpenses = () => {
    return reportData.expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  const formatNumber = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const formatPayout = (amount) => {
    // Rút gọn hiển thị tiền thưởng bằng cách chia cho 1000
    const shortenedAmount = Math.round(amount / 1000);
    return formatNumber(shortenedAmount);
  };

  const totalExpenses = calculateTotalExpenses();
  // Tính net income: Revenue (giữ nguyên) - Expenses (giữ nguyên) - Payout (chia 1000)
  // Ví dụ: 1120 (Revenue) - 100 (Chi) - 1810 (Payout rút gọn từ 1.810.000) = -790
  const currentNetIncome = reportData.currentRevenue - totalExpenses - Math.round(reportData.currentPayout / 1000);

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        date,
        expenses: reportData.expenses.filter(e => e.name || e.amount), // Filter empty rows if needed, or keep them
        totalRevenue: reportData.currentRevenue,
        totalPayout: reportData.currentPayout
      };

      const response = await axios.post(getApiUrl('/daily-report'), payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Lưu báo cáo thành công!' });
        // Update local state to reflect saved status if needed, 
        // but since we rely on live data for revenue, we just confirm save.
      }
    } catch (error) {
      console.error('Error saving report:', error);
      setMessage({ type: 'error', text: 'Lỗi khi lưu báo cáo' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="daily-report-container">
      <h2>Báo cáo cuối ngày</h2>
      
      <div className="date-selector">
        <label>Ngày báo cáo:</label>
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
        />
        {loading && <span style={{marginLeft: '10px', color: '#666'}}>Đang tải...</span>}
      </div>

      {message.text && (
        <div style={{
          padding: '10px',
          marginBottom: '15px',
          borderRadius: '4px',
          backgroundColor: message.type === 'error' ? '#ffebee' : '#e8f5e9',
          color: message.type === 'error' ? '#c62828' : '#2e7d32'
        }}>
          {message.text}
        </div>
      )}

      <table className="report-table">
        <thead>
          <tr>
            <th style={{width: '25%'}}>Thu</th>
            <th style={{width: '50%'}}>Chi</th>
            <th style={{width: '25%'}}>Trả thưởng</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="amount-cell revenue">
              {formatNumber(reportData.currentRevenue)} đ
            </td>
            <td>
              <div className="expenses-list">
                {reportData.expenses.map((expense, index) => (
                  <div key={index} className="expense-row">
                    <input
                      type="text"
                      className="expense-name"
                      placeholder="Tên khoản chi"
                      value={expense.name}
                      onChange={(e) => handleExpenseChange(index, 'name', e.target.value)}
                    />
                    <input
                      type="number"
                      className="expense-amount"
                      placeholder="Số tiền"
                      value={expense.amount}
                      onChange={(e) => handleExpenseChange(index, 'amount', e.target.value)}
                    />
                    <button 
                      className="btn-remove"
                      onClick={() => removeExpense(index)}
                      title="Xóa dòng"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button className="btn-add" onClick={addExpense}>
                  + Thêm khoản chi
                </button>
                <div style={{marginTop: '15px', textAlign: 'right', fontWeight: 'bold'}}>
                  Tổng chi: {formatNumber(totalExpenses)} đ
                </div>
              </div>
            </td>
            <td className="amount-cell payout">
              {formatPayout(reportData.currentPayout)} đ
            </td>
          </tr>
        </tbody>
      </table>

      <div className="report-footer">
        <div className="net-income-section" style={{marginBottom: '20px', textAlign: 'right'}}>
          <span style={{fontSize: '18px', marginRight: '15px'}}>Tổng cộng (Thu - Chi - Trả thưởng):</span>
          <span className="total" style={{fontSize: '24px', fontWeight: 'bold', color: currentNetIncome >= 0 ? '#28a745' : '#dc3545'}}>
            {formatNumber(currentNetIncome)} đ
          </span>
        </div>
        
        <div style={{textAlign: 'right'}}>
          <button 
            className="btn-save-report" 
            onClick={handleSave}
            disabled={loading || saving}
          >
            {saving ? 'Đang lưu...' : 'Lưu báo cáo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDailyReport;
