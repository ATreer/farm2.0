import React, { useState, useEffect, useRef } from 'react';
import * as api from '../services/api';
import { t } from '../services/i18n';
import assets from '../config/assets';

const MODES = {
  NONE: 'none',
  PLANT: 'plant',
  WATER: 'water',
  HARVEST: 'harvest',
  TOOL: 'tool',
};

// 作物各阶段对应的 emoji 映射
const STAGE_EMOJIS = assets.crop.stageDefault;

// ==================== 斜视角农田配置 ====================
// 荒地 CSS 参数: left:16.5% top:48.2% width:62% height:34% skewX(-44deg)
// transform-origin: center → 中心点 (47.5%, 65.2%)
// skewX(-44deg): x' = x + (y - 65.2) × (-tan44°)
// 平行四边形四角坐标（百分比，相对于背景图尺寸）
const DIRT_AREA = {
  topLeft:     { x: 32.92, y: 48.2 },
  topRight:    { x: 94.92, y: 48.2 },
  bottomLeft:  { x: 0.08,  y: 82.2 },
  bottomRight: { x: 62.08, y: 82.2 },
};

// 固定网格尺寸（不跟随等级，均匀铺满荒地）
const GRID_ROWS = 4;
const GRID_COLS = 8;

// 斜视角参数
const ISO_CONFIG = {
  perspectiveScale: 0.6,   // 远处行缩放比例（越小远处的行越窄，斜视角感越强）
  tilePadding: 0.72,       // 格子占单元格的比例（留间隙）
};

