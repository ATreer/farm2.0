import Phaser from 'phaser';
import theme from '../config/theme';

const P = theme.particles;

/**
 * 粒子纹理生成器 - 程序化生成粒子纹理，无需外部资源
 * 颜色从 theme.particles 配置读取，方便替换
 */
function generateTextures(scene) {
  // 水滴粒子
  if (!scene.textures.exists('water_drop')) {
    const g = scene.make.graphics({ add: false });
    g.fillStyle(P.waterDrop.primary, 1);
    g.fillCircle(4, 4, 4);
    g.fillStyle(P.waterDrop.highlight, 0.7);
    g.fillCircle(3, 3, 2);
    g.generateTexture('water_drop', 8, 8);
    g.destroy();
  }

  // 金币粒子
  if (!scene.textures.exists('gold_coin')) {
    const g = scene.make.graphics({ add: false });
    g.fillStyle(P.goldCoin.primary, 1);
    g.fillCircle(5, 5, 5);
    g.fillStyle(P.goldCoin.highlight, 0.6);
    g.fillCircle(3, 3, 3);
    g.generateTexture('gold_coin', 10, 10);
    g.destroy();
  }

  // 星星粒子
  if (!scene.textures.exists('star')) {
    const g = scene.make.graphics({ add: false });
    g.fillStyle(P.star.primary, 1);
    g.fillCircle(3, 3, 3);
    g.fillStyle(P.star.highlight, 0.8);
    g.fillCircle(2, 2, 1.5);
    g.generateTexture('star', 6, 6);
    g.destroy();
  }

  // 绿色叶子粒子
  if (!scene.textures.exists('leaf')) {
    const g = scene.make.graphics({ add: false });
    g.fillStyle(P.leaf.primary, 1);
    g.fillEllipse(5, 3, 10, 6);
    g.generateTexture('leaf', 10, 6);
    g.destroy();
  }

  // 红色爱心粒子
  if (!scene.textures.exists('heart')) {
    const g = scene.make.graphics({ add: false });
    g.fillStyle(P.heart.primary, 1);
    g.fillCircle(3, 3, 3);
    g.fillCircle(7, 3, 3);
    g.fillTriangle(0, 5, 10, 5, 5, 10);
    g.generateTexture('heart', 10, 10);
    g.destroy();
  }

  // 经验粒子（蓝色光点）
  if (!scene.textures.exists('exp_orb')) {
    const g = scene.make.graphics({ add: false });
    g.fillStyle(P.expOrb.primary, 1);
    g.fillCircle(4, 4, 4);
    g.fillStyle(P.expOrb.highlight, 0.5);
    g.fillCircle(3, 3, 2);
    g.generateTexture('exp_orb', 8, 8);
    g.destroy();
  }

  // 泥土粒子
  if (!scene.textures.exists('dirt')) {
    const g = scene.make.graphics({ add: false });
    g.fillStyle(P.dirt.primary, 1);
    g.fillCircle(3, 3, 3);
    g.generateTexture('dirt', 6, 6);
    g.destroy();
  }

  // 闪光粒子
  if (!scene.textures.exists('sparkle')) {
    const g = scene.make.graphics({ add: false });
    g.fillStyle(P.sparkle.primary, 1);
    g.fillRect(1, 3, 4, 2);
    g.fillRect(3, 1, 2, 4);
    g.generateTexture('sparkle', 6, 6);
    g.destroy();
  }
}

class ParticleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ParticleScene' });
  }

  create() {
    generateTextures(this);
    this.particles = {};
  }

  emitEffect(type, x, y) {
    switch (type) {
      case 'water': this._emitWater(x, y); break;
      case 'harvest': this._emitHarvest(x, y); break;
      case 'plant': this._emitPlant(x, y); break;
      case 'levelup': this._emitLevelUp(x, y); break;
      case 'gold': this._emitGold(x, y); break;
      case 'exp': this._emitExp(x, y); break;
      case 'sparkle': this._emitSparkle(x, y); break;
    }
  }

  _emitWater(x, y) {
    const emitter = this.add.particles(x, y, 'water_drop', {
      speed: { min: 30, max: 80 },
      angle: { min: -120, max: -60 },
      scale: { start: 1, end: 0.2 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 600, quantity: 12, gravityY: 150,
      tint: P.waterTint,
      emitting: false,
    });
    emitter.explode(12);
    this.time.delayedCall(800, () => emitter.destroy());
  }

  _emitHarvest(x, y) {
    const goldEmitter = this.add.particles(x, y, 'gold_coin', {
      speed: { min: 50, max: 120 }, angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0.1 }, alpha: { start: 1, end: 0 },
      lifespan: 800, quantity: 15, gravityY: 100,
      tint: P.goldTint, emitting: false,
    });
    goldEmitter.explode(15);

    const starEmitter = this.add.particles(x, y, 'star', {
      speed: { min: 20, max: 60 }, angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 }, alpha: { start: 1, end: 0 },
      lifespan: 600, quantity: 10, gravityY: -30, emitting: false,
    });
    starEmitter.explode(10);

    const leafEmitter = this.add.particles(x, y, 'leaf', {
      speed: { min: 30, max: 70 }, angle: { min: -90, max: 90 },
      scale: { start: 1, end: 0.3 }, alpha: { start: 0.8, end: 0 },
      lifespan: 1000, quantity: 8, gravityY: 50,
      tint: P.leafTint, emitting: false,
    });
    leafEmitter.explode(8);

    this.time.delayedCall(1200, () => {
      goldEmitter.destroy(); starEmitter.destroy(); leafEmitter.destroy();
    });
  }

  _emitPlant(x, y) {
    const dirtEmitter = this.add.particles(x, y + 10, 'dirt', {
      speed: { min: 30, max: 70 }, angle: { min: -150, max: -30 },
      scale: { start: 1, end: 0.2 }, alpha: { start: 0.8, end: 0 },
      lifespan: 500, quantity: 10, gravityY: 120,
      tint: P.dirtTint, emitting: false,
    });
    dirtEmitter.explode(10);

    const leafEmitter = this.add.particles(x, y, 'leaf', {
      speed: { min: 15, max: 40 }, angle: { min: -120, max: -60 },
      scale: { start: 0.8, end: 0 }, alpha: { start: 0.9, end: 0 },
      lifespan: 700, quantity: 5, gravityY: 30, emitting: false,
    });
    leafEmitter.explode(5);

    this.time.delayedCall(900, () => {
      dirtEmitter.destroy(); leafEmitter.destroy();
    });
  }

  _emitLevelUp(x, y) {
    const starEmitter = this.add.particles(x, y, 'star', {
      speed: { min: 60, max: 180 }, angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 }, alpha: { start: 1, end: 0 },
      lifespan: 1200, quantity: 30, gravityY: -20, emitting: false,
    });
    starEmitter.explode(30);

    const heartEmitter = this.add.particles(x, y, 'heart', {
      speed: { min: 40, max: 100 }, angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0.2 }, alpha: { start: 1, end: 0 },
      lifespan: 1500, quantity: 10, gravityY: -40, emitting: false,
    });
    heartEmitter.explode(10);

    const goldEmitter = this.add.particles(x, y, 'gold_coin', {
      speed: { min: 80, max: 150 }, angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 }, alpha: { start: 0.8, end: 0 },
      lifespan: 1000, quantity: 20, gravityY: 0, emitting: false,
    });
    goldEmitter.explode(20);

    this.time.delayedCall(1800, () => {
      starEmitter.destroy(); heartEmitter.destroy(); goldEmitter.destroy();
    });
  }

  _emitGold(x, y) {
    const emitter = this.add.particles(x, y, 'gold_coin', {
      speed: { min: 40, max: 90 }, angle: { min: -90, max: 90 },
      scale: { start: 1, end: 0.2 }, alpha: { start: 1, end: 0 },
      lifespan: 700, quantity: 8, gravityY: 80,
      tint: P.goldSplashTint, emitting: false,
    });
    emitter.explode(8);
    this.time.delayedCall(900, () => emitter.destroy());
  }

  _emitExp(x, y) {
    const emitter = this.add.particles(x, y, 'exp_orb', {
      speed: { min: 30, max: 70 }, angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 }, alpha: { start: 1, end: 0 },
      lifespan: 800, quantity: 10, gravityY: -50,
      tint: P.expTint, emitting: false,
    });
    emitter.explode(10);
    this.time.delayedCall(1000, () => emitter.destroy());
  }

  _emitSparkle(x, y) {
    const emitter = this.add.particles(x, y, 'sparkle', {
      speed: { min: 20, max: 50 }, angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 }, alpha: { start: 1, end: 0 },
      lifespan: 500, quantity: 6, gravityY: -20, emitting: false,
    });
    emitter.explode(6);
    this.time.delayedCall(700, () => emitter.destroy());
  }
}

/**
 * 创建 Phaser 游戏实例（覆盖在 React UI 上方）
 * @param {string} parentId - DOM 容器 ID
 * @returns {{ game, scene, emitEffect, destroy }}
 */
export function createParticleOverlay(parentId) {
  const container = document.getElementById(parentId);
  if (!container) return null;

  const overlay = document.createElement('div');
  overlay.id = `${parentId}-phaser-overlay`;
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 9999;
  `;
  document.body.appendChild(overlay);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: overlay,
    width: window.innerWidth,
    height: window.innerHeight,
    transparent: true,
    scene: [ParticleScene],
    audio: { noAudio: true },
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { pixelArt: true, antialias: false },
    fps: { target: 60, forceSetTimeOut: false },
  });

  const scene = game.scene.getScene('ParticleScene');

  const handleResize = () => { game.scale.resize(window.innerWidth, window.innerHeight); };
  window.addEventListener('resize', handleResize);

  return {
    game, scene,
    emitEffect(type, screenX, screenY) {
      if (scene && scene.scene.isActive()) scene.emitEffect(type, screenX, screenY);
    },
    destroy() {
      window.removeEventListener('resize', handleResize);
      game.destroy(true);
      overlay.remove();
    },
  };
}

export default createParticleOverlay;
