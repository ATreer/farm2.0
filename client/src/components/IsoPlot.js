import React, { useEffect, useRef, useState } from 'react';
import assets from '../config/assets';

/**
 * 斜视角单块农田组件
 * 格子本体应用 skew(-44deg)，内部 emoji 反向 skew 恢复直立 + 影子
 * 成熟时通过 Phaser 粒子引擎发射持续飞舞效果
 * 非种子阶段通过 Phaser tween 实现上半部分摇晃动画
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

export default function IsoPlot({ plot, emoji, isAnimating, emitParticle, phaserScene, zIndex }) {
  const { is_watered, is_ready, crop_id, growth_stage, row_idx, col_idx } = plot;
  const plotRef = useRef(null);
  const readyKeyRef = useRef(null);
  const swayTweenRef = useRef(null);
  const swayImageRef = useRef(null);
  const [imgError, setImgError] = useState(false);
  const [showDropSeed, setShowDropSeed] = useState(false);

  // 播种动画：先显示种子粒下落，落地后切换为种子阶段图片
  useEffect(() => {
    if (isAnimating && crop_id) {
      setShowDropSeed(true);
      const timer = setTimeout(() => setShowDropSeed(false), 500);
      return () => clearTimeout(timer);
    } else {
      setShowDropSeed(false);
    }
  }, [isAnimating, crop_id]);

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

  // Phaser 摇晃动画：上半部分摇晃，下半部分不动
  useEffect(() => {
    if (!phaserScene || !crop_id || growth_stage === 0 || !plotRef.current) return;

    const el = plotRef.current;
    const imgEl = el.querySelector('.iso-plot-img');
    if (!imgEl) return;

    // 等待图片加载完成
    const startSway = () => {
      const rect = imgEl.getBoundingClientRect();
      const imgW = rect.width;
      const imgH = rect.height;
      const cx = rect.left + imgW / 2;
      const cy = rect.top + imgH / 2;

      // 清理旧的
      if (swayImageRef.current) {
        swayImageRef.current.destroy();
        swayImageRef.current = null;
      }
      if (swayTweenRef.current) {
        swayTweenRef.current.stop();
        swayTweenRef.current = null;
      }

      try {
        const scene = phaserScene;
        if (!scene || !scene.scene.isActive()) return;

        // 加载图片纹理（如果还没加载）
        const texKey = `sway_${crop_id}_${growth_stage}`;
        if (!scene.textures.exists(texKey)) {
          // 用 Image 对象加载
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = getStageImagePath(crop_id, growth_stage);
          img.onload = () => {
            if (!scene.textures.exists(texKey)) {
              scene.textures.addImage(texKey, img);
            }
            createSwayImage(scene, texKey, cx, cy, imgW, imgH);
          };
          img.onerror = () => {};
        } else {
          createSwayImage(scene, texKey, cx, cy, imgW, imgH);
        }
      } catch {}
    };

    const createSwayImage = (scene, texKey, cx, cy, imgW, imgH) => {
      if (!scene || !scene.scene.isActive()) return;

      // 创建完整图片（底层，不动）
      const bottomImg = scene.add.image(cx, cy, texKey);
      bottomImg.setDisplaySize(imgW, imgH);
      bottomImg.setDepth(-1);
      bottomImg.setAlpha(0); // 透明，因为 DOM 图片仍然显示

      // 创建上半部分图片（摇晃层）
      const topImg = scene.add.image(cx, cy - imgH * 0.25, texKey);
      topImg.setDisplaySize(imgW, imgH);
      topImg.setCrop(0, 0, imgW, imgH * 0.5); // 只显示上半部分
      topImg.setOrigin(0.5, 1); // origin 在底部中心
      topImg.setDepth(1);
      topImg.setAlpha(0); // 透明

      // 用 tween 做摇晃动画
      const duration = 2000 + Math.random() * 1500;
      const angle = 2 + Math.random() * 2;
      const tween = scene.tweens.add({
        targets: topImg,
        angle: angle,
        duration: duration,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      swayImageRef.current = { bottom: bottomImg, top: topImg };
      swayTweenRef.current = tween;
    };

    if (imgEl.complete && imgEl.naturalWidth > 0) {
      startSway();
    } else {
      imgEl.addEventListener('load', startSway, { once: true });
    }

    return () => {
      if (swayTweenRef.current) {
        try { swayTweenRef.current.stop(); } catch {}
        swayTweenRef.current = null;
      }
      if (swayImageRef.current) {
        try {
          if (swayImageRef.current.bottom) swayImageRef.current.bottom.destroy();
          if (swayImageRef.current.top) swayImageRef.current.top.destroy();
        } catch {}
        swayImageRef.current = null;
      }
    };
  }, [phaserScene, crop_id, growth_stage]);

  // 渲染作物图标
  const renderCropIcon = () => {
    if (!crop_id) return null;

    // 播种动画：显示种子粒下落
    if (showDropSeed) {
      return (
        <span className="iso-plot-emoji stage-seed plot-seed-dropping">
          <img
            src="/seed_wheat.png"
            alt="seed"
            className="iso-plot-img iso-plot-img-seed-drop"
          />
        </span>
      );
    }

    const imgSrc = getStageImagePath(crop_id, growth_stage);
    // 阶段class：stage-seed / stage-sprout / stage-growing / stage-bloom / stage-ready
    let stageClass = '';
    if (growth_stage === 0) stageClass = 'stage-seed';
    else if (growth_stage === 1) stageClass = 'stage-sprout';
    else if (growth_stage === 2) stageClass = 'stage-growing';
    else if (is_ready) stageClass = 'stage-ready';
    else stageClass = 'stage-bloom';

    return (
      <span className={`iso-plot-emoji ${stageClass}`}>
        <img
          src={imgSrc}
          alt={crop_id}
          className="iso-plot-img"
          onError={(e) => { e.currentTarget.style.display = 'none'; setImgError(true); }}
          onLoad={(e) => { e.currentTarget.style.display = ''; setImgError(false); }}
        />
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
