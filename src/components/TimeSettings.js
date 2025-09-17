import { getApiUrl } from '../config/api';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TimeSettings.css';

const TimeSettings = () => {
  const [settings, setSettings] = useState({
    bettingCutoffTime: '18:30',
    isActive: true,
    editDeleteCutoffTime: '18:15',
    editDeleteLimitActive: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Cập nhật thời gian hiện tại mỗi giây
  useEffect(() => {
    const updateCurrentTime = () => {
      // Sử dụng timezone chính xác
      const now = new Date();
      const vietnamTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
      const timeString = vietnamTime.toTimeString().slice(0, 5); // HH:MM
      setCurrentTime(timeString);
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Load settings khi component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(getApiUrl('/admin/time-settings'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Lỗi khi tải cài đặt thời gian:', error);
      alert('Không thể tải cài đặt thời gian');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await axios.put(getApiUrl('/admin/time-settings'), settings, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        alert('Cập nhật cài đặt thời gian thành công!');
        setSettings(response.data.settings);
      } else {
        alert(response.data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật cài đặt:', error);
      alert(error.response?.data?.message || 'Không thể cập nhật cài đặt thời gian');
    } finally {
      setSaving(false);
    }
  };

  const handleTimeChange = (e) => {
    setSettings(prev => ({
      ...prev,
      bettingCutoffTime: e.target.value
    }));
  };

  const handleEditDeleteTimeChange = (e) => {
    setSettings(prev => ({
      ...prev,
      editDeleteCutoffTime: e.target.value
    }));
  };

  const handleActiveChange = (e) => {
    setSettings(prev => ({
      ...prev,
      isActive: e.target.checked
    }));
  };

  const handleEditDeleteLimitActiveChange = (e) => {
    setSettings(prev => ({
      ...prev,
      editDeleteLimitActive: e.target.checked
    }));
  };

  // Kiểm tra xem hiện tại có được phép nhập cược không
  const isCurrentlyAllowed = () => {
    if (!settings.isActive) return true;
    
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    const [cutoffHour, cutoffMinute] = settings.bettingCutoffTime.split(':').map(Number);
    
    const currentMinutes = currentHour * 60 + currentMinute;
    const cutoffMinutes = cutoffHour * 60 + cutoffMinute;
    
    return currentMinutes < cutoffMinutes;
  };

  if (loading) {
    return (
      <div className="time-settings">
        <div className="loading">⏳ Đang tải cài đặt...</div>
      </div>
    );
  }

  return (
    <div className="time-settings">
      <div className="time-settings-header">
        <h2>⏰ Tinh chỉnh thời gian nhập cược</h2>
        <p className="description">
          Thiết lập thời gian giới hạn để nhân viên không thể nhập cược sau giờ quy định.
          Thường được đặt sau 18:30 để đảm bảo công tác xử lý dữ liệu thưởng.
        </p>
      </div>

      <div className="time-settings-content">
        <div className="current-status">
          <div className="status-card">
            <h3>🕐 Thời gian hiện tại</h3>
            <div className="current-time">{currentTime}</div>
          </div>
          
          <div className={`status-card ${isCurrentlyAllowed() ? 'allowed' : 'blocked'}`}>
            <h3>📝 Trạng thái nhập cược</h3>
            <div className="status-text">
              {settings.isActive ? (
                isCurrentlyAllowed() ? (
                  <span className="allowed">✅ Được phép nhập cược</span>
                ) : (
                  <span className="blocked">🚫 Đã hết thời gian nhập cược</span>
                )
              ) : (
                <span className="disabled">⚪ Không giới hạn thời gian</span>
              )}
            </div>
          </div>
        </div>

        <div className="settings-form">
          <div className="time-settings-form-group">
            <label htmlFor="cutoff-time">
              <span className="label-text">🕕 Thời gian giới hạn nhập cược</span>
              <span className="label-desc">Nhân viên không thể nhập cược sau thời gian này</span>
            </label>
            <input
              type="time"
              id="cutoff-time"
              value={settings.bettingCutoffTime}
              onChange={handleTimeChange}
              className="time-input"
            />
          </div>

          <div className="time-settings-form-group">
            <label className="time-limit-checkbox-wrapper">
              <input
                type="checkbox"
                checked={settings.isActive}
                onChange={handleActiveChange}
                className="time-limit-checkbox-input"
              />
              <div className="time-limit-checkbox-content">
                <strong>Kích hoạt giới hạn thời gian nhập cược</strong>
                <small>Bỏ tick để tắt giới hạn thời gian nhập cược</small>
              </div>
            </label>
          </div>
          
          <hr className="settings-divider" />
          
          <div className="time-settings-form-group">
            <label htmlFor="edit-delete-cutoff-time">
              <span className="label-text">🔒 Thời gian giới hạn sửa/xóa hóa đơn</span>
              <span className="label-desc">Nhân viên không thể sửa hoặc xóa hóa đơn sau thời gian này</span>
            </label>
            <input
              type="time"
              id="edit-delete-cutoff-time"
              value={settings.editDeleteCutoffTime}
              onChange={handleEditDeleteTimeChange}
              className="time-input"
            />
          </div>

          <div className="time-settings-form-group">
            <label className="time-limit-checkbox-wrapper">
              <input
                type="checkbox"
                checked={settings.editDeleteLimitActive}
                onChange={handleEditDeleteLimitActiveChange}
                className="time-limit-checkbox-input"
              />
              <div className="time-limit-checkbox-content">
                <strong>Kích hoạt giới hạn thời gian sửa/xóa hóa đơn</strong>
                <small>Bỏ tick để cho phép nhân viên sửa/xóa hóa đơn bất kỳ lúc nào</small>
              </div>
            </label>
          </div>

          <div className="form-actions">
            <button
              onClick={handleSave}
              disabled={saving}
              className="save-btn"
            >
              {saving ? '⏳ Đang lưu...' : '💾 Lưu cài đặt'}
            </button>
          </div>
        </div>

        <div className="warning-info">
          <div className="warning-card">
            <h4>⚠️ Lưu ý quan trọng</h4>
            <ul>
              <li>Sau thời gian giới hạn nhập cược, nhân viên sẽ không thể lưu hóa đơn mới</li>
              <li>Sau thời gian giới hạn sửa/xóa, nhân viên sẽ không thể sửa hoặc xóa hóa đơn</li>
              <li>Hệ thống sẽ hiển thị thông báo từ chối khi nhân viên cố gắng thực hiện các thao tác này</li>
              <li>Thời gian được tính theo múi giờ Việt Nam (UTC+7)</li>
              <li>Khuyến nghị đặt thời gian giới hạn sửa/xóa sớm hơn thời gian giới hạn nhập cược</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeSettings;