import React from 'react';
import { t } from '../services/i18n';
import assets from '../config/assets';

export default function CropInfoPanel({ selectedCrop, selectedPlot, lang }) {
  if (!selectedCrop || !selectedPlot?.crop_id) return null;

  return (
    <div className="farm-sidebar">
      <div className="crop-info-panel">
        <div className="crop-info-header">
          <span className="crop-info-emoji">{selectedCrop.emoji_ready}</span>
          <div>
            <div className="crop-info-name">{selectedCrop.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              {t('position', lang)} [{selectedPlot.row_idx}, {selectedPlot.col_idx}]
            </div>
          </div>
        </div>
        <div className="crop-info-stats">
          <div className="crop-stat">
            <span className="crop-stat-label">{assets.stat.growTime} {t('growTime', lang)}</span>
            <span className="crop-stat-value">{selectedCrop.grow_time}{t('second', lang)}</span>
          </div>
          <div className="crop-stat">
            <span className="crop-stat-label">{assets.stat.growStage} {t('growStage', lang)}</span>
            <span className="crop-stat-value">{selectedPlot.growth_stage + 1}/{selectedCrop.stages}</span>
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
      </div>
    </div>
  );
}
