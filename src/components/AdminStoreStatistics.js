import { getApiUrl } from '../config/api';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminStoreStatistics.css';

const AdminStoreStatistics = ({ store }) => {
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

  // Load data when component mounts or date changes
  useEffect(() => {
    if (activeTab === 'betting') {
      loadStatistics();
    }
  }, [selectedDate, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

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
    // Calculate total for this group
    const groupTotal = betTypes.reduce((sum, betType) => {
      const totalField = `${betType}Total`;
      return sum + (statisticsData[totalField] || 0);
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
    betTypes.forEach(betType => {
      const betData = statisticsData[betType] || {};
      Object.entries(betData).forEach(([number, amount]) => {
        tableData.push({
          betType: betTypeNames[betType],
          number,
          amount,
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
            <span style={{color: '#333', fontWeight: 600, fontSize: '14px'}}>Tổng tiền đánh: {formatThousand(groupTotal)}</span>
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
                <td style={{color: '#d32f2f', fontWeight: 600}}>{item.amount}n</td>
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
            <div className="admin-stats-loto-table">
              <div className="admin-stats-loto-total">
                <h4>Tổng kết lô tô</h4>
                <div>
                  <span style={{color: '#1976d2', fontWeight: 600, fontSize: '14px'}}>Tổng tiền đánh: {formatThousand(statisticsData.lotoTotal)}</span>
                  <br />
                  <span className="admin-stats-loto-total-value">Tổng điểm: {lotoTotalPoints}đ</span>
                </div>
              </div>
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
                      {row.map((cell, colIndex) => (
                        <>
                          <td key={`${colIndex}-num`} className={cell.points > 0 ? 'admin-stats-has-bet' : ''}>
                            <div className="admin-stats-loto-cell">
                              <div className="admin-stats-number">{cell.number}</div>
                            </div>
                          </td>
                          <td key={`${colIndex}-points`} className={cell.points > 0 ? 'admin-stats-has-bet' : ''}>
                            <div className="admin-stats-loto-cell">
                              {cell.points > 0 && (
                                <div className="admin-stats-points">{cell.points}đ</div>
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

        case '2s':
          const twoSTableData = generate2sTableData();
          const twoSTotalAmount = Object.values(statisticsData['2s'] || {}).reduce((sum, amount) => sum + amount, 0);
          
          return (
            <div className="admin-stats-2s-table">
                             <div className="admin-stats-loto-total">
                 <h4>Tổng kết 2 số</h4>
                 <div>
                   <span style={{color: '#1976d2', fontWeight: 600, fontSize: '14px'}}>Tổng tiền đánh: {formatThousand(statisticsData['2sTotal'])}</span>
                   <br />
                 </div>
               </div>
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
                      {row.map((cell, colIndex) => (
                        <>
                          <td key={`${colIndex}-num`} className={cell.amount > 0 ? 'admin-stats-2s-has-bet' : ''}>
                            <div className="admin-stats-2s-cell">
                              <div className="admin-stats-2s-number">{cell.number}</div>
                            </div>
                          </td>
                          <td key={`${colIndex}-amount`} className={cell.amount > 0 ? 'admin-stats-2s-has-bet' : ''}>
                            <div className="admin-stats-2s-cell">
                              {cell.amount > 0 && (
                                <div className="admin-stats-2s-amount">{cell.amount}n</div>
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

        case 'combined-basic':
          return renderCombinedBetTable(['tong', 'kep', 'dau', 'dit', 'bo'], 'Tổng kết: Tổng, Kép, Đầu, Đít, Bộ');

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
            <div className="admin-stats-combined-table">
              <div className="admin-stats-combined-total">
                <h4>Tổng kết 3 số</h4>
                <div>
                  <span style={{color: '#333', fontWeight: 600, fontSize: '14px'}}>Tổng tiền đánh: {formatThousand(statisticsData['3sTotal'])}</span>
                </div>
              </div>
              <div className="admin-stats-bet-list">
                {Object.entries(betData3s).map(([key, value]) => (
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
            <div className="admin-stats-combined-table">
              <div className="admin-stats-combined-total">
                <h4>Tổng kết xiên</h4>
                <div>
                  <span style={{color: '#333', fontWeight: 600, fontSize: '14px'}}>Tổng tiền đánh: {formatThousand(statisticsData.xienTotal)}</span>
                </div>
              </div>
              <div className="admin-stats-bet-list">
                {Object.entries(betDataXien).map(([key, value]) => (
                  <div key={key} className="admin-stats-bet-item">
                    <span className="admin-stats-bet-number">{key}</span>
                    <span className="admin-stats-bet-amount">{value}n</span>
                  </div>
                ))}
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
            <div className="admin-stats-combined-table">
              <div className="admin-stats-combined-total">
                <h4>Tổng kết xiên quay</h4>
                <div>
                  <span style={{color: '#333', fontWeight: 600, fontSize: '14px'}}>Tổng tiền đánh: {formatThousand(statisticsData.xienquayTotal)}</span>
                </div>
              </div>
              <div className="admin-stats-bet-list">
                {Object.entries(betDataXienQuay).map(([key, value]) => (
                  <div key={key} className="admin-stats-bet-item">
                    <span className="admin-stats-bet-number">{key}</span>
                    <span className="admin-stats-bet-amount">{value}n</span>
                  </div>
                ))}
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
          <div className="admin-stats-prizes-placeholder">
            <p>Chưa có dữ liệu, hãy đợi nhân viên thống kê</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStoreStatistics; 