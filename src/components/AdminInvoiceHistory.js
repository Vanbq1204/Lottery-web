import { getApiUrl } from '../config/api';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminInterface.css'; // Tái sử dụng CSS của admin
import './EmployeeInterface.css'; // Tái sử dụng CSS của employee cho history styles

const AdminInvoiceHistory = ({ user }) => {
    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState(null);
    const [invoiceHistory, setInvoiceHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load danh sách cửa hàng khi component mount
    useEffect(() => {
        loadStores();
    }, []);

    const loadStores = async () => {
        try {
            const response = await axios.get(getApiUrl('/admin/my-stores'), {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.data.success) {
                setStores(response.data.stores);
            }
        } catch (error) {
            console.error('Lỗi khi tải cửa hàng:', error);
        }
    };

    const loadInvoiceHistory = async (storeId) => {
        if (!storeId) return;

        setIsLoading(true);
        try {
            const response = await axios.get(getApiUrl(`/admin/invoice-history/${storeId}`), {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.data.success) {
                setInvoiceHistory(response.data.history || []);
            }
        } catch (error) {
            console.error('Lỗi khi tải lịch sử:', error);
            alert('Không thể tải lịch sử sửa đổi');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStoreChange = (e) => {
        const storeId = e.target.value;
        const store = stores.find(s => s._id === storeId);
        setSelectedStore(store);
        if (storeId) {
            loadInvoiceHistory(storeId);
        } else {
            setInvoiceHistory([]);
        }
    };

    // Format functions (copied from EmployeeInterface)
    const formatHistoryChange = (field, change) => {
        switch (field) {
            case 'customerName':
                return `Tên khách hàng: "${change.from}" → "${change.to}"`;
            case 'totalAmount':
                return `Tổng tiền: ${change.from?.toLocaleString()} → ${change.to?.toLocaleString()} VNĐ`;
            case 'customerPaid':
                return `Khách đưa: ${change.from?.toLocaleString()} → ${change.to?.toLocaleString()} VNĐ`;
            case 'changeAmount':
                return `Tiền thừa: ${change.from?.toLocaleString()} → ${change.to?.toLocaleString()} VNĐ`;
            case 'items':
                return formatItemsDetailedChange(change.from, change.to);
            default:
                if (typeof change.from === 'object' || typeof change.to === 'object') {
                    return `${field}: Đã thay đổi nội dung`;
                }
                return `${field}: "${change.from}" → "${change.to}"`;
        }
    };

    const formatItemsDetailedChange = (fromItems, toItems) => {
        const fromArr = Array.isArray(fromItems) ? fromItems : [];
        const toArr = Array.isArray(toItems) ? toItems : [];

        if (fromArr.length === 0 && toArr.length === 0) {
            return 'Không có thay đổi';
        }

        if (toArr.length === 0) {
            return (
                <div>
                    <div style={{ color: '#e74c3c', fontWeight: 'bold', marginBottom: 4 }}>❌ Đã xóa toàn bộ:</div>
                    {formatItemsDetailed(fromArr)}
                </div>
            );
        }

        if (fromArr.length === 0) {
            return (
                <div>
                    <div style={{ color: '#27ae60', fontWeight: 'bold', marginBottom: 4 }}>✅ Đã thêm:</div>
                    {formatItemsDetailed(toArr)}
                </div>
            );
        }

        const { removed, added, modified } = compareItems(fromArr, toArr);

        return (
            <div>
                {removed.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                        <div style={{ color: '#e74c3c', fontWeight: 'bold', marginBottom: 4 }}>❌ Đã xóa:</div>
                        {formatItemsDetailed(removed)}
                    </div>
                )}
                {added.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                        <div style={{ color: '#27ae60', fontWeight: 'bold', marginBottom: 4 }}>✅ Đã thêm:</div>
                        {formatItemsDetailed(added)}
                    </div>
                )}
                {modified.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                        <div style={{ color: '#f39c12', fontWeight: 'bold', marginBottom: 4 }}>✏️ Đã sửa:</div>
                        {modified.map((mod, idx) => (
                            <div key={idx} style={{ marginLeft: 12, marginBottom: 4 }}>
                                <div style={{ color: '#7f8c8d' }}>{mod.label}:</div>
                                <div style={{ marginLeft: 8 }}>
                                    <div style={{ color: '#e74c3c' }}>Cũ: {formatSingleItem(mod.from)}</div>
                                    <div style={{ color: '#27ae60' }}>Mới: {formatSingleItem(mod.to)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const compareItems = (fromArr, toArr) => {
        const removed = [];
        const added = [];
        const modified = [];

        const toMap = new Map();
        toArr.forEach((item) => {
            const key = `${item.betType}_${item.numbers}`;
            toMap.set(key, { item });
        });

        const fromMap = new Map();
        fromArr.forEach((item) => {
            const key = `${item.betType}_${item.numbers}`;
            fromMap.set(key, { item });

            if (!toMap.has(key)) {
                removed.push(item);
            } else {
                const toItem = toMap.get(key).item;
                const fromAmount = item.amount || item.points || 0;
                const toAmount = toItem.amount || toItem.points || 0;
                const fromTotal = item.totalAmount || 0;
                const toTotal = toItem.totalAmount || 0;

                if (fromAmount !== toAmount || fromTotal !== toTotal) {
                    modified.push({
                        label: item.betTypeLabel || item.betType,
                        from: item,
                        to: toItem
                    });
                }
            }
        });

        toArr.forEach(item => {
            const key = `${item.betType}_${item.numbers}`;
            if (!fromMap.has(key)) {
                added.push(item);
            }
        });

        return { removed, added, modified };
    };

    const formatItemsDetailed = (items) => {
        if (!Array.isArray(items) || items.length === 0) {
            return <div style={{ marginLeft: 12, color: '#95a5a6' }}>Không có cược</div>;
        }

        const grouped = {};
        items.forEach(item => {
            const type = item.betTypeLabel || item.betType || 'Khác';
            if (!grouped[type]) {
                grouped[type] = [];
            }
            grouped[type].push(item);
        });

        return (
            <div style={{ marginLeft: 12 }}>
                {Object.entries(grouped).map(([type, itemsList]) => (
                    <div key={type} style={{ marginBottom: 6 }}>
                        <div style={{ fontWeight: 600, color: '#2c3e50' }}>{type}:</div>
                        {itemsList.map((item, idx) => (
                            <div key={idx} style={{ marginLeft: 16, color: '#34495e' }}>
                                {formatSingleItem(item)}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    const formatSingleItem = (item) => {
        const numbers = item.numbers || item.displayNumbers || '';
        const isLoto = item.betType === 'loto' || item.betType === 'loA';
        const amount = item.amount || item.points || 0;
        const total = item.totalAmount || 0;
        const unit = isLoto ? 'đ' : 'n';

        if (item.betType === 'xien' && item.isXienNhay) {
            return `${numbers} x ${amount}${unit} (xiên nháy) = ${total.toLocaleString()}n`;
        }

        return `${numbers} x ${amount}${unit} = ${total.toLocaleString()}n`;
    };

    return (
        <div className="admin-content-section">
            <h2>Lịch sử hoạt động</h2>
            <p>Xem lịch sử sửa đổi, xóa hóa đơn của từng cửa hàng</p>

            <div style={{ marginBottom: 20, marginTop: 20 }}>
                <label style={{ fontWeight: 600, marginRight: 10 }}>Chọn cửa hàng:</label>
                <select
                    value={selectedStore?._id || ''}
                    onChange={handleStoreChange}
                    style={{
                        padding: '8px 12px',
                        fontSize: '14px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        minWidth: '250px'
                    }}
                >
                    <option value="">-- Chọn cửa hàng --</option>
                    {stores.map(store => (
                        <option key={store._id} value={store._id}>
                            {store.name}
                        </option>
                    ))}
                </select>

                {selectedStore && (
                    <button
                        onClick={() => loadInvoiceHistory(selectedStore._id)}
                        style={{
                            marginLeft: 10,
                            padding: '8px 16px',
                            fontSize: '14px',
                            borderRadius: '4px',
                            border: 'none',
                            backgroundColor: '#3498db',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        Tải lại
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="admin-loading">
                    <p>Đang tải lịch sử...</p>
                </div>
            ) : selectedStore ? (
                <div className="history-container">
                    <div className="history-content">
                        {invoiceHistory.length === 0 ? (
                            <div className="no-history">
                                <p>Chưa có lịch sử sửa đổi nào cho cửa hàng này</p>
                            </div>
                        ) : (
                            <div className="history-list">
                                {invoiceHistory.map((history, index) => (
                                    <div key={index} className="history-item">
                                        <div className="history-header-info">
                                            <div className="history-invoice-id">
                                                <strong>Mã HĐ: {history.invoiceId}</strong>
                                            </div>
                                            <div className="history-action">
                                                <span className={`action-badge ${history.action}`}>
                                                    {history.action === 'edit' ? 'Sửa' : 'Xóa'}
                                                </span>
                                            </div>
                                            <div className="history-date">
                                                {new Date(history.actionDate).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                                            </div>
                                        </div>

                                        <div className="history-details">
                                            <div className="history-employee">
                                                <strong>Nhân viên:</strong> {history.employeeId?.name || 'N/A'}
                                            </div>
                                            <div className="history-reason">
                                                <strong>Lý do:</strong> {history.reason || 'Không có'}
                                            </div>
                                            {history.locationAddress && (
                                                <div className="history-location">
                                                    <strong>Địa điểm:</strong> {history.locationAddress}
                                                </div>
                                            )}

                                            {/* Hiển thị chi tiết thay đổi cho edit */}
                                            {history.action === 'edit' && Object.keys(history.changes).length > 0 && (
                                                <div className="history-changes">
                                                    <strong>Thay đổi:</strong>
                                                    <ul>
                                                        {Object.entries(history.changes).map(([field, change]) => (
                                                            <li key={field}>
                                                                {formatHistoryChange(field, change)}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Hiển thị nội dung đã xóa cho delete */}
                                            {history.action === 'delete' && history.oldData && (
                                                <div className="history-changes">
                                                    <strong>Nội dung đã xóa:</strong>
                                                    <div style={{ marginTop: 8 }}>
                                                        {history.oldData.items && history.oldData.items.length > 0 ? (
                                                            formatItemsDetailed(history.oldData.items)
                                                        ) : (
                                                            <div style={{ marginLeft: 12, color: '#95a5a6' }}>Không có dữ liệu cược</div>
                                                        )}
                                                        {history.oldData.totalAmount && (
                                                            <div style={{ marginTop: 8, marginLeft: 12, fontWeight: 'bold', color: '#e74c3c' }}>
                                                                Tổng tiền: {history.oldData.totalAmount.toLocaleString()} VNĐ
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div style={{ textAlign: 'center', color: '#7f8c8d', padding: '40px 0' }}>
                    <p>Vui lòng chọn cửa hàng để xem lịch sử</p>
                </div>
            )}
        </div>
    );
};

export default AdminInvoiceHistory;
