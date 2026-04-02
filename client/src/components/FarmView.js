import React, { useState, useEffect, useRef } from 'react';
import * as api from '../services/api';

const MODES = {
  NONE: 'none',
  PLANT: 'plant',
  WATER: 'water',
  HARVEST: 'harvest',
  TOOL: 'tool',
};

const MODE_LABELS = {
  none: '👀 查看模式',
  plant: '🌱 种植模式',
  water: '💧 浇水模式',
  harvest: '🌾 收获模式',
  tool: '🧪 道具模式',
};

// 作物各阶段对应的 emoji 映射
const STAGE_EMOJIS = {
  0: '🌱', 1: '🌿', 2: '🪴', 3: '🌾',
};

export default function FarmView({ playerId, player, notify, refresh, emitParticle }) {
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
        notify(`🌱 种下了${cropName}`, 'success');
        emitParticle('plant', event);
        triggerPlotAnimation(plot.id);
        loadData();
      } catch (e) {
        notify(e.message, 'error');
      }
    } else if (mode === MODES.WATER) {
      try {
        await api.waterPlot(playerId, plot.row_idx, plot.col_idx);
        notify('💧 浇水成功！生长速度提升', 'success');
        emitParticle('water', event);
        triggerPlotAnimation(plot.id);
        loadData();
      } catch (e) {
        notify(e.message, 'error');
      }
    } else if (mode === MODES.HARVEST) {
      try {
        const result = await api.harvestPlot(playerId, plot.row_idx, plot.col_idx);
        notify(`🎉 收获了${result.harvested.name}！+${result.harvested.sell_price}💰 +${result.harvested.exp_reward}EXP`, 'success');
        emitParticle('harvest', event);
        loadData();
      } catch (e) {
        notify(e.message, 'error');
      }
    } else if (mode === MODES.TOOL && selectedTool) {
      try {
        const result = await api.useTool(playerId, selectedTool, plot.row_idx, plot.col_idx);
        notify('✨ 使用道具成功！', 'success');
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
      notify('💧 全部浇水完成！', 'success');
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const handleHarvestAll = async () => {
    try {
      const result = await api.harvestAll(playerId);
      setPlots(result.plots);
      notify(`🎉 收获了 ${result.harvested.length} 个作物！+${result.totalGold}💰 +${result.totalExp}EXP`, 'success');
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const getPlotDisplayEmoji = (plot) => {
    if (!plot.crop_id) return '';
    const crop = cropsMap[plot.crop_id];
    if (plot.is_ready && crop) return crop.emoji_ready || '🌾';
    if (crop) {
      const emojis = [crop.emoji_seed, crop.emoji_sprout, crop.emoji_growing, crop.emoji_ready];
      return emojis[plot.growth_stage] || STAGE_EMOJIS[plot.growth_stage] || '🌱';
    }
    return STAGE_EMOJIS[plot.growth_stage] || '🌱';
  };

  const maxRow = plots.length > 0 ? Math.max(...plots.map(p => p.row_idx)) + 1 : 3;
  const maxCol = plots.length > 0 ? Math.max(...plots.map(p => p.col_idx)) + 1 : 3;

  const selectedCrop = selectedPlot?.crop_id ? cropsMap[selectedPlot.crop_id] : null;

  const modeButtons = [
    { key: MODES.PLANT, label: '🌱 种植', color: 'btn-green' },
    { key: MODES.WATER, label: '💧 浇水', color: 'btn-blue' },
    { key: MODES.HARVEST, label: '🌾 收获', color: 'btn-gold' },
    { key: MODES.TOOL, label: '🧪 道具', color: '' },
  ];

  return (
    <div className="farm-container">
      <div className="farm-grid-wrapper">
        <div className="panel">
          <div className="panel-title">🌾 我的农田 ({maxRow}×{maxCol})</div>

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
            <button className="btn btn-blue btn-small" onClick={handleWaterAll}>💧 全部浇水</button>
            <button className="btn btn-gold btn-small" onClick={handleHarvestAll}>🌾 全部收获</button>

            {mode !== MODES.NONE && (
              <span className="farm-mode-indicator">{MODE_LABELS[mode]}</span>
            )}
          </div>

          {mode === MODES.PLANT && (
            <div className="selection-bar">
              <span className="selection-bar-label">选择种子：</span>
              {seeds.length === 0 ? (
                <span className="selection-bar-empty">背包中没有种子，去商店购买吧！</span>
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
              <span className="selection-bar-label">选择道具：</span>
              {tools.length === 0 ? (
                <span className="selection-bar-empty">背包中没有道具</span>
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
                title={`[${plot.row_idx}, ${plot.col_idx}] ${plot.crop_id || '空地'}`}
              >
                {plot.crop_id ? (
                  <>
                    <span className="plot-emoji">{getPlotDisplayEmoji(plot)}</span>
                    {plot.is_watered && <span className="plot-water-indicator">💧</span>}
                    {!plot.is_ready && <span className="plot-stage">{plot.growth_stage + 1}/4</span>}
                  </>
                ) : (
                  <span style={{ fontSize: '16px', color: '#5a3010', opacity: 0.5 }}>+</span>
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
                  位置 [{selectedPlot.row_idx}, {selectedPlot.col_idx}]
                </div>
              </div>
            </div>
            <div className="crop-info-stats">
              <div className="crop-stat">
                <span className="crop-stat-label">⏱ 生长时间</span>
                <span className="crop-stat-value">{selectedCrop.grow_time}秒</span>
              </div>
              <div className="crop-stat">
                <span className="crop-stat-label">📊 生长阶段</span>
                <span className="crop-stat-value">{selectedPlot.growth_stage + 1}/{selectedCrop.stages}</span>
              </div>
              <div className="crop-stat">
                <span className="crop-stat-label">💰 出售价格</span>
                <span className="crop-stat-value">{selectedCrop.sell_price}</span>
              </div>
              <div className="crop-stat">
                <span className="crop-stat-label">⭐ 经验奖励</span>
                <span className="crop-stat-value">{selectedCrop.exp_reward}</span>
              </div>
              <div className="crop-stat">
                <span className="crop-stat-label">💧 浇水状态</span>
                <span className="crop-stat-value">{selectedPlot.is_watered ? '已浇水' : '未浇水'}</span>
              </div>
              <div className="crop-stat">
                <span className="crop-stat-label">✅ 成熟状态</span>
                <span className="crop-stat-value">{selectedPlot.is_ready ? '已成熟' : '生长中'}</span>
              </div>
            </div>
            <div className="crop-growth-process">
              {selectedCrop.emoji_seed} → {selectedCrop.emoji_sprout} → {selectedCrop.emoji_growing} → {selectedCrop.emoji_ready}
            </div>
          </div>
        )}

        {/* 农场概况 */}
        <div className="panel">
          <div className="panel-title">📊 农场概况</div>
          <div className="farm-stats">
            <div className="farm-stat-row">
              <span style={{ color: 'var(--text-dim)' }}>总面积</span>
              <span>{plots.length} 格</span>
            </div>
            <div className="farm-stat-row">
              <span style={{ color: 'var(--text-dim)' }}>已种植</span>
              <span>{plots.filter(p => p.crop_id).length} 格</span>
            </div>
            <div className="farm-stat-row">
              <span style={{ color: 'var(--text-dim)' }}>已浇水</span>
              <span>💧 {plots.filter(p => p.is_watered).length} 格</span>
            </div>
            <div className="farm-stat-row">
              <span style={{ color: 'var(--text-dim)' }}>可收获</span>
              <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>✅ {plots.filter(p => p.is_ready).length} 格</span>
            </div>
            <div className="farm-stat-row">
              <span style={{ color: 'var(--text-dim)' }}>空闲</span>
              <span>{plots.filter(p => !p.crop_id).length} 格</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
