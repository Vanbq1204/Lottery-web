import { getApiUrl } from '../config/api';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PrizeStatistics.css';

const PrizeStatistics = () => {
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
      const response = await axios.get(getApiUrl('/prize-stats/statistics'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          date: date
        }
      });

      if (response.data.success) {
        setStatisticsData(response.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải thống kê thưởng:', error);
      alert('Không thể tải dữ liệu thống kê thưởng');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when component mounts or date changes
  useEffect(() => {
    loadStatistics();
  }, [selectedDate]);

  // Format tiền tệ
  const formatMoney = (amount) => {
    if (!amount || amount === 0) return '0 đ';
    return Math.floor(amount).toLocaleString('vi-VN').replace(/,/g, '.') + ' đ';
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  // Render Loto Statistics
  const renderLotoStats = () => {
    const lotoStats = statisticsData?.statistics?.loto;
    if (!lotoStats || lotoStats.totalPrize === 0) {
      return <div className="no-data">Không có dữ liệu lô tô trúng thưởng</div>;
    }

    return (
      <div className="loto-stats">
        <div className="stats-summary">
          <div className="summary-card">
            <h4>Tổng thưởng lô tô</h4>
            <div className="amount">{formatMoney(lotoStats.totalPrize)}</div>
          </div>
          <div className="summary-card">
            <h4>Tổng số con trúng</h4>
            <div className="count">{lotoStats.totalWinningNumbers}</div>
          </div>
        </div>

        <div className="loto-details">
          <h4>Chi tiết từng con lô</h4>
          <table className="stats-table loto-table">
            <thead>
              <tr>
                <th style={{width: '20%'}}>Số lô</th>
                <th style={{width: '20%'}}>Số nháy</th>
                <th style={{width: '25%'}}>Tổng điểm</th>
                <th style={{width: '35%', textAlign: 'right'}}>Tổng thưởng</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(lotoStats.winningNumbers).map(([number, data]) => (
                <tr key={number}>
                  <td className="number">{number}</td>
                  <td>{data.hitCount || data.count}</td>
                  <td style={{fontWeight: 'bold', color: '#2c5530'}}>{data.totalPoints}đ</td>
                  <td className="prize-amount" style={{textAlign: 'right'}}>{formatMoney(data.totalPrize)}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan="3" style={{fontWeight: 'bold', textAlign: 'right'}}>Tổng tiền thưởng lô:</td>
                <td className="prize-amount total-prize" style={{textAlign: 'right', fontWeight: 'bold'}}>{formatMoney(lotoStats.totalPrize)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render 2S Statistics
  const render2sStats = () => {
    const stats2s = statisticsData?.statistics?.['2s'];
    if (!stats2s || stats2s.totalPrize === 0) {
      return <div className="no-data">Không có dữ liệu 2 số trúng thưởng</div>;
    }

    return (
      <div className="2s-stats">
        <div className="stats-summary">
          <div className="summary-card">
            <h4>Tổng thưởng 2 số</h4>
            <div className="amount">{formatMoney(stats2s.totalPrize)}</div>
          </div>
        </div>

        <div className="s2-details">
          <h4>Chi tiết từng con 2 số</h4>
          <table className="stats-table">
            <thead>
              <tr>
                <th style={{width: '30%'}}>Số</th>
                <th style={{width: '25%'}}>Số lần trúng</th>
                <th style={{width: '45%', textAlign: 'right'}}>Tổng thưởng</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats2s.winningNumbers).map(([number, data]) => (
                <tr key={number}>
                  <td className="number">{number}</td>
                  <td>{data.count}</td>
                  <td className="prize-amount" style={{textAlign: 'right'}}>{formatMoney(data.totalPrize)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render 3S Statistics
  const render3sStats = () => {
    const stats3s = statisticsData?.statistics?.['3s'];
    if (!stats3s || stats3s.totalPrize === 0) {
      return <div className="no-data">Không có dữ liệu 3 số trúng thưởng</div>;
    }

    // Tạo dữ liệu cho bảng gộp - gộp các số trùng nhau
    const allDetails = [];
    Object.entries(stats3s.cases).forEach(([caseType, caseData]) => {
      if (caseData.numberGroups) {
        // Sử dụng numberGroups để gộp
        Object.entries(caseData.numberGroups).forEach(([number, groupData]) => {
          allDetails.push({
            numbers: number,
            betAmount: groupData.totalBetAmount,
            multiplier: groupData.multiplier,
            prizeAmount: groupData.totalPrize,
            detailString: `${number} (${caseData.label}): ${groupData.totalBetAmount}n x ${groupData.multiplier} = ${groupData.totalPrize.toLocaleString('vi-VN')} đ`,
            caseLabel: caseData.label,
            caseType: caseType,
            count: groupData.count
          });
        });
      } else {
        // Fallback cho dữ liệu cũ
        caseData.details.forEach(detail => {
          allDetails.push({
            ...detail,
            caseLabel: caseData.label,
            caseType: caseType
          });
        });
      }
    });

    return (
      <div className="3s-stats">
        <div className="stats-summary">
          <div className="summary-card">
            <h4>Tổng thưởng 3 số</h4>
            <div className="amount">{formatMoney(stats3s.totalPrize)}</div>
          </div>
          <div className="summary-card">
            <h4>Tổng số case</h4>
            <div className="count">{stats3s.totalCases}</div>
          </div>
        </div>

        <div className="s3-details">
          <h4>Chi tiết 3 số trúng thưởng</h4>
          <table className="stats-table merged-table">
            <thead>
              <tr>
                <th style={{width: '20%'}}>Loại</th>
                <th style={{width: '15%'}}>Số</th>
                <th style={{width: '15%'}}>Tiền cược</th>
                <th style={{width: '15%'}}>Hệ số</th>
                <th style={{width: '35%', textAlign: 'right'}}>Thưởng</th>
              </tr>
            </thead>
            <tbody>
              {allDetails.map((detail, index) => (
                <tr key={index} className={`case-${detail.caseType}`}>
                  <td className="case-type">{detail.caseLabel}</td>
                  <td className="number">{detail.numbers}</td>
                  <td>{detail.betAmount}n</td>
                  <td>x{detail.multiplier}</td>
                  <td className="prize-amount" style={{textAlign: 'right'}}>{formatMoney(detail.prizeAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render Xien Statistics
  const renderXienStats = () => {
    const xienStats = statisticsData?.statistics?.xien;
    if (!xienStats || xienStats.totalPrize === 0) {
      return <div className="no-data">Không có dữ liệu xiên trúng thưởng</div>;
    }

    // Tạo dữ liệu cho bảng gộp và sắp xếp theo thứ tự xiên 2 -> 3 -> 4
    const allDetails = [];
    const xienOrder = ['xien2', 'xien3', 'xien4'];
    
    // Sắp xếp cases theo thứ tự xiên
    const sortedCases = Object.entries(xienStats.cases).sort(([a], [b]) => {
      const orderA = xienOrder.findIndex(type => a.includes(type));
      const orderB = xienOrder.findIndex(type => b.includes(type));
      if (orderA !== orderB) return orderA - orderB;
      return a.localeCompare(b); // Sắp xếp phụ theo tên
    });
    
    sortedCases.forEach(([caseType, caseData]) => {
      caseData.details.forEach(detail => {
        // Xác định loại xiên từ caseType
        let xienType = 'Xiên';
        if (caseType.includes('xien2')) xienType = 'Xiên 2';
        else if (caseType.includes('xien3')) xienType = 'Xiên 3';
        else if (caseType.includes('xien4')) xienType = 'Xiên 4';
        
        allDetails.push({
          ...detail,
          xienType: xienType,
          caseType: caseType
        });
      });
    });

    return (
      <div className="xien-stats">
        <div className="stats-summary">
          <div className="summary-card">
            <h4>Tổng thưởng xiên</h4>
            <div className="amount">{formatMoney(xienStats.totalPrize)}</div>
          </div>
          <div className="summary-card">
            <h4>Tổng số case</h4>
            <div className="count">{xienStats.totalCases}</div>
          </div>
        </div>

        <div className="xien-details">
          <h4>Chi tiết xiên trúng thưởng</h4>
          <table className="stats-table merged-table">
            <thead>
              <tr>
                <th style={{width: '15%'}}>Loại</th>
                <th style={{width: '25%'}}>Số xiên</th>
                <th style={{width: '12%'}}>Tiền cược</th>
                <th style={{width: '12%'}}>Hệ số</th>
                <th style={{width: '20%', textAlign: 'right'}}>Thưởng</th>
                <th style={{width: '16%'}}>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {allDetails.map((detail, index) => (
                <tr key={index} className={`xien-${detail.caseType}`}>
                  <td className="xien-type">{detail.xienType}</td>
                  <td className="number">{detail.numbers}</td>
                  <td>{detail.betAmount}n</td>
                  <td>x{detail.multiplier}</td>
                  <td className="prize-amount" style={{textAlign: 'right'}}>{formatMoney(detail.prizeAmount)}</td>
                  <td className="detail-string">{detail.detailString}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render Xien Quay Statistics
  const renderXienQuayStats = () => {
    const xienQuayStats = statisticsData?.statistics?.xienquay;
    if (!xienQuayStats || xienQuayStats.totalPrize === 0) {
      return <div className="no-data">Không có dữ liệu xiên quay trúng thưởng</div>;
    }

    // Tạo dữ liệu cho bảng gộp
    const allDetails = [];
    Object.entries(xienQuayStats.cases).forEach(([caseType, caseData]) => {
      caseData.details.forEach(detail => {
        // Xác định loại xiên quay từ caseType
        let xienQuayType = 'Xiên quay';
        if (caseType.includes('xienquay3')) xienQuayType = 'Xiên quay 3';
        else if (caseType.includes('xienquay4')) xienQuayType = 'Xiên quay 4';
        
        allDetails.push({
          ...detail,
          xienQuayType: xienQuayType,
          caseType: caseType
        });
      });
    });

    return (
      <div className="xienquay-stats">
        <div className="stats-summary">
          <div className="summary-card">
            <h4>Tổng thưởng xiên quay</h4>
            <div className="amount">{formatMoney(xienQuayStats.totalPrize)}</div>
          </div>
          <div className="summary-card">
            <h4>Tổng số case</h4>
            <div className="count">{xienQuayStats.totalCases}</div>
          </div>
        </div>

        <div className="xienquay-details">
          <h4>Chi tiết xiên quay trúng thưởng</h4>
          <table className="stats-table merged-table">
            <thead>
              <tr>
                <th style={{width: '15%'}}>Loại</th>
                <th style={{width: '25%'}}>Số xiên quay</th>
                <th style={{width: '12%'}}>Tiền cược</th>
                <th style={{width: '12%'}}>Hệ số</th>
                <th style={{width: '20%', textAlign: 'right'}}>Thưởng</th>
                <th style={{width: '16%'}}>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {allDetails.map((detail, index) => (
                <tr key={index} className={`xienquay-${detail.caseType}`}>
                  <td className="xienquay-type">{detail.xienQuayType}</td>
                  <td className="number">{detail.numbers}</td>
                  <td>{detail.betAmount}n</td>
                  <td>x{detail.multiplier}</td>
                  <td className="prize-amount" style={{textAlign: 'right'}}>{formatMoney(detail.prizeAmount)}</td>
                  <td className="detail-string">{detail.detailString}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render Others Statistics (tong, kep, dau, dit, bo)
  const renderOthersStats = () => {
    const othersStats = statisticsData?.statistics?.others;
    if (!othersStats || othersStats.totalPrize === 0) {
      return <div className="no-data">Không có dữ liệu tổng/kép/đầu/đít/bộ trúng thưởng</div>;
    }

    // Tạo dữ liệu cho bảng gộp với tên đúng
    const allDetails = [];
    const typeNames = {
      'tong': 'Tổng',
      'kep': 'Kép', 
      'dau': 'Đầu',
      'dit': 'Đít',
      'bo': 'Bộ'
    };
    
    Object.entries(othersStats.cases).forEach(([caseType, caseData]) => {
      caseData.details.forEach(detail => {
        allDetails.push({
          ...detail,
          typeName: typeNames[caseType] || caseType.toUpperCase(),
          caseType: caseType
        });
      });
    });

    return (
      <div className="others-stats">
        <div className="stats-summary">
          <div className="summary-card">
            <h4>Tổng thưởng khác</h4>
            <div className="amount">{formatMoney(othersStats.totalPrize)}</div>
          </div>
          <div className="summary-card">
            <h4>Tổng số case</h4>
            <div className="count">{othersStats.totalCases}</div>
          </div>
        </div>

        <div className="others-details">
          <h4>Chi tiết tổng/kép/đầu/đít/bộ trúng thưởng</h4>
          <table className="stats-table merged-table">
            <thead>
              <tr>
                <th style={{width: '15%'}}>Loại</th>
                <th style={{width: '20%'}}>Số</th>
                <th style={{width: '15%'}}>Tiền cược</th>
                <th style={{width: '15%'}}>Hệ số</th>
                <th style={{width: '20%', textAlign: 'right'}}>Thưởng</th>
                <th style={{width: '15%'}}>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {allDetails.map((detail, index) => (
                <tr key={index} className={`others-${detail.caseType}`}>
                  <td className="others-type">{detail.typeName}</td>
                  <td className="number">{detail.numbers}</td>
                  <td>{detail.betAmount}n</td>
                  <td>x{detail.multiplier}</td>
                  <td className="prize-amount" style={{textAlign: 'right'}}>{formatMoney(detail.prizeAmount)}</td>
                  <td className="detail-string">{detail.detailString}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="prize-statistics">
      <div className="statistics-header">
        <h2>📊 Thống kê thưởng</h2>
        <div className="controls">
          <div className="date-control">
            <label htmlFor="stats-date">Ngày:</label>
            <input
              type="date"
              id="stats-date"
              value={selectedDate}
              onChange={handleDateChange}
            />
          </div>
          <button onClick={() => loadStatistics()} className="btn btn-refresh">
            🔄 Tải lại
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">⏳ Đang tải thống kê...</div>
      ) : !statisticsData || statisticsData.totalInvoices === 0 ? (
        <div className="no-data">
          <p>📊 Không có dữ liệu thống kê thưởng</p>
          <p>Hãy chọn ngày khác hoặc tính thưởng trước</p>
        </div>
      ) : (
        <>
          <div className="statistics-overview">
            <div className="overview-card">
              <h4>Tổng hóa đơn trúng</h4>
              <div className="count">{statisticsData.totalInvoices}</div>
            </div>
            <div className="overview-card">
              <h4>Tổng tiền thưởng</h4>
              <div className="amount">{formatMoney(statisticsData.totalPrizeAmount)}</div>
            </div>
            <div className="overview-card">
              <h4>Ngày thống kê</h4>
              <div className="date">{new Date(selectedDate).toLocaleDateString('vi-VN')}</div>
            </div>
          </div>

          <div className="statistics-tabs">
            <div className="tab-buttons">
              <button 
                className={`tab-button ${activeTab === 'loto' ? 'active' : ''}`}
                onClick={() => setActiveTab('loto')}
              >
                🎯 Lô tô
              </button>
              <button 
                className={`tab-button ${activeTab === '2s' ? 'active' : ''}`}
                onClick={() => setActiveTab('2s')}
              >
                🎲 2 số
              </button>
              <button 
                className={`tab-button ${activeTab === '3s' ? 'active' : ''}`}
                onClick={() => setActiveTab('3s')}
              >
                🎯 3 số
              </button>
              <button 
                className={`tab-button ${activeTab === 'xien' ? 'active' : ''}`}
                onClick={() => setActiveTab('xien')}
              >
                🔗 Xiên
              </button>
              <button 
                className={`tab-button ${activeTab === 'xienquay' ? 'active' : ''}`}
                onClick={() => setActiveTab('xienquay')}
              >
                🔄 Xiên quay
              </button>
              <button 
                className={`tab-button ${activeTab === 'others' ? 'active' : ''}`}
                onClick={() => setActiveTab('others')}
              >
                📝 Khác
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'loto' && renderLotoStats()}
              {activeTab === '2s' && render2sStats()}
              {activeTab === '3s' && render3sStats()}
              {activeTab === 'xien' && renderXienStats()}
              {activeTab === 'xienquay' && renderXienQuayStats()}
              {activeTab === 'others' && renderOthersStats()}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PrizeStatistics; 