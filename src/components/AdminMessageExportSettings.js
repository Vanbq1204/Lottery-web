import React, { useEffect, useState } from 'react';

const defaultFormat = { lo: 'Lo', twoS: 'De', threeS: 'Bc', fourS: '4s', tong: 'De Tong', dau: 'De Dau', dit: 'De Dit', kep: 'Kep', boPrefix: 'Bo', xien2: 'Xien2', xien3: 'Xien3', xien4: 'Xien4', xq3: 'xq3', xq4: 'xq4', xiennhay: 'Xiennhay' };

const AdminMessageExportSettings = ({ user }) => {
  const resolveFormatKey = (u) => { const id = u?._id || u?.id; return id ? `msgExportFormat:${id}` : 'msgExportFormat'; };
  const [format, setFormat] = useState(() => {
    try { const raw = localStorage.getItem(resolveFormatKey(user)); if (!raw) return defaultFormat; const parsed = JSON.parse(raw); return { ...defaultFormat, ...(parsed||{}) }; } catch (_) { return defaultFormat; }
  });

  useEffect(() => { try { localStorage.setItem(resolveFormatKey(user), JSON.stringify(format)); } catch (_) {} }, [format, user]);

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
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(260px, 1fr))', gap:10 }}>
            <input placeholder="Lo" value={format.lo} onChange={(e)=>setFormat({ ...format, lo: e.target.value })} />
            <input placeholder="De" value={format.twoS} onChange={(e)=>setFormat({ ...format, twoS: e.target.value })} />
            <input placeholder="Bc" value={format.threeS} onChange={(e)=>setFormat({ ...format, threeS: e.target.value })} />
            <input placeholder="4s" value={format.fourS} onChange={(e)=>setFormat({ ...format, fourS: e.target.value })} />
            <input placeholder="De Tong" value={format.tong} onChange={(e)=>setFormat({ ...format, tong: e.target.value })} />
            <input placeholder="De Dau" value={format.dau} onChange={(e)=>setFormat({ ...format, dau: e.target.value })} />
            <input placeholder="De Dit" value={format.dit} onChange={(e)=>setFormat({ ...format, dit: e.target.value })} />
            <input placeholder="Kep" value={format.kep} onChange={(e)=>setFormat({ ...format, kep: e.target.value })} />
            <input placeholder="Bo" value={format.boPrefix} onChange={(e)=>setFormat({ ...format, boPrefix: e.target.value })} />
            <input placeholder="Xien2" value={format.xien2} onChange={(e)=>setFormat({ ...format, xien2: e.target.value })} />
            <input placeholder="Xien3" value={format.xien3} onChange={(e)=>setFormat({ ...format, xien3: e.target.value })} />
            <input placeholder="Xien4" value={format.xien4} onChange={(e)=>setFormat({ ...format, xien4: e.target.value })} />
            <input placeholder="xq3" value={format.xq3} onChange={(e)=>setFormat({ ...format, xq3: e.target.value })} />
            <input placeholder="xq4" value={format.xq4} onChange={(e)=>setFormat({ ...format, xq4: e.target.value })} />
            <input placeholder="Xiennhay" value={format.xiennhay} onChange={(e)=>setFormat({ ...format, xiennhay: e.target.value })} />
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