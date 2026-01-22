import { getApiUrl } from '../config/api';

import React, { useState } from 'react';
import axios from 'axios';
import './AdminChangePassword.css';

const SuperAdminChangePassword = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!oldPassword || !newPassword || !confirmPassword) {
            setError('Vui lòng nhập đầy đủ 3 ô');
            return;
        }
        if (newPassword.length < 6) {
            setError('Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Nhập lại mật khẩu mới không khớp');
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const resp = await axios.put(getApiUrl('/superadmin/change-password'),
                { oldPassword, newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (resp.data?.success) {
                setMessage('Đổi mật khẩu thành công! Vui lòng đăng nhập lại với mật khẩu mới.');
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setError(resp.data?.message || 'Đổi mật khẩu thất bại');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi server khi đổi mật khẩu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-change-password">
            <div className="super-admin-header">
                <h2>Đổi mật khẩu SuperAdmin</h2>
                <p>Nhập mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu mới.</p>
            </div>
            <form onSubmit={handleSubmit} className="admin-change-form">
                <div className="form-group">
                    <label>Mật khẩu cũ</label>
                    <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        autoComplete="current-password"
                    />
                </div>
                <div className="form-group">
                    <label>Mật khẩu mới (ít nhất 6 ký tự)</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                    />
                </div>
                <div className="form-group">
                    <label>Nhập lại mật khẩu mới</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                    />
                </div>
                {error && <div className="error-text">{error}</div>}
                {message && <div className="success-text">{message}</div>}
                <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
            </form>
        </div>
    );
};

export default SuperAdminChangePassword;
