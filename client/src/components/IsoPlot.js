import React from 'react';
import assets from '../config/assets';

/**
 * 斜视角单块农田组件
 * 格子本体应用 skew(-44deg)，内部 emoji 反向 skew 恢复直立 + 影子
 */
export default function IsoPlot({ plot, emoji, isAnimating, onClick, zIndex }) {
  const { is_watered, is_ready, crop_id, growth_stage, row_idx, col_idx } = plot;

  // 已种植但未浇水 → dry（发干状态）
  const isDry = crop_id && !is_watered && !is_ready;

  return (
    <div
      className={`iso-plot ${is_watered ? 'watered' : ''} ${is_ready ? 'ready' : ''} ${isDry ? 'dry' : ''} ${isAnimating ? 'plot-animating' : ''}`}
      style={{
        zIndex,
        backgroundImage: 'url(/plot.png)',
      }}
      onClick={onClick}
      title={`[${row_idx}, ${col_idx}] ${crop_id || ''}`}
    >
      {crop_id ? (
        <>
          <span className="iso-plot-emoji">{emoji}</span>
          {is_watered && <span className="iso-plot-water">{assets.plot.waterIndicator}</span>}
          {!is_ready && <span className="iso-plot-stage">{growth_stage + 1}/4</span>}
        </>
      ) : (
        <span className="iso-plot-empty">{assets.crop.emptyPlot}</span>
      )}
    </div>
  );
}
