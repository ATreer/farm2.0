const Database = require('better-sqlite3');
const path = require('path');
const config = require('./config/gameConfig');

const db = new Database(path.join(__dirname, 'farm.db'));

// 启用 WAL 模式提升性能
db.pragma('journal_mode = WAL');

// ==================== 建表 ====================

db.exec(`
  -- 玩家表
  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '${config.player.defaultName}',
    level INTEGER NOT NULL DEFAULT ${config.player.initialLevel},
    exp INTEGER NOT NULL DEFAULT ${config.player.initialExp},
    gold INTEGER NOT NULL DEFAULT ${config.player.initialGold},
    farm_level INTEGER NOT NULL DEFAULT ${config.farm.initialLevel},
    max_farm_rows INTEGER NOT NULL DEFAULT ${config.farm.initialRows},
    max_farm_cols INTEGER NOT NULL DEFAULT ${config.farm.initialCols},
    created_at TEXT DEFAULT (datetime('now')),
    avatar_index INTEGER NOT NULL DEFAULT 0,
    avatar_frame TEXT DEFAULT NULL
  );

  -- 头像框定义表
  CREATE TABLE IF NOT EXISTS avatar_frames (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    min_level INTEGER NOT NULL DEFAULT 1,
    image_url TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  -- 玩家设置表（key-value）
  CREATE TABLE IF NOT EXISTS player_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value TEXT NOT NULL DEFAULT '',
    UNIQUE(player_id, setting_key)
  );
  CREATE TABLE IF NOT EXISTS farm_plots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    row_idx INTEGER NOT NULL,
    col_idx INTEGER NOT NULL,
    crop_id TEXT,
    planted_at TEXT,
    watered_at TEXT,
    growth_stage INTEGER DEFAULT 0,
    is_watered INTEGER DEFAULT 0,
    is_ready INTEGER DEFAULT 0,
    UNIQUE(player_id, row_idx, col_idx)
  );

  -- 作物定义表
  CREATE TABLE IF NOT EXISTS crops (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    grow_time INTEGER NOT NULL,
    seed_price INTEGER NOT NULL,
    sell_price INTEGER NOT NULL,
    exp_reward INTEGER NOT NULL,
    unlock_level INTEGER DEFAULT 1,
    stages INTEGER DEFAULT 4,
    rarity INTEGER DEFAULT 1,
    season TEXT DEFAULT 'spring',
    description TEXT DEFAULT '',
    emoji_seed TEXT,
    emoji_sprout TEXT,
    emoji_growing TEXT,
    emoji_ready TEXT
  );

  -- 背包表
  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    item_type TEXT NOT NULL,
    item_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    UNIQUE(player_id, item_type, item_id)
  );

  -- 商店物品表
  CREATE TABLE IF NOT EXISTS shop_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    item_type TEXT NOT NULL,
    item_id TEXT NOT NULL,
    unlock_level INTEGER DEFAULT 1,
    max_buy INTEGER DEFAULT -1,
    emoji TEXT
  );

  -- 农田升级配置表
  CREATE TABLE IF NOT EXISTS farm_upgrades (
    level INTEGER PRIMARY KEY,
    rows INTEGER NOT NULL,
    cols INTEGER NOT NULL,
    cost INTEGER NOT NULL,
    required_player_level INTEGER NOT NULL
  );

  -- 游戏时间表
  CREATE TABLE IF NOT EXISTS game_time (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    day INTEGER NOT NULL DEFAULT 1,
    season TEXT NOT NULL DEFAULT 'spring',
    hour INTEGER NOT NULL DEFAULT 6,
    minute INTEGER NOT NULL DEFAULT 0,
    last_tick TEXT DEFAULT (datetime('now'))
  );
`);

// ==================== 初始化种子数据 ====================

// 迁移：为已有 crops 表添加新字段
try { db.exec(`ALTER TABLE crops ADD COLUMN rarity INTEGER DEFAULT 1`); } catch(e) {}
try { db.exec(`ALTER TABLE crops ADD COLUMN season TEXT DEFAULT 'spring'`); } catch(e) {}
try { db.exec(`ALTER TABLE crops ADD COLUMN description TEXT DEFAULT ''`); } catch(e) {}
try { db.exec(`ALTER TABLE players ADD COLUMN avatar_index INTEGER DEFAULT 0`); } catch(e) {}
try { db.exec(`ALTER TABLE players ADD COLUMN avatar_frame TEXT DEFAULT NULL`); } catch(e) {}

// 初始化头像框数据
const initFrames = db.prepare('SELECT COUNT(*) as cnt FROM avatar_frames').get();
if (initFrames.cnt === 0) {
  const insertFrame = db.prepare(`INSERT INTO avatar_frames (id, name, min_level, image_url, sort_order) VALUES (?, ?, ?, ?, ?)`);
  const frames = [
    ['broken',   '破碎头像框',     1,  '/avatar-frames/broken.png',   1],
    ['platinum', '白金头像框(测试)', 2,  '/avatar-frames/platinum.png', 2],
    ['bronze',   '青铜头像框',     5,  '/avatar-frames/bronze.png',   3],
    ['silver',   '白银头像框',     10, '/avatar-frames/silver.png',   4],
    ['gold',     '黄金头像框',     15, '/avatar-frames/gold.png',     5],
  ];
  const insertFrames = db.transaction((items) => { for (const f of items) insertFrame.run(...f); });
  insertFrames(frames);
}

const initCrops = db.prepare('SELECT COUNT(*) as cnt FROM crops').get();
if (initCrops.cnt === 0) {
  const insertCrop = db.prepare(`
    INSERT INTO crops (id, name, grow_time, seed_price, sell_price, exp_reward, unlock_level, stages, rarity, season, description, emoji_seed, emoji_sprout, emoji_growing, emoji_ready)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const crops = config.crops;

  const insertMany = db.transaction((items) => {
    for (const c of items) insertCrop.run(...c);
  });
  insertMany(crops);
}

const initShop = db.prepare('SELECT COUNT(*) as cnt FROM shop_items').get();
if (initShop.cnt === 0) {
  const insertShop = db.prepare(`
    INSERT INTO shop_items (id, name, description, price, item_type, item_id, unlock_level, max_buy, emoji)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const items = config.shopItems;

  const insertMany = db.transaction((items) => {
    for (const i of items) insertShop.run(...i);
  });
  insertMany(items);
}

const initUpgrades = db.prepare('SELECT COUNT(*) as cnt FROM farm_upgrades').get();
if (initUpgrades.cnt === 0) {
  const insertUpgrade = db.prepare(`
    INSERT INTO farm_upgrades (level, rows, cols, cost, required_player_level)
    VALUES (?, ?, ?, ?, ?)
  `);

  const upgrades = config.farmUpgrades;

  const insertMany = db.transaction((items) => {
    for (const u of items) insertUpgrade.run(...u);
  });
  insertMany(upgrades);
}

// 初始化游戏时间
const initTime = db.prepare('SELECT COUNT(*) as cnt FROM game_time').get();
if (initTime.cnt === 0) {
  const { day, season, hour, minute } = config.time.initial;
  db.prepare(`INSERT INTO game_time (id, day, season, hour, minute) VALUES (1, ?, ?, ?, ?)`).run(day, season, hour, minute);
}

module.exports = db;
