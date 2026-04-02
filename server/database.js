const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'farm.db'));

// 启用 WAL 模式提升性能
db.pragma('journal_mode = WAL');

// ==================== 建表 ====================

db.exec(`
  -- 玩家表
  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '农夫',
    level INTEGER NOT NULL DEFAULT 1,
    exp INTEGER NOT NULL DEFAULT 0,
    gold INTEGER NOT NULL DEFAULT 100,
    farm_level INTEGER NOT NULL DEFAULT 1,
    max_farm_rows INTEGER NOT NULL DEFAULT 3,
    max_farm_cols INTEGER NOT NULL DEFAULT 3,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- 农田格子表
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

const initCrops = db.prepare('SELECT COUNT(*) as cnt FROM crops').get();
if (initCrops.cnt === 0) {
  const insertCrop = db.prepare(`
    INSERT INTO crops (id, name, grow_time, seed_price, sell_price, exp_reward, unlock_level, stages, emoji_seed, emoji_sprout, emoji_growing, emoji_ready)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const crops = [
    ['wheat',     '小麦',   60,  10,  25,  5,   1, 4, '🟡', '🌱', '🌿', '🌾'],
    ['carrot',    '胡萝卜', 90,  15,  40,  8,   1, 4, '🟠', '🌱', '🌿', '🥕'],
    ['tomato',    '番茄',   120, 20,  55,  12,  2, 4, '🔴', '🌱', '🌿', '🍅'],
    ['corn',      '玉米',   150, 25,  70,  15,  3, 4, '🟡', '🌱', '🌿', '🌽'],
    ['pumpkin',   '南瓜',   200, 40, 110, 25,  5, 4, '🟤', '🌱', '🌿', '🎃'],
    ['strawberry','草莓',   180, 35,  90,  20,  4, 4, '🔴', '🌱', '🌿', '🍓'],
    ['potato',    '土豆',   100, 18,  48,  10,  2, 4, '🟤', '🌱', '🌿', '🥔'],
    ['sunflower', '向日葵', 240, 50, 140, 30,  7, 4, '🟡', '🌱', '🌿', '🌻'],
    ['grape',     '葡萄',   300, 60, 180, 40,  9, 4, '🟣', '🌱', '🌿', '🍇'],
    ['melon',     '西瓜',   360, 80, 250, 50, 12, 4, '🟢', '🌱', '🌿', '🍉'],
    ['golden_apple','金苹果',480, 150, 500, 100, 15, 4, '✨', '🌱', '🌿', '🍎'],
    ['star_fruit','杨桃',   420, 120, 380, 80,  13, 4, '⭐', '🌱', '🌿', '🌟'],
  ];

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

  const items = [
    ['seed_wheat',      '小麦种子',   '基础作物，生长快速',       10,  'seed', 'wheat',      1, -1, '🟡'],
    ['seed_carrot',     '胡萝卜种子', '常见的根茎作物',           15,  'seed', 'carrot',     1, -1, '🟠'],
    ['seed_tomato',     '番茄种子',   '需要一定经验才能种植',     20,  'seed', 'tomato',     2, -1, '🔴'],
    ['seed_potato',     '土豆种子',   '产量稳定的块茎作物',       18,  'seed', 'potato',     2, -1, '🟤'],
    ['seed_strawberry', '草莓种子',   '甜美多汁的浆果',           35,  'seed', 'strawberry', 4, -1, '🍓'],
    ['seed_corn',       '玉米种子',   '高大的谷物作物',           25,  'seed', 'corn',       3, -1, '🌽'],
    ['seed_pumpkin',    '南瓜种子',   '秋季的丰收之果',           40,  'seed', 'pumpkin',    5, -1, '🎃'],
    ['seed_sunflower',  '向日葵种子', '追逐阳光的花朵',           50,  'seed', 'sunflower',  7, -1, '🌻'],
    ['seed_grape',      '葡萄种子',   '藤蔓上的美味',             60,  'seed', 'grape',      9, -1, '🍇'],
    ['seed_melon',      '西瓜种子',   '夏日消暑必备',             80,  'seed', 'melon',     12, -1, '🍉'],
    ['seed_star_fruit', '杨桃种子',   '热带珍稀水果',             120, 'seed', 'star_fruit', 13, -1, '⭐'],
    ['seed_golden_apple','金苹果种子','传说中的神果',              150, 'seed', 'golden_apple',15, -1, '✨'],
    ['fertilizer',      '肥料',       '使作物生长速度提升50%',    30,  'tool', 'fertilizer',  3, -1, '🧪'],
    ['watering_can_up', '高级水壶',   '一次浇灌整行作物',         200, 'tool', 'watering_can_up', 5, 1, '🚿'],
    ['speed_grow',      '催熟剂',     '立即使一块田的作物成熟',    80,  'tool', 'speed_grow',  8, -1, '⚡'],
  ];

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

  const upgrades = [
    [1, 3, 3, 0, 1],
    [2, 4, 4, 500, 3],
    [3, 5, 5, 1500, 5],
    [4, 6, 6, 4000, 8],
    [5, 7, 7, 10000, 11],
    [6, 8, 8, 25000, 15],
  ];

  const insertMany = db.transaction((items) => {
    for (const u of items) insertUpgrade.run(...u);
  });
  insertMany(upgrades);
}

// 初始化游戏时间
const initTime = db.prepare('SELECT COUNT(*) as cnt FROM game_time').get();
if (initTime.cnt === 0) {
  db.prepare(`INSERT INTO game_time (id, day, season, hour, minute) VALUES (1, 1, 'spring', 6, 0)`).run();
}

module.exports = db;
