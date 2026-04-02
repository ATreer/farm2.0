import React, { useState } from 'react';

export default function StartScreen({ onStart }) {
  const [name, setName] = useState('');

  const handleStart = () => {
    const playerName = name.trim() || '农夫';
    onStart(playerName);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleStart();
  };

  return (
    <div className="start-screen">
      <div className="start-title">🌾 像素农场 🌾</div>
      <div className="start-subtitle">种下希望，收获快乐</div>
      <div className="start-character">🧑‍🌾</div>
      <input
        className="start-input"
        type="text"
        placeholder="输入你的名字"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={12}
      />
      <button className="btn btn-primary start-btn" onClick={handleStart}>
        开始种田
      </button>
      <div className="start-tips">
        种植 → 浇水 → 等待生长 → 收获 → 出售 → 升级
      </div>
    </div>
  );
}
