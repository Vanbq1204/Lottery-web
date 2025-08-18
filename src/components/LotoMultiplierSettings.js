import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';
import './LotoMultiplierSettings.css';

const LotoMultiplierSettings = () => {
  const [multiplier, setMultiplier] = useState(22);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadMultiplier();
  }, []);

  const loadMultiplier = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/employee/loto-multiplier'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setMultiplier(data.data.multiplier);
        setLastUpdated(data.data.lastUpdated);
      } else {
        setMessage(`Lỗi: ${data.message}`);
      }
    } catch (error) {
      console.error('Lỗi khi tải hệ số lô:', error);
      setMessage('Không thể tải hệ số lô');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!multiplier || multiplier < 1 || multiplier > 100) {
      setMessage('Hệ số phải từ 1 đến 100');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/employee/loto-multiplier'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ multiplier: parseFloat(multiplier) })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('Cập nhật hệ số lô thành công!');
        setLastUpdated(data.data.lastUpdated);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`Lỗi: ${data.message}`);
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật hệ số lô:', error);
      setMessage('Không thể cập nhật hệ số lô');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Cho phép nhập số thập phân
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setMultiplier(value);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="loto-mult-container">
      <div className="loto-mult-header">
        <h2>🎯 Điều Chỉnh Hệ Số Lô</h2>
        <p>Quản lý hệ số thu tiền lô cho cửa hàng của bạn</p>
      </div>

      <div className="loto-mult-content">
        <div className="loto-mult-current-info">
          <div className="loto-mult-info-card">
            <div className="loto-mult-info-label">Hệ số hiện tại:</div>
            <div className="loto-mult-info-value">{multiplier}</div>
          </div>
          
          <div className="loto-mult-info-card">
            <div className="loto-mult-info-label">Cập nhật lần cuối:</div>
            <div className="loto-mult-info-value">{formatDateTime(lastUpdated)}</div>
          </div>
        </div>

        <div className="loto-mult-form">
          <div className="loto-mult-form-group">
            <label htmlFor="multiplier">Hệ số mới:</label>
            <div className="loto-mult-input-group">
              <input
                type="text"
                id="multiplier"
                value={multiplier}
                onChange={handleInputChange}
                placeholder="Ví dụ: 22.5, 23, 24.2"
                className="loto-mult-input"
                disabled={loading}
              />
              <span className="loto-mult-input-suffix">x</span>
            </div>
            <small className="loto-mult-form-help">
              Hệ số từ 1 đến 100. Có thể nhập số thập phân (ví dụ: 22.5)
            </small>
          </div>

          <div className="loto-mult-calc-preview">
            <h4>🧮 Ví dụ tính toán:</h4>
            <div className="loto-mult-preview-item">
              <span>1000 điểm × {multiplier || 0} = </span>
              <strong>{(1000 * (parseFloat(multiplier) || 0)).toLocaleString('vi-VN')} VNĐ</strong>
            </div>
            <div className="loto-mult-preview-item">
              <span>5000 điểm × {multiplier || 0} = </span>
              <strong>{(5000 * (parseFloat(multiplier) || 0)).toLocaleString('vi-VN')} VNĐ</strong>
            </div>
          </div>

          <div className="loto-mult-form-actions">
            <button 
              className="loto-mult-btn-save"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? '🔄 Đang lưu...' : '💾 Lưu Hệ Số'}
            </button>
            
            <button 
              className="loto-mult-btn-refresh"
              onClick={loadMultiplier}
              disabled={loading}
            >
              🔄 Tải lại
            </button>
          </div>

          {message && (
            <div className={`loto-mult-message ${message.includes('thành công') ? 'loto-mult-success' : 'loto-mult-error'}`}>
              {message}
            </div>
          )}
        </div>

        <div className="loto-mult-info-section">
          <h4>📋 Lưu ý quan trọng:</h4>
          <ul>
            <li><strong>Đây là hệ số thu tiền lô</strong> - tiền khách phải trả khi đánh lô</li>
            <li>Ví dụ: 1 điểm lô × hệ số 22.5 = 22.500 VNĐ khách phải trả</li>
            <li>Hệ số này khác với hệ số thưởng (dùng để tính tiền thưởng khi trúng)</li>
            <li>Thay đổi hệ số sẽ ảnh hưởng đến giá tiền hóa đơn mới</li>
            <li>Hệ số có thể là số thập phân (ví dụ: 22.5, 23.8)</li>
            <li>Mỗi cửa hàng có thể có hệ số thu tiền khác nhau</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LotoMultiplierSettings; 