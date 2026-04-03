import { useState, useCallback } from 'react';
import * as api from '../services/api';
import { t } from '../services/i18n';
import assets from '../config/assets';

const STAGE_EMOJIS = assets.crop.stageDefault;

/**
 * 农田操作 hook
 * 管理种植、浇水、收获、拖拽等交互逻辑
 */
export default function useFarmActions(playerId, cropsMap, emitParticle, notify, reload, lang) {
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [animatingPlots, setAnimatingPlots] = useState(new Set());
  const [seedPanelVisible, setSeedPanelVisible] = useState(false);
  const [seedPanelPos, setSeedPanelPos] = useState({ x: 0, y: 0 });
  const [dragOverPlot, setDragOverPlot] = useState(null);

  const triggerAnimation = useCallback((plotId) => {
    setAnimatingPlots(prev => new Set([...prev, plotId]));
    setTimeout(() => {
      setAnimatingPlots(prev => {
        const next = new Set(prev);
        next.delete(plotId);
        return next;
      });
    }, 500);
  }, []);

  // 种植到指定格子
  const plantToPlot = useCallback(async (seedId, plot, event) => {
    if (plot.crop_id) return;
    try {
      await api.plantCrop(playerId, plot.row_idx, plot.col_idx, seedId);
      const cropName = cropsMap[seedId]?.name || seedId;
      notify(`${assets.notify.plant} ${t('plantSuccess', lang, { name: cropName })}`, 'success');
      if (event) emitParticle('plant', event);
      triggerAnimation(plot.id);
      reload();
    } catch (e) {
      notify(e.message, 'error');
    }
  }, [playerId, cropsMap, emitParticle, notify, reload, lang, triggerAnimation]);

  // 点击农田
  const handlePlotClick = useCallback(async (plot, event) => {
    setSelectedPlot(plot);

    if (!plot.crop_id) {
      // 空地 → 在点击位置弹出种子悬浮框
      const rect = event.currentTarget.getBoundingClientRect();
      setSeedPanelPos({ x: rect.right + 8, y: rect.top });
      setSeedPanelVisible(true);
      return;
    }

    if (plot.is_ready) {
      try {
        const result = await api.harvestPlot(playerId, plot.row_idx, plot.col_idx);
        notify(`${assets.notify.harvest} ${t('harvestSuccess', lang, { name: result.harvested.name, gold: result.harvested.sell_price, exp: result.harvested.exp_reward })}`, 'success');
        emitParticle('harvest', event);
        reload();
      } catch (e) {
        notify(e.message, 'error');
      }
    } else if (!plot.is_watered) {
      try {
        await api.waterPlot(playerId, plot.row_idx, plot.col_idx);
        notify(`${assets.notify.water} ${t('waterSuccess', lang)}`, 'success');
        emitParticle('water', event);
        triggerAnimation(plot.id);
        reload();
      } catch (e) {
        notify(e.message, 'error');
      }
    }
  }, [playerId, emitParticle, notify, reload, lang, triggerAnimation]);

  // 从面板点击种植
  const handleSeedPlant = useCallback((seedId) => {
    if (selectedPlot && !selectedPlot.crop_id) {
      plantToPlot(seedId, selectedPlot, null);
      setSeedPanelVisible(false);
    }
  }, [selectedPlot, plantToPlot]);

  // 拖拽事件
  const handleDragOver = useCallback((e, plot) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!plot.crop_id) setDragOverPlot(plot.id);
  }, []);

  const handleDragLeave = useCallback(() => setDragOverPlot(null), []);

  const handleDrop = useCallback(async (e, plot) => {
    e.preventDefault();
    setDragOverPlot(null);
    if (plot.crop_id) return;
    const seedId = e.dataTransfer.getData('text/plain');
    if (seedId) await plantToPlot(seedId, plot, e);
  }, [plantToPlot]);

  // 一键操作
  const handleWaterAll = useCallback(async () => {
    try {
      const result = await api.waterAllPlots(playerId);
      // result 是数组
      notify(`${assets.notify.water} ${t('waterAll', lang)}!`, 'success');
      reload();
    } catch (e) {
      notify(e.message, 'error');
    }
  }, [playerId, notify, reload, lang]);

  const handleHarvestAll = useCallback(async () => {
    try {
      const result = await api.harvestAll(playerId);
      notify(`${assets.notify.harvest} ${t('harvestAllSuccess', lang, { count: result.harvested.length, gold: result.totalGold, exp: result.totalExp })}`, 'success');
      reload();
    } catch (e) {
      notify(e.message, 'error');
    }
  }, [playerId, notify, reload, lang]);

  // 获取作物显示 emoji
  const getPlotEmoji = useCallback((plot) => {
    if (!plot.crop_id) return '';
    const crop = cropsMap[plot.crop_id];
    if (plot.is_ready && crop) return crop.emoji_ready || assets.crop.readyDefault;
    if (crop) {
      const emojis = [crop.emoji_seed, crop.emoji_sprout, crop.emoji_growing, crop.emoji_ready];
      return emojis[plot.growth_stage] || STAGE_EMOJIS[plot.growth_stage] || assets.mode.plant;
    }
    return STAGE_EMOJIS[plot.growth_stage] || assets.mode.plant;
  }, [cropsMap]);

  const selectedCrop = selectedPlot?.crop_id ? cropsMap[selectedPlot.crop_id] : null;

  const clearSelection = useCallback(() => {
    setSelectedPlot(null);
  }, []);

  return {
    selectedPlot, selectedCrop,
    animatingPlots,
    seedPanelVisible, seedPanelPos,
    dragOverPlot,
    setSeedPanelVisible,
    handlePlotClick, handleSeedPlant,
    handleDragOver, handleDragLeave, handleDrop,
    handleWaterAll, handleHarvestAll,
    getPlotEmoji,
    clearSelection,
  };
}
