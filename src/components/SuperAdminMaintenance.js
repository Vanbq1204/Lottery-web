import { getApiUrl } from '../config/api';
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SuperAdminMaintenance = () => {
    const [status, setStatus] = useState({
        maintenanceMode: false,
        maintenanceActivatedAt: null
    });
    const [loading, setLoading] = useState(false);

    const loadStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const resp = await axios.get(getApiUrl('/superadmin/session/maintenance/status'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (resp.data?.success) {
                setStatus({
                    maintenanceMode: resp.data.maintenanceMode || false,
                    maintenanceActivatedAt: resp.data.maintenanceActivatedAt || null
                });
            }
        } catch (err) {
            console.error('Error loading maintenance status:', err);
        }
    };

    useEffect(() => {
        loadStatus();
    }, []);

    const toggleMaintenanceMode = async () => {
        const willEnable = !status.maintenanceMode;

        const confirmMsg = willEnable
            ? 'Bạn có chắc muốn KÍCH HOẠT chế độ bảo trì? Toàn bộ tài khoản (trừ SuperAdmin) sẽ bị đăng xuất và không thể đăng nhập lại cho đến khi tắt chế độ bảo trì.'
            : 'Bạn có chắc muốn TẮT chế độ bảo trì? Người dùng sẽ có thể đăng nhập trở lại.';

        if (!window.confirm(confirmMsg)) return;

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const resp = await axios.post(
                getApiUrl('/superadmin/session/maintenance'),
                { enabled: willEnable },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (resp.data?.success) {
                alert(resp.data.message);
                setStatus({
                    maintenanceMode: resp.data.maintenanceMode,
                    maintenanceActivatedAt: resp.data.maintenanceActivatedAt
                });
            } else {
                alert(resp.data?.message || 'Không thể cập nhật trạng thái bảo trì');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi server');
        } finally {
            setLoading(false);
        }
    };

    const formatVN = (iso) => {
        if (!iso) return 'Chưa kích hoạt';
        const d = new Date(iso);
        return d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    };

    return (
        <div style={{ border: '2px solid black', borderRadius: 8, padding: 16, background: 'white' }}>
            <h3>Kích hoạt bảo trì hệ thống</h3>
            <p>
                Khi bật chế độ này, toàn bộ tài khoản (Admin và Nhân viên) sẽ bị đăng xuất ngay lập tức.
                Họ sẽ không thể đăng nhập lại cho đến khi bạn tắt chế độ bảo trì.
            </p>
            <p>
                Trang đăng nhập sẽ hiển thị thông báo: <em>"Hệ thống đang bảo trì, vui lòng quay lại sau. Xin lỗi vì sự bất tiện này."</em>
            </p>

            <div style={{ margin: '16px 0', padding: 12, background: status.maintenanceMode ? '#ffebee' : '#e8f5e9', borderRadius: 4 }}>
                <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
                    Trạng thái hiện tại: {' '}
                    <span style={{ color: status.maintenanceMode ? '#d32f2f' : '#2e7d32' }}>
                        {status.maintenanceMode ? '🔴 ĐANG BẢO TRÌ' : '🟢 HOẠT ĐỘNG BÌNH THƯỜNG'}
                    </span>
                </div>
                {status.maintenanceMode && (
                    <div style={{ fontSize: 14, color: '#666' }}>
                        Kích hoạt lúc: {formatVN(status.maintenanceActivatedAt)}
                    </div>
                )}
            </div>

            <button
                onClick={toggleMaintenanceMode}
                disabled={loading}
                style={{
                    border: '2px solid',
                    borderColor: status.maintenanceMode ? '#2e7d32' : '#d32f2f',
                    background: status.maintenanceMode ? '#2e7d32' : '#d32f2f',
                    color: 'white',
                    padding: '10px 16px',
                    borderRadius: 4,
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: 15
                }}
            >
                {loading
                    ? 'Đang xử lý...'
                    : status.maintenanceMode
                        ? '🟢 Tắt chế độ bảo trì'
                        : '🔴 Kích hoạt bảo trì hệ thống'}
            </button>

            <div style={{ marginTop: 16, padding: 12, background: '#fff3cd', borderRadius: 4, fontSize: 14 }}>
                <strong>⚠️ Lưu ý quan trọng:</strong>
                <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                    <li>Chỉ tài khoản Super Admin mới có thể đăng nhập khi hệ thống đang bảo trì.</li>
                    <li>Tất cả tài khoản khác sẽ bị đăng xuất ngay lập tức khi bật chế độ bảo trì.</li>
                    <li>Hãy chắc chắn bạn đã thông báo trước cho người dùng về thời gian bảo trì.</li>
                </ul>
            </div>
        </div>
    );
};

export default SuperAdminMaintenance;
