import React, { useEffect, useRef } from 'react';
import assets from '../config/assets';

/**
 * 斜视角单块农田组件
 * 格子本体应用 skew(-44deg)，内部 emoji 反向 skew 恢复直立 + 影子
 * 成熟时通过 Phaser 粒子引擎发射持续飞舞效果
 */

// 简单哈希：基于字符串生成 0~1 的伪随机数
function hashStr(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 100) / 100;
}

export default function IsoPlot({ plot, emoji, isAnimating, onClick, emitParticle, zIndex }) {
  const { is_watered, is_ready, crop_id, growth_stage, row_idx, col_idx } = plot;
  const plotRef = useRef(null);
  const readyKeyRef = useRef(null);

  // 干旱逻辑：已种植、未浇水、未成熟，且伪随机概率 40% 触发
  const isDry = crop_id && !is_watered && !is_ready && hashStr(plot.id) < 0.4;

  // 成熟时持续发射 Phaser 粒子
  useEffect(() => {
    if (!is_ready || !emitParticle || !plotRef.current) return;

    const el = plotRef.current;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.4;

    // 首次发射
    readyKeyRef.current = emitParticle('ready', cx, cy);

    // 持续发射（每3秒刷新一次位置，适应滚动/缩放）
    const interval = setInterval(() => {
      if (!plotRef.current) return;
      const r = plotRef.current.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height * 0.4;
      emitParticle('ready', x, y);
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [is_ready, emitParticle]);

  return (
    <div
      ref={plotRef}
      className={`iso-plot ${isDry ? 'dry' : ''} ${isAnimating ? 'plot-animating' : ''}`}
      style={{
        zIndex,
        backgroundImage: 'url(/plot.png)',
      }}
      onClick={onClick}
      title={`[${row_idx}, ${col_idx}] ${crop_id || ''}`}
    >
      {crop_id ? (
        <>
          <span className="iso-plot-emoji">
            {growth_stage === 1 ? (
              <img src="/seedling.png" alt="seedling" className="iso-plot-img" />
            ) : (
              emoji
            )}
          </span>
          {!is_ready && <span className="iso-plot-stage">{growth_stage + 1}/4</span>}
        </>
      ) : (
        <span className="iso-plot-empty">{assets.crop.emptyPlot}</span>
      )}
    </div>
  );
}
