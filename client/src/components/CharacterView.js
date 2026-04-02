import React from 'react';
import { t } from '../services/i18n';

export default function CharacterView({ player, lang }) {
  if (!player) return null;

  const avatars = ['🧑‍🌾', '👩‍🌾', '👨‍🌾', '🧙', '🧝', '🦊'];
  const avatarIndex = player.level % avatars.length;
  const titles = t('titles', lang);
  const title = titles[Math.min(player.level - 1, titles.length - 1)];

  const expPercent = player.nextLevelExp > 0
    ? Math.min(100, (player.currentExp / player.nextLevelExp) * 100)
    : 0;

  return (
    <div className="panel">
      <div className="panel-title">👤 {t('characterInfo', lang)}</div>

      <div className="character-panel">
        <div className="char-avatar">
          <div className="char-emoji">{avatars[avatarIndex]}</div>
          <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '16px', color: 'var(--gold)', marginTop: '8px' }}>
            {player.name}
          </div>
          <div className="char-title">{title}</div>
          <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px' }}>
            Lv.{player.level}
          </div>
          <div style={{ marginTop: '12px', width: '100%' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px', textAlign: 'center' }}>
              {t('experience', lang)} {player.currentExp}/{player.nextLevelExp}
            </div>
            <div className="exp-bar" style={{ width: '100%', height: '14px' }}>
              <div className="exp-bar-fill" style={{ width: `${expPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="char-stats">
          <div className="char-stat-row">
            <span className="char-stat-label">👤 {t('name', lang)}</span>
            <span className="char-stat-value">{player.name}</span>
          </div>
          <div className="char-stat-row">
            <span className="char-stat-label">⭐ {t('level', lang)}</span>
            <span className="char-stat-value">Lv.{player.level}</span>
          </div>
          <div className="char-stat-row">
            <span className="char-stat-label">🏅 {t('title', lang)}</span>
            <span className="char-stat-value">{title}</span>
          </div>
          <div className="char-stat-row">
            <span className="char-stat-label">✨ {t('experience', lang)}</span>
            <span className="char-stat-value">{player.currentExp}/{player.nextLevelExp}</span>
          </div>
          <div className="char-stat-row">
            <span className="char-stat-label">💰 {t('gold', lang)}</span>
            <span className="char-stat-value">{player.gold}</span>
          </div>
          <div className="char-stat-row">
            <span className="char-stat-label">🌾 {t('farmLevel', lang)}</span>
            <span className="char-stat-value">Lv.{player.farm_level}</span>
          </div>
          <div className="char-stat-row">
            <span className="char-stat-label">📐 {t('farmSize', lang)}</span>
            <span className="char-stat-value">{player.max_farm_rows}×{player.max_farm_cols}</span>
          </div>
          <div className="char-stat-row">
            <span className="char-stat-label">📅 {t('createdAt', lang)}</span>
            <span className="char-stat-value" style={{ fontSize: '11px' }}>
              {player.created_at ? new Date(player.created_at).toLocaleDateString('zh-CN') : '-'}
            </span>
          </div>
        </div>
      </div>

      <div className="tips-panel">
        <div className="tips-title">🎮 {t('gameTips', lang)}</div>
        <div className="tip-item">
          {t('tips', lang).map((tip, i) => (
            <React.Fragment key={i}>
              {i > 0 && <br />}
              {tip}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
