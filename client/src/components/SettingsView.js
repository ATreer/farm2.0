import React, { useState } from 'react';
import { t } from '../services/i18n';
import assets from '../config/assets';
import * as api from '../services/api';

export default function SettingsView({ lang, setLang, notify, playerId, uiScale, setUiScale }) {
  const [localScale, setLocalScale] = useState(uiScale);
  const [saving, setSaving] = useState(false);

  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem('farmLang', newLang);
    notify(newLang === 'zh' ? '已切换为中文' : 'Switched to English', 'success');
  };

  const handleScaleChange = (value) => {
    const scale = parseFloat(value);
    setLocalScale(scale);
    setUiScale(scale);
  };

  const handleScaleSave = async () => {
    if (!playerId) return;
    setSaving(true);
    try {
      await api.setPlayerSetting(playerId, 'ui_scale', localScale.toString());
      notify(lang === 'zh' ? '缩放比例已保存' : 'Scale saved', 'success');
    } catch {
      notify(lang === 'zh' ? '保存失败' : 'Save failed', 'error');
    }
    setSaving(false);
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
        {/* UI缩放 */}
        <div className="settings-item">
          <div className="settings-info">
            <div className="settings-label">🔍 {t('uiScale', lang)}</div>
            <div className="settings-desc">{t('uiScaleDesc', lang)}</div>
          </div>
          <div className="settings-control settings-scale-control">
            <input
              type="range"
              className="scale-slider"
              min="0.5"
              max="2"
              step="0.1"
              value={localScale}
              onChange={(e) => handleScaleChange(e.target.value)}
            />
            <span className="scale-value">{Math.round(localScale * 100)}%</span>
            <button className="btn btn-small btn-gold" onClick={handleScaleSave} disabled={saving}>
              {saving ? '...' : t('save', lang)}
            </button>
          </div>
        </div>

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

        {/* 升级说明 */}
        <div className="settings-item">
          <div className="settings-info">
            <div className="settings-label">{assets.panel.upgradeRoute} {t('upgradeInfo', lang)}</div>
            <div className="settings-desc">{t('upgradeInfoDesc', lang)}</div>
          </div>
          <div className="upgrade-info-table">
            <div className="upgrade-info-row header">
              <span>{t('level', lang)}</span>
              <span>{t('farmSize', lang)}</span>
              <span>{t('cost', lang)}</span>
              <span>{t('reqLevel', lang)}</span>
            </div>
            <div className="upgrade-info-row"><span>Lv.1</span><span>3×3</span><span>-</span><span>1</span></div>
            <div className="upgrade-info-row"><span>Lv.2</span><span>4×4</span><span>500💰</span><span>3</span></div>
            <div className="upgrade-info-row"><span>Lv.3</span><span>5×5</span><span>1500💰</span><span>5</span></div>
            <div className="upgrade-info-row"><span>Lv.4</span><span>6×6</span><span>4000💰</span><span>8</span></div>
            <div className="upgrade-info-row"><span>Lv.5</span><span>7×7</span><span>10000💰</span><span>11</span></div>
            <div className="upgrade-info-row"><span>Lv.6</span><span>8×8</span><span>25000💰</span><span>15</span></div>
          </div>
          <div className="upgrade-milestones">
            <div className="milestone-item">🏅 Lv.5 → {t('milestone5', lang)}</div>
            <div className="milestone-item">🏅 Lv.10 → {t('milestone10', lang)}</div>
            <div className="milestone-item">🏅 Lv.15 → {t('milestone15', lang)}</div>
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
