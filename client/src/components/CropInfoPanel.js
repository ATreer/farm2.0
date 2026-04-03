import React from 'react';
import { t } from '../services/i18n';
import assets from '../config/assets';
import * as api from '../services/api';

export default function CropInfoPanel({ selectedCrop, selectedPlot, lang, onClose, playerId, reload }) {
  if (!selectedCrop || !selectedPlot?.crop_id) return null;

  const currentStage = selectedPlot.growth_stage;
  const maxStage = selectedCrop.stages - 1;

  const handleSetStage = async (targetStage) => {
    try {
      await api.setPlotStage(playerId, selectedPlot.row_idx, selectedPlot.col_idx, targetStage);
      reload();
    } catch (e) {
      console.error('setStage error:', e);
    }
  };

  return (
    <div className="farm-sidebar">
      <div className="crop-info-panel">
        <div className="crop-info-header">
          <span className="crop-info-emoji">{selectedCrop.emoji_ready}</span>
          <div style={{ flex: 1 }}>
            <div className="crop-info-name">{selectedCrop.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              {t('position', lang)} [{selectedPlot.row_idx}, {selectedPlot.col_idx}]
            </div>
          </div>
          <button className="crop-info-close" onClick={onClose}>✕</button>
        </div>
        <div className="crop-info-stats">
          <div className="crop-stat">
            <span className="crop-stat-label">{assets.stat.growTime} {t('growTime', lang)}</span>
            <span className="crop-stat-value">{selectedCrop.grow_time}{t('second', lang)}</span>
          </div>
          <div className="crop-stat">
            <span className="crop-stat-label">{assets.stat.growStage} {t('growStage', lang)}</span>
            <span className="crop-stat-value">{currentStage + 1}/{selectedCrop.stages}</span>
          </div>
          <div className="crop-stat">
            <span className="crop-stat-label">{assets.stat.sellPrice} {t('sellPrice', lang)}</span>
            <span className="crop-stat-value">{selectedCrop.sell_price}</span>
          </div>
          <div className="crop-stat">
            <span className="crop-stat-label">{assets.stat.expReward} {t('expReward', lang)}</span>
            <span className="crop-stat-value">{selectedCrop.exp_reward}</span>
          </div>
          <div className="crop-stat">
            <span className="crop-stat-label">{assets.stat.waterStatus} {t('waterStatus', lang)}</span>
            <span className="crop-stat-value">{selectedPlot.is_watered ? t('wateredYes', lang) : t('wateredNo', lang)}</span>
          </div>
          <div className="crop-stat">
            <span className="crop-stat-label">{assets.stat.readyStatus} {t('readyStatus', lang)}</span>
            <span className="crop-stat-value">{selectedPlot.is_ready ? t('readyYes', lang) : t('readyNo', lang)}</span>
          </div>
        </div>
        <div className="crop-growth-process">
          {selectedCrop.emoji_seed} → {selectedCrop.emoji_sprout} → {selectedCrop.emoji_growing} → {selectedCrop.emoji_ready}
        </div>
        {/* 测试按钮：跳到下一阶段 */}
        <div className="crop-test-actions">
          <span className="crop-test-label">🧪 {t('testStage', lang)}</span>
          <button
            className="btn btn-small btn-primary"
            disabled={currentStage >= maxStage}
            onClick={() => handleSetStage(currentStage + 1)}
          >
            {currentStage >= maxStage ? t('maxStage', lang) : `${t('nextStage', lang)} (${currentStage + 2}/${selectedCrop.stages})`}
          </button>
        </div>
      </div>
    </div>
  );
}