export default function FarmView({ playerId, player, notify, refresh, emitParticle, lang }) {
  const [plots, setPlots] = useState([]);
  const [cropsMap, setCropsMap] = useState({});
  const [mode, setMode] = useState(MODES.NONE);
  const [selectedSeed, setSelectedSeed] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [animatingPlots, setAnimatingPlots] = useState(new Set());
  const farmRef = useRef(null);

  const MODE_LABELS = {
    none: `${assets.mode.view} ${t('modeView', lang)}`,
    plant: `${assets.mode.plant} ${t('modePlant', lang)}`,
    water: `${assets.mode.water} ${t('modeWater', lang)}`,
    harvest: `${assets.mode.harvest} ${t('modeHarvest', lang)}`,
    tool: `${assets.mode.tool} ${t('modeTool', lang)}`,
  };

  const loadData = async () => {
    try {
      const [plotData, invData, cropsData] = await Promise.all([
        api.getFarmPlots(playerId),
        api.getInventory(playerId),
        api.getAllCrops(),
      ]);
      setPlots(plotData);
      setInventory(invData);
      const map = {};
      cropsData.forEach(c => { map[c.id] = c; });
      setCropsMap(map);
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, [playerId, refresh]);

  const seeds = inventory.filter(i => i.item_type === 'seed');
  const tools = inventory.filter(i => i.item_type === 'tool');

  const triggerPlotAnimation = (plotId) => {
    setAnimatingPlots(prev => new Set([...prev, plotId]));
    setTimeout(() => {
      setAnimatingPlots(prev => {
        const next = new Set(prev);
        next.delete(plotId);
        return next;
      });
    }, 500);
  };

  const handlePlotClick = async (plot, event) => {
    setSelectedPlot(plot);

    if (mode === MODES.PLANT && selectedSeed) {
      try {
        await api.plantCrop(playerId, plot.row_idx, plot.col_idx, selectedSeed);
        const cropName = cropsMap[selectedSeed]?.name || selectedSeed;
        notify(`${assets.notify.plant} ${t('plantSuccess', lang, { name: cropName })}`, 'success');
        emitParticle('plant', event);
        triggerPlotAnimation(plot.id);
        loadData();
      } catch (e) {
        notify(e.message, 'error');
      }
    } else if (mode === MODES.WATER) {
      try {
        await api.waterPlot(playerId, plot.row_idx, plot.col_idx);
        notify(`${assets.notify.water} ${t('waterSuccess', lang)}`, 'success');
        emitParticle('water', event);
        triggerPlotAnimation(plot.id);
        loadData();
      } catch (e) {
        notify(e.message, 'error');
      }
    } else if (mode === MODES.HARVEST) {
      try {
        const result = await api.harvestPlot(playerId, plot.row_idx, plot.col_idx);
        notify(`${assets.notify.harvest} ${t('harvestSuccess', lang, { name: result.harvested.name, gold: result.harvested.sell_price, exp: result.harvested.exp_reward })}`, 'success');
        emitParticle('harvest', event);
        loadData();
      } catch (e) {
        notify(e.message, 'error');
      }
    } else if (mode === MODES.TOOL && selectedTool) {
      try {
        const result = await api.useTool(playerId, selectedTool, plot.row_idx, plot.col_idx);
        notify(`${assets.notify.tool} ${t('toolSuccess', lang)}`, 'success');
        emitParticle('sparkle', event);
        setPlots(result.plots);
        setInventory(result.inventory);
        setMode(MODES.NONE);
        setSelectedTool(null);
      } catch (e) {
        notify(e.message, 'error');
      }
    } else if (plot.crop_id) {
      // 查看作物信息
    }
  };

  const handleWaterAll = async () => {
    try {
      const result = await api.waterAllPlots(playerId);
      setPlots(result);
      notify(`${assets.notify.water} ${t('waterAll', lang)}!`, 'success');
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const handleHarvestAll = async () => {
    try {
      const result = await api.harvestAll(playerId);
      setPlots(result.plots);
      notify(`${assets.notify.harvest} ${t('harvestAllSuccess', lang, { count: result.harvested.length, gold: result.totalGold, exp: result.totalExp })}`, 'success');
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const getPlotDisplayEmoji = (plot) => {
    if (!plot.crop_id) return '';
    const crop = cropsMap[plot.crop_id];
    if (plot.is_ready && crop) return crop.emoji_ready || assets.crop.readyDefault;
    if (crop) {
      const emojis = [crop.emoji_seed, crop.emoji_sprout, crop.emoji_growing, crop.emoji_ready];
      return emojis[plot.growth_stage] || STAGE_EMOJIS[plot.growth_stage] || assets.mode.plant;
    }
    return STAGE_EMOJIS[plot.growth_stage] || assets.mode.plant;
  };

  const selectedCrop = selectedPlot?.crop_id ? cropsMap[selectedPlot.crop_id] : null;

  const modeButtons = [
    { key: MODES.PLANT, label: `${assets.btn.plant} ${t('modePlant', lang)}`, color: 'btn-green' },
    { key: MODES.WATER, label: `${assets.btn.water} ${t('modeWater', lang)}`, color: 'btn-blue' },
    { key: MODES.HARVEST, label: `${assets.btn.harvest} ${t('modeHarvest', lang)}`, color: 'btn-gold' },
    { key: MODES.TOOL, label: `${assets.btn.tool} ${t('modeTool', lang)}`, color: '' },
  ];

  // ==================== 斜视角位置计算 ====================
  // 建立 row_idx,col_idx → plot 数据的映射
  const plotMap = {};
  plots.forEach(p => { plotMap[`${p.row_idx}-${p.col_idx}`] = p; });

  // 将 (row, col) 转换为背景图上的位置（百分比）
  const getPlotPosition = (row, col) => {
    const { topLeft, topRight, bottomLeft, bottomRight } = DIRT_AREA;
    // 在 N×M 网格中，每个格子中心位于 (col+0.5)/M, (row+0.5)/N
    const rowT = (row + 0.5) / GRID_ROWS;
    const colT = (col + 0.5) / GRID_COLS;

    // 双线性插值
    const leftX = bottomLeft.x + (topLeft.x - bottomLeft.x) * rowT;
    const rightX = bottomRight.x + (topRight.x - bottomRight.x) * rowT;
    const leftY = bottomLeft.y + (topLeft.y - bottomLeft.y) * rowT;
    const rightY = bottomRight.y + (topRight.y - bottomRight.y) * rowT;

    return {
      x: leftX + (rightX - leftX) * colT,
      y: leftY + (rightY - leftY) * colT,
    };
  };

  // 计算该行格子的大小（百分比，近大远小）
  const getPlotSize = (row) => {
    const { topLeft, topRight, bottomLeft, bottomRight } = DIRT_AREA;
    const rowT = (row + 0.5) / GRID_ROWS;
    const scale = 1.0 - rowT * (1.0 - ISO_CONFIG.perspectiveScale);

    // 该行左右边界
    const leftX = bottomLeft.x + (topLeft.x - bottomLeft.x) * rowT;
    const rightX = bottomRight.x + (topRight.x - bottomRight.x) * rowT;

    // 该行宽度
    const rowWidth = Math.abs(rightX - leftX);
    // 荒地总高度（底边Y - 顶边Y）
    const totalHeight = Math.abs(bottomLeft.y - topLeft.y);
    // 每格高度 = 总高度 / 行数，再乘透视缩放
    const tileHeight = (totalHeight / GRID_ROWS) * scale;

    const pad = ISO_CONFIG.tilePadding;
    return {
      width: (rowWidth / GRID_COLS) * pad,
      height: tileHeight * pad,
      scale,
    };
  };

  // 生成固定 4×8 网格
  const plotGrid = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const dbPlot = plotMap[`${r}-${c}`];
      if (dbPlot) {
        plotGrid.push({ ...dbPlot, row: r, col: c });
      } else {
        plotGrid.push({
          id: `empty-${r}-${c}`,
          row_idx: r, col_idx: c,
          row: r, col: c,
          crop_id: null, is_watered: false, is_ready: false, growth_stage: 0,
        });
      }
    }
  }

  // 按行排序（远处先渲染）
  const sortedPlots = [...plotGrid].sort((a, b) => a.row - b.row || a.col - b.col);

  return (
    <div className="farm-container iso-farm-container">
      <div className="farm-grid-wrapper iso-farm-wrapper">
        {/* 工具栏面板 */}
        <div className="panel iso-toolbar-panel">
          <div className="panel-title">{assets.panel.farm} {t('myFarm', lang)} ({GRID_ROWS}×{GRID_COLS})</div>

          <div className="farm-actions">
            {modeButtons.map(btn => (
              <button
                key={btn.key}
                className={`btn ${btn.color} ${mode === btn.key ? 'active' : ''}`}
                onClick={() => {
                  setMode(mode === btn.key ? MODES.NONE : btn.key);
                  setSelectedSeed(null);
                  setSelectedTool(null);
                }}
              >
                {btn.label}
              </button>
            ))}
            <button className="btn btn-blue btn-small" onClick={handleWaterAll}>{assets.btn.waterAll} {t('waterAll', lang)}</button>
            <button className="btn btn-gold btn-small" onClick={handleHarvestAll}>{assets.btn.harvestAll} {t('harvestAll', lang)}</button>

            {mode !== MODES.NONE && (
              <span className="farm-mode-indicator">{MODE_LABELS[mode]}</span>
            )}
          </div>

          {mode === MODES.PLANT && (
            <div className="selection-bar">
              <span className="selection-bar-label">{t('selectSeed', lang)}</span>
              {seeds.length === 0 ? (
                <span className="selection-bar-empty">{t('noSeeds', lang)}</span>
              ) : (
                seeds.map(seed => (
                  <button
                    key={seed.item_id}
                    className={`btn btn-small ${selectedSeed === seed.item_id ? 'btn-gold' : ''}`}
                    onClick={() => setSelectedSeed(seed.item_id)}
                  >
                    {seed.emoji} {seed.name} ×{seed.quantity}
                  </button>
                ))
              )}
            </div>
          )}

          {mode === MODES.TOOL && (
            <div className="selection-bar">
              <span className="selection-bar-label">{t('selectTool', lang)}</span>
              {tools.length === 0 ? (
                <span className="selection-bar-empty">{t('noTools', lang)}</span>
              ) : (
                tools.map(tool => (
                  <button
                    key={tool.item_id}
                    className={`btn btn-small ${selectedTool === tool.item_id ? 'btn-gold' : ''}`}
                    onClick={() => setSelectedTool(tool.item_id)}
                  >
                    {tool.emoji} {tool.name} ×{tool.quantity}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* 斜视角农田场景 */}
        <div className="iso-scene" ref={farmRef}>
          <div
            className="iso-background"
            style={{ backgroundImage: 'url(/background.png)' }}
          >
            {/* 斜视角农田格子层 */}
            <div className="iso-plots-layer">
              {sortedPlots.map(plot => {
                const pos = getPlotPosition(plot.row, plot.col);
                const { width, height, scale } = getPlotSize(plot.row);

                return (
                  <div
                    key={plot.id}
                    className={`iso-plot ${plot.is_watered ? 'watered' : ''} ${plot.is_ready ? 'ready' : ''} ${animatingPlots.has(plot.id) ? 'plot-animating' : ''}`}
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      width: `${width}%`,
                      height: `${height}%`,
                      transform: `translate(-50%, -50%)`,
                      zIndex: plot.row * GRID_COLS + plot.col + 1,
                    }}
                    onClick={(e) => handlePlotClick(plot, e)}
                    title={`[${plot.row_idx}, ${plot.col_idx}] ${plot.crop_id || t('empty', lang)}`}
                  >
                    {plot.crop_id ? (
                      <>
                        <span className="iso-plot-emoji">{getPlotDisplayEmoji(plot)}</span>
                        {plot.is_watered && <span className="iso-plot-water">{assets.plot.waterIndicator}</span>}
                        {!plot.is_ready && <span className="iso-plot-stage">{plot.growth_stage + 1}/4</span>}
                      </>
                    ) : (
                      <span className="iso-plot-empty">{assets.crop.emptyPlot}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="farm-sidebar">
        {/* 作物信息面板 */}
        {selectedCrop && selectedPlot?.crop_id && (
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
        )}

        {/* 农场概况 */}
        <div className="panel">
          <div className="panel-title">{assets.panel.overview} {t('farmOverview', lang)}</div>
          <div className="farm-stats">
            <div className="farm-stat-row">
              <span style={{ color: 'var(--text-dim)' }}>{t('totalPlots', lang)}</span>
              <span>{plots.length} {t('unit', lang)}</span>
            </div>
            <div className="farm-stat-row">
              <span style={{ color: 'var(--text-dim)' }}>{t('planted', lang)}</span>
              <span>{plots.filter(p => p.crop_id).length} {t('unit', lang)}</span>
            </div>
            <div className="farm-stat-row">
              <span style={{ color: 'var(--text-dim)' }}>{t('watered', lang)}</span>
              <span>{assets.status.watered} {plots.filter(p => p.is_watered).length} {t('unit', lang)}</span>
            </div>
            <div className="farm-stat-row">
              <span style={{ color: 'var(--text-dim)' }}>{t('ready', lang)}</span>
              <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{assets.status.ready} {plots.filter(p => p.is_ready).length} {t('unit', lang)}</span>
            </div>
            <div className="farm-stat-row">
              <span style={{ color: 'var(--text-dim)' }}>{t('empty', lang)}</span>
              <span>{plots.filter(p => !p.crop_id).length} {t('unit', lang)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
