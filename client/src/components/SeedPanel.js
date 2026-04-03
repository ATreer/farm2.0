import React, { useState } from 'react';
import assets from '../config/assets';
import { t } from '../services/i18n';

/**
 * 右侧弹出种子选择面板
 * 支持拖拽种子到农田进行批量种植
 */
export default function SeedPanel({ seeds, cropsMap, visible, onClose, onPlant, lang }) {
  const [draggingSeed, setDraggingSeed] = useState(null);

  if (!visible) return null;

  const handleDragStart = (e, seed) => {
    setDraggingSeed(seed);
    e.dataTransfer.setData('text/plain', seed.item_id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setDraggingSeed(null);
  };

  const handleSeedClick = (seed) => {
    onPlant(seed.item_id);
  };

  return (
    <div className="seed-panel-overlay" onClick={onClose}>
      <div className="seed-panel" onClick={(e) => e.stopPropagation()}>
        <div className="seed-panel-header">
          <span>{assets.panel.seed} {t('selectSeed', lang)}</span>
          <button className="seed-panel-close" onClick={onClose}>✕</button>
        </div>
        <div className="seed-panel-hint">
          {t('dragHint', lang)}
        </div>
        <div className="seed-panel-list">
          {seeds.length === 0 ? (
            <div className="seed-panel-empty">{t('noSeeds', lang)}</div>
          ) : (
            seeds.map(seed => {
              const crop = cropsMap[seed.item_id];
              return (
                <div
                  key={seed.item_id}
                  className={`seed-item ${draggingSeed?.item_id === seed.item_id ? 'dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, seed)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleSeedClick(seed)}
                >
                  <span className="seed-item-emoji">
                    {seed.item_id === 'seed_wheat' ? (
                      <img src="/seed_wheat.png" alt={seed.name} style={{ width: 28, height: 28, objectFit: 'contain' }} />
                    ) : (
                      seed.emoji
                    )}
                  </span>
                  <div className="seed-item-info">
                    <div className="seed-item-name">{seed.name}</div>
                    <div className="seed-item-detail">
                      {crop ? `${t('growTime', lang)}: ${crop.grow_time}${t('second', lang)}` : ''}
                    </div>
                  </div>
                  <span className="seed-item-count">×{seed.quantity}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
