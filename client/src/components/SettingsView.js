import React, { useState } from 'react';
import { t } from '../services/i18n';
import assets from '../config/assets';
import * as api from '../services/api';

const SCALE_TARGET_OPTIONS = [
  { key: 'buttons', labelKey: 'scaleButtons' },
  { key: 'avatar',  labelKey: 'scaleAvatar' },
  { key: 'fonts',   labelKey: 'scaleFonts' },
  { key: 'popups',  labelKey: 'scalePopups' },
  { key: 'nav',     labelKey: 'scaleNav' },
];

export default function SettingsView({ lang, setLang, notify, playerId, uiScale, setUiScale, scaleTargets, setScaleTargets }) {
  const [localScale, setLocalScale] = useState(uiScale);
  const [localTargets, setLocalTargets] = useState(scaleTargets);
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

  const handleTargetToggle = (key) => {
    const next = { ...localTargets, [key]: !localTargets[key] };
    setLocalTargets(next);
    setScaleTargets(next);
  };

  const handleScaleSave = async () => {
    if (!playerId) return;
    setSaving(true);
    try {
      await api.setPlayerSetting(playerId, 'ui_scale', localScale.toString());
      await api.setPlayerSetting(playerId, 'scale_targets', JSON.stringify(localTargets));
      notify(lang === 'zh' ? '缩放设置已保存' : 'Scale settings saved', 'success');
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
          <div className="settings-scale-area">
            <div className="settings-scale-control">
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
            <div className="scale-targets">
              {SCALE_TARGET_OPTIONS.map(opt => (
                <label key={opt.key} className="scale-target-item">
                  <input
                    type="checkbox"
                    checked={!!localTargets[opt.key]}
                    onChange={() => handleTargetToggle(opt.key)}
                  />
                  <span>{t(opt.labelKey, lang)}</span>
                </label>
              ))}
            </div>
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
              <span>{t('landQuality', lang)}</span>
              <span>{t('effect', lang)}</span>
              <span>{t('reqLevel', lang)}</span>
            </div>
            <div className="upgrade-info-row"><span>Lv.1</span><span>{t('normalLand', lang)}</span><span>{t('normalLandDesc', lang)}</span><span>1</span></div>
            <div className="upgrade-info-row"><span>Lv.10</span><span>{t('premiumLand', lang)}</span><span>{t('premiumLandDesc', lang)}</span><span>10</span></div>
            <div className="upgrade-info-row"><span>Lv.20</span><span>{t('epicLand', lang)}</span><span>{t('epicLandDesc', lang)}</span><span>20</span></div>
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
