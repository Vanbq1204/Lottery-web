import React, { useState } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import './DataCleanup.css';

const DataCleanup = ({ user }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteStats, setDeleteStats] = useState(null);

  // Tính toán ngày giới hạn (giữ lại 2 ngày gần nhất)
  const getRetentionDate = () => {
    const today = new Date();
    const retentionDate = new Date(today);
    retentionDate.setDate(today.getDate() - 2); // Giữ lại 2 ngày gần nhất
    return retentionDate.toISOString().split('T')[0];
  };

  // Lấy thống kê dữ liệu sẽ bị xóa
  const getDeleteStats = async () => {
    setIsLoading(true);
    try {
      const retentionDate = getRetentionDate();
      const response = await axios.get(
        getApiUrl(`/admin/data-cleanup/stats?beforeDate=${retentionDate}`),
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setDeleteStats(response.data.stats);
        setConfirmDelete(true);
      } else {
        alert('Không thể lấy thống kê dữ liệu');
      }
    } catch (error) {
      console.error('Lỗi khi lấy thống kê:', error);
      alert('Có lỗi xảy ra khi lấy thống kê dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  // Thực hiện xóa dữ liệu
  const performCleanup = async () => {
    setIsLoading(true);
    try {
      const retentionDate = getRetentionDate();
      const response = await axios.delete(
        getApiUrl(`/admin/data-cleanup?beforeDate=${retentionDate}`),
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        alert(`Đã xóa thành công:\n- ${response.data.deletedInvoices} hóa đơn cược\n- ${response.data.deletedWinningInvoices} hóa đơn thưởng`);
        setConfirmDelete(false);
        setDeleteStats(null);
      } else {
        alert('Không thể xóa dữ liệu');
      }
    } catch (error) {
      console.error('Lỗi khi xóa dữ liệu:', error);
      alert('Có lỗi xảy ra khi xóa dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelCleanup = () => {
    setConfirmDelete(false);
    setDeleteStats(null);
  };

  const today = new Date();
  const retentionDate = new Date(today);
  retentionDate.setDate(today.getDate() - 2);

  return (
    <div className="data-cleanup-container">
      <div className="data-cleanup-header">
        <h2>Làm sạch dữ liệu</h2>
        <p className="data-cleanup-description">
          Chức năng này sẽ xóa toàn bộ hóa đơn cược và hóa đơn thưởng của các cửa hàng bạn quản lý,
          chỉ giữ lại dữ liệu của 2 ngày gần nhất.
        </p>
      </div>

      <div className="data-cleanup-info">
        <div className="cleanup-info-card">
          <h3>📅 Thông tin xóa dữ liệu</h3>
          <div className="cleanup-dates">
            <div className="date-info">
              <span className="date-label">Ngày hôm nay:</span>
              <span className="date-value">{today.toLocaleDateString('vi-VN')}</span>
            </div>
            <div className="date-info">
              <span className="date-label">Sẽ xóa dữ liệu trước ngày:</span>
              <span className="date-value danger">{retentionDate.toLocaleDateString('vi-VN')}</span>
            </div>
            <div className="date-info">
              <span className="date-label">Giữ lại dữ liệu từ:</span>
              <span className="date-value safe">
                {retentionDate.toLocaleDateString('vi-VN')} đến {today.toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {!confirmDelete ? (
        <div className="cleanup-action">
          <button 
            className="cleanup-check-btn"
            onClick={getDeleteStats}
            disabled={isLoading}
          >
            {isLoading ? 'Đang kiểm tra...' : '🔍 Kiểm tra dữ liệu sẽ xóa'}
          </button>
        </div>
      ) : (
        <div className="cleanup-confirmation">
          <div className="cleanup-stats">
            <h3>📊 Thống kê dữ liệu sẽ bị xóa</h3>
            {deleteStats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{deleteStats.totalInvoices}</div>
                  <div className="stat-label">Hóa đơn cược</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{deleteStats.totalWinningInvoices}</div>
                  <div className="stat-label">Hóa đơn thưởng</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{deleteStats.affectedStores}</div>
                  <div className="stat-label">Cửa hàng bị ảnh hưởng</div>
                </div>
              </div>
            )}
          </div>

          <div className="cleanup-warning">
            <div className="warning-box">
              <h4>⚠️ Cảnh báo quan trọng</h4>
              <ul>
                <li>Dữ liệu bị xóa sẽ <strong>KHÔNG THỂ KHÔI PHỤC</strong></li>
                <li>Chỉ xóa dữ liệu của các cửa hàng bạn quản lý</li>
                <li>Giữ lại dữ liệu của 2 ngày gần nhất</li>
                <li>Hãy chắc chắn trước khi thực hiện</li>
              </ul>
            </div>
          </div>

          <div className="cleanup-actions">
            <button 
              className="cleanup-cancel-btn"
              onClick={cancelCleanup}
              disabled={isLoading}
            >
              ❌ Hủy bỏ
            </button>
            <button 
              className="cleanup-confirm-btn"
              onClick={performCleanup}
              disabled={isLoading}
            >
              {isLoading ? 'Đang xóa...' : '🗑️ Xác nhận xóa'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataCleanup;