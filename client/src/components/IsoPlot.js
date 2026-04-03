import React, { useEffect, useRef, useState } from 'react';
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

// 阶段图片路径映射：seed → seedling → large-leaved → bloom → mature
const STAGE_DIRS = ['seed', 'seedling', 'large-leaved', 'bloom', 'mature'];

function getStageImagePath(cropId, growthStage) {
  const dir = STAGE_DIRS[Math.min(growthStage, STAGE_DIRS.length - 1)];
  // seed阶段所有作物共用一张图片
  if (growthStage === 0) return '/seed/init_seed.png';
  return `/${dir}/${cropId}.png`;
}

export default function IsoPlot({ plot, emoji, isAnimating, emitParticle, zIndex }) {
  const { is_watered, is_ready, crop_id, growth_stage, row_idx, col_idx } = plot;
  const plotRef = useRef(null);
  const readyKeyRef = useRef(null);
  const [imgError, setImgError] = useState(false);

  // 干旱逻辑：已种植、未浇水、未成熟，且伪随机概率 40% 触发
  const isDry = crop_id && !is_watered && !is_ready && hashStr(plot.id) < 0.4;

  // 成熟时持续发射 Phaser 粒子
  useEffect(() => {
    if (!is_ready || !emitParticle || !plotRef.current) return;

    const el = plotRef.current;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.4;

    readyKeyRef.current = emitParticle('ready', cx, cy);

    const interval = setInterval(() => {
      if (!plotRef.current) return;
      const r = plotRef.current.getBoundingClientRect();
      emitParticle('ready', r.left + r.width / 2, r.top + r.height * 0.4);
    }, 3000);

    return () => clearInterval(interval);
  }, [is_ready, emitParticle]);

  // 渲染作物图标：优先用阶段图片，失败则回退 emoji
  const renderCropIcon = () => {
    if (!crop_id) return null;

    const imgSrc = getStageImagePath(crop_id, growth_stage);
    // 种子阶段不播放摇晃动画
    const noSway = growth_stage === 0;
    // 阶段class：stage-seed / stage-growing
    const stageClass = growth_stage === 0 ? 'stage-seed' : 'stage-growing';

    return (
      <span className={`iso-plot-emoji ${stageClass}`} style={noSway ? { animation: 'none' } : {}}>
        <img
          src={imgSrc}
          alt={crop_id}
          className="iso-plot-img"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            setImgError(true);
          }}
          onLoad={(e) => {
            e.currentTarget.style.display = '';
            setImgError(false);
          }}
        />
        {/* 图片加载失败时回退 emoji */}
        {imgError && <span className="iso-plot-emoji-fallback">{emoji}</span>}
      </span>
    );
  };

  return (
    <div
      ref={plotRef}
      className={`iso-plot ${isDry ? 'dry' : ''} ${isAnimating ? 'plot-animating' : ''}`}
      style={{
        zIndex,
        backgroundImage: 'url(/plot.png)',
      }}
      onClick
      title={`[${row_idx}, ${col_idx}] ${crop_id || ''}`}
    >
      {crop_id ? (
        <>
          {renderCropIcon()}
          {!is_ready && <span className="iso-plot-stage">{growth_stage + 1}/{plot.stages || 4}</span>}
        </>
      ) : (
        <span className="iso-plot-empty">{assets.crop.emptyPlot}</span>
      )}
    </div>
  );
}
