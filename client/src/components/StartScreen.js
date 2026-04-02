import React, { useState } from 'react';
import { t } from '../services/i18n';
import assets from '../config/assets';

export default function StartScreen({ onStart, lang }) {
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
      <div className="start-title">{assets.title.wheat} {t('appTitle', lang)} {assets.title.wheat}</div>
      <div className="start-subtitle">{t('appSubtitle', lang)}</div>
      <div className="start-character">{assets.avatars.default}</div>
      <input
        className="start-input"
        type="text"
        placeholder={t('namePlaceholder', lang)}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={12}
      />
      <button className="btn btn-primary start-btn" onClick={handleStart}>
        {t('startBtn', lang)}
      </button>
      <div className="start-tips">
        {t('startTips', lang)}
      </div>
    </div>
  );
}
