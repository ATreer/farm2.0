import React, { useState, useEffect, useRef } from 'react';
import assets from '../config/assets';
import { t } from '../services/i18n';

/**
 * 种子选择悬浮框
 * 在点击位置附近弹出，支持拖拽到农田
 */
export default function SeedPanel({ seeds, cropsMap, visible, position, onClose, onPlant, lang }) {
  const [draggingSeed, setDraggingSeed] = useState(null);
  const panelRef = useRef(null);

  // 自动调整位置防止超出屏幕
  const adjustedPos = (() => {
    if (!visible) return {};
    const panelW = 240;
    const panelH = Math.min(seeds.length * 60 + 80, 400);
    let x = position.x;
    let y = position.y;
    if (x + panelW > window.innerWidth - 10) x = position.x - panelW - 16;
    if (y + panelH > window.innerHeight - 10) y = window.innerHeight - panelH - 10;
    if (y < 10) y = 10;
    return { left: x, top: y };
  })();

  // 点击外部关闭
  useEffect(() => {
    if (!visible) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => document.removeEventListener('mousedown', handler);
  }, [visible, onClose]);

  if (!visible) return null;

  const handleDragStart = (e, seed) => {
    setDraggingSeed(seed);
    e.dataTransfer.setData('text/plain', seed.item_id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="seed-popup" ref={panelRef} style={adjustedPos}>
      <div className="seed-popup-header">
        <span>{assets.panel.seed} {t('selectSeed', lang)}</span>
        <button className="seed-popup-close" onClick={onClose}>✕</button>
      </div>
      <div className="seed-popup-hint">{t('dragHint', lang)}</div>
      <div className="seed-popup-list">
        {seeds.length === 0 ? (
          <div className="seed-popup-empty">{t('noSeeds', lang)}</div>
        ) : (
          seeds.map(seed => {
            const crop = cropsMap[seed.item_id];
            return (
              <div
                key={seed.item_id}
                className={`seed-item ${draggingSeed?.item_id === seed.item_id ? 'dragging' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, seed)}
                onDragEnd={() => setDraggingSeed(null)}
                onClick={() => onPlant(seed.item_id)}
              >
                <span className="seed-item-emoji">
                  {seed.item_id === 'seed_wheat' ? (
                    <img src="/seed_wheat.png" alt={seed.name} style={{ width: 26, height: 26, objectFit: 'contain' }} />
                  ) : (
                    seed.emoji
                  )}
                </span>
                <div className="seed-item-info">
                  <div className="seed-item-name">{seed.name}</div>
                  {crop && <div className="seed-item-detail">{crop.grow_time}{t('second', lang)}</div>}
                </div>
                <span className="seed-item-count">×{seed.quantity}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
