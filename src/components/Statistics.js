import { getApiUrl } from '../config/api';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Statistics.css';

const Statistics = () => {
  // Get current date in Vietnam timezone (UTC+7)
  const getCurrentVietnamDate = () => {
    const now = new Date();
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // Add 7 hours
    return vietnamTime.toISOString().split('T')[0];
  };
  
  const [selectedDate, setSelectedDate] = useState(getCurrentVietnamDate());
  const [isLoading, setIsLoading] = useState(false);
  const [statisticsData, setStatisticsData] = useState(null);
  const [activeTab, setActiveTab] = useState('loto');

  // Load statistics data
  const loadStatistics = async (date = selectedDate) => {
    setIsLoading(true);
    try {
      const response = await axios.get(getApiUrl('/invoice/stats'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params: {
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

  // Load data when component mounts or date changes
  useEffect(() => {
    loadStatistics();
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset activeTab if 4s tab is hidden due to no data
  useEffect(() => {
    if (statisticsData && activeTab === '4s') {
      const totals = calculateTotals();
      if (totals['4sTotal'] <= 0) {
        setActiveTab('loto');
      }
    }
  }, [statisticsData, activeTab]);

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

  // Calculate loto total points
  const calculateLotoTotalPoints = () => {
    const lotoData = statisticsData?.loto || {};
    return Object.values(lotoData).reduce((sum, points) => sum + points, 0);
  };

  // Format money to new format (7.123.000 đ)
  const formatMoney = (amount) => {
    if (!amount || amount === 0) return '0 đ';
    return Math.floor(amount).toLocaleString('vi-VN').replace(/,/g, '.') + 'n';
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!statisticsData) return {
      totalRevenue: 0,
      lotoTotal: 0,
      '2sTotal': 0,
      '3sTotal': 0,
      '4sTotal': 0,
      tongTotal: 0,
      kepTotal: 0,
      dauTotal: 0,
      ditTotal: 0,
      boTotal: 0,
      xienTotal: 0,
      xienquayTotal: 0
    };

    return {
      totalRevenue: statisticsData.totalRevenue || 0,
      lotoTotal: statisticsData.lotoTotal || 0,
      '2sTotal': statisticsData['2sTotal'] || 0,
      '3sTotal': statisticsData['3sTotal'] || 0,
      '4sTotal': statisticsData['4sTotal'] || 0,
      tongTotal: statisticsData.tongTotal || 0,
      kepTotal: statisticsData.kepTotal || 0,
      dauTotal: statisticsData.dauTotal || 0,
      ditTotal: statisticsData.ditTotal || 0,
      boTotal: statisticsData.boTotal || 0,
      xienTotal: statisticsData.xienTotal || 0,
      xienquayTotal: statisticsData.xienquayTotal || 0
    };
  };

  // Generate 2s statistics table data (same format as loto)
  const generate2sTableData = () => {
    const data2s = statisticsData?.['2s'] || {};
    const tableData = [];

    // Create 5 columns x 20 rows (00-99)
    for (let row = 0; row < 20; row++) {
      const rowData = [];
      for (let col = 0; col < 5; col++) {
        const number = (row + col * 20).toString().padStart(2, '0');
        const amount = data2s[number] || 0;
        rowData.push({ number, amount });
      }
      tableData.push(rowData);
    }
    return tableData;
  };

  // Calculate 2s total amount
  const calculate2sTotalAmount = () => {
    const data2s = statisticsData?.['2s'] || {};
    return Object.values(data2s).reduce((sum, amount) => sum + amount, 0);
  };

  const totals = calculateTotals();

  return (
    <div className="statistics-container">
      {/* Header */}
      <div className="statistics-header">
        <h2>Thống kê cược</h2>
        <div className="date-controls">
          <label htmlFor="stats-date">Ngày:</label>
          <input
            id="stats-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-input"
          />
          <button onClick={() => loadStatistics(selectedDate)} className="btn btn-search">
            Tìm kiếm
          </button>
          <button className="btn btn-export">Xuất Excel</button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">
          <p>Đang tải dữ liệu thống kê...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="summary-section">
            <h3>Tổng kết doanh thu</h3>
            <div className="summary-grid">
              <div className="summary-card loto-card">
                <h4>Lô tô</h4>
                <p className="amount">{formatMoney(totals.lotoTotal)}</p>
              </div>
              <div className="summary-card">
                <h4>2 số</h4>
                <p className="amount">{formatMoney(totals['2sTotal'])}</p>
              </div>
              <div className="summary-card">
                <h4>3 số</h4>
                <p className="amount">{formatMoney(totals['3sTotal'])}</p>
              </div>
              {/* Chỉ hiển thị khối 4 số khi có dữ liệu */}
              {totals['4sTotal'] > 0 && (
                <div className="summary-card">
                  <h4>4 số</h4>
                  <p className="amount">{formatMoney(totals['4sTotal'])}</p>
                </div>
              )}
              <div className="summary-card">
                <h4>Bộ</h4>
                <p className="amount">{formatMoney(totals.boTotal)}</p>
              </div>
              <div className="summary-card group-card">
                <h4>Tổng - Kép - Đầu - Đít</h4>
                <p className="amount">{formatMoney(totals.tongTotal + totals.kepTotal + totals.dauTotal + totals.ditTotal)}</p>
              </div>
              <div className="summary-card">
                <h4>Xiên</h4>
                <p className="amount">{formatMoney(totals.xienTotal)}</p>
              </div>
              <div className="summary-card">
                <h4>Xiên quay</h4>
                <p className="amount">{formatMoney(totals.xienquayTotal)}</p>
              </div>
            </div>

            <div className="total-revenue">
              <h3>Tổng doanh thu</h3>
              <p className="total-amount">{formatMoney(totals.totalRevenue)}</p>
            </div>
          </div>

          {/* Bet Type Tabs */}
          <div className="bet-tabs">
            <button 
              className={`tab-btn ${activeTab === 'loto' ? 'active' : ''}`}
              onClick={() => setActiveTab('loto')}
            >
              Lô tô
            </button>
            <button 
              className={`tab-btn ${activeTab === '2s' ? 'active' : ''}`}
              onClick={() => setActiveTab('2s')}
            >
              2 số
            </button>
            <button 
              className={`tab-btn ${activeTab === '3s' ? 'active' : ''}`}
              onClick={() => setActiveTab('3s')}
            >
              3 số
            </button>
            {/* Chỉ hiển thị tab 4s khi có dữ liệu */}
            {totals['4sTotal'] > 0 && (
              <button 
                className={`tab-btn ${activeTab === '4s' ? 'active' : ''}`}
                onClick={() => setActiveTab('4s')}
              >
                4 số
              </button>
            )}
            <button 
              className={`tab-btn ${activeTab === 'other' ? 'active' : ''}`}
              onClick={() => setActiveTab('other')}
            >
              Khác (Tổng, Kép, Đầu, Đít, Bộ)
            </button>
            <button 
              className={`tab-btn ${activeTab === 'xien' ? 'active' : ''}`}
              onClick={() => setActiveTab('xien')}
            >
              Xiên
            </button>
            <button 
              className={`tab-btn ${activeTab === 'xienquay' ? 'active' : ''}`}
              onClick={() => setActiveTab('xienquay')}
            >
              Xiên quay
            </button>
          </div>

          {/* Detailed Statistics */}
          <div className="detailed-stats">
            {activeTab === 'loto' && (
                              <div className="loto-stats">
                <h3>Tổng kết lô tô</h3>
                <p className="loto-total">Tổng tiền đánh: <strong>{formatMoney(totals.lotoTotal)}</strong></p>
                <p className="loto-points-total">Tổng điểm: <strong>{calculateLotoTotalPoints()}đ</strong></p>
                
                <div className="loto-table-container">
                  <table className="loto-table">
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
                      {generateLotoTableData().map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, colIndex) => (
                            <>
                              <td key={`num-${rowIndex}-${colIndex}`} className="loto-number">
                                {cell.number}
                              </td>
                              <td key={`points-${rowIndex}-${colIndex}`} className={`loto-points ${cell.points > 0 ? 'has-bet' : ''}`}>
                                {cell.points > 0 ? `${cell.points}đ` : ''}
                              </td>
                            </>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === '2s' && (
              <div className="twos-stats">
                <h3 style={{textAlign: 'center'}}>Tổng kết 2 số</h3>
                <p className="twos-total">Tổng tiền đánh: <strong>{formatMoney(totals['2sTotal'])}</strong></p>
                
                <div className="twos-table-container">
                  <table className="twos-table">
                    <thead>
                      <tr>
                        <th>2 số</th><th>Tiền (n)</th><th>2 số</th><th>Tiền (n)</th><th>2 số</th><th>Tiền (n)</th><th>2 số</th><th>Tiền (n)</th><th>2 số</th><th>Tiền (n)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generate2sTableData().map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, colIndex) => (
                            <>
                              <td key={`num-${rowIndex}-${colIndex}`} className="twos-number">
                                {cell.number}
                              </td>
                              <td key={`amount-${rowIndex}-${colIndex}`} className={`twos-amount ${cell.amount > 0 ? 'has-bet' : ''}`}>
                                {cell.amount > 0 ? `${cell.amount}n` : ''}
                              </td>
                            </>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === '3s' && (
              <div className="threes-stats">
                <h3>Tổng kết 3 số</h3>
                <p className="threes-total">Tổng tiền đánh: <strong>{formatMoney(totals['3sTotal'])}</strong></p>
                
                <div className="threes-detail">
                  {statisticsData?.['3s'] && Object.keys(statisticsData['3s']).length > 0 ? (
                    <div className="threes-list">
                      <h4>Chi tiết cược 3 số:</h4>
                      <div className="bet-items">
                        {Object.entries(statisticsData['3s'])
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([number, amount]) => (
                            <div key={number} className="bet-item">
                              <span className="bet-number">{number}:</span>
                              <span className="bet-amount">{amount}n</span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  ) : (
                    <p>Chưa có dữ liệu cược 3 số.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === '4s' && (
              <div className="fours-stats">
                <h3>Tổng kết 4 số</h3>
                <p className="fours-total">Tổng tiền đánh: <strong>{formatMoney(totals['4sTotal'])}</strong></p>
                
                <div className="fours-detail">
                  {statisticsData?.['4s'] && Object.keys(statisticsData['4s']).length > 0 ? (
                    <div className="fours-list">
                      <h4>Chi tiết cược 4 số:</h4>
                      <div className="bet-items">
                        {Object.entries(statisticsData['4s'])
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([number, amount]) => (
                            <div key={number} className="bet-item">
                              <span className="bet-number">{number}:</span>
                              <span className="bet-amount">{amount}n</span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  ) : (
                    <p>Chưa có dữ liệu cược 4 số.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'other' && (
              <div className="other-stats">
                <h3>Tổng kết khác</h3>
                
                {/* Tổng */}
                {statisticsData?.tong && Object.keys(statisticsData.tong).length > 0 && (
                  <div className="stat-section">
                    <h4>Tổng - Tổng tiền: <span className="section-total">{formatMoney(totals.tongTotal)}</span></h4>
                    <div className="bet-items">
                      {Object.entries(statisticsData.tong)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([number, amount]) => (
                          <div key={number} className="bet-item">
                            <span className="bet-number">Tổng {number}:</span>
                            <span className="bet-amount">{amount}n</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}

                {/* Kép */}
                {statisticsData?.kep && Object.keys(statisticsData.kep).length > 0 && (
                  <div className="stat-section">
                    <h4>Kép - Tổng tiền: <span className="section-total">{formatMoney(totals.kepTotal)}</span></h4>
                    <div className="bet-items">
                      {Object.entries(statisticsData.kep)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([type, amount]) => (
                          <div key={type} className="bet-item">
                            <span className="bet-number">Kép {type}:</span>
                            <span className="bet-amount">{amount}n</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}

                {/* Đầu */}
                {statisticsData?.dau && Object.keys(statisticsData.dau).length > 0 && (
                  <div className="stat-section">
                    <h4>Đầu - Tổng tiền: <span className="section-total">{formatMoney(totals.dauTotal)}</span></h4>
                    <div className="bet-items">
                      {Object.entries(statisticsData.dau)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([number, amount]) => (
                          <div key={number} className="bet-item">
                            <span className="bet-number">Đầu {number}:</span>
                            <span className="bet-amount">{amount}n</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}

                {/* Đít */}
                {statisticsData?.dit && Object.keys(statisticsData.dit).length > 0 && (
                  <div className="stat-section">
                    <h4>Đít - Tổng tiền: <span className="section-total">{formatMoney(totals.ditTotal)}</span></h4>
                    <div className="bet-items">
                      {Object.entries(statisticsData.dit)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([number, amount]) => (
                          <div key={number} className="bet-item">
                            <span className="bet-number">Đít {number}:</span>
                            <span className="bet-amount">{amount}n</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}

                {/* Bộ */}
                {statisticsData?.bo && Object.keys(statisticsData.bo).length > 0 && (
                  <div className="stat-section">
                    <h4>Bộ - Tổng tiền: <span className="section-total">{formatMoney(totals.boTotal)}</span></h4>
                    <div className="bet-items">
                      {Object.entries(statisticsData.bo)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([number, amount]) => (
                          <div key={number} className="bet-item">
                            <span className="bet-number">Bộ {number}:</span>
                            <span className="bet-amount">{amount}n</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'xien' && (
              <div className="xien-stats">
                <h3>Tổng kết xiên</h3>
                <p className="xien-total">Tổng tiền đánh: <strong>{formatMoney(totals.xienTotal)}</strong></p>
                
                <div className="xien-detail">
                  {statisticsData?.xien && Object.keys(statisticsData.xien).length > 0 ? (
                    <div className="xien-list">
                      <h4>Chi tiết cược xiên:</h4>
                      <div className="bet-items">
                        {Object.entries(statisticsData.xien)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([combo, amount]) => (
                            <div key={combo} className="bet-item">
                              <span className="bet-number">{combo}:</span>
                              <span className="bet-amount">{amount}n</span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  ) : (
                    <p>Chưa có dữ liệu cược xiên.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'xienquay' && (
              <div className="xienquay-stats">
                <h3>Tổng kết xiên quay</h3>
                <p className="xienquay-total">Tổng tiền đánh: <strong>{formatMoney(totals.xienquayTotal)}</strong></p>
                
                <div className="xienquay-detail">
                  {statisticsData?.xienquay && Object.keys(statisticsData.xienquay).length > 0 ? (
                    <div className="xienquay-list">
                      <h4>Chi tiết cược xiên quay:</h4>
                      <div className="bet-items">
                        {Object.entries(statisticsData.xienquay)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([combo, amount]) => (
                            <div key={combo} className="bet-item">
                              <span className="bet-number">{combo}:</span>
                              <span className="bet-amount">{amount}n</span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  ) : (
                    <p>Chưa có dữ liệu cược xiên quay.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Statistics;