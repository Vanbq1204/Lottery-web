import { getApiUrl } from '../config/api';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BettingInterface.css';

const BettingInterface = ({ user }) => {
  const [betData, setBetData] = useState({
    customerName: '',
    customerPhone: '',
    betType: 'lo2so', // lo2so, lo3so, xien2, xien3, dau, duoi
    numbers: '',
    amount: '',
    province: 'mienbac' // mienbac, mientrung, miennam
  });
  
  const [bets, setBets] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const betTypes = {
    lo2so: 'Lô 2 số',
    lo3so: 'Lô 3 số', 
    xien2: 'Xiên 2',
    xien3: 'Xiên 3',
    dau: 'Đầu',
    duoi: 'Đuôi'
  };

  const provinces = {
    mienbac: 'Miền Bắc',
    mientrung: 'Miền Trung',
    miennam: 'Miền Nam'
  };

  useEffect(() => {
    const total = bets.reduce((sum, bet) => sum + parseFloat(bet.amount || 0), 0);
    setTotalAmount(total);
  }, [bets]);

  const handleInputChange = (e) => {
    setBetData({
      ...betData,
      [e.target.name]: e.target.value
    });
  };

  const addBet = () => {
    if (!betData.numbers || !betData.amount) {
      alert('Vui lòng nhập đầy đủ số và tiền cược');
      return;
    }

    const newBet = {
      ...betData,
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString()
    };

    setBets([...bets, newBet]);
    
    // Reset form trừ thông tin khách hàng
    setBetData({
      ...betData,
      numbers: '',
      amount: ''
    });
  };

  const removeBet = (id) => {
    setBets(bets.filter(bet => bet.id !== id));
  };

  const submitAllBets = async () => {
    if (bets.length === 0) {
      alert('Chưa có cược nào để gửi');
      return;
    }

    setLoading(true);
    try {
      await axios.post(getApiUrl('/betting/submit'), {
        bets,
        employeeId: user.id,
        storeId: user.storeId,
        totalAmount
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      alert('Gửi cược thành công!');
      setBets([]);
      setBetData({
        customerName: '',
        customerPhone: '',
        betType: 'lo2so',
        numbers: '',
        amount: '',
        province: 'mienbac'
      });
    } catch (error) {
      const errorData = error.response?.data;
      
      // Xử lý lỗi thời gian đặc biệt
      if (errorData?.code === 'BETTING_TIME_EXPIRED') {
        alert(`⏰ THỜI GIAN ĐÃ HẾT!\n\n${errorData.message}\n\nVui lòng liên hệ admin để điều chỉnh thời gian nếu cần thiết.`);
      } else {
        alert('Lỗi khi gửi cược: ' + (errorData?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <div className="betting-container">
      <div className="betting-header">
        <div className="header-info">
          <h2>Nhập Cược - {user.storeName}</h2>
          <p>Nhân viên: {user.name}</p>
        </div>
        <button onClick={logout} className="logout-btn">Đăng xuất</button>
      </div>

      <div className="betting-content">
        <div className="betting-form-section">
          <div className="customer-info">
            <h3>Thông tin khách hàng</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Tên khách hàng</label>
                <input
                  type="text"
                  inputMode="text"
                  name="customerName"
                  value={betData.customerName}
                  onChange={handleInputChange}
                  placeholder="Nhập tên khách hàng"
                />
              </div>
              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  name="customerPhone"
                  value={betData.customerPhone}
                  onChange={handleInputChange}
                  placeholder="Nhập số điện thoại"
                />
              </div>
            </div>
          </div>

          <div className="bet-form">
            <h3>Thông tin cược</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Loại cược</label>
                <select
                  name="betType"
                  value={betData.betType}
                  onChange={handleInputChange}
                >
                  {Object.entries(betTypes).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Miền</label>
                <select
                  name="province"
                  value={betData.province}
                  onChange={handleInputChange}
                >
                  {Object.entries(provinces).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Số cược</label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="numbers"
                  value={betData.numbers}
                  onChange={handleInputChange}
                  placeholder="VD: 12, 34, 56"
                />
              </div>
              <div className="form-group">
                <label>Tiền cược (VNĐ)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="amount"
                  value={betData.amount}
                  onChange={handleInputChange}
                  placeholder="Nhập số tiền"
                />
              </div>
            </div>

            <button onClick={addBet} className="add-bet-btn">
              Thêm cược
            </button>
          </div>
        </div>

        <div className="bets-summary-section">
          <div className="bets-list">
            <h3>Danh sách cược ({bets.length})</h3>
            <div className="bets-container">
              {bets.length === 0 ? (
                <p className="no-bets">Chưa có cược nào</p>
              ) : (
                bets.map((bet) => (
                  <div key={bet.id} className="bet-item">
                    <div className="bet-info">
                      <div className="bet-main">
                        <span className="bet-type">{betTypes[bet.betType]}</span>
                        <span className="bet-numbers">{bet.numbers}</span>
                        <span className="bet-amount">{parseInt(bet.amount).toLocaleString()} VNĐ</span>
                      </div>
                      <div className="bet-details">
                        <span>{provinces[bet.province]} - {bet.timestamp}</span>
                        {bet.customerName && <span>KH: {bet.customerName}</span>}
                      </div>
                    </div>
                    <button 
                      onClick={() => removeBet(bet.id)}
                      className="remove-bet-btn"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="summary-footer">
            <div className="total-amount">
              <strong>Tổng tiền: {totalAmount.toLocaleString()} VNĐ</strong>
            </div>
            <button 
              onClick={submitAllBets}
              disabled={loading || bets.length === 0}
              className="submit-bets-btn"
            >
              {loading ? 'Đang gửi...' : 'Gửi tất cả cược'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BettingInterface;