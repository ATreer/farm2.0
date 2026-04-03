import React from 'react';
import assets from '../config/assets';

/**
 * 斜视角单块农田组件
 * 格子本体应用 skew(-44deg)，内部 emoji 反向 skew 恢复直立 + 影子
 */

// 简单哈希：基于字符串生成 0~1 的伪随机数
function hashStr(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 100) / 100;
}

export default function IsoPlot({ plot, emoji, isAnimating, onClick, zIndex }) {
  const { is_watered, is_ready, crop_id, growth_stage, row_idx, col_idx } = plot;

  // 干旱逻辑：已种植、未浇水、未成熟，且伪随机概率 40% 触发
  const isDry = crop_id && !is_watered && !is_ready && hashStr(plot.id) < 0.4;

  return (
    <div
      className={`iso-plot ${is_ready ? 'ready' : ''} ${isDry ? 'dry' : ''} ${isAnimating ? 'plot-animating' : ''}`}
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
