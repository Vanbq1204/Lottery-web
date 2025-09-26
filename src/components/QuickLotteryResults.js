import React, { useEffect, useState } from 'react';
import './QuickLotteryResults.css';

const QuickLotteryResults = () => {
  const [lotteryNumbers, setLotteryNumbers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    // Tạo một div ẩn để chứa kết quả xổ số từ minhngoc.com.vn
    const hiddenDiv = document.createElement('div');
    hiddenDiv.id = 'box_kqxs_minhngoc';
    hiddenDiv.style.display = 'none';
    document.body.appendChild(hiddenDiv);

    // Tạo script jQuery
    const jqueryScript = document.createElement('script');
    jqueryScript.src = '//www.minhngoc.com.vn/jquery/jquery-1.7.2.js';
    jqueryScript.async = true;
    hiddenDiv.appendChild(jqueryScript);

    // Tạo CSS link
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.type = 'text/css';
    cssLink.href = '//www.minhngoc.com.vn/style/bangketqua_mini.css';
    hiddenDiv.appendChild(cssLink);

    // Tạo script cấu hình
    const configScript = document.createElement('script');
    configScript.innerHTML = 'bgcolor="#bfbfbf";titlecolor="#730038";dbcolor="#000000";fsize="12px";kqwidth="300px";';
    hiddenDiv.appendChild(configScript);

    // Tạo script kết quả xổ số
    const kqScript = document.createElement('script');
    kqScript.src = '//www.minhngoc.com.vn/getkqxs/mien-bac.js';
    kqScript.async = true;
    hiddenDiv.appendChild(kqScript);

    // Đợi script tải xong và xử lý kết quả
    const timer = setTimeout(() => {
      extractLotteryNumbers();
    }, 2000);

    return () => {
      // Dọn dẹp khi component unmount
      clearTimeout(timer);
      if (document.body.contains(hiddenDiv)) {
        document.body.removeChild(hiddenDiv);
      }
    };
  }, []);

  const extractLotteryNumbers = () => {
    // Lấy tất cả các phần tử chứa số xổ số từ bảng kết quả
    const numberElements = document.querySelectorAll('#box_kqxs_minhngoc .giaidb, #box_kqxs_minhngoc .giai1, #box_kqxs_minhngoc .giai2, #box_kqxs_minhngoc .giai3, #box_kqxs_minhngoc .giai4, #box_kqxs_minhngoc .giai5, #box_kqxs_minhngoc .giai6, #box_kqxs_minhngoc .giai7');
    
    const numbers = [];
    
    // Nếu không tìm thấy số nào
    if (numberElements.length === 0) {
      setIsLoading(false);
      return;
    }
    
    // Trích xuất các số từ các phần tử HTML
    numberElements.forEach(function(element) {
      const extractedNumbers = element.textContent.trim().split(' ');
      extractedNumbers.forEach(function(number) {
        if (number && !isNaN(number)) {
          numbers.push(number);
        }
      });
    });
    
    setLotteryNumbers(numbers);
    setIsLoading(false);
  };

  const handleCopyNumbers = () => {
    const textToCopy = lotteryNumbers.join(' ');
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopySuccess('Đã sao chép!');
        setTimeout(() => {
          setCopySuccess('');
        }, 2000);
      })
      .catch(err => {
        console.error('Không thể sao chép: ', err);
        setCopySuccess('Lỗi sao chép!');
        setTimeout(() => {
          setCopySuccess('');
        }, 2000);
      });
  };

  const refreshResults = () => {
    setIsLoading(true);
    // Xóa div cũ nếu có
    const oldDiv = document.getElementById('box_kqxs_minhngoc');
    if (oldDiv) {
      document.body.removeChild(oldDiv);
    }
    
    // Tạo lại div và scripts
    const hiddenDiv = document.createElement('div');
    hiddenDiv.id = 'box_kqxs_minhngoc';
    hiddenDiv.style.display = 'none';
    document.body.appendChild(hiddenDiv);

    // Tạo script jQuery
    const jqueryScript = document.createElement('script');
    jqueryScript.src = '//www.minhngoc.com.vn/jquery/jquery-1.7.2.js';
    jqueryScript.async = true;
    hiddenDiv.appendChild(jqueryScript);

    // Tạo CSS link
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.type = 'text/css';
    cssLink.href = '//www.minhngoc.com.vn/style/bangketqua_mini.css';
    hiddenDiv.appendChild(cssLink);

    // Tạo script cấu hình
    const configScript = document.createElement('script');
    configScript.innerHTML = 'bgcolor="#bfbfbf";titlecolor="#730038";dbcolor="#000000";fsize="12px";kqwidth="300px";';
    hiddenDiv.appendChild(configScript);

    // Tạo script kết quả xổ số
    const kqScript = document.createElement('script');
    kqScript.src = '//www.minhngoc.com.vn/getkqxs/mien-bac.js';
    kqScript.async = true;
    hiddenDiv.appendChild(kqScript);

    // Đợi script tải xong và xử lý kết quả
    setTimeout(() => {
      extractLotteryNumbers();
    }, 2000);
  };

  return (
    <div className="quick-lottery-container">
      <div className="quick-lottery-header">
        <h2>Kết Quả Xổ Số Nhanh</h2>
        <button onClick={refreshResults} className="refresh-button">
          🔄 Làm mới
        </button>
      </div>
      
      {/* Div hiển thị kết quả đã xử lý */}
      <div className="result-container" id="processed-results">
        <h3>Các Số Trúng Thưởng</h3>
        <div id="lottery-numbers">
          {isLoading ? (
            <p>Đang tải kết quả...</p>
          ) : lotteryNumbers.length > 0 ? (
            <div className="numbers-container">
              {lotteryNumbers.map((number, index) => (
                <span key={index} className="quick-lottery-number">{number}</span>
              ))}
            </div>
          ) : (
            <p>Không tìm thấy số xổ số. Vui lòng thử lại sau.</p>
          )}
        </div>
      </div>
      
      {/* Div hiển thị kết quả dạng một dòng để copy */}
      <div className="result-container">
        <h3>Dòng Kết Quả Để Sao Chép</h3>
        <div className="copyable-numbers">
          {isLoading ? (
            <p>Đang tải kết quả...</p>
          ) : lotteryNumbers.length > 0 ? (
            lotteryNumbers.join(' ')
          ) : (
            <p>Không tìm thấy số xổ số.</p>
          )}
        </div>
        <button 
          onClick={handleCopyNumbers} 
          className="copy-button"
          disabled={isLoading || lotteryNumbers.length === 0}
        >
          {copySuccess || 'Sao chép kết quả'}
        </button>
      </div>
    </div>
  );
};

export default QuickLotteryResults;