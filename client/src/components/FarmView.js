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

export default function FarmView({ playerId, player, notify, refresh, emitParticle, lang }) {
  const [plots, setPlots] = useState([]);
  const [cropsMap, setCropsMap] = useState({});
  const [mode, setMode] = useState(MODES.NONE);
  const [selectedSeed, setSelectedSeed] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [animatingPlots, setAnimatingPlots] = useState(new Set());

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
      // 建立作物ID到信息的映射
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

  const maxRow = plots.length > 0 ? Math.max(...plots.map(p => p.row_idx)) + 1 : 3;
  const maxCol = plots.length > 0 ? Math.max(...plots.map(p => p.col_idx)) + 1 : 3;

  const selectedCrop = selectedPlot?.crop_id ? cropsMap[selectedPlot.crop_id] : null;

  const modeButtons = [
    { key: MODES.PLANT, label: `${assets.btn.plant} ${t('modePlant', lang)}`, color: 'btn-green' },
    { key: MODES.WATER, label: `${assets.btn.water} ${t('modeWater', lang)}`, color: 'btn-blue' },
    { key: MODES.HARVEST, label: `${assets.btn.harvest} ${t('modeHarvest', lang)}`, color: 'btn-gold' },
    { key: MODES.TOOL, label: `${assets.btn.tool} ${t('modeTool', lang)}`, color: '' },
  ];

  return (
    <div className="farm-container">
      <div className="farm-grid-wrapper">
        <div className="panel">
          <div className="panel-title">{assets.panel.farm} {t('myFarm', lang)} ({maxRow}×{maxCol})</div>

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

          <div
            className="farm-grid"
            style={{ gridTemplateColumns: `repeat(${maxCol}, 68px)` }}
          >
            {plots.map(plot => (
              <div
                key={plot.id}
                className={`farm-plot ${plot.is_watered ? 'watered' : ''} ${plot.is_ready ? 'ready' : ''} ${animatingPlots.has(plot.id) ? 'plot-animating' : ''}`}
                onClick={(e) => handlePlotClick(plot, e)}
                title={`[${plot.row_idx}, ${plot.col_idx}] ${plot.crop_id || t('empty', lang)}`}
              >
                {plot.crop_id ? (
                  <>
                    <span className="plot-emoji">{getPlotDisplayEmoji(plot)}</span>
                    {plot.is_watered && <span className="plot-water-indicator">{assets.plot.waterIndicator}</span>}
                    {!plot.is_ready && <span className="plot-stage">{plot.growth_stage + 1}/4</span>}
                  </>
                ) : (
                  <span style={{ fontSize: '16px', color: '#5a3010', opacity: 0.5 }}>{assets.crop.emptyPlot}</span>
                )}
              </div>
            ))}
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
