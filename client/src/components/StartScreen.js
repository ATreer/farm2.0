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
      <div style={{ fontSize: '48px', margin: '10px 0' }}>🧑‍🌾</div>
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
      <div style={{ fontSize: '7px', color: '#555', marginTop: '20px' }}>
        提示：种植 → 浇水 → 等待生长 → 收获 → 出售 → 升级
      </div>
    </div>
  );
}
