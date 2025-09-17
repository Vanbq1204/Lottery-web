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
  const [activeTab, setActiveTab] = useState('intro'); // 'intro' hoặc 'login'

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
      
      <div className={`login-card-wrapper ${activeTab === 'intro' ? 'show-intro' : 'show-login'}`}>
        {/* Mobile Tab Navigation */}
        <div className="mobile-tabs">
          <button 
            className={`mobile-tab-button ${activeTab === 'intro' ? 'active' : ''}`}
            onClick={() => setActiveTab('intro')}
          >
            Giới thiệu
          </button>
          <button 
            className={`mobile-tab-button ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Đăng nhập
          </button>
        </div>
        {/* Left Side - Welcome Section */}
        
        
        {/* Right Side - Login Form */}
        <div className="login-right-panel">
          <div className="login-form-container">
            <div className="login-header">
          
               <h2 className="login-title">Đăng nhập</h2>
             </div>
            
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