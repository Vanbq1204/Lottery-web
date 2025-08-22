import { getApiUrl } from '../config/api';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PrizeSettings.css';

const PrizeSettings = () => {
  const [multipliers, setMultipliers] = useState([]);
  const [editingMultiplier, setEditingMultiplier] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expanded3s, setExpanded3s] = useState(false);
  const [expandedXien, setExpandedXien] = useState(false);
  const [expandedXienQuay, setExpandedXienQuay] = useState(false);

  // Mapping tên loại cược - Cập nhật cho 5 betType riêng biệt của 3 số và xiên quay
  const betTypeNames = {
    'loto': 'Lô tô',
    '2s': '2 số',
    '3s_gdb': '3 số trùng giải đặc biệt',
    '3s_gdb_g1': '3 số trùng cả GĐB và G1',
    '3s_gdb2_g1': '3 số 2 số cuối GĐB và 3 số cuối G1',
    '3s_g1': '3 số trùng giải 1',
    '3s_g6': '3 số trùng giải 6',
    '3s_2digits_gdb': '3 số trùng 2 số cuối trùng GĐB',
    'tong': 'Tổng',
    'kep': 'Kép',
    'dau': 'Đầu',
    'dit': 'Đít',
    'bo': 'Bộ',
    'xien': 'Xiên',
    'xienquay': 'Xiên quay',
    // Xiên 2, 3, 4
    'xien2_full': 'Xiên 2 - Trúng cả 2 số',
    'xien2_1hit': 'Xiên 2 - Trúng 1 số (≥2 nháy)',
    'xien3_full': 'Xiên 3 - Trúng cả 3 số',
    'xien3_2hit_both': 'Xiên 3 - Trúng 2 số (cả 2 ≥2 nháy)',
    'xien3_2hit_one': 'Xiên 3 - Trúng 2 số (1 số ≥2 nháy)',
    'xien4_full': 'Xiên 4 - Trúng cả 4 số',
    'xien4_3hit_all': 'Xiên 4 - Trúng 3 số (cả 3 ≥2 nháy)',
    'xien4_3hit_two': 'Xiên 4 - Trúng 3 số (2 số ≥2 nháy)',
    'xien4_3hit_one': 'Xiên 4 - Trúng 3 số (1 số ≥2 nháy)',
    // Xiên quay 4
    'xienquay4_full': 'Xiên quay 4 - Trúng cả 4 con',
    'xienquay4_3con': 'Xiên quay 4 - Trúng 3 con',
    'xienquay4_2con': 'Xiên quay 4 - Trúng 2 con',
    // Xiên quay 3
    'xienquay3_full': 'Xiên quay 3 - Trúng cả 3 con',
    'xienquay3_2con': 'Xiên quay 3 - Trúng 2 con'
  };

  // Lấy danh sách hệ số thưởng
  const loadMultipliers = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(getApiUrl('/prize/multipliers'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMultipliers(response.data);
    } catch (error) {
      console.error('Lỗi tải hệ số thưởng:', error);
      alert('Lỗi khi tải danh sách hệ số thưởng');
    } finally {
      setIsLoading(false);
    }
  };

  // Cập nhật hệ số thưởng - Logic mới không dùng subType
  const updateMultiplier = async (betType, multiplier, description) => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      
      await axios.put(getApiUrl('/prize/multipliers'), 
        { betType, multiplier, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Cập nhật state local
      setMultipliers(prev => 
        prev.map(m => 
          m.betType === betType 
            ? { ...m, multiplier, description, updatedAt: new Date() }
            : m
        )
      );
      
      setEditingMultiplier(null);
      alert('Cập nhật hệ số thưởng thành công!');
      
    } catch (error) {
      console.error('Lỗi cập nhật hệ số thưởng:', error);
      alert('Lỗi khi cập nhật hệ số thưởng: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  // Xử lý submit form chỉnh sửa
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const multiplier = parseFloat(formData.get('multiplier'));
    const description = formData.get('description');
    
    if (isNaN(multiplier) || multiplier < 0) {
      alert('Vui lòng nhập hệ số hợp lệ (≥ 0)');
      return;
    }
    
    updateMultiplier(editingMultiplier.betType, multiplier, description);
  };

  // Format ngày giờ
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  };

  useEffect(() => {
    loadMultipliers();
  }, []);

  return (
    <div className="prize-settings">
      <div className="settings-header">
        <h2>⚙️ Cài đặt hệ số thưởng</h2>
        <p>Quản lý và điều chỉnh hệ số thưởng cho từng loại cược</p>
      </div>

      {isLoading ? (
        <div className="loading">⏳ Đang tải...</div>
      ) : (
        <div className="multipliers-grid">
          {(() => {
            const threeNumberTypes = multipliers.filter(m => m.betType.startsWith('3s_'));
            const xienTypes = multipliers.filter(m => m.betType.startsWith('xien') && !m.betType.includes('quay') && m.betType !== 'xien');
            const xienQuayTypes = multipliers.filter(m => m.betType.startsWith('xienquay') && m.betType !== 'xienquay');
            const otherTypes = multipliers.filter(m => 
              !m.betType.startsWith('3s_') && 
              !m.betType.startsWith('xienquay') &&
              !(m.betType.startsWith('xien') && !m.betType.includes('quay') && m.betType !== 'xien')
            );
            
            return (
              <>
                {/* Card nhóm 3 số */}
                {threeNumberTypes.length > 0 && (
                  <div className="multiplier-card">
                    <div className="card-header">
                      <h3>3 số (5 loại)</h3>
                      <button 
                        className="expand-btn"
                        onClick={() => setExpanded3s(!expanded3s)}
                      >
                        ✏️ Chỉnh sửa
                      </button>
                    </div>
                    
                    {!expanded3s ? (
                      <div className="multiplier-info">
                        <div className="multiplier-value">
                          <span className="label">Hệ số:</span>
                          <span className="value">Nhiều mức (6 loại)</span>
                        </div>
                        <div className="multiplier-desc">
                          <span className="label">Mô tả:</span>
                          <span className="desc">Click "✏️ Chỉnh sửa" để xem và chỉnh sửa từng loại</span>
                        </div>
                      </div>
                    ) : (
                      <div className="dropdown-content">
                        {threeNumberTypes.map((multiplier) => (
                          <div key={multiplier.betType} className="dropdown-item">
                            <div className="item-info">
                              <span className="item-label">
                                {betTypeNames[multiplier.betType] || multiplier.betType}
                              </span>
                              <div className="item-multiplier-info">
                                <span className="multiplier-value">×{multiplier.multiplier}</span>
                                <span className="status-badge active">Hoạt động</span>
                              </div>
                            </div>
                            <button 
                              className="edit-btn-small"
                              onClick={() => setEditingMultiplier(multiplier)}
                            >
                              ✏️
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Card nhóm xiên */}
                {xienTypes.length > 0 && (
                  <div className="multiplier-card">
                    <div className="card-header">
                      <h3>Xiên ({xienTypes.length} loại)</h3>
                      <button 
                        className="expand-btn"
                        onClick={() => setExpandedXien(!expandedXien)}
                      >
                        ✏️ Chỉnh sửa
                      </button>
                    </div>
                    
                    {!expandedXien ? (
                      <div className="multiplier-info">
                        <div className="multiplier-value">
                          <span className="label">Hệ số:</span>
                          <span className="value">Nhiều mức ({xienTypes.length} loại)</span>
                        </div>
                        <div className="multiplier-desc">
                          <span className="label">Mô tả:</span>
                          <span className="desc">Click "✏️ Chỉnh sửa" để xem và chỉnh sửa từng loại</span>
                        </div>
                      </div>
                    ) : (
                      <div className="dropdown-content">
                        {xienTypes.map((multiplier) => (
                          <div key={multiplier.betType} className="dropdown-item">
                            <div className="item-info">
                              <span className="item-label">
                                {betTypeNames[multiplier.betType] || multiplier.betType}
                              </span>
                              <div className="item-multiplier-info">
                                <span className="multiplier-value">×{multiplier.multiplier}</span>
                                <span className="status-badge active">Hoạt động</span>
                              </div>
                            </div>
                            <button 
                              className="edit-btn-small"
                              onClick={() => setEditingMultiplier(multiplier)}
                            >
                              ✏️
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Card nhóm xiên quay */}
                {xienQuayTypes.length > 0 && (
                  <div className="multiplier-card">
                    <div className="card-header">
                      <h3>Xiên quay ({xienQuayTypes.length} loại)</h3>
                      <button 
                        className="expand-btn"
                        onClick={() => setExpandedXienQuay(!expandedXienQuay)}
                      >
                        ✏️ Chỉnh sửa
                      </button>
                    </div>
                    
                    {!expandedXienQuay ? (
                      <div className="multiplier-info">
                        <div className="multiplier-value">
                          <span className="label">Hệ số:</span>
                          <span className="value">Nhiều mức ({xienQuayTypes.length} loại)</span>
                        </div>
                        <div className="multiplier-desc">
                          <span className="label">Mô tả:</span>
                          <span className="desc">Click "✏️ Chỉnh sửa" để xem và chỉnh sửa từng loại</span>
                        </div>
                      </div>
                    ) : (
                      <div className="dropdown-content">
                        {xienQuayTypes.map((multiplier) => (
                          <div key={multiplier.betType} className="dropdown-item">
                            <div className="item-info">
                              <span className="item-label">
                                {betTypeNames[multiplier.betType] || multiplier.betType}
                              </span>
                              <div className="item-multiplier-info">
                                <span className="multiplier-value">×{multiplier.multiplier}</span>
                                <span className="status-badge active">Hoạt động</span>
                              </div>
                            </div>
                            <button 
                              className="edit-btn-small"
                              onClick={() => setEditingMultiplier(multiplier)}
                            >
                              ✏️
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Các card khác */}
                {otherTypes.map((multiplier) => (
            <div key={multiplier.betType} className="multiplier-card">
              <div className="card-header">
                      <h3>
                        {betTypeNames[multiplier.betType] || multiplier.betType}
                      </h3>
                <button 
                  className="edit-btn"
                  onClick={() => setEditingMultiplier(multiplier)}
                >
                  ✏️ Chỉnh sửa
                </button>
              </div>
              
              <div className="multiplier-info">
                <div className="multiplier-value">
                  <span className="label">Hệ số:</span>
                  <span className="value">×{multiplier.multiplier}</span>
                </div>
                
                <div className="multiplier-desc">
                  <span className="label">Mô tả:</span>
                  <span className="desc">{multiplier.description}</span>
                </div>
                
                {multiplier.updatedAt && (
                  <div className="last-updated">
                    <span className="label">Cập nhật:</span>
                    <span className="date">{formatDateTime(multiplier.updatedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
              </>
            );
          })()}
        </div>
      )}

      {/* Modal chỉnh sửa */}
      {editingMultiplier && (
        <div className="modal-overlay" onClick={() => setEditingMultiplier(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chỉnh sửa hệ số thưởng</h3>
              <button 
                className="close-btn"
                onClick={() => setEditingMultiplier(null)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="edit-form">
              <div className="form-group">
                <label>Loại cược:</label>
                <input 
                  type="text" 
                  value={betTypeNames[editingMultiplier.betType] || editingMultiplier.betType}
                  disabled
                  className="form-input disabled"
                />
              </div>
              
              <div className="form-group">
                <label>Hệ số thưởng:</label>
                <input 
                  type="text" 
                  name="multiplier"
                  defaultValue={editingMultiplier.multiplier}
                  required
                  className="form-input"
                  placeholder="Nhập hệ số (VD: 80)"
                />
              </div>
              
              <div className="form-group">
                <label>Mô tả:</label>
                <textarea 
                  name="description"
                  defaultValue={editingMultiplier.description}
                  className="form-textarea"
                  placeholder="Mô tả hệ số thưởng..."
                  rows="3"
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setEditingMultiplier(null)}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="save-btn"
                  disabled={isSaving}
                >
                  {isSaving ? '⏳ Đang lưu...' : '💾 Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrizeSettings; 