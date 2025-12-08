import { getApiUrl } from '../config/api';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPrizeStatistics.css';

const AdminStoreDetailPrizeStats = ({ storeId, storeName, onBack }) => {
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

  // Load statistics data for specific store
  const loadStatistics = async (date = selectedDate) => {
    if (!storeId) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get(getApiUrl('/admin/store-prize-statistics'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          date: date,
          storeId: storeId
        }
      });

      if (response.data.success) {
        setStatisticsData(response.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải thống kê thưởng cửa hàng:', error);
      alert('Không thể tải dữ liệu thống kê thưởng cửa hàng');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when component mounts or date/store changes
  useEffect(() => {
    loadStatistics();
  }, [selectedDate, storeId]);

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
      return <div className="admin-prize-no-data">Không có dữ liệu lô tô trúng thưởng</div>;
    }

    return (
      <div className="admin-prize-loto-stats">
        <div className="admin-prize-stats-summary">
          <div className="admin-prize-summary-card">
            <h4>Tổng điểm thưởng</h4>
            <div className="admin-prize-amount">{lotoStats.totalPoints ? `${lotoStats.totalPoints}đ` : '0đ'}</div>
          </div>
          <div className="admin-prize-summary-card">
            <h4>Tổng thưởng lô tô</h4>
            <div className="admin-prize-amount">{formatMoney(lotoStats.totalPrize)}</div>
          </div>
          <div className="admin-prize-summary-card">
            <h4>Tổng số con trúng</h4>
            <div className="admin-prize-count">{lotoStats.totalWinningNumbers}</div>
          </div>
        </div>

        <div className="admin-prize-loto-details">
          <h4>Chi tiết từng con lô</h4>
          <table className="admin-prize-stats-table admin-prize-loto-table">
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
                  <td className="admin-prize-number">{number}</td>
                  <td>{data.hitCount ?? 0}</td>
                  <td style={{fontWeight: 'bold', color: '#2c5530'}}>{data.totalPoints}đ</td>
                  <td className="admin-prize-prize-amount" style={{textAlign: 'right'}}>{formatMoney(data.totalPrize)}</td>
                </tr>
              ))}
              <tr className="admin-prize-total-row">
                <td colSpan="3" style={{fontWeight: 'bold', textAlign: 'right'}}>Tổng tiền thưởng lô:</td>
                <td className="admin-prize-prize-amount admin-prize-total-prize" style={{textAlign: 'right', fontWeight: 'bold'}}>{formatMoney(lotoStats.totalPrize)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render Lo A Statistics
  const renderLoAStats = () => {
    const loAStats = statisticsData?.statistics?.loA;
    if (!loAStats || loAStats.totalPrize === 0) {
      return <div className="admin-prize-no-data">Không có dữ liệu Lô A trúng thưởng</div>;
    }
    return (
      <div className="admin-prize-loto-stats">
        <div className="admin-prize-stats-summary">
          <div className="admin-prize-summary-card">
            <h4>Tổng thưởng Lô A</h4>
            <div className="admin-prize-amount">{formatMoney(loAStats.totalPrize)}</div>
          </div>
          <div className="admin-prize-summary-card">
            <h4>Tổng số con trúng</h4>
            <div className="admin-prize-count">{loAStats.totalWinningNumbers}</div>
          </div>
        </div>
        <div className="admin-prize-loto-details">
          <h4>Lô A: Chi tiết từng con</h4>
          <table className="admin-prize-stats-table admin-prize-loto-table">
            <thead>
              <tr>
                <th style={{width: '20%'}}>Số</th>
                <th style={{width: '20%'}}>Số nháy</th>
                <th style={{width: '25%'}}>Tổng điểm</th>
                <th style={{width: '35%', textAlign: 'right'}}>Tổng thưởng</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(loAStats.winningNumbers).map(([number, data]) => (
                <tr key={number}>
                  <td className="admin-prize-number">{number}</td>
                  <td>{data.hitCount || data.count}</td>
                  <td style={{fontWeight: 'bold', color: '#2c5530'}}>{data.totalPoints}đ</td>
                  <td className="admin-prize-prize-amount" style={{textAlign: 'right'}}>{formatMoney(data.totalPrize)}</td>
                </tr>
              ))}
              <tr className="admin-prize-total-row">
                <td colSpan="3" style={{fontWeight: 'bold', textAlign: 'right'}}>Tổng tiền thưởng Lô A:</td>
                <td className="admin-prize-prize-amount admin-prize-total-prize" style={{textAlign: 'right', fontWeight: 'bold'}}>{formatMoney(loAStats.totalPrize)}</td>
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
      return <div className="admin-prize-no-data">Không có dữ liệu 2 số trúng thưởng</div>;
    }

    return (
      <div className="admin-prize-2s-stats">
        <div className="admin-prize-stats-summary">
          <div className="admin-prize-summary-card">
            <h4>Tổng thưởng 2 số</h4>
            <div className="admin-prize-amount">{formatMoney(stats2s.totalPrize)}</div>
          </div>
          <div className="admin-prize-summary-card">
            <h4>Tổng tiền cược 2 số</h4>
            <div className="admin-prize-amount" style={{color: '#2c5530'}}>
              {formatMoney(Object.values(stats2s.winningNumbers).reduce((sum, data) => sum + (data.totalBetAmount * 1000), 0))}
            </div>
          </div>
        </div>

        <div className="admin-prize-s2-details">
          <h4>Chi tiết từng con 2 số</h4>
          <table className="admin-prize-stats-table">
            <thead>
              <tr>
                <th style={{width: '20%'}}>Số</th>
                <th style={{width: '20%'}}>Số lần trúng</th>
                <th style={{width: '30%', textAlign: 'right'}}>Tiền cược</th>
                <th style={{width: '30%', textAlign: 'right'}}>Tổng thưởng</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats2s.winningNumbers).map(([number, data]) => (
                <tr key={number}>
                  <td className="admin-prize-number">{number}</td>
                  <td>{data.count}</td>
                  <td style={{textAlign: 'right', fontWeight: 'bold', color: '#2c5530'}}>{formatMoney(data.totalBetAmount * 1000)}</td>
                  <td className="admin-prize-prize-amount" style={{textAlign: 'right'}}>{formatMoney(data.totalPrize)}</td>
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
      return <div className="admin-prize-no-data">Không có dữ liệu 3 số trúng thưởng</div>;
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
      <div className="admin-prize-3s-stats">
        <div className="admin-prize-stats-summary">
          <div className="admin-prize-summary-card">
            <h4>Tổng thưởng 3 số</h4>
            <div className="admin-prize-amount">{formatMoney(stats3s.totalPrize)}</div>
          </div>
          <div className="admin-prize-summary-card">
            <h4>Tổng số case</h4>
            <div className="admin-prize-count">{stats3s.totalCases}</div>
          </div>
        </div>

        <div className="admin-prize-s3-details">
          <h4>Chi tiết 3 số trúng thưởng</h4>
          <table className="admin-prize-stats-table admin-prize-merged-table">
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
                <tr key={index} className={`admin-prize-case-${detail.caseType}`}>
                  <td className="admin-prize-case-type">{detail.caseLabel}</td>
                  <td className="admin-prize-number">
                    {detail.numbers}
                    {detail.isXienNhay && <span style={{color: 'red', fontWeight: 'bold'}}> nháy</span>}
                  </td>
                  <td>{detail.betAmount}n</td>
                  <td>x{detail.multiplier}</td>
                  <td className="admin-prize-prize-amount" style={{textAlign: 'right'}}>{formatMoney(detail.prizeAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render 4S Statistics
  const render4sStats = () => {
    const stats4s = statisticsData?.statistics?.['4s'];
    if (!stats4s || stats4s.totalPrize === 0) {
      return <div className="admin-prize-no-data">Không có dữ liệu 4 số trúng thưởng</div>;
    }

    // Tạo dữ liệu cho bảng gộp - gộp các số trùng nhau
    const allDetails = [];
    Object.entries(stats4s.cases).forEach(([caseType, caseData]) => {
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
      <div className="admin-prize-4s-stats">
        <div className="admin-prize-stats-summary">
          <div className="admin-prize-summary-card">
            <h4>Tổng thưởng 4 số</h4>
            <div className="admin-prize-amount">{formatMoney(stats4s.totalPrize)}</div>
          </div>
          <div className="admin-prize-summary-card">
            <h4>Tổng số case</h4>
            <div className="admin-prize-count">{stats4s.totalCases}</div>
          </div>
        </div>

        <div className="admin-prize-s4-details">
          <h4>Chi tiết 4 số trúng thưởng</h4>
          <table className="admin-prize-stats-table admin-prize-merged-table">
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
                <tr key={index} className={`admin-prize-case-${detail.caseType}`}>
                  <td className="admin-prize-case-type">{detail.caseLabel}</td>
                  <td className="admin-prize-number">
                    {detail.numbers}
                    {detail.isXienNhay && <span style={{color: 'red', fontWeight: 'bold'}}> nháy</span>}
                  </td>
                  <td>{detail.betAmount}n</td>
                  <td>x{detail.multiplier}</td>
                  <td className="admin-prize-prize-amount" style={{textAlign: 'right'}}>{formatMoney(detail.prizeAmount)}</td>
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
      return <div className="admin-prize-no-data">Không có dữ liệu xiên trúng thưởng</div>;
    }

    const allDetails = [];
    Object.entries(xienStats.cases).forEach(([caseType, caseData]) => {
      if (caseData.numberGroups) {
        Object.entries(caseData.numberGroups).forEach(([number, groupData]) => {
          allDetails.push({
            numbers: number,
            betAmount: groupData.totalBetAmount,
            multiplier: groupData.multiplier,
            prizeAmount: groupData.totalPrize,
            caseLabel: caseData.label,
            caseType: caseType,
            count: groupData.count,
            isXienNhay: groupData.isXienNhay || false
          });
        });
      }
    });

    const totalBetAmount = allDetails.reduce((sum, detail) => sum + detail.betAmount, 0);
    const totalMultiplier = allDetails.length > 0 ? allDetails[0].multiplier : 0;

    return (
      <div className="admin-prize-xien-stats">
        <div className="admin-prize-stats-summary">
          <div className="admin-prize-summary-card">
            <h4>Tổng thưởng xiên</h4>
            <div className="admin-prize-amount">{formatMoney(xienStats.totalPrize)}</div>
          </div>
          <div className="admin-prize-summary-card">
            <h4>Tổng số case</h4>
            <div className="admin-prize-count">{xienStats.totalCases}</div>
          </div>
        </div>

        <div className="admin-prize-xien-details">
          <h4>Chi tiết xiên trúng thưởng</h4>
          <table className="admin-prize-stats-table admin-prize-merged-table">
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
                <tr key={index} className={`admin-prize-case-${detail.caseType}`}>
                  <td className="admin-prize-case-type">{detail.caseLabel}</td>
                  <td className="admin-prize-number">
                    {detail.numbers}
                    {detail.isXienNhay && <span style={{color: 'red', fontWeight: 'bold'}}> nháy</span>}
                  </td>
                  <td>{detail.betAmount}n</td>
                  <td>x{detail.multiplier}</td>
                  <td className="admin-prize-prize-amount" style={{textAlign: 'right'}}>{formatMoney(detail.prizeAmount)}</td>
                </tr>
              ))}
              <tr className="admin-prize-total-row">
                <td colSpan="2" style={{fontWeight: 'bold', textAlign: 'right'}}>Tổng tiền cược:</td>
                <td style={{fontWeight: 'bold'}}>{totalBetAmount}n</td>
                <td style={{fontWeight: 'bold'}}>x{totalMultiplier}</td>
                <td className="admin-prize-prize-amount" style={{textAlign: 'right', fontWeight: 'bold'}}>{formatMoney(totalBetAmount * totalMultiplier * 1000)}</td>
              </tr>
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
      return <div className="admin-prize-no-data">Không có dữ liệu xiên quay trúng thưởng</div>;
    }

    const allDetails = [];
    Object.entries(xienQuayStats.cases).forEach(([caseType, caseData]) => {
      if (caseData.numberGroups) {
        Object.entries(caseData.numberGroups).forEach(([number, groupData]) => {
          allDetails.push({
            numbers: number,
            betAmount: groupData.totalBetAmount,
            multiplier: groupData.multiplier,
            prizeAmount: groupData.totalPrize,
            caseLabel: caseData.label,
            caseType: caseType,
            count: groupData.count
          });
        });
      }
    });

    const totalBetAmount = allDetails.reduce((sum, detail) => sum + detail.betAmount, 0);
    const totalMultiplier = allDetails.length > 0 ? allDetails[0].multiplier : 0;

    return (
      <div className="admin-prize-xienquay-stats">
        <div className="admin-prize-stats-summary">
          <div className="admin-prize-summary-card">
            <h4>Tổng thưởng xiên quay</h4>
            <div className="admin-prize-amount">{formatMoney(xienQuayStats.totalPrize)}</div>
          </div>
          <div className="admin-prize-summary-card">
            <h4>Tổng số case</h4>
            <div className="admin-prize-count">{xienQuayStats.totalCases}</div>
          </div>
        </div>

        <div className="admin-prize-xienquay-details">
          <h4>Chi tiết xiên quay trúng thưởng</h4>
          <table className="admin-prize-stats-table admin-prize-merged-table">
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
                <tr key={index} className={`admin-prize-case-${detail.caseType}`}>
                  <td className="admin-prize-case-type">{detail.caseLabel}</td>
                  <td className="admin-prize-number">{detail.numbers}</td>
                  <td>{detail.betAmount}n</td>
                  <td>x{detail.multiplier}</td>
                  <td className="admin-prize-prize-amount" style={{textAlign: 'right'}}>{formatMoney(detail.prizeAmount)}</td>
                </tr>
              ))}
              <tr className="admin-prize-total-row">
                <td colSpan="2" style={{fontWeight: 'bold', textAlign: 'right'}}>Tổng tiền cược:</td>
                <td style={{fontWeight: 'bold'}}>{totalBetAmount}n</td>
                <td style={{fontWeight: 'bold'}}>x{totalMultiplier}</td>
                <td className="admin-prize-prize-amount" style={{textAlign: 'right', fontWeight: 'bold'}}>{formatMoney(totalBetAmount * totalMultiplier * 1000)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };


  // Render Others Statistics
  const renderOthersStats = () => {
    const othersStats = statisticsData?.statistics?.others;
    if (!othersStats || othersStats.totalPrize === 0) {
      return <div className="admin-prize-no-data">Không có dữ liệu loại khác trúng thưởng</div>;
    }

    const allDetails = [];
    Object.entries(othersStats.cases).forEach(([caseType, caseData]) => {
      if (caseData.numberGroups) {
        Object.entries(caseData.numberGroups).forEach(([number, groupData]) => {
          allDetails.push({
            numbers: number,
            betAmount: groupData.totalBetAmount,
            multiplier: groupData.multiplier,
            prizeAmount: groupData.totalPrize,
            caseLabel: caseData.label,
            caseType: caseType,
            count: groupData.count
          });
        });
      }
    });

    const totalBetAmount = allDetails.reduce((sum, detail) => sum + detail.betAmount, 0);
    const totalMultiplier = allDetails.length > 0 ? allDetails[0].multiplier : 0;

    return (
      <div className="admin-prize-others-stats">
        <div className="admin-prize-stats-summary">
          <div className="admin-prize-summary-card">
            <h4>Tổng thưởng khác</h4>
            <div className="admin-prize-amount">{formatMoney(othersStats.totalPrize)}</div>
          </div>
          <div className="admin-prize-summary-card">
            <h4>Tổng số case</h4>
            <div className="admin-prize-count">{othersStats.totalCases}</div>
          </div>
        </div>

        <div className="admin-prize-others-details">
          <h4>Chi tiết loại khác trúng thưởng</h4>
          <table className="admin-prize-stats-table admin-prize-merged-table">
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
                <tr key={index} className={`admin-prize-case-${detail.caseType}`}>
                  <td className="admin-prize-case-type">{detail.caseLabel}</td>
                  <td className="admin-prize-number">{detail.numbers}</td>
                  <td>{detail.betAmount}n</td>
                  <td>x{detail.multiplier}</td>
                  <td className="admin-prize-prize-amount" style={{textAlign: 'right'}}>{formatMoney(detail.prizeAmount)}</td>
                </tr>
              ))}
              <tr className="admin-prize-total-row">
                <td colSpan="2" style={{fontWeight: 'bold', textAlign: 'right'}}>Tổng tiền cược:</td>
                <td style={{fontWeight: 'bold'}}>{totalBetAmount}n</td>
                <td style={{fontWeight: 'bold'}}>x{totalMultiplier}</td>
                <td className="admin-prize-prize-amount" style={{textAlign: 'right', fontWeight: 'bold'}}>{formatMoney(totalBetAmount * totalMultiplier * 1000)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-prize-statistics">
      <div className="admin-prize-statistics-header">
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <button onClick={onBack} className="admin-prize-btn admin-prize-btn-back">
            ← Quay lại
          </button>
          <h2>📊 Thống kê thưởng - {storeName}</h2>
        </div>
        <div className="admin-prize-controls">
          <div className="admin-prize-date-control">
            <label htmlFor="admin-stats-date">Ngày:</label>
            <input
              type="date"
              id="admin-stats-date"
              value={selectedDate}
              onChange={handleDateChange}
            />
          </div>
          <button onClick={() => loadStatistics()} className="admin-prize-btn admin-prize-btn-refresh">
            🔄 Tải lại
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="admin-prize-loading">⏳ Đang tải thống kê thưởng cửa hàng...</div>
      ) : !statisticsData || statisticsData.totalInvoices === 0 ? (
        <div className="admin-prize-no-data">
          <p>📊 Không có dữ liệu thống kê thưởng cho cửa hàng này</p>
          <p>Hãy chọn ngày khác hoặc tính thưởng trước</p>
        </div>
      ) : (
        <>
          <div className="admin-prize-statistics-overview">
            <div className="admin-prize-overview-card">
              <h4>Tổng hóa đơn trúng</h4>
              <div className="admin-prize-count">{statisticsData.totalInvoices}</div>
            </div>
            <div className="admin-prize-overview-card">
              <h4>Tổng tiền thưởng</h4>
              <div className="admin-prize-amount">{formatMoney(statisticsData.totalPrizeAmount)}</div>
            </div>
            <div className="admin-prize-overview-card">
              <h4>Tổng số hóa đơn cược</h4>
              <div className="admin-prize-count">{statisticsData.totalBettingInvoices || 0}</div>
            </div>
            <div className="admin-prize-overview-card">
              <h4>Ngày thống kê</h4>
              <div className="admin-prize-date">{new Date(selectedDate).toLocaleDateString('vi-VN')}</div>
            </div>
          </div>

          <div className="admin-prize-statistics-tabs">
            <div className="admin-prize-tab-buttons">
              <button 
                className={`admin-prize-tab-button ${activeTab === 'loto' ? 'active' : ''}`}
                onClick={() => setActiveTab('loto')}
              >
                🎯 Lô tô
              </button>
              {statisticsData?.statistics?.loA && (
                <button 
                  className={`admin-prize-tab-button ${activeTab === 'loA' ? 'active' : ''}`}
                  onClick={() => setActiveTab('loA')}
                >
                  🎯 Lô A
                </button>
              )}
              <button 
                className={`admin-prize-tab-button ${activeTab === '2s' ? 'active' : ''}`}
                onClick={() => setActiveTab('2s')}
              >
                🎲 2 số
              </button>
              <button 
                className={`admin-prize-tab-button ${activeTab === '3s' ? 'active' : ''}`}
                onClick={() => setActiveTab('3s')}
              >
                🎯 3 số
              </button>
              <button 
                className={`admin-prize-tab-button ${activeTab === '4s' ? 'active' : ''}`}
                onClick={() => setActiveTab('4s')}
              >
                🎯 4 số
              </button>
              <button 
                className={`admin-prize-tab-button ${activeTab === 'xien' ? 'active' : ''}`}
                onClick={() => setActiveTab('xien')}
              >
                🔗 Xiên
              </button>
              <button 
                className={`admin-prize-tab-button ${activeTab === 'xienquay' ? 'active' : ''}`}
                onClick={() => setActiveTab('xienquay')}
              >
                🔄 Xiên quay
              </button>
              <button 
                className={`admin-prize-tab-button ${activeTab === 'others' ? 'active' : ''}`}
                onClick={() => setActiveTab('others')}
              >
                📝 Khác
              </button>
            </div>

            <div className="admin-prize-tab-content">
              {activeTab === 'loto' && renderLotoStats()}
              {activeTab === 'loA' && renderLoAStats()}
              {activeTab === '2s' && render2sStats()}
              {activeTab === '3s' && render3sStats()}
              {activeTab === '4s' && render4sStats()}
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

export default AdminStoreDetailPrizeStats;
