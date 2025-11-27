import React from 'react';

const StoreExpirationBar = ({ startDate, endDate, storeName }) => {
    // Nếu không có endDate, không hiển thị gì
    if (!endDate) {
        return null;
    }

    const now = new Date();
    const start = new Date(startDate || now);
    const end = new Date(endDate);

    // Tính toán số ngày
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

    // Tính phần trăm đã sử dụng
    const percentage = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

    // Xác định màu sắc dựa trên số ngày còn lại và phần trăm
    let barColor = 'green';
    if (remainingDays <= 3) {
        barColor = 'red';
    } else if (percentage >= 80) { // Đã dùng >= 80% thời gian (còn <= 20%)
        barColor = 'yellow';
    }

    // Format ngày
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    // Kiểm tra xem có cần hiển thị cảnh báo không (còn <= 3 ngày)
    const showWarning = remainingDays <= 3 && remainingDays >= 0;
    const isExpired = remainingDays < 0;

    return (
        <div className="expiration-container">
            {showWarning && !isExpired && (
                <div className="expiration-warning">
                    {remainingDays === 0
                        ? '⚠️ Hết hạn sử dụng, hãy liên hệ với quản trị viên để gia hạn sử dụng'
                        : '⚠️ Thời gian sử dụng sắp hết, hãy liên hệ với quản trị viên để gia hạn sử dụng'
                    }
                </div>
            )}
            {isExpired && (
                <div className="expiration-warning expired">
                    ❌ Cửa hàng đã hết hạn sử dụng, vui lòng liên hệ quản trị viên
                </div>
            )}

            <div className="expiration-bar-container">
                <div className={`expiration-bar ${barColor}`} style={{ width: `${percentage}%` }}></div>
            </div>

            <div className="expiration-dates">
                <span className="start-date">Bắt đầu: {formatDate(start)}</span>
                <span className="days-remaining">
                    {isExpired ? 'Đã hết hạn' : `Còn ${remainingDays}/${totalDays} ngày`}
                </span>
                <span className="end-date">Kết thúc: {formatDate(end)}</span>
            </div>
        </div>
    );
};

export default StoreExpirationBar;
