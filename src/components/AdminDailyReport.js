import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import './AdminDailyReport.css';

const AdminDailyReport = ({ user }) => {
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
  const [isLoading, setIsLoading] = useState(false);
  const [storesData, setStoresData] = useState([]);
  const [message, setMessage] = useState('');

  const toThousandUnit = (amount) => Math.round((Number(amount) || 0) / 1000);
  const formatThousand = (amount) => {
    const n = Number(amount) || 0;
    return n.toLocaleString('vi-VN').replace(/,/g, '.') + 'n';
  };

  const loadDailyReports = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const resp = await axios.get(getApiUrl('/admin/daily-reports'), {
        headers: { Authorization: `Bearer ${token}` },
        params: { date }
      });

      if (resp.data?.success) {
        const { stores } = resp.data.data || { stores: [] };
        setStoresData(stores || []);
      } else {
        setMessage('Không thể tải báo cáo');
      }
    } catch (err) {
      console.error('Lỗi tải báo cáo admin:', err);
      setMessage('Lỗi tải báo cáo');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadDailyReports(); }, [date]);

  const calculateRow = (row) => {
    const revenueNBase = row.report ? (row.report.totalRevenue || 0) : (row.currentRevenue || 0);
    const payoutVND = row.report ? (row.report.totalPayout || 0) : (row.currentPayout || 0);
    const hasReportExpenses = Array.isArray(row.report?.expenses) && row.report.expenses.length > 0;
    const expensesNBase = hasReportExpenses
      ? row.report.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0) // Khoản chi nhập theo đơn vị nghìn
      : (row.totalExpenses || 0); // Fallback từ API nếu có

    const revenueN = Number(revenueNBase) || 0; // Thu đã là đơn vị nghìn (n)
    const payoutN = toThousandUnit(payoutVND);   // Chỉ chuyển thưởng về nghìn
    const expensesN = hasReportExpenses ? Number(expensesNBase) || 0 : toThousandUnit(expensesNBase);
    const netN = revenueN - expensesN - payoutN;
    return { revenueN, payoutN, expensesN, netN };
  };

  const totals = storesData.reduce((acc, r) => {
    const { revenueN, payoutN, expensesN, netN } = calculateRow(r);
    acc.revenueN += revenueN;
    acc.payoutN += payoutN;
    acc.expensesN += expensesN;
    acc.netN += netN;
    return acc;
  }, { revenueN: 0, payoutN: 0, expensesN: 0, netN: 0 });

  return (
    <div className="admin-daily-report">
      <div className="admin-daily-report-header">
        <h3>Báo cáo cuối ngày</h3>
        <div className="admin-daily-report-controls">
          <label htmlFor="daily-report-date">Chọn ngày:</label>
          <input id="daily-report-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          {isLoading && <span className="admin-daily-report-loading">Đang tải...</span>}
        </div>
      </div>

      {message && <div className="admin-daily-report-message">{message}</div>}

      <div className="excel-table-wrapper">
        <table className="excel-table">
          <thead>
            <tr>
              <th className="sticky-col">Cửa hàng</th>
              <th>Thu (n)</th>
              <th>Chi (n)</th>
              <th>Trả thưởng (n)</th>
              <th>Tổng cuối (n)</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {storesData.map((row) => {
              const { revenueN, payoutN, expensesN, netN } = calculateRow(row);
              const reported = !!row.report;
              return (
                <tr key={row.storeId}>
                  <td className="sticky-col store-name">{row.storeName}</td>
                  <td className="number-cell">{formatThousand(revenueN)}</td>
                  <td className="number-cell">
                    <div className="expense-total">{formatThousand(expensesN)}</div>
                    {row.report?.expenses?.length > 0 && (
                      <div className="expense-list">
                        {row.report.expenses.map((exp, idx) => (
                          <div key={idx} className="expense-chip">
                            <span className="expense-chip-name">{exp.name}</span>
                            <span className="expense-chip-amount">{formatThousand(Number(exp.amount) || 0)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="number-cell payout">{formatThousand(payoutN)}</td>
                  <td className={`number-cell net ${netN >= 0 ? 'positive' : 'negative'}`}>{formatThousand(netN)}</td>
                  <td className="status-col">
                    <span className={`status-badge ${reported ? 'reported' : 'not-reported'}`}>
                      {reported ? 'Đã báo cáo' : 'Chưa báo cáo'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="sticky-col total-label">Tổng</td>
              <td className="number-cell">{formatThousand(totals.revenueN)}</td>
              <td className="number-cell">{formatThousand(totals.expensesN)}</td>
              <td className="number-cell">{formatThousand(totals.payoutN)}</td>
              <td className={`number-cell ${totals.netN >= 0 ? 'positive' : 'negative'}`}>{formatThousand(totals.netN)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="admin-daily-report-note">
        <p>Đơn vị hiển thị: nghìn đồng (n). Ví dụ 20.000.000 → 20.000.</p>
      </div>
    </div>
  );
};

export default AdminDailyReport;
