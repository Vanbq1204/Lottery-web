import { getApiUrl } from '../config/api';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TimeSettings.css';

const AdminStoreTimeSettings = () => {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pendingChanges, setPendingChanges] = useState({});

    // Load stores khi component mount
    useEffect(() => {
        loadStores();
    }, []);

    const loadStores = async () => {
        try {
            setLoading(true);
            const response = await axios.get(getApiUrl('/admin/my-stores'), {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data.success) {
                setStores(response.data.stores);
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách cửa hàng:', error);
            alert('Không thể tải danh sách cửa hàng');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStore = (storeId, currentValue) => {
        setPendingChanges(prev => ({
            ...prev,
            [storeId]: !currentValue
        }));
    };

    const handleSaveAll = async () => {
        try {
            setSaving(true);
            const updatePromises = Object.entries(pendingChanges).map(([storeId, applyBettingTimeLimit]) => {
                return axios.put(
                    getApiUrl(`/admin/stores/${storeId}/time-settings`),
                    { applyBettingTimeLimit },
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );
            });

            await Promise.all(updatePromises);

            alert('Cập nhật cài đặt thành công!');
            setPendingChanges({});
            await loadStores(); // Reload to get updated data
        } catch (error) {
            console.error('Lỗi khi cập nhật cài đặt:', error);
            alert(error.response?.data?.message || 'Không thể cập nhật cài đặt');
        } finally {
            setSaving(false);
        }
    };

    const handleEnableAll = () => {
        const changes = {};
        stores.forEach(store => {
            if (!store.applyBettingTimeLimit) {
                changes[store._id] = true;
            }
        });
        setPendingChanges(prev => ({ ...prev, ...changes }));
    };

    const handleDisableAll = () => {
        const changes = {};
        stores.forEach(store => {
            if (store.applyBettingTimeLimit) {
                changes[store._id] = false;
            }
        });
        setPendingChanges(prev => ({ ...prev, ...changes }));
    };

    const getEffectiveValue = (storeId, currentValue) => {
        return pendingChanges.hasOwnProperty(storeId) ? pendingChanges[storeId] : currentValue;
    };

    const hasPendingChanges = Object.keys(pendingChanges).length > 0;

    if (loading) {
        return (
            <div className="time-settings">
                <div className="loading">⏳ Đang tải danh sách cửa hàng...</div>
            </div>
        );
    }

    return (
        <div className="time-settings">
            <div className="time-settings-header">
                <h2>🏪 Quản lý thời gian nhập cược theo cửa hàng</h2>
                <p className="description">
                    Chọn cửa hàng nào sẽ áp dụng giới hạn thời gian nhập cược.
                    Nếu bỏ chọn, cửa hàng đó sẽ không bị giới hạn thời gian nhập cược.
                </p>
            </div>

            <div className="time-settings-content">
                {stores.length === 0 ? (
                    <div className="warning-info">
                        <div className="warning-card">
                            <p>Bạn chưa có cửa hàng nào.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="settings-form">
                            <div className="form-actions" style={{ marginBottom: '20px' }}>
                                <button
                                    onClick={handleEnableAll}
                                    className="save-btn"
                                    style={{ marginRight: '10px', backgroundColor: '#28a745' }}
                                >
                                    ✅ Bật tất cả
                                </button>
                                <button
                                    onClick={handleDisableAll}
                                    className="save-btn"
                                    style={{ backgroundColor: '#dc3545' }}
                                >
                                    ❌ Tắt tất cả
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {stores.map(store => {
                                    const effectiveValue = getEffectiveValue(store._id, store.applyBettingTimeLimit);
                                    const hasChange = pendingChanges.hasOwnProperty(store._id);

                                    return (
                                        <div
                                            key={store._id}
                                            className="time-settings-form-group"
                                            style={{
                                                backgroundColor: hasChange ? '#fff3cd' : 'transparent',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: hasChange ? '2px solid #ffc107' : '1px solid #e0e0e0'
                                            }}
                                        >
                                            <label className="time-limit-checkbox-wrapper">
                                                <input
                                                    type="checkbox"
                                                    checked={effectiveValue}
                                                    onChange={() => handleToggleStore(store._id, effectiveValue)}
                                                    className="time-limit-checkbox-input"
                                                />
                                                <div className="time-limit-checkbox-content">
                                                    <strong>{store.name}</strong>
                                                    <small>
                                                        {store.address} • {store.phone}
                                                        {hasChange && <span style={{ color: '#ff9800', marginLeft: '8px' }}>● Chưa lưu</span>}
                                                    </small>
                                                </div>
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>

                            {hasPendingChanges && (
                                <div className="form-actions" style={{ marginTop: '20px' }}>
                                    <button
                                        onClick={handleSaveAll}
                                        disabled={saving}
                                        className="save-btn"
                                    >
                                        {saving ? '⏳ Đang lưu...' : '💾 Lưu thay đổi'}
                                    </button>
                                    <button
                                        onClick={() => setPendingChanges({})}
                                        disabled={saving}
                                        className="save-btn"
                                        style={{ marginLeft: '10px', backgroundColor: '#6c757d' }}
                                    >
                                        ↩️ Hủy
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="warning-info">
                            <div className="warning-card">
                                <h4>⚠️ Lưu ý quan trọng</h4>
                                <ul>
                                    <li>Chỉ các cửa hàng được chọn (có dấu ✓) mới áp dụng giới hạn thời gian nhập cược</li>
                                    <li>Cửa hàng không được chọn sẽ không bị giới hạn thời gian, nhân viên có thể nhập cược bất kỳ lúc nào</li>
                                    <li>Cài đặt này hoạt động kết hợp với cài đặt thời gian chung trong tab "Tinh chỉnh thời gian nhập cược"</li>
                                    <li>Nếu admin tắt giới hạn thời gian chung, tất cả cửa hàng sẽ không bị giới hạn bất kể cài đặt này</li>
                                </ul>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminStoreTimeSettings;
