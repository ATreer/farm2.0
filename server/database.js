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
    avatar_frame TEXT DEFAULT NULL,
    mana INTEGER NOT NULL DEFAULT 50,
    max_mana INTEGER NOT NULL DEFAULT 50
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
  -- 技能定义表
  CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'active',
    max_level INTEGER NOT NULL DEFAULT 10,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  -- 技能等级配置表（每级的效果值）
  CREATE TABLE IF NOT EXISTS skill_levels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    skill_id TEXT NOT NULL,
    level INTEGER NOT NULL,
    mana_cost INTEGER NOT NULL DEFAULT 0,
    yield_bonus INTEGER NOT NULL DEFAULT 0,
    exp_required INTEGER NOT NULL DEFAULT 0,
    UNIQUE(skill_id, level)
  );

  -- 功法定义表
  CREATE TABLE IF NOT EXISTS techniques (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    max_level INTEGER NOT NULL DEFAULT 3,
    mana_bonus_percent INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  -- 功法等级配置表
  CREATE TABLE IF NOT EXISTS technique_levels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    technique_id TEXT NOT NULL,
    level INTEGER NOT NULL,
    mana_bonus_percent INTEGER NOT NULL DEFAULT 0,
    exp_required INTEGER NOT NULL DEFAULT 0,
    UNIQUE(technique_id, level)
  );

  -- 玩家技能表
  CREATE TABLE IF NOT EXISTS player_skills (
    player_id TEXT NOT NULL,
    skill_id TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    exp INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (player_id, skill_id)
  );

  -- 玩家功法表
  CREATE TABLE IF NOT EXISTS player_techniques (
    player_id TEXT NOT NULL,
    technique_id TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    exp INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (player_id, technique_id)
  );

  -- 土地品质定义表
  CREATE TABLE IF NOT EXISTS land_qualities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    yield_bonus_percent INTEGER NOT NULL DEFAULT 0,
    min_level INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  -- 玩家土地品质表
  CREATE TABLE IF NOT EXISTS player_land_quality (
    player_id TEXT NOT NULL,
    land_quality_id TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (player_id, land_quality_id)
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
try { db.exec(`ALTER TABLE players ADD COLUMN mana INTEGER DEFAULT 50`); } catch(e) {}
try { db.exec(`ALTER TABLE players ADD COLUMN max_mana INTEGER DEFAULT 50`); } catch(e) {}
try { db.exec(`ALTER TABLE farm_plots ADD COLUMN yield_bonus INTEGER DEFAULT 0`); } catch(e) {}

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

// ==================== 技能系统种子数据 ====================

// 技能定义
const initSkills = db.prepare('SELECT COUNT(*) as cnt FROM skills').get();
if (initSkills.cnt === 0) {
  const insertSkill = db.prepare(`INSERT INTO skills (id, name, type, max_level, sort_order) VALUES (?, ?, ?, ?, ?)`);
  insertSkill.run('spirit_rain', '灵雨术', 'active', 10, 1);
}

// 灵雨术等级配置
const initSkillLevels = db.prepare('SELECT COUNT(*) as cnt FROM skill_levels').get();
if (initSkillLevels.cnt === 0) {
  const insertSL = db.prepare(`INSERT INTO skill_levels (skill_id, level, mana_cost, yield_bonus, exp_required) VALUES (?, ?, ?, ?, ?)`);
  const levels = [
    ['spirit_rain', 1, 5, 10, 0],
    ['spirit_rain', 2, 8, 50, 50],
    ['spirit_rain', 3, 12, 100, 100],
    ['spirit_rain', 4, 18, 150, 200],
    ['spirit_rain', 5, 25, 200, 400],
    ['spirit_rain', 6, 35, 300, 600],
    ['spirit_rain', 7, 50, 400, 900],
    ['spirit_rain', 8, 70, 500, 1300],
    ['spirit_rain', 9, 100, 1000, 1800],
    ['spirit_rain', 10, 150, 2000, 2500],
  ];
  const insertManySL = db.transaction((items) => { for (const l of items) insertSL.run(...l); });
  insertManySL(levels);
}

// 功法定义
const initTechs = db.prepare('SELECT COUNT(*) as cnt FROM techniques').get();
if (initTechs.cnt === 0) {
  const insertTech = db.prepare(`INSERT INTO techniques (id, name, max_level, mana_bonus_percent, sort_order) VALUES (?, ?, ?, ?, ?)`);
  insertTech.run('qingxin', '清心决', 3, 10, 1);
}

// 功法等级配置
const initTechLevels = db.prepare('SELECT COUNT(*) as cnt FROM technique_levels').get();
if (initTechLevels.cnt === 0) {
  const insertTL = db.prepare(`INSERT INTO technique_levels (technique_id, level, mana_bonus_percent, exp_required) VALUES (?, ?, ?, ?)`);
  const tLevels = [
    ['qingxin', 1, 10, 0],
    ['qingxin', 2, 20, 100],
    ['qingxin', 3, 30, 500],
  ];
  const insertManyTL = db.transaction((items) => { for (const l of items) insertTL.run(...l); });
  insertManyTL(tLevels);
}

// 初始化土地品质数据
const initLandQ = db.prepare('SELECT COUNT(*) as cnt FROM land_qualities').get();
if (initLandQ.cnt === 0) {
  const insertLQ = db.prepare(`INSERT INTO land_qualities (id, name, yield_bonus_percent, min_level, sort_order) VALUES (?, ?, ?, ?, ?)`);
  const landQs = [
    ['normal',  '普通土地', 0,   1,  1],
    ['premium', '高级土地', 50,  10, 2],
    ['epic',    '史诗土地', 100, 20, 3],
  ];
  const insertManyLQ = db.transaction((items) => { for (const l of items) insertLQ.run(...l); });
  insertManyLQ(landQs);
}

// 迁移：为所有已有玩家补齐农田格子到 4×8
const migrateFarmPlots = db.prepare(`
  INSERT OR IGNORE INTO farm_plots (player_id, row_idx, col_idx)
  SELECT p.id, r.r, c.c
  FROM players p
  CROSS JOIN (SELECT 0 as r UNION SELECT 1 UNION SELECT 2 UNION SELECT 3) r
  CROSS JOIN (SELECT 0 as c UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7) c
`);
try { migrateFarmPlots.run(); } catch {}

// 迁移：更新所有玩家的 max_farm_rows/max_farm_cols 为 4/8
try { db.prepare('UPDATE players SET max_farm_rows = 4, max_farm_cols = 8 WHERE max_farm_rows < 4 OR max_farm_cols < 8').run(); } catch {}

module.exports = db;
