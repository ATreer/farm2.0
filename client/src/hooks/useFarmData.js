import { useState, useEffect } from 'react';
import * as api from '../services/api';

/**
 * 农田数据加载 hook
 * 管理 plots、inventory、cropsMap、seeds
 */
export default function useFarmData(playerId, refresh) {
  const [plots, setPlots] = useState([]);
  const [cropsMap, setCropsMap] = useState({});
  const [inventory, setInventory] = useState([]);

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
      // 由调用方处理错误
      throw e;
    }
  };

  useEffect(() => {
    loadData().catch(() => {});
  }, [playerId, refresh]);

  const seeds = inventory.filter(i => i.item_type === 'seed');
  const tools = inventory.filter(i => i.item_type === 'tool');

  return { plots, setPlots, cropsMap, inventory, setInventory, seeds, tools, reload: loadData };
}
