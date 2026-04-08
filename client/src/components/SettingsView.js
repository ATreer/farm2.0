import React, { useState, useEffect } from 'react';
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
  const [techniques, setTechniques] = useState([]);
  const [skills, setSkills] = useState([]);
  const [upgrading, setUpgrading] = useState(false);

  // 加载功法和技能数据
  useEffect(() => {
    if (!playerId) return;
    api.getPlayerTechniques(playerId).then(list => setTechniques(list || [])).catch(() => {});
    api.getPlayerSkills(playerId).then(list => setSkills(list || [])).catch(() => {});
  }, [playerId, upgrading]);

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

  const handleUpgradeTechnique = async (techId) => {
    setUpgrading(true);
    try {
      await api.upgradeTechnique(playerId, techId);
      notify(lang === 'zh' ? '功法升级成功！' : 'Technique upgraded!', 'success');
    } catch (e) {
      notify(e.message, 'error');
    }
    setUpgrading(false);
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

        {/* 功法 */}
        <div className="settings-item">
          <div className="settings-info">
            <div className="settings-label">🧘 {t('technique', lang)}</div>
            <div className="settings-desc">{t('techniqueUpgrade', lang)}</div>
          </div>
          <div className="technique-list">
            {techniques.map(tech => (
              <div key={tech.technique_id} className="technique-card">
                <div className="technique-header">
                  <span className="technique-name">{tech.technique_name}</span>
                  <span className="technique-lv">Lv.{tech.level}/{tech.max_level}</span>
                </div>
                <div className="technique-stats">
                  <span>💧 {t('manaBonus', lang)}: +{tech.mana_bonus_percent}%</span>
                  <span>📖 {t('expRequired', lang)}: {tech.next_level_exp || '-'}</span>
                  <span>⭐ EXP: {tech.exp}</span>
                </div>
                {tech.level < tech.max_level && (
                  <button className="btn btn-small btn-gold" onClick={() => handleUpgradeTechnique(tech.technique_id)} disabled={upgrading}>
                    {upgrading ? '...' : `⬆ ${t('techniqueUpgrade', lang)}`}
                  </button>
                )}
                {tech.level >= tech.max_level && (
                  <span className="technique-max">✅ {lang === 'zh' ? '已满级' : 'Max Level'}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 技能 */}
        <div className="settings-item">
          <div className="settings-info">
            <div className="settings-label">⚡ {t('spiritRain', lang)}</div>
            <div className="settings-desc">{lang === 'zh' ? '灵雨术等级与效果' : 'Spirit Rain level & effects'}</div>
          </div>
          <div className="technique-list">
            {skills.map(skill => (
              <div key={skill.skill_id} className="technique-card">
                <div className="technique-header">
                  <span className="technique-name">{skill.skill_name}</span>
                  <span className="technique-lv">Lv.{skill.level}/{skill.max_level}</span>
                </div>
                <div className="technique-stats">
                  <span>💧 {t('mana', lang)}: {skill.mana_cost}</span>
                  <span>🌾 {lang === 'zh' ? '产量加成' : 'Yield Bonus'}: +{skill.yield_bonus}%</span>
                  <span>📖 EXP: {skill.exp}</span>
                </div>
              </div>
            ))}
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
