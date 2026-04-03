import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import { t } from '../services/i18n';
import assets from '../config/assets';
import IsoPlot from './IsoPlot';
import SeedPanel from './SeedPanel';

const STAGE_EMOJIS = assets.crop.stageDefault;

// ==================== 斜视角农田配置 ====================
const DIRT_AREA = {
  topLeft:     { x: 30.79, y: 48.2 },
  topRight:    { x: 88.91, y: 48.2 },
  bottomLeft:  { x: 6.09,  y: 82.2 },
  bottomRight: { x: 64.21, y: 82.2 },
};

const GRID_ROWS = 4;
const GRID_COLS = 8;
const TILE_FILL = 0.85;
const SKEW_ANGLE = -44;
const SKEW_TAN = Math.tan(Math.abs(SKEW_ANGLE) * Math.PI / 180);

export default function FarmView({ playerId, player, notify, refresh, emitParticle, lang }) {
  const [plots, setPlots] = useState([]);
  const [cropsMap, setCropsMap] = useState({});
  const [inventory, setInventory] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [animatingPlots, setAnimatingPlots] = useState(new Set());
  const [seedPanelVisible, setSeedPanelVisible] = useState(false);
  const [dragOverPlot, setDragOverPlot] = useState(null);

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

  // 种植到指定格子
  const plantToPlot = async (seedId, plot, event) => {
    if (plot.crop_id) return;
    try {
      await api.plantCrop(playerId, plot.row_idx, plot.col_idx, seedId);
      const cropName = cropsMap[seedId]?.name || seedId;
      notify(`${assets.notify.plant} ${t('plantSuccess', lang, { name: cropName })}`, 'success');
      if (event) emitParticle('plant', event);
      triggerPlotAnimation(plot.id);
      loadData();
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  // 点击农田
  const handlePlotClick = async (plot, event) => {
    setSelectedPlot(plot);

    if (!plot.crop_id) {
      // 空地 → 弹出种子面板
      setSeedPanelVisible(true);
      return;
    }

    // 已种植的农田 → 浇水或收获
    if (plot.is_ready) {
      try {
        const result = await api.harvestPlot(playerId, plot.row_idx, plot.col_idx);
        notify(`${assets.notify.harvest} ${t('harvestSuccess', lang, { name: result.harvested.name, gold: result.harvested.sell_price, exp: result.harvested.exp_reward })}`, 'success');
        emitParticle('harvest', event);
        loadData();
      } catch (e) {
        notify(e.message, 'error');
      }
    } else if (!plot.is_watered) {
      try {
        await api.waterPlot(playerId, plot.row_idx, plot.col_idx);
        notify(`${assets.notify.water} ${t('waterSuccess', lang)}`, 'success');
        emitParticle('water', event);
        triggerPlotAnimation(plot.id);
        loadData();
      } catch (e) {
        notify(e.message, 'error');
      }
    }
  };

  // 从种子面板点击种植（种到当前选中的空地）
  const handleSeedPanelPlant = (seedId) => {
    if (selectedPlot && !selectedPlot.crop_id) {
      plantToPlot(seedId, selectedPlot, null);
    }
  };

  // 拖拽相关事件
  const handlePlotDragOver = (e, plot) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!plot.crop_id) {
      setDragOverPlot(plot.id);
    }
  };

  const handlePlotDragLeave = () => {
    setDragOverPlot(null);
  };

  const handlePlotDrop = async (e, plot) => {
    e.preventDefault();
    setDragOverPlot(null);
    if (plot.crop_id) return;

    const seedId = e.dataTransfer.getData('text/plain');
    if (!seedId) return;

    await plantToPlot(seedId, plot, e);
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

    const skewOffsetX = (tileH / 2) * SKEW_TAN;
    const rowOffsetX = (row + 1) * 0.125 * tileW;

    return {
      centerX: centerX - skewOffsetX + rowOffsetX,
      centerY,
      tileW,
      tileH,
    };
  };

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
            const isDragOver = dragOverPlot === plot.id;

            return (
              <div
                key={plot.id}
                className={`iso-plot-wrapper ${isDragOver ? 'drag-over' : ''}`}
                style={{
                  left: `${centerX}%`,
                  top: `${centerY}%`,
                  width: `${tileW}%`,
                  height: `${tileH}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: plot.row * GRID_COLS + plot.col + 1,
                }}
                onClick={(e) => handlePlotClick(plot, e)}
                onDragOver={(e) => handlePlotDragOver(e, plot)}
                onDragLeave={handlePlotDragLeave}
                onDrop={(e) => handlePlotDrop(e, plot)}
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

      {/* 快捷操作按钮 */}
      <div className="iso-quick-actions">
        <button className="btn btn-blue btn-small" onClick={handleWaterAll}>{assets.btn.waterAll} {t('waterAll', lang)}</button>
        <button className="btn btn-gold btn-small" onClick={handleHarvestAll}>{assets.btn.harvestAll} {t('harvestAll', lang)}</button>
      </div>

      {/* 右侧信息面板 */}
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

      {/* 种子选择面板 */}
      <SeedPanel
        seeds={seeds}
        cropsMap={cropsMap}
        visible={seedPanelVisible}
        onClose={() => setSeedPanelVisible(false)}
        onPlant={handleSeedPanelPlant}
        lang={lang}
      />
    </div>
  );
}
