import { getApiUrl } from '../config/api';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Login.css';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login'); // Default to login
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [checkingMaintenance, setCheckingMaintenance] = useState(true);

  // Check maintenance mode on mount
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const response = await axios.get(getApiUrl('/auth/maintenance'));
        if (response.data?.success && response.data?.maintenanceMode) {
          setMaintenanceMode(true);
        }
      } catch (err) {
        console.error('Error checking maintenance mode:', err);
      } finally {
        setCheckingMaintenance(false);
      }
    };
    checkMaintenance();
  }, []);

  // Check if user has already accepted terms
  useEffect(() => {
    const accepted = localStorage.getItem('termsAccepted');
    if (accepted === 'true') {
      setTermsAccepted(true);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTermsChange = (e) => {
    const isChecked = e.target.checked;

    // If checking the box, show modal first
    if (isChecked && !termsAccepted) {
      setShowTermsModal(true);
    }

    setTermsAccepted(isChecked);
    if (isChecked) {
      localStorage.setItem('termsAccepted', 'true');
    } else {
      // If unchecking, remove from storage
      localStorage.removeItem('termsAccepted');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Show error if terms not accepted
    if (!termsAccepted) {
      setError('Vui lòng đồng ý với Điều khoản sử dụng để tiếp tục');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(getApiUrl('/auth/login'), formData);
      const { token, user } = response.data;

      // Lưu token vào localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      onLogin(user);
    } catch (error) {
      setError(error.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-pattern"></div>
      </div>

      {/* Loading State */}
      {checkingMaintenance && (
        <div className="login-card-wrapper show-login">
          <div className="login-right-panel">
            <div className="login-form-container">
              <div className="login-header">
                <h2 className="login-title">Đang kiểm tra...</h2>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {!checkingMaintenance && showTermsModal && (
        <div className="terms-modal-overlay" onClick={() => setShowTermsModal(false)}>
          <div className="terms-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="terms-modal-header">
              <h2>ĐIỀU KHOẢN SỬ DỤNG PHẦN MỀM</h2>
              <button className="terms-modal-close" onClick={() => setShowTermsModal(false)}>×</button>
            </div>
            <div className="terms-modal-body">
              <p><strong>Bằng việc truy cập, đăng nhập và sử dụng Phần mềm Quản lý Bán hàng này, Người dùng xác nhận đã đọc, hiểu và đồng ý tuân thủ toàn bộ các điều khoản dưới đây:</strong></p>

              <p>* Người dùng cam kết sử dụng Phần mềm đúng mục đích, đúng chức năng và tuân thủ đầy đủ các quy định của pháp luật Việt Nam hiện hành.</p>

              <p>* Người dùng không được sử dụng Phần mềm cho bất kỳ mục đích nào trái pháp luật, bao gồm nhưng không giới hạn ở các hành vi gian lận, trốn thuế, che giấu doanh thu, làm giả dữ liệu, xâm phạm quyền và lợi ích hợp pháp của tổ chức, cá nhân khác.</p>

              <p>* Người dùng tự chịu hoàn toàn trách nhiệm trước pháp luật đối với mọi hành vi sử dụng Phần mềm, cũng như đối với toàn bộ dữ liệu, thông tin, giao dịch được tạo lập, lưu trữ hoặc xử lý thông qua Phần mềm.</p>

              <p>* Nhà cung cấp Phần mềm không chịu trách nhiệm đối với bất kỳ thiệt hại, rủi ro, tranh chấp hoặc nghĩa vụ pháp lý nào phát sinh từ việc Người dùng sử dụng Phần mềm trái quy định pháp luật hoặc vi phạm điều khoản này.</p>

              <p>* Nhà cung cấp Phần mềm có quyền tạm ngừng hoặc chấm dứt quyền truy cập của Người dùng nếu phát hiện hoặc có căn cứ cho rằng Người dùng vi phạm pháp luật hoặc các điều khoản sử dụng, mà không cần báo trước và không phải bồi thường.</p>

              <p className="terms-highlight">👉 Việc Người dùng tích chọn "Tôi đồng ý với Điều khoản sử dụng" và tiếp tục đăng nhập được xem là sự chấp thuận ràng buộc pháp lý đối với các điều khoản nêu trên.</p>
            </div>
            <div className="terms-modal-footer-simple">
              <button
                className="terms-modal-btn"
                onClick={() => setShowTermsModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`login-card-wrapper ${activeTab === 'intro' ? 'show-intro' : 'show-login'}`} style={{ display: checkingMaintenance ? 'none' : 'flex' }}>
        {/* Mobile Tab Navigation - Hidden (duplicate text) */}
        {/* <div className="mobile-tabs mobile-tabs-single">
          <button
            className="mobile-tab-button active"
            style={{ cursor: 'default' }}
          >
            Đăng nhập
          </button>
        </div> */}
        {/* Left Side - Welcome Section */}


        {/* Right Side - Login Form */}
        <div className="login-right-panel">
          <div className="login-form-container">
            <div className="login-header">

              <h2 className="login-title">Đăng nhập</h2>
            </div>

            {/* Maintenance Mode Warning Banner */}
            {maintenanceMode && (
              <div style={{
                padding: '16px',
                background: '#fff3cd',
                borderRadius: 8,
                marginBottom: 16,
                border: '2px solid #ffc107'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 20, marginRight: 8 }}>🔧</span>
                  <strong style={{ color: '#d32f2f' }}>HỆ THỐNG ĐANG BẢO TRÌ</strong>
                </div>
                <p style={{ fontSize: 14, color: '#666', margin: 0 }}>
                  Chỉ tài khoản <strong>SuperAdmin</strong> mới có thể đăng nhập. Tất cả tài khoản khác sẽ bị từ chối.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="username">
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Tên đăng nhập hoặc email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Mật khẩu"
                />
              </div>

              {/* Terms Checkbox with Link */}
              <div className="terms-checkbox-group">
                <label className="terms-checkbox-label">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={handleTermsChange}
                    className="terms-checkbox"
                  />
                  <span>
                    Tôi đồng ý với{' '}
                    <button
                      type="button"
                      className="terms-link"
                      onClick={() => setShowTermsModal(true)}
                    >
                      Điều khoản sử dụng
                    </button>
                  </span>
                </label>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>

              <div className="copyright-text">@2025 VJamin-Tech</div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;