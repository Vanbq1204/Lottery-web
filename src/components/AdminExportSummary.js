import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import './AdminExportSummary.css';

const AdminExportSummary = ({ user }) => {
    // Helpers
    const getCurrentVietnamDate = () => {
        const now = new Date();
        const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
        return vietnamTime.toISOString().split('T')[0];
    };

    const [selectedDate, setSelectedDate] = useState(getCurrentVietnamDate());
    const [snapshots, setSnapshots] = useState([]);
    const [lotteryResult, setLotteryResult] = useState(null);
    const [dynamicBoGroups, setDynamicBoGroups] = useState({});
    const [loading, setLoading] = useState(false);

    // User input settings
    const [receiveMultiplier, setReceiveMultiplier] = useState('83');
    const [prizeMultiplier, setPrizeMultiplier] = useState('80');

    const [loReceiveMultiplier, setLoReceiveMultiplier] = useState('21.8');
    const [loPrizeMultiplier, setLoPrizeMultiplier] = useState('80');

    const [threeSReceiveMultiplier, setThreeSReceiveMultiplier] = useState('60');
    const [threeSPrizeMultiplier, setThreeSPrizeMultiplier] = useState('400');

    const [fourSReceiveMultiplier, setFourSReceiveMultiplier] = useState('60');
    const [fourSPrizeMultiplier, setFourSPrizeMultiplier] = useState('1000');

    const [xienReceiveMultiplier, setXienReceiveMultiplier] = useState('60');
    const [x2PrizeMultiplier, setX2PrizeMultiplier] = useState('10');
    const [x3PrizeMultiplier, setX3PrizeMultiplier] = useState('40');
    const [x4PrizeMultiplier, setX4PrizeMultiplier] = useState('100');
    const [xqHit2PrizeMultiplier, setXqHit2PrizeMultiplier] = useState('10');
    const [xqHit3PrizeMultiplier, setXqHit3PrizeMultiplier] = useState('70');
    const [xqHit4PrizeMultiplier, setXqHit4PrizeMultiplier] = useState('320');

    // Checkbox state keeping track of selected snapshot IDs
    const [selectedSnapshotIds, setSelectedSnapshotIds] = useState([]);

    // Toggle state for settings
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Copy visual state
    const [isCopied, setIsCopied] = useState(false);

    // Manual mode state
    const [isManualMode, setIsManualMode] = useState(false);
    const [manualTexts, setManualTexts] = useState(['']);

    // Copy format mode state
    const [copyMergeMode, setCopyMergeMode] = useState('merge'); // 'merge' or 'separate'

    // Debt book state
    const [debt, setDebt] = useState(null);
    const [showDebtBook, setShowDebtBook] = useState(false);

    // Toast notification state
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
    };

    // Update paid modal state
    const [updateModal, setUpdateModal] = useState({ isOpen: false, oldDebt: 0, paid: 0, received: 0 });

    // Confirm Modal state
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null
    });

    const loadDebt = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(getApiUrl('/debt'), { headers: { Authorization: `Bearer ${token}` } });
            if (res.data && res.data.success) {
                setDebt(res.data.data);
            }
        } catch (err) {
            console.error('Lỗi khi tải danh sách nợ:', err);
        }
    };

    const loadMultipliers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(getApiUrl('/admin/message-exports/multipliers'), { headers: { Authorization: `Bearer ${token}` } });
            if (res.data?.success && res.data.multipliers) {
                const m = res.data.multipliers;
                if (m.receive) setReceiveMultiplier(m.receive);
                if (m.prize) setPrizeMultiplier(m.prize);
                if (m.loReceive) setLoReceiveMultiplier(m.loReceive);
                if (m.loPrize) setLoPrizeMultiplier(m.loPrize);
                if (m.threeSReceive) setThreeSReceiveMultiplier(m.threeSReceive);
                if (m.threeSPrize) setThreeSPrizeMultiplier(m.threeSPrize);
                if (m.fourSReceive) setFourSReceiveMultiplier(m.fourSReceive);
                if (m.fourSPrize) setFourSPrizeMultiplier(m.fourSPrize);
                if (m.xienReceive) setXienReceiveMultiplier(m.xienReceive);
                if (m.x2Prize) setX2PrizeMultiplier(m.x2Prize);
                if (m.x3Prize) setX3PrizeMultiplier(m.x3Prize);
                if (m.x4Prize) setX4PrizeMultiplier(m.x4Prize);
                if (m.xqHit2Prize) setXqHit2PrizeMultiplier(m.xqHit2Prize);
                if (m.xqHit3Prize) setXqHit3PrizeMultiplier(m.xqHit3Prize);
                if (m.xqHit4Prize) setXqHit4PrizeMultiplier(m.xqHit4Prize);
            }
        } catch (err) {
            console.error('Lỗi khi tải hệ số:', err);
        }
    };

    useEffect(() => {
        loadDebt();
        loadMultipliers();
    }, []);

    const saveMultipliers = async () => {
        try {
            const token = localStorage.getItem('token');
            const multipliers = {
                receive: receiveMultiplier,
                prize: prizeMultiplier,
                loReceive: loReceiveMultiplier,
                loPrize: loPrizeMultiplier,
                threeSReceive: threeSReceiveMultiplier,
                threeSPrize: threeSPrizeMultiplier,
                fourSReceive: fourSReceiveMultiplier,
                fourSPrize: fourSPrizeMultiplier,
                xienReceive: xienReceiveMultiplier,
                x2Prize: x2PrizeMultiplier,
                x3Prize: x3PrizeMultiplier,
                x4Prize: x4PrizeMultiplier,
                xqHit2Prize: xqHit2PrizeMultiplier,
                xqHit3Prize: xqHit3PrizeMultiplier,
                xqHit4Prize: xqHit4PrizeMultiplier
            };
            const res = await axios.put(getApiUrl('/admin/message-exports/multipliers'), { multipliers }, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data?.success) {
                showNotification('Lưu hệ số thành công');
                setIsSettingsOpen(false);
            } else {
                showNotification(res.data?.message || 'Không thể lưu hệ số', 'error');
            }
        } catch (err) {
            console.error('Lỗi khi lưu hệ số:', err);
            showNotification('Lỗi kết nối khi lưu hệ số', 'error');
        }
    };

    // Load snapshots and lottery results
    const loadData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch message export snapshots
            const snapshotsRes = await axios.get(getApiUrl(`/admin/message-exports/history?date=${selectedDate}`), { headers });
            const snapData = snapshotsRes.data.snapshots || [];
            setSnapshots(snapData);

            // Fetch dynamic special number groups
            const groupsRes = await axios.get(getApiUrl(`/admin/special-number-groups`), { headers });
            const groupsData = groupsRes.data.data || [];
            const mappedBo = {};
            groupsData.forEach(g => {
                const key = String(g.name).trim().toLowerCase();
                mappedBo[key] = g.numbers || [];
            });
            setDynamicBoGroups(mappedBo);

            // Auto-select all by default when loaded
            setSelectedSnapshotIds(snapData.map(s => s._id));

            // Fetch lottery result for the selected date
            // /api/lottery/results?date=... returns a paginated list
            const lotteryRes = await axios.get(getApiUrl(`/lottery/results?date=${selectedDate}`), { headers });
            const lotteries = lotteryRes.data.lotteryResults || [];
            if (lotteries.length > 0) {
                setLotteryResult(lotteries[0]);
            } else {
                setLotteryResult(null);
            }
        } catch (err) {
            console.error('Lỗi khi tải dữ liệu tổng kết:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate]);

    const handleCheckboxChange = (id) => {
        setSelectedSnapshotIds(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);
            return [...prev, id];
        });
    };

    // Generic parsing logic for grouped messages (supports n, đ, d suffix)
    const parseGroupedLine = (msg) => {
        if (!msg) return [];
        const lines = msg.split('\n');
        const results = [];
        lines.forEach(line => {
            const regex = /(.+?)\s*x\s*(\d+)[a-zA-ZđĐ]?/gi;
            let match;
            while ((match = regex.exec(line)) !== null) {
                let leftPart = match[1];
                const amount = parseInt(match[2], 10);
                if (leftPart.indexOf(':') >= 0) {
                    leftPart = leftPart.substring(leftPart.indexOf(':') + 1);
                }
                const tokens = leftPart.split(',').map(n => n.trim()).filter(Boolean);
                tokens.forEach(token => {
                    results.push({ item: token, amount });
                });
            }
        });
        return results;
    };

    // Helper to get all lottery numbers for "Lô" (2 cuối các giải)
    const getLotoNumbers = (resultObj) => {
        const lotoNmbs = [];
        if (!resultObj) return lotoNmbs;

        ['gdb', 'g1'].forEach(p => {
            if (resultObj[p]) lotoNmbs.push(resultObj[p].slice(-2));
        });
        ['g2', 'g3', 'g4', 'g5', 'g6', 'g7'].forEach(p => {
            if (resultObj[p] && Array.isArray(resultObj[p])) {
                resultObj[p].forEach(num => {
                    if (num && num.length >= 2) lotoNmbs.push(num.slice(-2));
                });
            }
        });
        return lotoNmbs;
    };

    // Helper Math cho Tổ hợp (Combinations) tính xiên
    const getCombinations = (n, k) => {
        if (k < 0 || k > n) return 0;
        if (k === 0 || k === n) return 1;
        if (k === 1 || k === n - 1) return n;
        let c = 1;
        for (let i = 1; i <= k; i++) {
            c = c * (n - i + 1) / i;
        }
        return c;
    };

    // Helper to calculate combinations count and hit logic for "Bo"
    const getBoNumbersCountAndHit = (key, winningTwoS) => {
        key = key.trim().toLowerCase();

        if (key === 'de chanle' || key === 'chanle') {
            const hit = winningTwoS && (parseInt(winningTwoS[0], 10) % 2 === 0) && (parseInt(winningTwoS[1], 10) % 2 !== 0);
            return { count: 25, isHit: hit };
        }
        if (key === 'de lechan' || key === 'lechan') {
            const hit = winningTwoS && (parseInt(winningTwoS[0], 10) % 2 !== 0) && (parseInt(winningTwoS[1], 10) % 2 === 0);
            return { count: 25, isHit: hit };
        }
        if (key === 'de lele' || key === 'lele') {
            const hit = winningTwoS && (parseInt(winningTwoS[0], 10) % 2 !== 0) && (parseInt(winningTwoS[1], 10) % 2 !== 0);
            return { count: 25, isHit: hit };
        }
        if (key === 'de chanchan' || key === 'chanchan') {
            const hit = winningTwoS && (parseInt(winningTwoS[0], 10) % 2 === 0) && (parseInt(winningTwoS[1], 10) % 2 === 0);
            return { count: 25, isHit: hit };
        }

        if (key.includes('cham ')) {
            const chars = key.replace('de cham ', '').replace('cham ', '').trim();
            const hit = winningTwoS && winningTwoS.includes(chars);
            return { count: 19, isHit: hit };
        }

        if (/^\d{2}$/.test(key)) {
            const d1 = parseInt(key[0], 10);
            const d2 = parseInt(key[1], 10);
            const shadow1 = (d1 + 5) % 10;
            const shadow2 = (d2 + 5) % 10;
            const set = new Set();
            set.add(`${d1}${d2}`);
            set.add(`${d2}${d1}`);
            set.add(`${shadow1}${d2}`);
            set.add(`${d2}${shadow1}`);
            set.add(`${d1}${shadow2}`);
            set.add(`${shadow2}${d1}`);
            set.add(`${shadow1}${shadow2}`);
            set.add(`${shadow2}${shadow1}`);
            const isHit = winningTwoS && set.has(winningTwoS);
            return { count: set.size, isHit };
        }

        const rawKey = key.replace('de ', '').trim().toLowerCase();

        // Kiểm tra bộ động thiết lập (Custom Bo Groups)
        if (dynamicBoGroups[rawKey]) {
            const numbersList = dynamicBoGroups[rawKey];
            const isHit = winningTwoS && numbersList.includes(winningTwoS);
            return { count: numbersList.length, isHit };
        }

        const isHit = winningTwoS && (rawKey === winningTwoS);
        return { count: 1, isHit };
    };

    const resolveFormatKey = (u) => {
        const id = u?._id || u?.id;
        return id ? `msgExportFormat:${id}` : 'msgExportFormat';
    };

    const getExportFormat = () => {
        const defaultFormat = { lo: 'Lo', loA: 'Lo A', twoS: 'De', deaA: 'De A', dauA: 'De Dau A', ditA: 'De Dit A', threeS: 'Bc', fourS: '4s', tong: 'De Tong', dau: 'De Dau', dit: 'De Dit', kep: 'Kep', boPrefix: 'Bo', xien2: 'Xien2', xien3: 'Xien3', xien4: 'Xien4', xq3: 'xq3', xq4: 'xq4', xiennhay: 'Xiennhay' };
        try {
            const raw = localStorage.getItem(resolveFormatKey(user));
            if (!raw) return defaultFormat;
            const parsed = JSON.parse(raw);
            return { ...defaultFormat, ...(parsed || {}) };
        } catch (_) {
            return defaultFormat;
        }
    };

    // Helper to parse manual text to message format
    const parseManualTextToMessages = (text) => {
        const msgs = {};
        let currentKey = null;
        const lines = text.split('\n');

        const formatConfig = getExportFormat();
        // Sắp xếp các key dài hơn lên trước để tránh match nhầm 'De' trước 'De Dau'
        const formatMapEntries = [
            { label: (formatConfig.tong || '').toLowerCase(), key: 'tong' },
            { label: (formatConfig.dau || '').toLowerCase(), key: 'dau' },
            { label: (formatConfig.dit || '').toLowerCase(), key: 'dit' },
            { label: (formatConfig.twoS || '').toLowerCase(), key: 'twoS' },
            { label: (formatConfig.lo || '').toLowerCase(), key: 'lo' },
            { label: (formatConfig.threeS || '').toLowerCase(), key: 'threeS' },
            { label: (formatConfig.fourS || '').toLowerCase(), key: 'fourS' },
            { label: (formatConfig.kep || '').toLowerCase(), key: 'kep' },
            { label: (formatConfig.boPrefix || '').toLowerCase(), key: 'bo' },
            { label: (formatConfig.xien2 || '').toLowerCase(), key: 'xien2' },
            { label: (formatConfig.xien3 || '').toLowerCase(), key: 'xien3' },
            { label: (formatConfig.xien4 || '').toLowerCase(), key: 'xien4' },
            { label: (formatConfig.xq3 || '').toLowerCase(), key: 'xienq3' },
            { label: (formatConfig.xq4 || '').toLowerCase(), key: 'xienq4' },
        ].filter(e => e.label).sort((a, b) => b.label.length - a.label.length);

        lines.forEach(line => {
            const lowerLine = line.trim().toLowerCase();
            let foundKey = false;
            let contentToMerge = '';

            // Bám sát format động của Cài đặt định dạng xuất
            for (const { label, key } of formatMapEntries) {
                // Hỗ trợ trường hợp có khoảng trắng thừa trước dấu hai chấm, VD: "De Dau :"
                if (lowerLine.startsWith(label + ':') || lowerLine.startsWith(label + ' :') || lowerLine.startsWith(label + '  :')) {
                    currentKey = key;
                    foundKey = true;
                    contentToMerge = line.substring(line.indexOf(':') + 1).trim();
                    break;
                } else if (key === 'kep' && lowerLine.startsWith(label + ' ')) {
                    // Riêng với Kép, đôi khi xuất text không có ':' (VD: "kep kep bang x 100n" hoặc "kep lech x 50n")
                    currentKey = 'kep';
                    foundKey = true;

                    // Thử check xem text phía sau có chữ 'bang' hay 'lech' không
                    let possibleItem = lowerLine.substring(label.length).trim();

                    // Nếu sau label mà lại thấy trùng chữ 'kep' nữa (vì xuất có thể bị chập "kep kep bang")
                    if (possibleItem.startsWith('kep ')) possibleItem = possibleItem.substring(4).trim();

                    contentToMerge = possibleItem;
                    break;
                }
            }

            // Nếu không match được định nghĩa nhưng cấu trúc giống như header lạ (vd: abcxyz:) -> Reset currentKey
            if (!foundKey && lowerLine.match(/^[a-z0-9_àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ\s]+:/i)) {
                currentKey = null;
            }

            if (currentKey) {
                let content = line.trim();
                // Với trường hợp tìm thấy header, phải lấy phần nội dung phía sau (đã lọc ở trên)
                if (foundKey) {
                    content = contentToMerge;
                }
                if (content) {
                    msgs[currentKey] = (msgs[currentKey] || '') + content + '\n';
                }
            }
        });

        return msgs;
    };

    const calculateMultipleSnapshots = (activeSnapshots) => {
        let totalBetDe = 0;
        let totalPrizeDe = 0;

        let totalBetMoRong = 0;
        let totalPrizeMoRong = 0;

        let totalBetLo = 0;
        let totalPrizeLo = 0;

        let totalBetThreeS = 0;
        let totalPrizeThreeS = 0;

        let totalBetFourS = 0;
        let totalPrizeFourS = 0;

        const loRecvMult = parseFloat(loReceiveMultiplier) || 0;
        const loPrizeMult = parseFloat(loPrizeMultiplier) || 0;

        const threeSRecvMult = parseFloat(threeSReceiveMultiplier) || 0;
        const threeSPrizeMult = parseFloat(threeSPrizeMultiplier) || 0;

        const fourSRecvMult = parseFloat(fourSReceiveMultiplier) || 0;
        const fourSPrizeMult = parseFloat(fourSPrizeMultiplier) || 0;

        const recvMult = parseFloat(receiveMultiplier) || 0;
        const prizeMult = parseFloat(prizeMultiplier) || 0;

        let totalHitLoPoints = 0;
        let totalHitDeMoney = 0;
        let totalHitMoRongMoney = 0;
        let totalHitThreeSMoney = 0;
        let totalHitFourSMoney = 0;
        let totalHitXienMoney = 0;

        let totalBetXien = 0;
        let totalPrizeXien = 0;

        let totalBetX2 = 0; let totalPrizeX2 = 0; let totalHitX2Money = 0;
        let totalBetX3 = 0; let totalPrizeX3 = 0; let totalHitX3Money = 0;
        let totalBetX4 = 0; let totalPrizeX4 = 0; let totalHitX4Money = 0;
        const xienRecvMult = parseFloat(xienReceiveMultiplier) || 0;
        const prizeX2 = parseFloat(x2PrizeMultiplier) || 0;
        const prizeX3 = parseFloat(x3PrizeMultiplier) || 0;
        const prizeX4 = parseFloat(x4PrizeMultiplier) || 0;
        const prizeXqHit2 = parseFloat(xqHit2PrizeMultiplier) || 0;
        const prizeXqHit3 = parseFloat(xqHit3PrizeMultiplier) || 0;
        const prizeXqHit4 = parseFloat(xqHit4PrizeMultiplier) || 0;

        const gdbStr = lotteryResult?.results?.gdb || '';
        const isLotteryAvailable = gdbStr.length >= 2;
        const winningTwoS = isLotteryAvailable ? gdbStr.slice(-2) : null;

        const isLotteryFullAvailable = lotteryResult?.results && Object.keys(lotteryResult.results).length >= 5; // Có đủ các giải
        const lotoNumbers = isLotteryFullAvailable ? getLotoNumbers(lotteryResult.results) : [];

        // 3 số (Đặc biệt)
        const isThreeSAvailable = gdbStr.length >= 3;
        const winningThreeS = isThreeSAvailable ? gdbStr.slice(-3) : null;

        // 4 số (Đặc biệt)
        const isFourSAvailable = gdbStr.length >= 4;
        const winningFourS = isFourSAvailable ? gdbStr.slice(-4) : null;

        const uniqueLotoSet = new Set(lotoNumbers.map(n => n.slice(-2).padStart(2, '0')));
        const getHitCombinations = (item) => {
            const nums = item.split('-').map(n => n.trim().padStart(2, '0')).filter(n => n.length === 2);
            const hitCount = nums.filter(n => uniqueLotoSet.has(n)).length;
            return { numOfNums: nums.length, hitCount };
        };

        activeSnapshots.forEach(snap => {
            // 0. Lô (Lo)
            const loMsg = snap.messages?.loto || snap.messages?.lo || '';
            const parsedLo = parseGroupedLine(loMsg);
            parsedLo.forEach(({ item, amount }) => { // amount is point (đ) cho Lô
                totalBetLo += amount;
                if (isLotteryFullAvailable) {
                    const hitCount = lotoNumbers.filter(n => n === item.padStart(2, '0')).length;
                    if (hitCount > 0) {
                        totalPrizeLo += amount * hitCount * loPrizeMult;
                        totalHitLoPoints += amount * hitCount;
                    }
                }
            });

            // 1. Đề (2 số)
            const parsedDe = parseGroupedLine(snap.messages?.twoS);
            parsedDe.forEach(({ item, amount }) => {
                totalBetDe += amount;
                if (winningTwoS && item === winningTwoS) {
                    totalPrizeDe += amount * prizeMult;
                    totalHitDeMoney += amount;
                }
            });

            // 1.5 Ba Số (3s)
            const threeSMsg = snap.messages?.threeS || snap.messages?.['3s'] || '';
            const parsedThreeS = parseGroupedLine(threeSMsg);
            parsedThreeS.forEach(({ item, amount }) => {
                totalBetThreeS += amount;
                if (isThreeSAvailable && item === winningThreeS) {
                    totalPrizeThreeS += amount * threeSPrizeMult;
                    totalHitThreeSMoney += amount;
                }
            });

            // 1.8 Bốn Số (4s)
            // Tạm thời tắt tính năng 4s theo yêu cầu
            /*
            const fourSMsg = snap.messages?.fourS || snap.messages?.['4s'] || '';
            const parsedFourS = parseGroupedLine(fourSMsg);
            parsedFourS.forEach(({ item, amount }) => {
                totalBetFourS += amount;
                if (isFourSAvailable && item === winningFourS) {
                    totalPrizeFourS += amount * fourSPrizeMult;
                }
            });
            */

            // 2. Đề Tổng
            const tongItems = parseGroupedLine(snap.messages?.tong);
            tongItems.forEach(({ item, amount }) => {
                totalBetMoRong += amount * 10;
                if (winningTwoS) {
                    const sum = (parseInt(winningTwoS[0], 10) + parseInt(winningTwoS[1], 10)) % 10;
                    if (sum === parseInt(item, 10)) {
                        totalPrizeMoRong += amount * prizeMult;
                        totalHitMoRongMoney += amount;
                    }
                }
            });

            // 3. Đề Đầu
            const dauItems = parseGroupedLine(snap.messages?.dau);
            dauItems.forEach(({ item, amount }) => {
                totalBetMoRong += amount * 10;
                if (winningTwoS && winningTwoS[0] === item) {
                    totalPrizeMoRong += amount * prizeMult;
                    totalHitMoRongMoney += amount;
                }
            });

            // 4. Đề Đít
            const ditItems = parseGroupedLine(snap.messages?.dit);
            ditItems.forEach(({ item, amount }) => {
                totalBetMoRong += amount * 10;
                if (winningTwoS && winningTwoS[1] === item) {
                    totalPrizeMoRong += amount * prizeMult;
                    totalHitMoRongMoney += amount;
                }
            });

            // 5. Kép
            const kepItems = parseGroupedLine(snap.messages?.kep);
            kepItems.forEach(({ item, amount }) => {
                const itemLower = item.toLowerCase();
                if (itemLower.includes('bang') || itemLower.includes('bằng')) {
                    totalBetMoRong += amount * 10;
                    if (winningTwoS && winningTwoS[0] === winningTwoS[1]) {
                        totalPrizeMoRong += amount * prizeMult;
                        totalHitMoRongMoney += amount;
                    }
                } else if (itemLower.includes('lech') || itemLower.includes('lệch')) {
                    totalBetMoRong += amount * 10;
                    if (winningTwoS && Math.abs(parseInt(winningTwoS[0], 10) - parseInt(winningTwoS[1], 10)) === 5) {
                        totalPrizeMoRong += amount * prizeMult;
                        totalHitMoRongMoney += amount;
                    }
                } else if (/^\d{2}$/.test(item.trim())) { // Kép nhập dưới dạng số trực tiếp (vd: 11, 22)
                    totalBetMoRong += amount;
                    if (winningTwoS === item.trim()) {
                        totalPrizeMoRong += amount * prizeMult;
                        totalHitMoRongMoney += amount;
                    }
                }
            });

            // 6. Bộ
            const boItems = parseGroupedLine(snap.messages?.bo);
            boItems.forEach(({ item, amount }) => {
                const { count, isHit } = getBoNumbersCountAndHit(item, winningTwoS);
                totalBetMoRong += amount * count;
                if (isHit) {
                    totalPrizeMoRong += amount * prizeMult;
                    totalHitMoRongMoney += amount;
                }
            });

            // 7. Xiên
            if (isLotteryFullAvailable) {
                // Xien 2
                const parsedX2 = parseGroupedLine(snap.messages?.xien2);
                parsedX2.forEach(({ item, amount }) => {
                    totalBetXien += amount;
                    totalBetX2 += amount;
                    if (getHitCombinations(item).hitCount >= 2 && item.split('-').length === 2) {
                        totalPrizeXien += amount * prizeX2;
                        totalHitXienMoney += amount;
                        totalPrizeX2 += amount * prizeX2;
                        totalHitX2Money += amount;
                    }
                });
                // Xien 3
                const parsedX3 = parseGroupedLine(snap.messages?.xien3);
                parsedX3.forEach(({ item, amount }) => {
                    totalBetXien += amount;
                    totalBetX3 += amount;
                    if (getHitCombinations(item).hitCount >= 3 && item.split('-').length === 3) {
                        totalPrizeXien += amount * prizeX3;
                        totalHitXienMoney += amount;
                        totalPrizeX3 += amount * prizeX3;
                        totalHitX3Money += amount;
                    }
                });
                // Xien 4
                const parsedX4 = parseGroupedLine(snap.messages?.xien4);
                parsedX4.forEach(({ item, amount }) => {
                    totalBetXien += amount;
                    totalBetX4 += amount;
                    if (getHitCombinations(item).hitCount >= 4 && item.split('-').length === 4) {
                        totalPrizeXien += amount * prizeX4;
                        totalHitXienMoney += amount;
                        totalPrizeX4 += amount * prizeX4;
                        totalHitX4Money += amount;
                    }
                });
                // Xiên quay 3
                const parsedXq3 = parseGroupedLine(snap.messages?.xienq3 || snap.messages?.xq3);
                parsedXq3.forEach(({ item, amount }) => {
                    totalBetXien += amount * 4;
                    totalBetX2 += amount * 3;
                    totalBetX3 += amount * 1;

                    const { hitCount } = getHitCombinations(item);
                    if (hitCount === 2) {
                        totalPrizeXien += amount * prizeXqHit2;
                        totalHitXienMoney += amount;
                        totalPrizeX2 += amount * prizeXqHit2;
                        totalHitX2Money += amount;
                    } else if (hitCount === 3) {
                        totalPrizeXien += amount * prizeXqHit3;
                        totalHitXienMoney += amount;
                        totalPrizeX3 += amount * prizeXqHit3;
                        totalHitX3Money += amount;
                    }
                });
                // Xiên quay 4
                const parsedXq4 = parseGroupedLine(snap.messages?.xienq4 || snap.messages?.xq4);
                parsedXq4.forEach(({ item, amount }) => {
                    totalBetXien += amount * 11;
                    totalBetX2 += amount * 6;
                    totalBetX3 += amount * 4;
                    totalBetX4 += amount * 1;

                    const { hitCount } = getHitCombinations(item);
                    if (hitCount === 2) {
                        totalPrizeXien += amount * prizeXqHit2;
                        totalHitXienMoney += amount;
                        totalPrizeX2 += amount * prizeXqHit2;
                        totalHitX2Money += amount;
                    } else if (hitCount === 3) {
                        totalPrizeXien += amount * prizeXqHit3;
                        totalHitXienMoney += amount;
                        totalPrizeX3 += amount * prizeXqHit3;
                        totalHitX3Money += amount;
                    } else if (hitCount === 4) {
                        totalPrizeXien += amount * prizeXqHit4;
                        totalHitXienMoney += amount;
                        totalPrizeX4 += amount * prizeXqHit4;
                        totalHitX4Money += amount;
                    }
                });
            }
        });

        const totalBetSum = totalBetDe + totalBetMoRong;
        const totalPrizeSum = totalPrizeDe + totalPrizeMoRong;
        const totalHitSumMoney = totalHitDeMoney + totalHitMoRongMoney;

        const calculatedProfitLoss = isLotteryAvailable
            ? totalPrizeSum - (totalBetSum / 100) * recvMult
            : null;

        const calculatedProfitLossLo = isLotteryFullAvailable
            ? totalPrizeLo - totalBetLo * loRecvMult
            : null;

        const calculatedProfitLossThreeS = isThreeSAvailable
            ? totalPrizeThreeS - (totalBetThreeS / 100) * threeSRecvMult
            : null;

        const calculatedProfitLossFourS = isFourSAvailable
            ? totalPrizeFourS - (totalBetFourS / 100) * fourSRecvMult
            : null;

        const calculatedProfitLossXien = isLotteryFullAvailable
            ? totalPrizeXien - (totalBetXien / 100) * xienRecvMult
            : null;

        const calculatedProfitLossX2 = isLotteryFullAvailable ? totalPrizeX2 - (totalBetX2 / 100) * xienRecvMult : null;
        const calculatedProfitLossX3 = isLotteryFullAvailable ? totalPrizeX3 - (totalBetX3 / 100) * xienRecvMult : null;
        const calculatedProfitLossX4 = isLotteryFullAvailable ? totalPrizeX4 - (totalBetX4 / 100) * xienRecvMult : null;

        return {
            totalBetDe,
            totalPrizeDe,
            totalBetMoRong,
            totalPrizeMoRong,
            totalBetSum,
            totalPrizeSum,
            totalBetLo,
            totalPrizeLo,
            totalBetThreeS,
            totalPrizeThreeS,
            totalBetFourS,
            totalPrizeFourS,
            totalBetXien,
            totalPrizeXien,
            calculatedProfitLoss,
            calculatedProfitLossLo,
            calculatedProfitLossThreeS,
            calculatedProfitLossFourS,
            calculatedProfitLossXien,
            totalBetX2, totalPrizeX2, totalHitX2Money, calculatedProfitLossX2,
            totalBetX3, totalPrizeX3, totalHitX3Money, calculatedProfitLossX3,
            totalBetX4, totalPrizeX4, totalHitX4Money, calculatedProfitLossX4,
            winningTwoS,
            winningThreeS,
            winningFourS,
            isLotteryAvailable,
            isLotteryFullAvailable,
            isThreeSAvailable,
            isFourSAvailable,
            totalHitSumMoney,
            totalHitLoPoints,
            totalHitThreeSMoney,
            totalHitFourSMoney,
            totalHitXienMoney,
            totalProfitLoss: (calculatedProfitLoss || 0) +
                (calculatedProfitLossLo || 0) +
                (calculatedProfitLossThreeS || 0) +
                (calculatedProfitLossFourS || 0) +
                (calculatedProfitLossXien || 0)
        };
    };

    // Derived calculation state
    const calculateResult = () => {
        const activeSnapshots = isManualMode
            ? [{ messages: parseManualTextToMessages(manualTexts.join('\n\n')) }]
            : snapshots.filter(s => selectedSnapshotIds.includes(s._id));
        return calculateMultipleSnapshots(activeSnapshots);
    };

    const {
        totalBetDe, totalPrizeDe,
        totalBetMoRong, totalPrizeMoRong,
        totalBetSum, totalPrizeSum,
        totalBetLo, totalPrizeLo,
        totalBetThreeS, totalPrizeThreeS,
        totalBetFourS, totalPrizeFourS,
        totalBetXien, totalPrizeXien,
        calculatedProfitLoss, calculatedProfitLossLo, calculatedProfitLossThreeS, calculatedProfitLossFourS, calculatedProfitLossXien,
        winningTwoS, winningThreeS, winningFourS, isLotteryAvailable, isLotteryFullAvailable, isThreeSAvailable, isFourSAvailable,
        totalProfitLoss
    } = calculateResult();

    const generateSingleSummaryText = (stats, labelStr, isSeparateXien = false, isMergeMode = false) => {
        const lines = [];
        if (isMergeMode) {
            const dateObj = new Date(selectedDate);
            const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()} :`;
            lines.push(formattedDate);
        } else if (labelStr) {
            lines.push(`Tin ${labelStr}:`);
        }

        if (stats.totalBetSum > 0) lines.push(`De : ${stats.totalBetSum.toLocaleString('vi-VN')}(${stats.totalHitSumMoney.toLocaleString('vi-VN')}) = ${stats.calculatedProfitLoss?.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) ?? 0}n`);
        if (stats.totalBetLo > 0) lines.push(`Lo : ${stats.totalBetLo.toLocaleString('vi-VN')}(${stats.totalHitLoPoints.toLocaleString('vi-VN')}) = ${stats.calculatedProfitLossLo?.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) ?? 0}n`);
        if (stats.totalBetThreeS > 0) lines.push(`3so : ${stats.totalBetThreeS.toLocaleString('vi-VN')}(${stats.totalHitThreeSMoney.toLocaleString('vi-VN')}) = ${stats.calculatedProfitLossThreeS?.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) ?? 0}n`);

        if (isSeparateXien) {
            if (stats.totalBetX2 > 0) lines.push(`xien2 : ${stats.totalBetX2.toLocaleString('vi-VN')}(${stats.totalHitX2Money.toLocaleString('vi-VN')}) = ${stats.calculatedProfitLossX2?.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) ?? 0}n`);
            if (stats.totalBetX3 > 0) lines.push(`xien3 : ${stats.totalBetX3.toLocaleString('vi-VN')}(${stats.totalHitX3Money.toLocaleString('vi-VN')}) = ${stats.calculatedProfitLossX3?.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) ?? 0}n`);
            if (stats.totalBetX4 > 0) lines.push(`xien4 : ${stats.totalBetX4.toLocaleString('vi-VN')}(${stats.totalHitX4Money.toLocaleString('vi-VN')}) = ${stats.calculatedProfitLossX4?.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) ?? 0}n`);
        } else {
            if (stats.totalBetXien > 0) lines.push(`Xien : ${stats.totalBetXien.toLocaleString('vi-VN')}(${stats.totalPrizeXien.toLocaleString('vi-VN')}) = ${stats.calculatedProfitLossXien?.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) ?? 0}n`);
        }

        if (isMergeMode) {
            lines.push(`Tổng nhận = ${stats.totalProfitLoss.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}n`);
        } else {
            lines.push(`Tổng nhận ${labelStr ? 'tin ' + labelStr : ''} = ${stats.totalProfitLoss.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}n`);
        }
        return lines.join('\n');
    };

    const generateSummaryText = () => {
        const activeSnapshotsForText = isManualMode
            ? manualTexts.map((text, idx) => ({ _id: `manual_${idx}`, sequence: `${idx + 1}`, messages: parseManualTextToMessages(text) }))
            : snapshots.filter(s => selectedSnapshotIds.includes(s._id));

        if (activeSnapshotsForText.length === 0) return '';

        if (copyMergeMode === 'merge') {
            return generateSingleSummaryText(calculateMultipleSnapshots(activeSnapshotsForText), '', false, true);
        } else {
            const lines = [];
            activeSnapshotsForText.forEach(snap => {
                const labelStr = snap.sequence;
                const stats = calculateMultipleSnapshots([snap]);
                if (stats.totalBetSum > 0 || stats.totalBetLo > 0 || stats.totalBetThreeS > 0 || stats.totalBetFourS > 0 || stats.totalBetXien > 0) {
                    lines.push(generateSingleSummaryText(stats, labelStr, true, false));
                    lines.push(''); // Thêm dòng trống giữa các phần
                }
            });

            if (lines.length > 0) {
                const totalStats = calculateMultipleSnapshots(activeSnapshotsForText);
                lines.push(`Tổng nhận = ${totalStats.totalProfitLoss.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}n`);
            }
            return lines.join('\n').trim();
        }
    };

    const handleCopySummary = () => {
        const textToCopy = generateSummaryText();
        navigator.clipboard.writeText(textToCopy).then(() => {
            setIsCopied(true);
            setTimeout(() => {
                setIsCopied(false);
            }, 2000);
        }).catch(err => {
            console.error('Lỗi khi copy: ', err);
            alert('Không thể copy, vui lòng thử lại.');
        });
    };

    const handleSaveDebt = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Xác nhận lưu',
            message: `Bạn có chắc muốn cộng dồn kết quả hôm nay (${totalProfitLoss.toLocaleString('vi-VN')}n) vào cột Nợ Cũ?`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    const token = localStorage.getItem('token');
                    const response = await axios.post(getApiUrl('/debt/add'), {
                        newAmount: totalProfitLoss
                    }, { headers: { Authorization: `Bearer ${token}` } });

                    if (response.data && response.data.message) {
                        showNotification(response.data.message, response.data.message === 'Đã cập nhật giá trị nợ này' ? 'success' : 'success');
                    } else {
                        showNotification('Đã lưu kết quả vào sổ nợ!');
                    }
                    loadDebt();
                } catch (err) {
                    console.error(err);
                    showNotification('Có lỗi khi lưu sổ nợ', 'error');
                }
            }
        });
    };

    const handleEditDebtClick = () => {
        setUpdateModal({
            isOpen: true,
            oldDebt: debt?.oldDebt || 0,
            paid: debt?.paid || 0,
            received: debt?.received || 0
        });
    };

    const submitUpdateDebt = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(getApiUrl('/debt/update'), {
                oldDebt: updateModal.oldDebt,
                paid: updateModal.paid,
                received: updateModal.received
            }, { headers: { Authorization: `Bearer ${token}` } });
            setUpdateModal({ isOpen: false, oldDebt: 0, paid: 0, received: 0 });
            showNotification('Đã cập nhật sổ nợ!');
            loadDebt();
        } catch (err) {
            console.error(err);
            showNotification('Có lỗi khi cập nhật sổ nợ', 'error');
        }
    };


    return (
        <div className="admin-export-summary">
            {notification.show && (
                <div className={`toast-notification ${notification.type}`}>
                    {notification.message}
                </div>
            )}
            <div className="summary-header">
                <h2 className="summary-title">Tổng kết tin xuất</h2>
                <div className="summary-controls">
                    <input
                        type="date"
                        className="summary-date-picker"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                    <button className="summary-refresh-btn" onClick={loadData} disabled={loading}>
                        {loading ? 'Đang tải...' : 'Làm mới'}
                    </button>
                    <button
                        style={{ fontSize: '18px', padding: '6px 10px', cursor: 'pointer', background: '#f5f5f5', border: '1px solid #ccc', borderRadius: '4px' }}
                        onClick={() => setIsSettingsOpen(true)}
                        title="Cài đặt hệ số"
                    >
                        ⚙️
                    </button>
                </div>
            </div>

            <div className="manual-mode-wrapper">
                <label className="switch">
                    <input
                        type="checkbox"
                        checked={isManualMode}
                        onChange={(e) => setIsManualMode(e.target.checked)}
                    />
                    <span className="slider round"></span>
                </label>
                <span className="switch-label">Bật chế độ tính ngoài</span>
            </div>

            {/* Debt book moved back down */}

            {/* Removed inline settings */}

            <div className="summary-snapshots-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Dữ liệu tính toán</h3>
                </div>

                {isManualMode ? (
                    <div className="manual-input-section mt-2">
                        <p style={{ fontSize: '13px', marginBottom: '8px', color: '#666' }}>
                            Dán nội dung báo cáo hoặc tin nhắn đã xuất vào đây để phân tích. Nhấn "Thêm đoạn text" để nhập nhiều dữ liệu và tính gộp.
                        </p>
                        {manualTexts.map((text, index) => (
                            <div key={index} style={{ marginBottom: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                    <strong style={{ fontSize: '14px', color: '#333' }}>Đoạn text {index + 1}</strong>
                                    {manualTexts.length > 1 && (
                                        <button
                                            onClick={() => {
                                                const newTexts = [...manualTexts];
                                                newTexts.splice(index, 1);
                                                setManualTexts(newTexts);
                                            }}
                                            style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                                        >
                                            Xóa đoạn này
                                        </button>
                                    )}
                                </div>
                                <textarea
                                    className="manual-text-area"
                                    placeholder="Đề: 11, 22x100&#10;Lô: 55, 66x50&#10;Xiên 2: 12-34x10"
                                    value={text}
                                    onChange={(e) => {
                                        const newTexts = [...manualTexts];
                                        newTexts[index] = e.target.value;
                                        setManualTexts(newTexts);
                                    }}
                                    rows="6"
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontFamily: 'inherit', fontSize: '14px', lineHeight: '1.5', resize: 'vertical' }}
                                />
                            </div>
                        ))}
                        <button
                            onClick={() => setManualTexts([...manualTexts, ''])}
                            style={{ padding: '8px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                        >
                            + Thêm đoạn text nữa
                        </button>
                    </div>
                ) : (
                    <>
                        {snapshots.length === 0 ? (
                            <p className="no-data">Không có tin xuất nào trong ngày này.</p>
                        ) : (
                            <div className="snapshot-list">
                                {snapshots.map(snap => (
                                    <div key={snap._id} className="snapshot-item">
                                        <label className="snapshot-checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={selectedSnapshotIds.includes(snap._id)}
                                                onChange={() => handleCheckboxChange(snap._id)}
                                            />
                                            <strong>Lần {snap.sequence}</strong>
                                            <span className="snapshot-time">
                                                (Từ {new Date(snap.startTime || snap.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} đến {new Date(snap.endTime || snap.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})
                                            </span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="summary-result-card">
                <h3>Kết quả tổng hợp tính điểm</h3>
                {(snapshots.length === 0 && !isManualMode) ? (
                    <p className="no-data">Vui lòng xuất tin nhắn để tính toán.</p>
                ) : (
                    <div className="calculation-details">
                        <div className="settings-table-container">
                            <table className="settings-table result-table">
                                <thead>
                                    <tr>
                                        <th>Loại thưởng</th>
                                        <th>Thu (Điểm/Tiền)</th>
                                        <th>Trả thưởng</th>
                                        <th>Tổng kết âm dương</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Đề */}
                                    <tr>
                                        <td><strong>Đề Tổng Kép Đầu Đít Bộ</strong></td>
                                        <td>{totalBetSum.toLocaleString()}n</td>
                                        <td>
                                            {isLotteryAvailable ? (
                                                <span className="text-danger">{totalPrizeSum.toLocaleString()}n</span>
                                            ) : (
                                                <span className="waiting-text">Đang chờ KQ...</span>
                                            )}
                                        </td>
                                        <td>
                                            {isLotteryAvailable ? (
                                                <strong className={calculatedProfitLoss >= 0 ? 'text-success' : 'text-danger'}>
                                                    {calculatedProfitLoss >= 0 ? '+' : ''}
                                                    {calculatedProfitLoss?.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}n
                                                </strong>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                    </tr>
                                    <tr className="formula-row">
                                        <td colSpan="4">
                                            <em>Cách tính: {totalPrizeSum.toLocaleString()} - ({totalBetSum.toLocaleString()} / 100) × {receiveMultiplier} = {calculatedProfitLoss?.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) ?? '?'}n</em>
                                            {isLotteryAvailable && ` (GĐB: ${lotteryResult?.results?.gdb})`}
                                        </td>
                                    </tr>

                                    {/* Lô */}
                                    <tr>
                                        <td><strong>Lô (Lottery)</strong></td>
                                        <td>{totalBetLo.toLocaleString()} điểm</td>
                                        <td>
                                            {isLotteryFullAvailable ? (
                                                <span className="text-danger">{totalPrizeLo.toLocaleString()}n</span>
                                            ) : (
                                                <span className="waiting-text">Đang chờ KQ...</span>
                                            )}
                                        </td>
                                        <td>
                                            {isLotteryFullAvailable ? (
                                                <strong className={calculatedProfitLossLo >= 0 ? 'text-success' : 'text-danger'}>
                                                    {calculatedProfitLossLo >= 0 ? '+' : ''}
                                                    {calculatedProfitLossLo?.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}n
                                                </strong>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                    </tr>
                                    <tr className="formula-row">
                                        <td colSpan="4">
                                            <em>Cách tính: {totalPrizeLo.toLocaleString()} - ({totalBetLo.toLocaleString()} × {loReceiveMultiplier}) = {calculatedProfitLossLo?.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) ?? '?'}n</em>
                                        </td>
                                    </tr>

                                    {/* 3s */}
                                    <tr>
                                        <td><strong>Ba số (3s)</strong></td>
                                        <td>{totalBetThreeS.toLocaleString()}n</td>
                                        <td>
                                            {isThreeSAvailable ? (
                                                <span className="text-danger">{totalPrizeThreeS.toLocaleString()}n</span>
                                            ) : (
                                                <span className="waiting-text">Đang chờ KQ...</span>
                                            )}
                                        </td>
                                        <td>
                                            {isThreeSAvailable ? (
                                                <strong className={calculatedProfitLossThreeS >= 0 ? 'text-success' : 'text-danger'}>
                                                    {calculatedProfitLossThreeS >= 0 ? '+' : ''}
                                                    {calculatedProfitLossThreeS?.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}n
                                                </strong>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                    </tr>
                                    <tr className="formula-row">
                                        <td colSpan="4">
                                            <em>Cách tính: {totalPrizeThreeS.toLocaleString()} - ({totalBetThreeS.toLocaleString()} / 100) × {threeSReceiveMultiplier} = {calculatedProfitLossThreeS?.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) ?? '?'}n</em>
                                            {isThreeSAvailable && ` (3 số cuối: ${winningThreeS})`}
                                        </td>
                                    </tr>

                                    {/* 4s (Tạm thời ẩn)
                                    <tr>
                                        <td><strong>Bốn số (4s)</strong></td>
                                        <td>{totalBetFourS.toLocaleString()}n</td>
                                        <td>
                                            {isFourSAvailable ? (
                                                <span className="text-danger">{totalPrizeFourS.toLocaleString()}n</span>
                                            ) : (
                                                <span className="waiting-text">Đang chờ KQ...</span>
                                            )}
                                        </td>
                                        <td>
                                            {isFourSAvailable ? (
                                                <strong className={calculatedProfitLossFourS >= 0 ? 'text-success' : 'text-danger'}>
                                                    {calculatedProfitLossFourS >= 0 ? '+' : ''}
                                                    {calculatedProfitLossFourS?.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}n
                                                </strong>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                    </tr>
                                    <tr className="formula-row">
                                        <td colSpan="4">
                                            <em>Cách tính: {totalPrizeFourS.toLocaleString()} - ({totalBetFourS.toLocaleString()} / 100) × {fourSReceiveMultiplier} = {calculatedProfitLossFourS?.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) ?? '?'}n</em>
                                            {isFourSAvailable && ` (4 số cuối: ${winningFourS})`}
                                        </td>
                                    </tr>
                                    */}

                                    {/* Xiên */}
                                    <tr>
                                        <td><strong>Xiên (x2, x3, x4, xq)</strong></td>
                                        <td>{totalBetXien.toLocaleString()}n</td>
                                        <td>
                                            {isLotteryFullAvailable ? (
                                                <span className="text-danger">{totalPrizeXien.toLocaleString()}n</span>
                                            ) : (
                                                <span className="waiting-text">Đang chờ KQ...</span>
                                            )}
                                        </td>
                                        <td>
                                            {isLotteryFullAvailable ? (
                                                <strong className={calculatedProfitLossXien >= 0 ? 'text-success' : 'text-danger'}>
                                                    {calculatedProfitLossXien >= 0 ? '+' : ''}
                                                    {calculatedProfitLossXien?.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}n
                                                </strong>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                    </tr>
                                    <tr className="formula-row">
                                        <td colSpan="4">
                                            <em>Cách tính: {totalPrizeXien.toLocaleString()} - ({totalBetXien.toLocaleString()} / 100) × {xienReceiveMultiplier} = {calculatedProfitLossXien?.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) ?? '?'}n</em>
                                        </td>
                                    </tr>

                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {(snapshots.length > 0 || isManualMode) && (
                    <div style={{ padding: '10px 0', color: '#d32f2f', fontStyle: 'italic', fontSize: '14px', fontWeight: '500' }}>
                        * Ghi chú: Tạm thời kết quả 4 số và xiên nháy không được áp dụng tính trong phần này.
                    </div>
                )}
            </div>

            {
                (snapshots.length > 0 || isManualMode) && (
                    <div className="summary-text-export">
                        <div style={{ marginBottom: '15px' }}>
                            <h3 style={{ marginBottom: '15px' }}>Copy Báo Cáo Text</h3>

                            <div className="export-controls-container">
                                <label className="export-radio-label">
                                    <input
                                        type="radio"
                                        name="copyMergeMode"
                                        value="merge"
                                        checked={copyMergeMode === 'merge'}
                                        onChange={(e) => setCopyMergeMode(e.target.value)}
                                    />
                                    Gộp chung
                                </label>
                                <label className="export-radio-label">
                                    <input
                                        type="radio"
                                        name="copyMergeMode"
                                        value="separate"
                                        checked={copyMergeMode === 'separate'}
                                        onChange={(e) => setCopyMergeMode(e.target.value)}
                                    />
                                    Tách riêng từng lần
                                </label>
                            </div>

                            <button
                                onClick={handleSaveDebt}
                                className="btn-save-debt-main"
                                title="Lưu số tổng vào sổ nợ ngày đang chọn"
                            >
                                📓 Lưu vào sổ nợ ({totalProfitLoss.toLocaleString()}n)
                            </button>
                        </div>
                        <div className="summary-text-content-wrapper">
                            <button
                                className={`copy-summary-btn ${isCopied ? 'copied' : ''}`}
                                onClick={handleCopySummary}
                            >
                                {isCopied ? '✅ Đã Copy!' : '📋 Copy Text'}
                            </button>
                            <pre className="summary-text-pre">{generateSummaryText()}</pre>
                        </div>
                    </div>
                )
            }

            <div className="summary-snapshots-section debt-book-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, color: '#d32f2f', borderLeft: 'none', paddingLeft: '0' }}>📓 Cập nhật sổ nợ ngày {debt?.lastUpdatedDate ? new Date(debt.lastUpdatedDate).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}</h3>
                    <button
                        onClick={() => setShowDebtBook(!showDebtBook)}
                        className="btn-toggle-debt"
                    >
                        {showDebtBook ? 'Ẩn sổ nợ ▲' : 'Xem sổ nợ ▼'}
                    </button>
                </div>

                {showDebtBook && (
                    <div className="debt-book-content">
                        <div className="debt-table-wrapper">
                            <table className="minimal-table" style={{ width: '100%', marginTop: '10px' }}>
                                <thead>
                                    <tr style={{ background: '#f1f1f1' }}>
                                        <th style={{ border: '1px solid #ddd', textAlign: 'right' }}>Hôm nay</th>
                                        <th style={{ border: '1px solid #ddd', textAlign: 'right' }}>Nợ cũ</th>
                                        <th style={{ border: '1px solid #ddd', textAlign: 'right' }}>Đã trả (+)</th>
                                        <th style={{ border: '1px solid #ddd', textAlign: 'right' }}>Đã nhận (-)</th>
                                        <th style={{ border: '1px solid #ddd', textAlign: 'right' }}>Còn lại</th>
                                        <th style={{ border: '1px solid #ddd', textAlign: 'center' }}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr key="current-debt">
                                        <td style={{ border: '1px solid #ddd', textAlign: 'right', color: (debt?.todayAmount || 0) >= 0 ? '#d32f2f' : 'green', fontWeight: 'bold' }}>
                                            {(debt?.todayAmount || 0).toLocaleString('vi-VN')}n
                                        </td>
                                        <td style={{ border: '1px solid #ddd', textAlign: 'right', color: (debt?.oldDebt || 0) >= 0 ? '#d32f2f' : 'green' }}>
                                            {(debt?.oldDebt || 0).toLocaleString('vi-VN')}n
                                        </td>
                                        <td style={{ border: '1px solid #ddd', textAlign: 'right', color: 'green' }}>
                                            {(debt?.paid || 0).toLocaleString('vi-VN')}n
                                        </td>
                                        <td style={{ border: '1px solid #ddd', textAlign: 'right', color: '#ff9800' }}>
                                            {(debt?.received || 0).toLocaleString('vi-VN')}n
                                        </td>
                                        <td style={{ border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold', color: (debt?.remainingDebt || 0) >= 0 ? '#d32f2f' : 'green', fontSize: '16px' }}>
                                            {(debt?.remainingDebt || 0).toLocaleString('vi-VN')}n
                                        </td>
                                        <td style={{ border: '1px solid #ddd', textAlign: 'center' }}>
                                            <button
                                                onClick={handleEditDebtClick}
                                                className="btn-action btn-success"
                                            >
                                                Sửa
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <div style={{ marginTop: '8px', fontStyle: 'italic', fontSize: '13px', color: '#666', lineHeight: '1.4' }}>
                                📌 *Lưu ý: Khi sang ngày mới, số tiền "Còn lại" của ngày hôm trước sẽ được tự động chuyển thành "Nợ cũ" của ngày hôm nay. Đồng thời, "Hôm nay", "Đã trả" và "Đã nhận" sẽ tự động đặt lại về 0.*
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {
                isSettingsOpen && (
                    <div className="settings-modal-overlay" onClick={(e) => { if (e.target.className === 'settings-modal-overlay') setIsSettingsOpen(false); }}>
                        <div className="settings-modal-content">
                            <div className="settings-modal-header">
                                <h3>Cài đặt hệ số</h3>
                                <button className="close-modal-btn" onClick={() => setIsSettingsOpen(false)}>✕</button>
                            </div>
                            <div className="settings-modal-body">
                                <table className="settings-table">
                                    <thead>
                                        <tr>
                                            <th>Cài đặt hệ số</th>
                                            <th>Nhận (Điểm)</th>
                                            <th>Thưởng (Tiền)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Đề (2 số, Tổng, Đầu...)</td>
                                            <td><input type="number" step="0.1" value={receiveMultiplier} onChange={(e) => setReceiveMultiplier(e.target.value)} /></td>
                                            <td><input type="number" step="0.1" value={prizeMultiplier} onChange={(e) => setPrizeMultiplier(e.target.value)} /></td>
                                        </tr>
                                        <tr>
                                            <td>Lô (Lottery)</td>
                                            <td><input type="number" step="0.1" value={loReceiveMultiplier} onChange={(e) => setLoReceiveMultiplier(e.target.value)} /></td>
                                            <td><input type="number" step="0.1" value={loPrizeMultiplier} onChange={(e) => setLoPrizeMultiplier(e.target.value)} /></td>
                                        </tr>
                                        <tr>
                                            <td>Ba số (3s)</td>
                                            <td><input type="number" step="0.1" value={threeSReceiveMultiplier} onChange={(e) => setThreeSReceiveMultiplier(e.target.value)} /></td>
                                            <td><input type="number" step="0.1" value={threeSPrizeMultiplier} onChange={(e) => setThreeSPrizeMultiplier(e.target.value)} /></td>
                                        </tr>
                                        <tr>
                                            <td>Bốn số (4s)</td>
                                            <td><input type="number" step="0.1" value={fourSReceiveMultiplier} onChange={(e) => setFourSReceiveMultiplier(e.target.value)} /></td>
                                            <td><input type="number" step="0.1" value={fourSPrizeMultiplier} onChange={(e) => setFourSPrizeMultiplier(e.target.value)} /></td>
                                        </tr>
                                        <tr>
                                            <td>Xiên 2</td>
                                            <td rowSpan="6" className="vertical-center">
                                                <input type="number" step="0.1" value={xienReceiveMultiplier} onChange={(e) => setXienReceiveMultiplier(e.target.value)} />
                                            </td>
                                            <td><input type="number" step="0.1" value={x2PrizeMultiplier} onChange={(e) => setX2PrizeMultiplier(e.target.value)} /></td>
                                        </tr>
                                        <tr>
                                            <td>Xiên 3</td>
                                            <td><input type="number" step="0.1" value={x3PrizeMultiplier} onChange={(e) => setX3PrizeMultiplier(e.target.value)} /></td>
                                        </tr>
                                        <tr>
                                            <td>Xiên 4</td>
                                            <td><input type="number" step="0.1" value={x4PrizeMultiplier} onChange={(e) => setX4PrizeMultiplier(e.target.value)} /></td>
                                        </tr>
                                        <tr>
                                            <td>Xiên Quay trúng 2</td>
                                            <td><input type="number" step="0.1" value={xqHit2PrizeMultiplier} onChange={(e) => setXqHit2PrizeMultiplier(e.target.value)} /></td>
                                        </tr>
                                        <tr>
                                            <td>Xiên Quay trúng 3</td>
                                            <td><input type="number" step="0.1" value={xqHit3PrizeMultiplier} onChange={(e) => setXqHit3PrizeMultiplier(e.target.value)} /></td>
                                        </tr>
                                        <tr>
                                            <td>Xiên Quay trúng 4</td>
                                            <td><input type="number" step="0.1" value={xqHit4PrizeMultiplier} onChange={(e) => setXqHit4PrizeMultiplier(e.target.value)} /></td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div style={{ marginTop: '15px', textAlign: 'right' }}>
                                    <button
                                        className="btn btn-primary"
                                        style={{ padding: '8px 16px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        onClick={saveMultipliers}
                                    >
                                        Lưu cài đặt
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                updateModal.isOpen && (
                    <div className="settings-modal-overlay" onClick={(e) => { if (e.target.className === 'settings-modal-overlay') setUpdateModal({ ...updateModal, isOpen: false }); }}>
                        <div className="settings-modal-content" style={{ maxWidth: '400px' }}>
                            <div className="settings-modal-header">
                                <h3>Cập nhật số tiền đã trả</h3>
                                <button className="close-modal-btn" onClick={() => setUpdateModal({ ...updateModal, isOpen: false })}>✕</button>
                            </div>
                            <div className="settings-modal-body">
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Nợ cũ (n):</label>
                                    <input
                                        type="number"
                                        style={{ width: '100%', padding: '10px', fontSize: '16px', border: '1px solid #ced4da', borderRadius: '4px' }}
                                        value={updateModal.oldDebt}
                                        onChange={(e) => setUpdateModal({ ...updateModal, oldDebt: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Đã trả (n) (+):</label>
                                    <input
                                        type="number"
                                        style={{ width: '100%', padding: '10px', fontSize: '16px', border: '1px solid #007bff', borderRadius: '4px' }}
                                        value={updateModal.paid}
                                        onChange={(e) => setUpdateModal({ ...updateModal, paid: e.target.value })}
                                    />
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Đã nhận (n) (-):</label>
                                    <input
                                        type="number"
                                        style={{ width: '100%', padding: '10px', fontSize: '16px', border: '1px solid #ff9800', borderRadius: '4px' }}
                                        value={updateModal.received}
                                        onChange={(e) => setUpdateModal({ ...updateModal, received: e.target.value })}
                                    />
                                </div>
                                <button
                                    onClick={submitUpdateDebt}
                                    style={{ width: '100%', padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
                                >
                                    Lưu Cập Nhật
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                confirmModal.isOpen && (
                    <div className="settings-modal-overlay" onClick={(e) => { if (e.target.className === 'settings-modal-overlay') setConfirmModal(prev => ({ ...prev, isOpen: false })); }}>
                        <div className="settings-modal-content" style={{ maxWidth: '400px' }}>
                            <div className="settings-modal-header">
                                <h3>{confirmModal.title}</h3>
                                <button className="close-modal-btn" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>✕</button>
                            </div>
                            <div className="settings-modal-body" style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '16px', marginBottom: '25px', lineHeight: '1.5' }}>{confirmModal.message}</p>
                                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                        style={{ padding: '10px 20px', background: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', minWidth: '100px' }}
                                    >
                                        Huỷ bỏ
                                    </button>
                                    <button
                                        onClick={confirmModal.onConfirm}
                                        style={{ padding: '10px 20px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', minWidth: '100px' }}
                                    >
                                        Xác nhận
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AdminExportSummary;
