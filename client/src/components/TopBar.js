import React from 'react';
import { t } from '../services/i18n';
import assets from '../config/assets';

export default function TopBar({ player, time, onTimeAdvance, onSleep, lang }) {
  if (!player) return null;

  const expPercent = player.nextLevelExp > 0
    ? Math.min(100, (player.currentExp / player.nextLevelExp) * 100)
    : 0;

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <div className="player-info">
          <span className="player-avatar">{assets.avatars.topbar}</span>
          <span className="player-name">{player.name}</span>
          <span className="level-badge">Lv.{player.level}</span>
        </div>
        <div className="exp-bar-container">
          <span>{t('exp', lang)}</span>
          <div className="exp-bar">
            <div className="exp-bar-fill" style={{ width: `${expPercent}%` }} />
          </div>
          <span>{player.currentExp}/{player.nextLevelExp}</span>
        </div>
        <div className="gold-display">
          <span>{assets.stat.gold}</span>
          <span>{player.gold}</span>
        </div>
      </div>

      <div className="time-display">
        {time && (
          <>
            <span className="season-icon">{time.seasonEmoji}</span>
            <span>{t(time.season, lang)} {t('day', lang, { n: time.day })}</span>
            <span>{assets.time.clock} {time.timeStr}</span>
          </>
        )}
        <div className="time-controls">
          <button className="btn btn-small" onClick={() => onTimeAdvance(10)}>{t('timeAdvance10', lang)}</button>
          <button className="btn btn-small" onClick={() => onTimeAdvance(60)}>{t('timeAdvance60', lang)}</button>
          <button className="btn btn-small btn-primary" onClick={onSleep}>{assets.btn.sleep} {t('sleep', lang)}</button>
        </div>
      </div>
    </div>
  );
}
