import React, { useState, useRef, useEffect } from 'react';
import { t } from '../services/i18n';
import assets from '../config/assets';
import * as api from '../services/api';

export default function TopBar({ player, time, onSleep, onOpenSettings, lang, refresh }) {
  const [showProfile, setShowProfile] = useState(false);
  const [sleepHours, setSleepHours] = useState(8);
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [avatarFrames, setAvatarFrames] = useState([]);
  const [currentFrame, setCurrentFrame] = useState(null);
  const [manaInfo, setManaInfo] = useState({ mana: 0, maxMana: 50 });
  const profileRef = useRef(null);

  if (!player) return null;

  const expPercent = player.nextLevelExp > 0
    ? Math.min(100, (player.currentExp / player.nextLevelExp) * 100)
    : 0;

  const avatarIndex = (player.avatar_index || 0) % assets.avatars.list.length;
  const avatarEmoji = assets.avatars.list[avatarIndex];

  // 加载头像框数据
  useEffect(() => {
    if (!player) return;
    // 获取已解锁的头像框列表
    api.getAvatarFrames(player.level).then(list => {
      setAvatarFrames(list || []);
    }).catch(() => {});
    // 获取当前佩戴的头像框详情
    if (player.avatar_frame) {
      api.getAvatarFrameById(player.avatar_frame).then(f => {
        setCurrentFrame(f || null);
      }).catch(() => {});
    } else {
      setCurrentFrame(null);
    }
    // 获取法力信息
    api.getPlayerMana(player.id).then(m => {
      setManaInfo(m || { mana: 0, maxMana: 50 });
    }).catch(() => {});
  }, [player?.level, player?.avatar_frame, player?.mana]);

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
    const nextIndex = ((player.avatar_index || 0) + 1) % assets.avatars.list.length;
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

  const handleFrameChange = (frameId) => {
    api.updatePlayer(player.id, { avatar_frame: frameId || null }).then(() => {
      refresh();
    }).catch(() => {});
  };

  // 头像框图片渲染
  const renderFrameImage = (frame, size = 38) => {
    if (!frame || !frame.image_url) return null;
    return (
      <img
        src={frame.image_url}
        alt={frame.name}
        className="avatar-frame-img"
        style={{ width: size + 8, height: size + 8 }}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    );
  };

  return (
    <div className="top-bar-new">
      {/* 左侧：头像 + 信息（木制背景） */}
      <div className="topbar-left" onClick={() => setShowProfile(!showProfile)} style={{ cursor: 'pointer' }}>
        <div className="topbar-avatar-wrap">
          {renderFrameImage(currentFrame, 38)}
          <div className="topbar-avatar">
            <span className="topbar-avatar-emoji">{avatarEmoji}</span>
          </div>
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
          <div className="topbar-mana">
            <span>💧</span>
            <div className="topbar-mana-bar">
              <div className="topbar-mana-fill" style={{ width: `${manaInfo.maxMana > 0 ? (manaInfo.mana / manaInfo.maxMana * 100) : 0}%` }} />
            </div>
            <span className="topbar-mana-text">{manaInfo.mana}/{manaInfo.maxMana}</span>
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
            <div className="profile-popup-avatar-wrap" onClick={(e) => { e.stopPropagation(); handleAvatarChange(); }} title={t('changeAvatar', lang)}>
              {renderFrameImage(currentFrame, 40)}
              <div className="profile-popup-avatar">
                <span>{avatarEmoji}</span>
              </div>
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
          {/* 头像框选择器 */}
          <div className="profile-frame-selector">
            <div className="profile-frame-title">{t('avatarFrame', lang)}</div>
            <div className="profile-frame-list">
              {/* 不戴选项 */}
              <div
                className={`profile-frame-option ${!player.avatar_frame ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleFrameChange(null); }}
              >
                <div className="profile-frame-preview no-frame">✕</div>
                <span>{t('noFrame', lang)}</span>
              </div>
              {avatarFrames.map(f => (
                <div
                  key={f.id}
                  className={`profile-frame-option ${player.avatar_frame === f.id ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleFrameChange(f.id); }}
                >
                  <div className="profile-frame-preview">
                    <img src={f.image_url} alt={f.name} className="avatar-frame-img" style={{ width: 28, height: 28 }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  </div>
                  <span>{f.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
