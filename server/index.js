// 修复 Windows 控制台中文乱码
if (process.platform === 'win32') {
  process.stdout.setDefaultEncoding?.('utf8');
  process.stderr.setDefaultEncoding?.('utf8');
}

const express = require('express');
const cors = require('cors');
const game = require('./gameLogic');

const app = express();
app.use(cors());
app.use(express.json());

// ==================== 玩家 ====================

app.post('/api/player', (req, res) => {
  try {
    const { name } = req.body;
    const player = game.createPlayer(name);
    res.json({ success: true, data: player });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/player/:id', (req, res) => {
  try {
    const player = game.getPlayer(req.params.id);
    if (!player) return res.status(404).json({ success: false, error: '玩家不存在' });
    res.json({ success: true, data: player });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.put('/api/player/:id/name', (req, res) => {
  try {
    const player = game.updatePlayerName(req.params.id, req.body.name);
    res.json({ success: true, data: player });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==================== 农田 ====================

app.get('/api/farm/:playerId', (req, res) => {
  try {
    const plots = game.getFarmPlots(req.params.playerId);
    res.json({ success: true, data: plots });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/farm/:playerId/plant', (req, res) => {
  try {
    const { row, col, cropId } = req.body;
    const plots = game.plantCrop(req.params.playerId, row, col, cropId);
    res.json({ success: true, data: plots });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/farm/:playerId/water', (req, res) => {
  try {
    const { row, col } = req.body;
    const plots = game.waterPlot(req.params.playerId, row, col);
    res.json({ success: true, data: plots });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/farm/:playerId/water-all', (req, res) => {
  try {
    const plots = game.waterAllPlots(req.params.playerId);
    res.json({ success: true, data: plots });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/farm/:playerId/harvest', (req, res) => {
  try {
    const { row, col } = req.body;
    const result = game.harvestPlot(req.params.playerId, row, col);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/farm/:playerId/harvest-all', (req, res) => {
  try {
    const result = game.harvestAll(req.params.playerId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/farm/:playerId/use-tool', (req, res) => {
  try {
    const { toolId, row, col } = req.body;
    const result = game.useTool(req.params.playerId, toolId, row, col);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==================== 背包 ====================

app.get('/api/inventory/:playerId', (req, res) => {
  try {
    const items = game.getInventory(req.params.playerId);
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==================== 商店 ====================

app.get('/api/shop/:playerId', (req, res) => {
  try {
    const items = game.getShopItems(req.params.playerId);
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/shop/:playerId/buy', (req, res) => {
  try {
    const { shopItemId, quantity } = req.body;
    const result = game.buyItem(req.params.playerId, shopItemId, quantity || 1);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/shop/:playerId/sell', (req, res) => {
  try {
    const { itemType, itemId, quantity } = req.body;
    const result = game.sellItem(req.params.playerId, itemType, itemId, quantity || 1);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==================== 农田升级 ====================

app.get('/api/farm-upgrades/:playerId', (req, res) => {
  try {
    const upgrades = game.getFarmUpgrades(req.params.playerId);
    res.json({ success: true, data: upgrades });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/farm-upgrades/:playerId/upgrade', (req, res) => {
  try {
    const result = game.upgradeFarm(req.params.playerId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==================== 时间系统 ====================

app.get('/api/time', (req, res) => {
  try {
    const time = game.getGameTime();
    res.json({ success: true, data: time });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/time/advance', (req, res) => {
  try {
    const { minutes } = req.body;
    const time = game.advanceTime(minutes || 10);
    res.json({ success: true, data: time });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/time/sleep/:playerId', (req, res) => {
  try {
    const result = game.sleepAdvance(req.params.playerId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==================== 作物信息 ====================

app.get('/api/crops', (req, res) => {
  try {
    const crops = game.getAllCrops();
    res.json({ success: true, data: crops });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/crops/:cropId', (req, res) => {
  try {
    const crop = game.getCropInfo(req.params.cropId);
    if (!crop) return res.status(404).json({ success: false, error: '作物不存在' });
    res.json({ success: true, data: crop });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ==================== 自动生长定时器 ====================

setInterval(() => {
  try {
    game.updateGrowth();
  } catch (e) {
    console.error('生长更新错误:', e.message);
  }
}, 5000); // 每5秒更新一次生长

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🌾 种田游戏服务器运行在 http://localhost:${PORT}`);
});
