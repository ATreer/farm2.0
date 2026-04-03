import React from 'react';
import assets from '../config/assets';

/**
 * 斜视角单块农田组件
 * 每块农田应用 skew(-44deg) 变换，并通过 translate 补偿偏移
 */
export default function IsoPlot({ plot, emoji, isAnimating, onClick, zIndex }) {
  const { is_watered, is_ready, crop_id, growth_stage, row_idx, col_idx } = plot;

  return (
    <div
      className={`iso-plot ${is_watered ? 'watered' : ''} ${is_ready ? 'ready' : ''} ${isAnimating ? 'plot-animating' : ''}`}
      style={{ zIndex }}
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
