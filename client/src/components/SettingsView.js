import React from 'react';
import { t } from '../services/i18n';
import assets from '../config/assets';

export default function SettingsView({ lang, setLang, notify }) {
  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem('farmLang', newLang);
    notify(newLang === 'zh' ? '已切换为中文' : 'Switched to English', 'success');
  };

  const handleReset = () => {
    if (window.confirm(t('resetConfirm', lang))) {
      localStorage.removeItem('farmPlayerId');
      localStorage.removeItem('farmLang');
      window.location.reload();
    }
  };

  return (
    <div className="panel">
      <div className="panel-title">{assets.panel.settings} {t('settings', lang)}</div>

      <div className="settings-list">
        {/* 语言设置 */}
        <div className="settings-item">
          <div className="settings-info">
            <div className="settings-label">{assets.settings.language} {t('language', lang)}</div>
            <div className="settings-desc">{t('languageDesc', lang)}</div>
          </div>
          <div className="settings-control">
            <button
              className={`btn btn-small ${lang === 'zh' ? 'btn-gold' : ''}`}
              onClick={() => handleLangChange('zh')}
            >
              {t('chinese', lang)}
            </button>
            <button
              className={`btn btn-small ${lang === 'en' ? 'btn-gold' : ''}`}
              onClick={() => handleLangChange('en')}
            >
              {t('english', lang)}
            </button>
          </div>
        </div>

        {/* 重置数据 */}
        <div className="settings-item">
          <div className="settings-info">
            <div className="settings-label">{assets.settings.reset} {t('resetData', lang)}</div>
            <div className="settings-desc">{t('resetDataDesc', lang)}</div>
          </div>
          <div className="settings-control">
            <button className="btn btn-small btn-primary" onClick={handleReset}>
              {t('resetData', lang)}
            </button>
          </div>
        </div>

        {/* 关于 */}
        <div className="settings-item">
          <div className="settings-info">
            <div className="settings-label">{assets.settings.about} {t('about', lang)}</div>
            <div className="settings-desc">{t('aboutDesc', lang)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
