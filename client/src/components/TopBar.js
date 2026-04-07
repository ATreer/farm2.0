import React, { useState, useRef, useEffect } from 'react';
import { t } from '../services/i18n';
import assets from '../config/assets';
import * as api from '../services/api';

// 头像框配置：等级达到后解锁
const AVATAR_FRAMES = [
  { minLevel: 2,  name: '白金头像框(测试)', border: '3px solid #e5e4e2', shadow: '0 0 8px rgba(229,228,226,0.8)' },
  { minLevel: 5,  name: '青铜头像框', border: '3px solid #cd7f32', shadow: '0 0 6px rgba(205,127,50,0.6)' },
  { minLevel: 10, name: '白银头像框', border: '3px solid #c0c0c0', shadow: '0 0 6px rgba(192,192,192,0.6)' },
  { minLevel: 15, name: '黄金头像框', border: '3px solid #ffd700', shadow: '0 0 8px rgba(255,215,0,0.7)' },
];

function getAvatarFrame(level) {
  let frame = null;
  for (const f of AVATAR_FRAMES) {
    if (level >= f.minLevel) frame = f;
  }
  return frame;
}

export default function TopBar({ player, time, onSleep, onOpenSettings, lang, refresh }) {
  const [showProfile, setShowProfile] = useState(false);
  const [sleepHours, setSleepHours] = useState(8);
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const profileRef = useRef(null);

  if (!player) return null;

  const expPercent = player.nextLevelExp > 0
    ? Math.min(100, (player.currentExp / player.nextLevelExp) * 100)
    : 0;

  const avatarIndex = player.level % assets.avatars.list.length;
  const avatarEmoji = assets.avatars.list[avatarIndex];
  const frame = getAvatarFrame(player.level);

  // 点击外部关闭悬浮框
  useEffect(() => {
    if (!showProfile) return;
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
        setEditingName(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showProfile]);

  const handleSleep = () => {
    setShowSleepMenu(false);
    onSleep(sleepHours);
  };

  const handleAvatarChange = () => {
    const nextIndex = (avatarIndex + 1) % assets.avatars.list.length;
    api.updatePlayerAvatar(player.id, nextIndex).then(() => {
      refresh();
    }).catch(() => {});
  };

  const handleNameChange = () => {
    if (!newName.trim()) { setEditingName(false); return; }
    api.updatePlayerName(player.id, newName.trim()).then(() => {
      refresh();
      setEditingName(false);
    }).catch(() => {});
  };

  return (
    <div className="top-bar-new">
      {/* 左侧：头像 + 信息（木制背景） */}
      <div className="topbar-left" onClick={() => setShowProfile(!showProfile)} style={{ cursor: 'pointer' }}>
        <div className="topbar-avatar" style={frame ? { border: frame.border, boxShadow: frame.shadow } : {}}>
          <span className="topbar-avatar-emoji">{avatarEmoji}</span>
        </div>
        <div className="topbar-info">
          <div className="topbar-name">{player.name}</div>
          <div className="topbar-level">
            <span>Lv.{player.level}</span>
            <div className="topbar-exp-bar">
              <div className="topbar-exp-fill" style={{ width: `${expPercent}%` }} />
            </div>
            <span className="topbar-exp-text">{player.currentExp}/{player.nextLevelExp}</span>
          </div>
        </div>
      </div>

      {/* 右侧：时间 + 睡觉 + 设置 */}
      <div className="topbar-right">
        <div className="topbar-time">
          {time && (
            <>
              <span>{time.seasonEmoji}</span>
              <span>{t(time.season, lang)} {t('day', lang, { n: time.day })}</span>
              <span>{assets.time.clock} {time.timeStr}</span>
            </>
          )}
        </div>
        <div className="sleep-wrapper">
          <button className="btn btn-small btn-primary" onClick={() => setShowSleepMenu(!showSleepMenu)}>
            {assets.btn.sleep} {t('sleep', lang)}
          </button>
          {showSleepMenu && (
            <div className="sleep-dropdown">
              <div className="sleep-dropdown-title">{t('sleepHours', lang)}</div>
              {[1, 2, 4, 6, 8, 12, 24].map(h => (
                <div
                  key={h}
                  className={`sleep-option ${sleepHours === h ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setSleepHours(h); }}
                >
                  {h} {t('hour', lang)}
                </div>
              ))}
              <button className="btn btn-small btn-gold sleep-confirm" onClick={handleSleep}>
                {t('sleepConfirm', lang)}
              </button>
            </div>
          )}
        </div>
        <button className="btn btn-small" onClick={onOpenSettings}>
          ⚙️
        </button>
      </div>

      {/* 头像悬浮框：人物信息 */}
      {showProfile && (
        <div className="profile-popup" ref={profileRef}>
          <div className="profile-popup-header">
            <div className="profile-popup-avatar" style={frame ? { border: frame.border, boxShadow: frame.shadow } : {}} onClick={(e) => { e.stopPropagation(); handleAvatarChange(); }} title={t('changeAvatar', lang)}>
              <span>{avatarEmoji}</span>
              <div className="profile-popup-avatar-hint">🔄</div>
            </div>
            <div style={{ flex: 1 }}>
              {editingName ? (
                <div className="profile-name-edit">
                  <input
                    className="profile-name-input"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameChange()}
                    autoFocus
                    maxLength={12}
                  />
                  <button className="btn btn-small btn-gold" onClick={handleNameChange}>✓</button>
                  <button className="btn btn-small" onClick={() => setEditingName(false)}>✕</button>
                </div>
              ) : (
                <div className="profile-popup-name" onClick={(e) => { e.stopPropagation(); setNewName(player.name); setEditingName(true); }} title={t('changeName', lang)}>
                  {player.name} ✏️
                </div>
              )}
              <div className="profile-popup-title">
                {(() => {
                  const titles = t('titles', lang);
                  return titles[Math.min(player.level - 1, titles.length - 1)];
                })()}
              </div>
              <div className="profile-popup-level">Lv.{player.level}</div>
            </div>
          </div>
          <div className="profile-popup-stats">
            <div className="profile-popup-stat">
              <span>{assets.stat.exp} {t('experience', lang)}</span>
              <span>{player.currentExp}/{player.nextLevelExp}</span>
            </div>
            <div className="profile-popup-stat">
              <span>{assets.stat.gold} {t('gold', lang)}</span>
              <span>{player.gold}</span>
            </div>
            <div className="profile-popup-stat">
              <span>{assets.stat.farmLevel} {t('farmLevel', lang)}</span>
              <span>Lv.{player.farm_level}</span>
            </div>
            <div className="profile-popup-stat">
              <span>{assets.stat.farmSize} {t('farmSize', lang)}</span>
              <span>{player.max_farm_rows}×{player.max_farm_cols}</span>
            </div>
          </div>
          {frame && (
            <div className="profile-popup-frame">{frame.name}</div>
          )}
        </div>
      )}
    </div>
  );
}
