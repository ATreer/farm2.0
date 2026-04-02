import React, { useState, useEffect } from 'react';
import * as api from '../services/api';

const MODES = {
  NONE: 'none',
  PLANT: 'plant',
  WATER: 'water',
  HARVEST: 'harvest',
  TOOL: 'tool',
};

export default function FarmView({ playerId, player, notify, refresh }) {
  const [plots, setPlots] = useState([]);
  const [mode, setMode] = useState(MODES.NONE);
  const [selectedSeed, setSelectedSeed] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [cropInfo, setCropInfo] = useState(null);

  const loadData = async () => {
    try {
      const [plotData, invData] = await Promise.all([
        api.getFarmPlots(playerId),
        api.getInventory(playerId),
      ]);
      setPlots(plotData);
      setInventory(invData);
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, [playerId, refresh]);

  const seeds = inventory.filter(i => i.item_type === 'seed');
  const tools = inventory.filter(i => i.item_type === 'tool');

  const handlePlotClick = async (plot) => {
    setSelectedPlot(plot);

    if (mode === MODES.PLANT && selectedSeed) {
      try {
        await api.plantCrop(playerId, plot.row_idx, plot.col_idx, selectedSeed);
        notify(`种下了 ${selectedSeed}`, 'success');
        loadData();
      } catch (e) {
        notify(e.message, 'error');
      }
    } else if (mode === MODES.WATER) {
      try {
        await api.waterPlot(playerId, plot.row_idx, plot.col_idx);
        notify('💧 浇水成功', 'success');
        loadData();
      } catch (e) {
        notify(e.message, 'error');
      }
    } else if (mode === MODES.HARVEST) {
      try {
        const result = await api.harvestPlot(playerId, plot.row_idx, plot.col_idx);
        notify(`🎉 收获了 ${result.harvested.name}！+${result.harvested.sell_price}💰 +${result.harvested.exp_reward}EXP`, 'success');
        loadData();
      } catch (e) {
        notify(e.message, 'error');
      }
    } else if (mode === MODES.TOOL && selectedTool) {
      try {
        const result = await api.useTool(playerId, selectedTool, plot.row_idx, plot.col_idx);
        notify('✨ 使用道具成功', 'success');
        setPlots(result.plots);
        setInventory(result.inventory);
        setMode(MODES.NONE);
        setSelectedTool(null);
      } catch (e) {
        notify(e.message, 'error');
      }
    } else if (plot.crop_id) {
      // 显示作物信息
      try {
        const info = await api.getCropInfo(plot.crop_id);
        setCropInfo({ ...info, plot });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleWaterAll = async () => {
    try {
      const result = await api.waterAllPlots(playerId);
      setPlots(result);
      notify('💧 全部浇水完成', 'success');
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

  const getPlotEmoji = (plot) => {
    if (!plot.crop_id) return '';
    if (plot.is_ready) return '✅';
    const crop = cropInfo && cropInfo.id === plot.crop_id ? cropInfo : null;
    if (plot.growth_stage === 0) return '🌱';
    if (plot.growth_stage === 1) return '🌿';
    if (plot.growth_stage >= 2) return '🪴';
    return '🌱';
  };

  const getPlotDisplayEmoji = (plot) => {
    if (!plot.crop_id) return '';
    if (plot.is_ready) {
      // 尝试从作物信息获取成熟emoji
      return '🌾';
    }
    if (plot.growth_stage === 0) return '🌱';
    if (plot.growth_stage === 1) return '🌿';
    if (plot.growth_stage === 2) return '🪴';
    return '🌱';
  };

  const maxRow = plots.length > 0 ? Math.max(...plots.map(p => p.row_idx)) + 1 : 3;
  const maxCol = plots.length > 0 ? Math.max(...plots.map(p => p.col_idx)) + 1 : 3;

  const modeButtons = [
    { key: MODES.PLANT, label: '🌱 种植', color: 'btn-green' },
    { key: MODES.WATER, label: '💧 浇水', color: 'btn-primary' },
    { key: MODES.HARVEST, label: '🌾 收获', color: 'btn-gold' },
    { key: MODES.TOOL, label: '🧪 道具', color: '' },
  ];

  return (
    <div className="farm-container">
      <div className="farm-grid-wrapper">
        <div className="panel">
          <div className="panel-title">🌾 我的农田 ({maxRow}x{maxCol})</div>

          <div className="farm-actions">
            {modeButtons.map(btn => (
              <button
                key={btn.key}
                className={`btn btn-small ${btn.color} ${mode === btn.key ? 'active' : ''}`}
                onClick={() => {
                  setMode(mode === btn.key ? MODES.NONE : btn.key);
                  setSelectedSeed(null);
                  setSelectedTool(null);
                }}
              >
                {btn.label}
              </button>
            ))}
            <button className="btn btn-small" onClick={handleWaterAll}>💧 全部浇水</button>
            <button className="btn btn-small btn-gold" onClick={handleHarvestAll}>🌾 全部收获</button>
          </div>

          {mode === MODES.PLANT && (
            <div style={{ marginBottom: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '8px', color: '#8899aa' }}>选择种子：</span>
              {seeds.length === 0 ? (
                <span style={{ fontSize: '7px', color: '#e94560' }}>背包中没有种子，去商店购买吧！</span>
              ) : (
                seeds.map(seed => (
                  <button
                    key={seed.item_id}
                    className={`btn btn-small ${selectedSeed === seed.item_id ? 'btn-gold' : ''}`}
                    onClick={() => setSelectedSeed(seed.item_id)}
                  >
                    {seed.emoji} {seed.name} x{seed.quantity}
                  </button>
                ))
              )}
            </div>
          )}

          {mode === MODES.TOOL && (
            <div style={{ marginBottom: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '8px', color: '#8899aa' }}>选择道具：</span>
              {tools.length === 0 ? (
                <span style={{ fontSize: '7px', color: '#e94560' }}>背包中没有道具</span>
              ) : (
                tools.map(tool => (
                  <button
                    key={tool.item_id}
                    className={`btn btn-small ${selectedTool === tool.item_id ? 'btn-gold' : ''}`}
                    onClick={() => setSelectedTool(tool.item_id)}
                  >
                    {tool.emoji} {tool.name} x{tool.quantity}
                  </button>
                ))
              )}
            </div>
          )}

          <div
            className="farm-grid"
            style={{ gridTemplateColumns: `repeat(${maxCol}, 56px)` }}
          >
            {plots.map(plot => (
              <div
                key={plot.id}
                className={`farm-plot ${plot.is_watered ? 'watered' : ''} ${plot.is_ready ? 'ready' : ''}`}
                onClick={() => handlePlotClick(plot)}
                title={`[${plot.row_idx},${plot.col_idx}] ${plot.crop_id || '空地'}`}
              >
                {plot.crop_id ? (
                  <>
                    <span className="plot-emoji">{getPlotDisplayEmoji(plot)}</span>
                    {plot.is_watered && <span className="plot-water-indicator">💧</span>}
                    {!plot.is_ready && <span className="plot-stage">{plot.growth_stage + 1}/4</span>}
                  </>
                ) : (
                  <span style={{ fontSize: '12px', color: '#5a3010' }}>+</span>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '8px', fontSize: '7px', color: '#555' }}>
            当前模式：{mode === MODES.NONE ? '查看' : mode === MODES.PLANT ? '🌱 种植' : mode === MODES.WATER ? '💧 浇水' : mode === MODES.HARVEST ? '🌾 收获' : '🧪 道具'}
            {' '}(点击格子执行操作)
          </div>
        </div>
      </div>

      <div className="farm-sidebar">
        {cropInfo && selectedPlot && selectedPlot.crop_id && (
          <div className="crop-info-panel">
            <div className="crop-info-header">
              <span className="crop-info-emoji">{cropInfo.emoji_ready}</span>
              <div>
                <div className="crop-info-name">{cropInfo.name}</div>
                <div style={{ fontSize: '7px', color: '#8899aa' }}>
                  位置 [{selectedPlot.row_idx}, {selectedPlot.col_idx}]
                </div>
              </div>
            </div>
            <div className="crop-info-stats">
              <div className="crop-stat">
                <span className="crop-stat-label">生长时间</span>
                <span className="crop-stat-value">{cropInfo.grow_time}秒</span>
              </div>
              <div className="crop-stat">
                <span className="crop-stat-label">生长阶段</span>
                <span className="crop-stat-value">{selectedPlot.growth_stage + 1}/{cropInfo.stages}</span>
              </div>
              <div className="crop-stat">
                <span className="crop-stat-label">出售价格</span>
                <span className="crop-stat-value">💰{cropInfo.sell_price}</span>
              </div>
              <div className="crop-stat">
                <span className="crop-stat-label">经验奖励</span>
                <span className="crop-stat-value">⭐{cropInfo.exp_reward}</span>
              </div>
              <div className="crop-stat">
                <span className="crop-stat-label">浇水状态</span>
                <span className="crop-stat-value">{selectedPlot.is_watered ? '💧 已浇水' : '❌ 未浇水'}</span>
              </div>
              <div className="crop-stat">
                <span className="crop-stat-label">成熟状态</span>
                <span className="crop-stat-value">{selectedPlot.is_ready ? '✅ 已成熟' : '⏳ 生长中'}</span>
              </div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '7px', color: '#8899aa' }}>
              生长过程：{cropInfo.emoji_seed} → {cropInfo.emoji_sprout} → {cropInfo.emoji_growing} → {cropInfo.emoji_ready}
            </div>
          </div>
        )}

        <div className="panel">
          <div className="panel-title">📊 农场概况</div>
          <div style={{ fontSize: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8899aa' }}>总格子数</span>
              <span>{plots.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8899aa' }}>已种植</span>
              <span>{plots.filter(p => p.crop_id).length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8899aa' }}>已浇水</span>
              <span>{plots.filter(p => p.is_watered).length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8899aa' }}>可收获</span>
              <span style={{ color: '#ffd700' }}>{plots.filter(p => p.is_ready).length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8899aa' }}>空闲</span>
              <span>{plots.filter(p => !p.crop_id).length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
