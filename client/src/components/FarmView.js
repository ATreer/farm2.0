import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import { t } from '../services/i18n';
import assets from '../config/assets';
import IsoPlot from './IsoPlot';

const MODES = {
  NONE: 'none',
  PLANT: 'plant',
  WATER: 'water',
  HARVEST: 'harvest',
  TOOL: 'tool',
};

const STAGE_EMOJIS = assets.crop.stageDefault;

// ==================== 斜视角农田配置 ====================
// 荒地 CSS: left:18.44% top:48.2% width:58.12% height:34% skewX(-36deg)
// 中心点 (47.50, 65.20)，tan(36°) ≈ 0.7265
const DIRT_AREA = {
  topLeft:     { x: 30.79, y: 48.2 },
  topRight:    { x: 88.91, y: 48.2 },
  bottomLeft:  { x: 6.09,  y: 82.2 },
  bottomRight: { x: 64.21, y: 82.2 },
};

const GRID_ROWS = 4;
const GRID_COLS = 8;
const TILE_FILL = 0.85;
const SKEW_ANGLE = -44; // 度
const SKEW_TAN = Math.tan(Math.abs(SKEW_ANGLE) * Math.PI / 180); // tan(44°) ≈ 0.9657

export default function FarmView({ playerId, player, notify, refresh, emitParticle, lang }) {
  const [plots, setPlots] = useState([]);
  const [cropsMap, setCropsMap] = useState({});
  const [mode, setMode] = useState(MODES.NONE);
  const [selectedSeed, setSelectedSeed] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [animatingPlots, setAnimatingPlots] = useState(new Set());

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

  // ==================== 平行四边形网格计算 ====================
  const plotMap = {};
  plots.forEach(p => { plotMap[`${p.row_idx}-${p.col_idx}`] = p; });

  const getRowEdge = (row) => {
    const { topLeft, topRight, bottomLeft, bottomRight } = DIRT_AREA;
    const t = row / GRID_ROWS;
    return {
      leftX:  topLeft.x + (bottomLeft.x - topLeft.x) * t,
      rightX: topRight.x + (bottomRight.x - topRight.x) * t,
      y:      topLeft.y + (bottomLeft.y - topLeft.y) * t,
    };
  };

  // 计算格子 (row, col) 的中心位置、尺寸和 skew 补偿
  const getPlotGeometry = (row, col) => {
    const topEdge = getRowEdge(row);
    const bottomEdge = getRowEdge(row + 1);

    const centerY = (topEdge.y + bottomEdge.y) / 2;
    const centerLeftX = (topEdge.leftX + bottomEdge.leftX) / 2;
    const centerRightX = (topEdge.rightX + bottomEdge.rightX) / 2;

    const colT = (col + 0.5) / GRID_COLS;
    const centerX = centerLeftX + (centerRightX - centerLeftX) * colT;

    const rowWidth = centerRightX - centerLeftX;
    const tileW = (rowWidth / GRID_COLS) * TILE_FILL;

    const rowHeight = bottomEdge.y - topEdge.y;
    const tileH = rowHeight * TILE_FILL;

    // skew(-44deg) 补偿：偏移量 = tileH * tan(44°)
    const skewOffsetX = (tileH / 2) * SKEW_TAN;

    // 每行起始 x 向右偏移：第0行+1/8×tileW，第1行+1/4×，第2行+3/8×，第3行+1/2×
    const rowOffsetX = (row + 1) * 0.125 * tileW;

    return {
      centerX: centerX - skewOffsetX + rowOffsetX,
      centerY,
      tileW,
      tileH,
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

  const sortedPlots = [...plotGrid].sort((a, b) => a.row - b.row || a.col - b.col);

  return (
    <div className="farm-container iso-farm-container">
      <div className="farm-grid-wrapper iso-farm-wrapper">
        <div className="iso-plots-layer">
          {sortedPlots.map(plot => {
            const { centerX, centerY, tileW, tileH } = getPlotGeometry(plot.row, plot.col);

            return (
              <div
                key={plot.id}
                className="iso-plot-wrapper"
                style={{
                  left: `${centerX}%`,
                  top: `${centerY}%`,
                  width: `${tileW}%`,
                  height: `${tileH}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: plot.row * GRID_COLS + plot.col + 1,
                }}
              >
                <IsoPlot
                  plot={plot}
                  emoji={getPlotDisplayEmoji(plot)}
                  isAnimating={animatingPlots.has(plot.id)}
                  onClick={(e) => handlePlotClick(plot, e)}
                  zIndex={plot.row * GRID_COLS + plot.col + 1}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="farm-sidebar">
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
      </div>
    </div>
  );
}
