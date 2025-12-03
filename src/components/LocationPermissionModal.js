import React, { useState, useEffect } from 'react';
import './LocationPermissionModal.css';
import { getCurrentAddress } from '../utils/geolocationUtils';

const LocationPermissionModal = ({ isOpen, onClose, onSuccess }) => {
    const [isChecking, setIsChecking] = useState(false);
    const [permissionState, setPermissionState] = useState('prompt'); // 'prompt', 'granted', 'denied'

    useEffect(() => {
        if (isOpen) {
            checkPermission();
        }
    }, [isOpen]);

    const checkPermission = async () => {
        if (navigator.permissions && navigator.permissions.query) {
            try {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                setPermissionState(result.state);

                result.onchange = () => {
                    setPermissionState(result.state);
                };
            } catch (error) {
                console.error('Error checking permission:', error);
            }
        }
    };

    const handleAllowClick = async () => {
        setIsChecking(true);
        try {
            const address = await getCurrentAddress();
            if (address) {
                onSuccess(address);
            } else {
                // Fallback if address is null but no error thrown (rare)
                alert('Không thể lấy địa chỉ. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error('Error requesting location:', error);
            // If error is permission denied, state should update via onchange or re-check
            checkPermission();

            if (error.message.toLowerCase().includes('từ chối') || error.message.toLowerCase().includes('denied')) {
                setPermissionState('denied');
                alert('Quyền truy cập vẫn bị chặn. Vui lòng làm theo hướng dẫn để mở khóa.');
            } else {
                alert('Không thể lấy vị trí. Vui lòng kiểm tra GPS hoặc kết nối mạng và thử lại.\nChi tiết: ' + error.message);
            }
        } finally {
            setIsChecking(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="location-modal-overlay">
            <div className="location-modal">
                <div className="location-modal-header">
                    <div className="location-modal-icon">📍</div>
                    <h3 className="location-modal-title">Yêu cầu quyền truy cập vị trí</h3>
                </div>

                <div className="location-modal-body">
                    <p>
                        Để đảm bảo tính minh bạch, hệ thống yêu cầu ghi lại địa điểm thực hiện khi <strong>Sửa</strong> hoặc <strong>Xóa</strong> hóa đơn.
                    </p>

                    {permissionState === 'denied' ? (
                        <div className="location-instruction">
                            <strong>⚠️ Quyền truy cập đã bị chặn</strong>
                            <p style={{ marginTop: '8px', marginBottom: '0' }}>
                                Vui lòng làm theo hướng dẫn sau để mở lại:
                            </p>
                            <ol style={{ paddingLeft: '20px', marginTop: '8px', marginBottom: '0' }}>
                                <li>Nhấn vào biểu tượng ổ khóa 🔒 hoặc cài đặt bên cạnh thanh địa chỉ.</li>
                                <li>Tìm mục <strong>Vị trí (Location)</strong>.</li>
                                <li>Chuyển sang trạng thái <strong>Cho phép (Allow)</strong> hoặc <strong>Hỏi (Ask)</strong>.</li>
                                <li>Nhấn nút <strong>Thử lại</strong> bên dưới.</li>
                            </ol>
                        </div>
                    ) : (
                        <p>
                            Vui lòng nhấn nút <strong>Cho phép vị trí</strong> bên dưới. Sau đó, trình duyệt sẽ hiện thông báo, hãy chọn <strong>Allow (Cho phép)</strong>.
                        </p>
                    )}
                </div>

                <div className="location-modal-footer">
                    <button className="btn-modal-cancel" onClick={onClose}>
                        Hủy bỏ
                    </button>
                    <button
                        className="btn-modal-allow"
                        onClick={handleAllowClick}
                        disabled={isChecking}
                    >
                        {isChecking ? 'Đang lấy vị trí...' : (permissionState === 'denied' ? 'Thử lại' : 'Cho phép vị trí')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LocationPermissionModal;
