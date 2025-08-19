import React from 'react';
import './QuantityControls.css';

const QuantityControls = ({ 
  value, 
  onChange, 
  min = 1, 
  max = 20, 
  step = 1,
  disabled = false 
}) => {
  const handleIncrease = () => {
    if (!disabled && value < max) {
      onChange(value + step);
    }
  };

  const handleDecrease = () => {
    if (!disabled && value > min) {
      onChange(value - step);
    }
  };

  const handleInputChange = (e) => {
    const newValue = parseInt(e.target.value) || min;
    if (newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <div className="quantity-controls">
      <button
        type="button"
        className="quantity-btn quantity-decrease"
        onClick={handleDecrease}
        disabled={disabled || value <= min}
        title="Giảm số lượng"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        className="quantity-control-input"
        min={min}
        max={max}
        disabled={disabled}
      />
      
      <button
        type="button"
        className="quantity-btn quantity-increase"
        onClick={handleIncrease}
        disabled={disabled || value >= max}
        title="Tăng số lượng"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
};

export default QuantityControls; 