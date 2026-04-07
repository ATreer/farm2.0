const db = require('./database');
const { v4: uuidv4 } = require('uuid');
const config = require('./config/gameConfig');

// ==================== 经验等级表 ====================
function expForLevel(level) {
  return Math.floor(config.exp.base * Math.pow(level, config.exp.exponent));
}

function getLevelInfo(exp) {
  let level = 1;
  let currentExp = exp;
  while (currentExp >= expForLevel(level + 1)) {
    currentExp -= expForLevel(level + 1);
    level++;
  }
  return {
    level,
    currentExp,
    nextLevelExp: expForLevel(level + 1),
  };
}

// ==================== 玩家 API ====================

function createPlayer(name = '农夫') {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO players (id, name) VALUES (?, ?)
  `).run(id, name);

  // 初始化农田格子
  const player = getPlayer(id);
  const insertPlot = db.prepare(`
    INSERT OR IGNORE INTO farm_plots (player_id, row_idx, col_idx) VALUES (?, ?, ?)
  `);
  const initFarm = db.transaction(() => {
    for (let r = 0; r < player.max_farm_rows; r++) {
      for (let c = 0; c < player.max_farm_cols; c++) {
        insertPlot.run(id, r, c);
      }
    }
  });
  initFarm();

  return getPlayer(id);
}

function getPlayer(id) {
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(id);
  if (!player) return null;
  const levelInfo = getLevelInfo(player.exp);
  return { ...player, ...levelInfo };
}

function updatePlayerName(id, name) {
  db.prepare('UPDATE players SET name = ? WHERE id = ?').run(name, id);
  return getPlayer(id);
}

function updatePlayerAvatar(id, avatarIndex) {
  db.prepare('UPDATE players SET avatar_index = ? WHERE id = ?').run(avatarIndex, id);
  return getPlayer(id);
}

function addExp(id, amount) {
  db.prepare('UPDATE players SET exp = exp + ? WHERE id = ?').run(amount, id);
  const player = getPlayer(id);
  // 检查是否升级
  const oldLevel = db.prepare('SELECT level FROM players WHERE id = ?').get(id).level;
  if (player.level > oldLevel) {
    db.prepare('UPDATE players SET level = ? WHERE id = ?').run(player.level, id);
  }
  return getPlayer(id);
}

function addGold(id, amount) {
  db.prepare('UPDATE players SET gold = gold + ? WHERE id = ?').run(amount, id);
  return getPlayer(id);
}

// ==================== 农田 API ====================

function getFarmPlots(playerId) {
  return db.prepare('SELECT * FROM farm_plots WHERE player_id = ? ORDER BY row_idx, col_idx').all(playerId);
}

function plantCrop(playerId, rowIdx, colIdx, cropId) {
  const player = getPlayer(playerId);
  if (!player) throw new Error('玩家不存在');

  // 检查作物是否解锁
  const crop = db.prepare('SELECT * FROM crops WHERE id = ?').get(cropId);
  if (!crop) throw new Error('作物不存在');
  if (crop.unlock_level > player.level) throw new Error('等级不足，无法种植该作物');

  // 检查格子是否为空且在范围内
  const plot = db.prepare(
    'SELECT * FROM farm_plots WHERE player_id = ? AND row_idx = ? AND col_idx = ?'
  ).get(playerId, rowIdx, colIdx);
  if (!plot) throw new Error('农田格子不存在，请先升级农田');
  if (plot.crop_id) throw new Error('该格子已有作物');

  // 检查背包是否有种子
  const inv = db.prepare(
    'SELECT * FROM inventory WHERE player_id = ? AND item_type = ? AND item_id = ?'
  ).get(playerId, 'seed', cropId);
  if (!inv || inv.quantity <= 0) throw new Error('没有足够的种子');

  // 扣除种子
  if (inv.quantity === 1) {
    db.prepare('DELETE FROM inventory WHERE id = ?').run(inv.id);
  } else {
    db.prepare('UPDATE inventory SET quantity = quantity - 1 WHERE id = ?').run(inv.id);
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE farm_plots SET crop_id = ?, planted_at = ?, watered_at = ?, growth_stage = 0, is_watered = 0, is_ready = 0
    WHERE player_id = ? AND row_idx = ? AND col_idx = ?
  `).run(cropId, now, now, playerId, rowIdx, colIdx);

  return getFarmPlots(playerId);
}

function waterPlot(playerId, rowIdx, colIdx) {
  const plot = db.prepare(
    'SELECT * FROM farm_plots WHERE player_id = ? AND row_idx = ? AND col_idx = ?'
  ).get(playerId, rowIdx, colIdx);
  if (!plot) throw new Error('格子不存在');
  if (!plot.crop_id) throw new Error('该格子没有作物');
  if (plot.is_ready) throw new Error('作物已成熟，无需浇水');
  if (plot.is_watered) throw new Error('今天已经浇过水了');

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE farm_plots SET is_watered = 1, watered_at = ? WHERE player_id = ? AND row_idx = ? AND col_idx = ?
  `).run(now, playerId, rowIdx, colIdx);

  return getFarmPlots(playerId);
}

function waterAllPlots(playerId) {
  const plots = db.prepare(
    'SELECT * FROM farm_plots WHERE player_id = ? AND crop_id IS NOT NULL AND is_ready = 0 AND is_watered = 0'
  ).all(playerId);

  if (plots.length === 0) throw new Error('没有需要浇水的作物');

  const now = new Date().toISOString();
  const waterAll = db.transaction(() => {
    for (const p of plots) {
      db.prepare(`
        UPDATE farm_plots SET is_watered = 1, watered_at = ? WHERE id = ?
      `).run(now, p.id);
    }
  });
  waterAll();

  return getFarmPlots(playerId);
}

function harvestPlot(playerId, rowIdx, colIdx) {
  const plot = db.prepare(
    'SELECT * FROM farm_plots WHERE player_id = ? AND row_idx = ? AND col_idx = ?'
  ).get(playerId, rowIdx, colIdx);
  if (!plot) throw new Error('格子不存在');
  if (!plot.crop_id) throw new Error('该格子没有作物');
  if (!plot.is_ready) throw new Error('作物尚未成熟');

  const crop = db.prepare('SELECT * FROM crops WHERE id = ?').get(plot.crop_id);

  // 收获：加入背包
  const existing = db.prepare(
    'SELECT * FROM inventory WHERE player_id = ? AND item_type = ? AND item_id = ?'
  ).get(playerId, 'harvest', plot.crop_id);

  if (existing) {
    db.prepare('UPDATE inventory SET quantity = quantity + 1 WHERE id = ?').run(existing.id);
  } else {
    db.prepare(`
      INSERT INTO inventory (player_id, item_type, item_id, quantity) VALUES (?, 'harvest', ?, 1)
    `).run(playerId, plot.crop_id);
  }

  // 清空格子
  db.prepare(`
    UPDATE farm_plots SET crop_id = NULL, planted_at = NULL, watered_at = NULL, growth_stage = 0, is_watered = 0, is_ready = 0
    WHERE player_id = ? AND row_idx = ? AND col_idx = ?
  `).run(playerId, rowIdx, colIdx);

  // 增加经验和金币
  addExp(playerId, crop.exp_reward);
  addGold(playerId, crop.sell_price);

  return {
    plots: getFarmPlots(playerId),
    player: getPlayer(playerId),
    harvested: crop,
  };
}

function harvestAll(playerId) {
  const plots = db.prepare(
    'SELECT * FROM farm_plots WHERE player_id = ? AND is_ready = 1'
  ).all(playerId);

  if (plots.length === 0) throw new Error('没有可收获的作物');

  let totalGold = 0;
  let totalExp = 0;
  const harvested = [];

  const harvestAllTx = db.transaction(() => {
    for (const plot of plots) {
      const crop = db.prepare('SELECT * FROM crops WHERE id = ?').get(plot.crop_id);
      const existing = db.prepare(
        'SELECT * FROM inventory WHERE player_id = ? AND item_type = ? AND item_id = ?'
      ).get(playerId, 'harvest', plot.crop_id);

      if (existing) {
        db.prepare('UPDATE inventory SET quantity = quantity + 1 WHERE id = ?').run(existing.id);
      } else {
        db.prepare(`
          INSERT INTO inventory (player_id, item_type, item_id, quantity) VALUES (?, 'harvest', ?, 1)
        `).run(playerId, plot.crop_id);
      }

      db.prepare(`
        UPDATE farm_plots SET crop_id = NULL, planted_at = NULL, watered_at = NULL, growth_stage = 0, is_watered = 0, is_ready = 0
        WHERE id = ?
      `).run(plot.id);

      totalGold += crop.sell_price;
      totalExp += crop.exp_reward;
      harvested.push(crop);
    }
  });
  harvestAllTx();

  db.prepare('UPDATE players SET gold = gold + ?, exp = exp + ? WHERE id = ?').run(totalGold, totalExp, playerId);

  return {
    plots: getFarmPlots(playerId),
    player: getPlayer(playerId),
    harvested,
    totalGold,
    totalExp,
  };
}

// ==================== 生长系统 ====================

function updateGrowth() {
  const plots = db.prepare(
    'SELECT fp.*, c.grow_time, c.stages FROM farm_plots fp JOIN crops c ON fp.crop_id = c.id WHERE fp.crop_id IS NOT NULL AND fp.is_ready = 0'
  ).all();

  const now = new Date();
  const updated = db.transaction(() => {
    for (const plot of plots) {
      const plantedAt = new Date(plot.planted_at);
      const wateredAt = plot.watered_at ? new Date(plot.watered_at) : plantedAt;
      const effectiveStart = wateredAt > plantedAt ? plantedAt : plantedAt;

      // 计算经过的时间（秒）
      let elapsed = (now - plantedAt) / 1000;

      // 浇水加速：每次浇水减少20%生长时间
      if (plot.is_watered) {
        elapsed *= config.growth.waterSpeedMultiplier;
      }

      const timePerStage = plot.grow_time / plot.stages;
      const stage = Math.min(Math.floor(elapsed / timePerStage), plot.stages - 1);

      const isReady = stage >= plot.stages - 1;

      db.prepare(`
        UPDATE farm_plots SET growth_stage = ?, is_ready = ? WHERE id = ?
      `).run(stage, isReady ? 1 : 0, plot.id);
    }
  });
  updated();
}

// ==================== 背包 API ====================

function getInventory(playerId) {
  const items = db.prepare('SELECT * FROM inventory WHERE player_id = ?').all(playerId);
  return items.map(item => {
    let detail = {};
    if (item.item_type === 'seed') {
      const crop = db.prepare('SELECT * FROM crops WHERE id = ?').get(item.item_id);
      detail = crop ? { name: crop.name, emoji: crop.emoji_seed } : {};
    } else if (item.item_type === 'harvest') {
      const crop = db.prepare('SELECT * FROM crops WHERE id = ?').get(item.item_id);
      detail = crop ? { name: crop.name, emoji: crop.emoji_ready } : {};
    } else if (item.item_type === 'tool') {
      const shop = db.prepare('SELECT * FROM shop_items WHERE item_id = ?').get(item.item_id);
      detail = shop ? { name: shop.name, emoji: shop.emoji, description: shop.description } : {};
    }
    return { ...item, ...detail };
  });
}

// ==================== 商店 API ====================

function getShopItems(playerId) {
  const player = getPlayer(playerId);
  const items = db.prepare('SELECT * FROM shop_items').all();
  return items.map(item => ({
    ...item,
    locked: item.unlock_level > player.level,
  }));
}

function buyItem(playerId, shopItemId, quantity = 1) {
  const player = getPlayer(playerId);
  const shopItem = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(shopItemId);
  if (!shopItem) throw new Error('商品不存在');
  if (shopItem.unlock_level > player.level) throw new Error('等级不足，无法购买');
  if (shopItem.max_buy !== -1) {
    const owned = db.prepare(
      'SELECT quantity FROM inventory WHERE player_id = ? AND item_type = ? AND item_id = ?'
    ).get(playerId, shopItem.item_type, shopItem.item_id);
    if (owned && owned.quantity >= shopItem.max_buy) throw new Error('已达到购买上限');
  }

  const totalCost = shopItem.price * quantity;
  if (player.gold < totalCost) throw new Error('金币不足');

  // 扣除金币
  addGold(playerId, -totalCost);

  // 添加到背包
  const existing = db.prepare(
    'SELECT * FROM inventory WHERE player_id = ? AND item_type = ? AND item_id = ?'
  ).get(playerId, shopItem.item_type, shopItem.item_id);

  if (existing) {
    db.prepare('UPDATE inventory SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
  } else {
    db.prepare(`
      INSERT INTO inventory (player_id, item_type, item_id, quantity) VALUES (?, ?, ?, ?)
    `).run(playerId, shopItem.item_type, shopItem.item_id, quantity);
  }

  return {
    player: getPlayer(playerId),
    inventory: getInventory(playerId),
  };
}

function sellItem(playerId, itemType, itemId, quantity = 1) {
  const inv = db.prepare(
    'SELECT * FROM inventory WHERE player_id = ? AND item_type = ? AND item_id = ?'
  ).get(playerId, itemType, itemId);
  if (!inv || inv.quantity < quantity) throw new Error('物品不足');

  let sellPrice = 0;
  if (itemType === 'harvest') {
    const crop = db.prepare('SELECT sell_price FROM crops WHERE id = ?').get(itemId);
    sellPrice = crop ? crop.sell_price * quantity : 0;
  }

  if (sellPrice === 0) throw new Error('该物品无法出售');

  // 扣除物品
  if (inv.quantity === quantity) {
    db.prepare('DELETE FROM inventory WHERE id = ?').run(inv.id);
  } else {
    db.prepare('UPDATE inventory SET quantity = quantity - ? WHERE id = ?').run(quantity, inv.id);
  }

  addGold(playerId, sellPrice);

  return {
    player: getPlayer(playerId),
    inventory: getInventory(playerId),
    earned: sellPrice,
  };
}

// ==================== 农田升级 API ====================

function getFarmUpgrades(playerId) {
  const player = getPlayer(playerId);
  const upgrades = db.prepare('SELECT * FROM farm_upgrades ORDER BY level').all();
  return upgrades.map(u => ({
    ...u,
    current: u.level === player.farm_level,
    affordable: player.gold >= u.cost && player.level >= u.required_player_level,
    locked: player.level < u.required_player_level,
  }));
}

function upgradeFarm(playerId) {
  const player = getPlayer(playerId);
  const currentLevel = player.farm_level;

  const nextUpgrade = db.prepare('SELECT * FROM farm_upgrades WHERE level = ?').get(currentLevel + 1);
  if (!nextUpgrade) throw new Error('农田已达最高等级');

  if (player.gold < nextUpgrade.cost) throw new Error('金币不足');
  if (player.level < nextUpgrade.required_player_level) throw new Error('玩家等级不足');

  addGold(playerId, -nextUpgrade.cost);
  db.prepare(`
    UPDATE players SET farm_level = ?, max_farm_rows = ?, max_farm_cols = ? WHERE id = ?
  `).run(nextUpgrade.level, nextUpgrade.rows, nextUpgrade.cols, playerId);

  // 添加新的农田格子
  const insertPlot = db.prepare(`
    INSERT OR IGNORE INTO farm_plots (player_id, row_idx, col_idx) VALUES (?, ?, ?)
  `);
  const addPlots = db.transaction(() => {
    for (let r = 0; r < nextUpgrade.rows; r++) {
      for (let c = 0; c < nextUpgrade.cols; c++) {
        insertPlot.run(playerId, r, c);
      }
    }
  });
  addPlots();

  return {
    player: getPlayer(playerId),
    plots: getFarmPlots(playerId),
  };
}

// ==================== 时间系统 ====================

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const SEASON_NAMES = { spring: '春天', summer: '夏天', autumn: '秋天', winter: '冬天' };
const SEASON_EMOJI = { spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' };

function getGameTime() {
  const time = db.prepare('SELECT * FROM game_time WHERE id = 1').get();
  return {
    ...time,
    seasonName: SEASON_NAMES[time.season],
    seasonEmoji: SEASON_EMOJI[time.season],
    timeStr: `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`,
  };
}

function advanceTime(minutes = 10) {
  const time = db.prepare('SELECT * FROM game_time WHERE id = 1').get();
  let newMinute = time.minute + minutes;
  let newHour = time.hour;
  let newDay = time.day;
  let newSeason = time.season;

  while (newMinute >= 60) {
    newMinute -= 60;
    newHour++;
  }
  while (newHour >= 24) {
    newHour -= 24;
    newDay++;
  }
  // 每 N 天换季
  const seasonIdx = Math.floor((newDay - 1) / config.time.daysPerSeason) % 4;
  newSeason = SEASONS[seasonIdx];

  db.prepare(`
    UPDATE game_time SET day = ?, season = ?, hour = ?, minute = ?, last_tick = datetime('now') WHERE id = 1
  `).run(newDay, newSeason, newHour, newMinute);

  // 新的一天重置浇水状态
  const oldDay = time.day;
  if (newDay > oldDay) {
    db.prepare('UPDATE farm_plots SET is_watered = 0 WHERE is_watered = 1').run();
  }

  // 更新作物生长
  updateGrowth();

  return getGameTime();
}

function sleepAdvance(playerId) {
  // 睡觉：时间前进到第二天早上6点
  const time = db.prepare('SELECT * FROM game_time WHERE id = 1').get();
  const hoursToAdvance = 24 - time.hour + 6;
  advanceTime(hoursToAdvance * config.time.sleepMinutesPerHour);

  return {
    time: getGameTime(),
    plots: getFarmPlots(playerId),
    player: getPlayer(playerId),
  };
}

// ==================== 使用道具 ====================

function useTool(playerId, toolId, rowIdx, colIdx) {
  const inv = db.prepare(
    'SELECT * FROM inventory WHERE player_id = ? AND item_type = ? AND item_id = ?'
  ).get(playerId, 'tool', toolId);
  if (!inv || inv.quantity <= 0) throw new Error('没有该道具');

  if (toolId === 'fertilizer') {
    const plot = db.prepare(
      'SELECT * FROM farm_plots WHERE player_id = ? AND row_idx = ? AND col_idx = ?'
    ).get(playerId, rowIdx, colIdx);
    if (!plot || !plot.crop_id) throw new Error('请选择有作物的格子');
    if (plot.is_ready) throw new Error('作物已成熟');

    // 肥料效果：将种植时间提前一定比例
    const plantedAt = new Date(plot.planted_at);
    const newPlantedAt = new Date(plantedAt.getTime() - (plot.grow_time || 120) * 1000 * config.tools.fertilizerTimeReduction);
    db.prepare('UPDATE farm_plots SET planted_at = ? WHERE id = ?').run(newPlantedAt.toISOString(), plot.id);

    // 消耗道具
    if (inv.quantity === 1) {
      db.prepare('DELETE FROM inventory WHERE id = ?').run(inv.id);
    } else {
      db.prepare('UPDATE inventory SET quantity = quantity - 1 WHERE id = ?').run(inv.id);
    }

    updateGrowth();
    return { plots: getFarmPlots(playerId), inventory: getInventory(playerId) };
  }

  if (toolId === 'speed_grow') {
    const plot = db.prepare(
      'SELECT * FROM farm_plots WHERE player_id = ? AND row_idx = ? AND col_idx = ?'
    ).get(playerId, rowIdx, colIdx);
    if (!plot || !plot.crop_id) throw new Error('请选择有作物的格子');
    if (plot.is_ready) throw new Error('作物已成熟');

    db.prepare('UPDATE farm_plots SET is_ready = 1, growth_stage = ? WHERE id = ?').run(config.tools.speedGrowTargetStage, plot.id);

    if (inv.quantity === 1) {
      db.prepare('DELETE FROM inventory WHERE id = ?').run(inv.id);
    } else {
      db.prepare('UPDATE inventory SET quantity = quantity - 1 WHERE id = ?').run(inv.id);
    }

    return { plots: getFarmPlots(playerId), inventory: getInventory(playerId) };
  }

  throw new Error('未知道具');
}

// ==================== 作物信息 ====================

function getCropInfo(cropId) {
  return db.prepare('SELECT * FROM crops WHERE id = ?').get(cropId);
}

function getAllCrops() {
  return db.prepare('SELECT * FROM crops ORDER BY unlock_level, seed_price').all();
}

// ==================== 测试：手动设置生长阶段 ====================

function setPlotStage(playerId, rowIdx, colIdx, targetStage) {
  const plot = db.prepare('SELECT * FROM farm_plots WHERE player_id = ? AND row_idx = ? AND col_idx = ?').get(playerId, rowIdx, colIdx);
  if (!plot || !plot.crop_id) throw new Error('该格子没有作物');

  const crop = db.prepare('SELECT * FROM crops WHERE id = ?').get(plot.crop_id);
  if (!crop) throw new Error('作物不存在');

  const stage = Math.max(0, Math.min(targetStage, crop.stages - 1));
  const isReady = stage >= crop.stages - 1;

  db.prepare(`
    UPDATE farm_plots SET growth_stage = ?, is_ready = ? WHERE id = ?
  `).run(stage, isReady ? 1 : 0, plot.id);

  return db.prepare('SELECT * FROM farm_plots WHERE id = ?').get(plot.id);
}

module.exports = {
  createPlayer,
  getPlayer,
  updatePlayerName,
  updatePlayerAvatar,
  addExp,
  addGold,
  getFarmPlots,
  plantCrop,
  waterPlot,
  waterAllPlots,
  harvestPlot,
  harvestAll,
  updateGrowth,
  getInventory,
  getShopItems,
  buyItem,
  sellItem,
  getFarmUpgrades,
  upgradeFarm,
  getGameTime,
  advanceTime,
  sleepAdvance,
  useTool,
  getCropInfo,
  getAllCrops,
  setPlotStage,
  expForLevel,
};
