import React from 'react';

export default function TopBar({ player, time, onTimeAdvance, onSleep }) {
  if (!player) return null;

  const expPercent = player.nextLevelExp > 0
    ? Math.min(100, (player.currentExp / player.nextLevelExp) * 100)
    : 0;

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <div className="player-info">
          <span>🧑‍🌾</span>
          <span className="player-name">{player.name}</span>
          <span className="level-badge">Lv.{player.level}</span>
        </div>
        <div className="exp-bar-container">
          <span>EXP</span>
          <div className="exp-bar">
            <div className="exp-bar-fill" style={{ width: `${expPercent}%` }} />
          </div>
          <span>{player.currentExp}/{player.nextLevelExp}</span>
        </div>
        <div className="gold-display">
          <span>💰</span>
          <span>{player.gold}</span>
        </div>
      </div>

      <div className="time-display">
        {time && (
          <>
            <span>{time.seasonEmoji} {time.seasonName}</span>
            <span>📅 第{time.day}天</span>
            <span>🕐 {time.timeStr}</span>
          </>
        )}
        <div className="time-controls">
          <button className="btn btn-small" onClick={() => onTimeAdvance(10)}>+10分</button>
          <button className="btn btn-small" onClick={() => onTimeAdvance(60)}>+1时</button>
          <button className="btn btn-small btn-primary" onClick={onSleep}>💤 睡觉</button>
        </div>
      </div>
    </div>
  );
}
