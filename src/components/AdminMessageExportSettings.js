import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import './AdminMessageExportSettings.css';

const defaultFormat = { lo: 'Lo', loA: 'Lo A', twoS: 'De', deaA: 'De A', dauA: 'De Dau A', ditA: 'De Dit A', threeS: 'Bc', fourS: '4s', tong: 'De Tong', dau: 'De Dau', dit: 'De Dit', kep: 'Kep', boPrefix: 'Bo', xien2: 'Xien2', xien3: 'Xien3', xien4: 'Xien4', xq3: 'xq3', xq4: 'xq4', xiennhay: 'Xiennhay' };

const AdminMessageExportSettings = ({ user }) => {
  const resolveFormatKey = (u) => { const id = u?._id || u?.id; return id ? `msgExportFormat:${id}` : 'msgExportFormat'; };
  const resolveSeparateExportKey = (u) => { const id = u?._id || u?.id; return id ? `msgSeparateExport:${id}` : 'msgSeparateExport'; };

  const [format, setFormat] = useState(() => {
    try { const raw = localStorage.getItem(resolveFormatKey(user)); if (!raw) return defaultFormat; const parsed = JSON.parse(raw); return { ...defaultFormat, ...(parsed || {}) }; } catch (_) { return defaultFormat; }
  });

  const [separateExport, setSeparateExport] = useState(() => {
    try { const raw = localStorage.getItem(resolveSeparateExportKey(user)); return raw === 'true'; } catch (_) { return false; }
  });

  const [autoExportMessage, setAutoExportMessage] = useState(false);
  const [loadingAutoExport, setLoadingAutoExport] = useState(true);

  useEffect(() => {
    const fetchAutoExportSetting = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(getApiUrl('/admin/message-exports/auto-setting'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success) {
          setAutoExportMessage(res.data.autoExportMessage);
        }
      } catch (err) {
        console.error('Lỗi lấy thiết lập tự động xuất:', err);
      } finally {
        setLoadingAutoExport(false);
      }
    };
    fetchAutoExportSetting();
  }, []);

  const handleToggleAutoExport = async (checked) => {
    setAutoExportMessage(checked);
    try {
      const token = localStorage.getItem('token');
      await axios.put(getApiUrl('/admin/message-exports/auto-setting'), {
        autoExportMessage: checked
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Lỗi cập nhật thiết lập tự động xuất:', err);
      // Revert if error
      setAutoExportMessage(!checked);
    }
  };

  useEffect(() => { try { localStorage.setItem(resolveFormatKey(user), JSON.stringify(format)); } catch (_) { } }, [format, user]);

  useEffect(() => { try { localStorage.setItem(resolveSeparateExportKey(user), separateExport ? 'true' : 'false'); } catch (_) { } }, [separateExport, user]);

  const resetDefault = () => setFormat(defaultFormat);

  return (
    <div className="msg-export-container">
      <div className="msg-export-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>
          <h2>Cài đặt định dạng xuất tin nhắn</h2>
          <p>Tuỳ chỉnh nhãn cho từng dòng cược. Áp dụng khi bạn xuất tin.</p>
        </div>
      </div>

      <div className="msg-export-content">
        <div className="msg-block">
          <div className="msg-title">Cài đặt định dạng</div>
          <div className="msg-format-row">
            <input placeholder="Lo" value={format.lo} onChange={(e) => setFormat({ ...format, lo: e.target.value })} />
            <input placeholder="De" value={format.twoS} onChange={(e) => setFormat({ ...format, twoS: e.target.value })} />
            <input placeholder="Bc" value={format.threeS} onChange={(e) => setFormat({ ...format, threeS: e.target.value })} />
            <input placeholder="De Tong" value={format.tong} onChange={(e) => setFormat({ ...format, tong: e.target.value })} />
            <input placeholder="De Dau" value={format.dau} onChange={(e) => setFormat({ ...format, dau: e.target.value })} />
            <input placeholder="De Dit" value={format.dit} onChange={(e) => setFormat({ ...format, dit: e.target.value })} />
            <input placeholder="Kep" value={format.kep} onChange={(e) => setFormat({ ...format, kep: e.target.value })} />
            <input placeholder="Bo" value={format.boPrefix} onChange={(e) => setFormat({ ...format, boPrefix: e.target.value })} />
            <input placeholder="Xien2" value={format.xien2} onChange={(e) => setFormat({ ...format, xien2: e.target.value })} />
            <input placeholder="Xien3" value={format.xien3} onChange={(e) => setFormat({ ...format, xien3: e.target.value })} />
            <input placeholder="Xien4" value={format.xien4} onChange={(e) => setFormat({ ...format, xien4: e.target.value })} />
            <input placeholder="xq3" value={format.xq3} onChange={(e) => setFormat({ ...format, xq3: e.target.value })} />
            <input placeholder="xq4" value={format.xq4} onChange={(e) => setFormat({ ...format, xq4: e.target.value })} />
            <input style={{ backgroundColor: '#2b87432d' }} placeholder="Xiennhay" value={format.xiennhay} onChange={(e) => setFormat({ ...format, xiennhay: e.target.value })} />
            <input style={{ backgroundColor: '#2b87432d' }} placeholder="4s" value={format.fourS} onChange={(e) => setFormat({ ...format, fourS: e.target.value })} />
            <input style={{ backgroundColor: '#2b87432d' }} placeholder="Lo A" value={format.loA} onChange={(e) => setFormat({ ...format, loA: e.target.value })} />
            <input style={{ backgroundColor: '#2b87432d' }} placeholder="De A" value={format.deaA} onChange={(e) => setFormat({ ...format, deaA: e.target.value })} />
            <input style={{ backgroundColor: '#2b87432d' }} placeholder="De Dau A" value={format.dauA} onChange={(e) => setFormat({ ...format, dauA: e.target.value })} />
            <input style={{ backgroundColor: '#2b87432d' }} placeholder="De Dit A" value={format.ditA} onChange={(e) => setFormat({ ...format, ditA: e.target.value })} />
          </div>
          <div className="msg-block" style={{ marginTop: 16 }}>
            <div className="msg-title">Tùy chọn xuất tin nhắn</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={separateExport}
                onChange={(e) => setSeparateExport(e.target.checked)}
              />
              <span>Xuất riêng theo từng cửa hàng (trong lịch sử)</span>
            </label>
            <div className="msg-note" style={{ marginTop: 8 }}>
              Khi bật: Lịch sử xuất tin sẽ hiển thị riêng từng cửa hàng. Khi tắt: Gộp tất cả cửa hàng như bình thường.
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 12 }}>
              <input
                type="checkbox"
                checked={autoExportMessage}
                disabled={loadingAutoExport}
                onChange={(e) => handleToggleAutoExport(e.target.checked)}
              />
              <span>Tự động xuất tin nhắn sau thời gian giới hạn báo cáo (18h30)</span>
            </label>
            <div className="msg-note" style={{ marginTop: 8 }}>
              Khi bật: Hệ thống sẽ tự động xuất tin nhắn một lần vào lúc 18h30. (Cài đặt lưu trên server)
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button className="msg-refresh-btn" onClick={resetDefault}>Khôi phục mặc định</button>
          </div>
        </div>
        <div className="msg-note">Các cài đặt này được lưu theo tài khoản admin và sẽ áp dụng cho lần xuất tiếp theo.</div>
      </div>
    </div>
  );
};

export default AdminMessageExportSettings;
