import { getApiUrl } from '../config/api';

import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      
      <div className="login-card">
        <div className="login-header">
          <div className="logo-section">
            <div className="logo-icon">🎯</div>
            <h1 className="main-title">Lộc Phát 88</h1>
            <div className="subtitle">Hệ Thống Quản Lý Xổ Số</div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">
              <span className="label-icon">👤</span>
              Tên đăng nhập
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Nhập tên đăng nhập"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <span className="label-icon">🔐</span>
              Mật khẩu
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Nhập mật khẩu"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            <span className="button-icon">🚀</span>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        
        <div className="login-footer">
          <p className="footer-text">
            © 2024 Lộc Phát 88 - Hệ thống xổ số chuyên nghiệp
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 