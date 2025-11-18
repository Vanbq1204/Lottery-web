import React, { useEffect, useState, useRef } from 'react';
import './QuickLotteryResults.css';
import Tesseract from 'tesseract.js';

const QuickLotteryResults = ({ onRecognized }) => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [recognizedText, setRecognizedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);
  const pasteAreaRef = useRef(null);

  useEffect(() => {
    // Thêm sự kiện paste cho document
    const handlePaste = (e) => {
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          handleImageFile(blob);
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

  const handleImageFile = (file) => {
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleImageFile(file);
  };

  const handlePasteAreaClick = () => {
    pasteAreaRef.current.focus();
  };

  const processImage = () => {
    if (!imageFile) {
      alert('Vui lòng chọn hoặc dán một ảnh trước!');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setRecognizedText('');

    Tesseract.recognize(
      imageFile,
      'eng+vie', // Ngôn ngữ: tiếng Anh và tiếng Việt
      {
        logger: progress => {
          if (progress.status === 'recognizing text') {
            const percent = Math.round(progress.progress * 100);
            setProgress(percent);
          }
        }
      }
    ).then(({ data: { text } }) => {
      // Xử lý văn bản để hiển thị thành một hàng ngang
      // Tách văn bản thành các dòng và loại bỏ khoảng trắng thừa
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      // Nối các dòng lại và làm sạch ký tự không phải số/space
      const singleLineText = lines.join(' ');
      const sanitized = singleLineText.replace(/[^\d\s]/g, ' ').replace(/\s+/g, ' ').trim();

      // Xác thực chuỗi theo định dạng: tổng 27 số với độ dài từng nhóm
      const tokens = sanitized.split(' ').filter(Boolean);
      const expectedLengths = [
        5, // G.ĐB
        5, // G.1
        5,5, // G.2 (2 số)
        5,5,5,5,5,5, // G.3 (6 số)
        4,4,4,4, // G.4 (4 số)
        4,4,4,4,4,4, // G.5 (6 số)
        3,3,3, // G.6 (3 số)
        2,2,2,2 // G.7 (4 số)
      ];

      const isValidCount = tokens.length === expectedLengths.length;
      const isValidShapes = isValidCount && tokens.every((tok, idx) => /^\d+$/.test(tok) && tok.length === expectedLengths[idx]);

      if (!isValidShapes) {
        setErrorMsg('Ảnh định dạng sai: Chuỗi phải gồm 27 số theo định dạng (5,5, 5x2, 5x6, 4x4, 4x6, 3x3, 2x4) và chỉ chứa chữ số.');
        setRecognizedText('');
        setIsProcessing(false);
        setProgress(0);
        alert('Ảnh định dạng sai');
        return;
      }

      // Hiển thị kết quả hợp lệ
      setErrorMsg('');
      setRecognizedText(sanitized);
      try {
        if (typeof onRecognized === 'function') {
          onRecognized(sanitized);
        }
      } catch (_) { /* ignore */ }
      setIsProcessing(false);
      setProgress(0);
    }).catch(error => {
      console.error('Lỗi khi nhận dạng văn bản:', error);
      setErrorMsg('Đã xảy ra lỗi khi xử lý ảnh. Vui lòng thử lại.');
      setRecognizedText('');
      setIsProcessing(false);
    });
  };

  const handleCopyText = () => {
    if (recognizedText) {
      navigator.clipboard.writeText(recognizedText)
        .then(() => {
          alert('Đã sao chép văn bản!');
        })
        .catch(err => {
          console.error('Không thể sao chép: ', err);
          alert('Lỗi khi sao chép văn bản!');
        });
    }
  };

  return (
    <div className="quick-lottery-container">
      <h1>Nhập liệu từ ảnh</h1>
      <div className="upload-section">
        <p>Chọn ảnh chứa văn bản để nhận dạng</p>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange}
          ref={fileInputRef}
        />
        <p>Hoặc dán ảnh trực tiếp vào đây (Ctrl+V)</p>
        <div 
          className="paste-area" 
          onClick={handlePasteAreaClick}
          ref={pasteAreaRef}
          tabIndex="0"
        >
          <span>Nhấp vào đây và dán ảnh (Ctrl+V)</span>
        </div>
        <button 
          onClick={processImage}
          disabled={isProcessing || !imageFile}
        >
          Nhập liệu ảnh vào kết quả xổ số
        </button>
        {isProcessing && (
          <div className="loading">
            <p>Đang xử lý ảnh, vui lòng đợi...</p>
            <div className="progress">
              <div 
                className="progress-bar" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
      
      <div className="preview-section">
        <div className="image-preview">
          <h3>Ảnh đã tải lên</h3>
          {imagePreview ? (
            <img src={imagePreview} alt="Ảnh xem trước" />
          ) : (
            <p>Chưa có ảnh nào được tải lên</p>
          )}
        </div>
        <div className="text-result">
          <h3>Văn bản được nhận dạng</h3>
          {recognizedText ? (
            <>
              <div>{recognizedText}</div>
              <button onClick={handleCopyText} className="quick-lottery-copy-button">
                Sao chép văn bản
              </button>
            </>
          ) : (
            <p style={{ color: errorMsg ? '#b00020' : '#6c757d' }}>{errorMsg || 'Chưa có văn bản nào được nhận dạng'}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickLotteryResults;