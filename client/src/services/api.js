// API 基础地址：直接指向后端端口
const API_BASE = 'http://localhost:3001';

const request = async (method, path, body) => {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
};

// 玩家
export const createPlayer = (name) => request('POST', '/api/player', { name });
export const getPlayer = (id) => request('GET', `/api/player/${id}`);
export const updatePlayerName = (id, name) => request('PUT', `/api/player/${id}/name`, { name });

// 农田
export const getFarmPlots = (playerId) => request('GET', `/api/farm/${playerId}`);
export const plantCrop = (playerId, row, col, cropId) => request('POST', `/api/farm/${playerId}/plant`, { row, col, cropId });
export const waterPlot = (playerId, row, col) => request('POST', `/api/farm/${playerId}/water`, { row, col });
export const waterAllPlots = (playerId) => request('POST', `/api/farm/${playerId}/water-all`);
export const harvestPlot = (playerId, row, col) => request('POST', `/api/farm/${playerId}/harvest`, { row, col });
export const harvestAll = (playerId) => request('POST', `/api/farm/${playerId}/harvest-all`);
export const useTool = (playerId, toolId, row, col) => request('POST', `/api/farm/${playerId}/use-tool`, { toolId, row, col });

// 背包
export const getInventory = (playerId) => request('GET', `/api/inventory/${playerId}`);

// 商店
export const getShopItems = (playerId) => request('GET', `/api/shop/${playerId}`);
export const buyItem = (playerId, shopItemId, quantity) => request('POST', `/api/shop/${playerId}/buy`, { shopItemId, quantity });
export const sellItem = (playerId, itemType, itemId, quantity) => request('POST', `/api/shop/${playerId}/sell`, { itemType, itemId, quantity });

// 农田升级
export const getFarmUpgrades = (playerId) => request('GET', `/api/farm-upgrades/${playerId}`);
export const upgradeFarm = (playerId) => request('POST', `/api/farm-upgrades/${playerId}/upgrade`);

// 时间
export const getGameTime = () => request('GET', '/api/time');
export const advanceTime = (minutes) => request('POST', '/api/time/advance', { minutes });
export const sleepAdvance = (playerId) => request('POST', `/api/time/sleep/${playerId}`);

// 作物
export const getAllCrops = () => request('GET', '/api/crops');
export const getCropInfo = (cropId) => request('GET', `/api/crops/${cropId}`);
export const setPlotStage = (playerId, row, col, stage) => request('POST', `/api/farm/${playerId}/set-stage`, { row_idx: row, col_idx: col, stage });
