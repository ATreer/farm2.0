const zh = {
  // 通用
  appTitle: '像素农场',
  appSubtitle: '种下希望，收获快乐',
  startBtn: '开始种田',
  namePlaceholder: '输入你的名字',
  startTips: '种植 → 浇水 → 等待生长 → 收获 → 出售 → 升级',

  // 导航
  navFarm: '农场',
  navInventory: '背包',
  navShop: '商店',
  navUpgrade: '升级',
  navCharacter: '人物',
  navSettings: '设置',

  // 顶部栏
  exp: '经验',
  timeAdvance10: '+10分',
  timeAdvance60: '+1时',
  sleep: '睡觉',

  // 时间
  spring: '春天',
  summer: '夏天',
  autumn: '秋天',
  winter: '冬天',
  day: '第{n}天',

  // 农田
  myFarm: '我的农田',
  modePlant: '种植模式',
  modeWater: '浇水模式',
  modeHarvest: '收获模式',
  modeTool: '道具模式',
  modeView: '查看模式',
  waterAll: '全部浇水',
  harvestAll: '全部收获',
  selectSeed: '选择种子：',
  noSeeds: '背包中没有种子，去商店购买吧！',
  dragHint: '拖拽种子到农田种植，或点击直接种植',
  selectTool: '选择道具：',
  noTools: '背包中没有道具',
  plantSuccess: '种下了{name}',
  waterSuccess: '浇水成功！生长速度提升',
  harvestSuccess: '收获了{name}！+{gold}💰 +{exp}EXP',
  harvestAllSuccess: '收获了 {count} 个作物！+{gold}💰 +{exp}EXP',
  toolSuccess: '使用道具成功！',

  // 农场概况
  farmOverview: '农场概况',
  totalPlots: '总面积',
  planted: '已种植',
  watered: '已浇水',
  ready: '可收获',
  empty: '空闲',
  unit: '格',

  // 作物信息
  growTime: '生长时间',
  growStage: '生长阶段',
  sellPrice: '出售价格',
  expReward: '经验奖励',
  waterStatus: '浇水状态',
  readyStatus: '成熟状态',
  wateredYes: '已浇水',
  wateredNo: '未浇水',
  readyYes: '已成熟',
  readyNo: '生长中',
  position: '位置',
  second: '秒',
  testStage: '测试阶段',
  nextStage: '下一阶段',
  maxStage: '已满级',

  // 背包
  inventory: '背包',
  itemTypes: '种物品',
  all: '全部',
  seeds: '种子',
  harvest: '收获',
  tools: '道具',
  emptyInventory: '背包空空如也...',
  sell: '出售',
  sellAll: '全部',
  sellSuccess: '出售成功！+{gold}💰',
  sellAllSuccess: '全部出售成功！+{gold}💰',
  cannotSell: '只有收获物可以出售',
  typeSeed: '种子',
  typeHarvest: '收获',
  typeTool: '道具',

  // 商店
  shop: '商店',
  currentGold: '当前金币',
  buyQty: '购买数量：',
  buy: '购买',
  locked: '需要 Lv.{level} 解锁',
  description: '描述',

  // 升级
  farmUpgrade: '农田升级',
  currentLevel: '当前农田等级',
  nextUpgrade: '下一级升级',
  need: '需要',
  upgrade: '升级',
  upgradeSuccess: '农田升级成功！现在 {rows}×{cols}',
  upgradeRoute: '升级路线',
  maxLevel: '农田已达最高等级！',
  totalPlotsLabel: '块农田',

  // 人物
  characterInfo: '人物信息',
  name: '名字',
  level: '等级',
  title: '称号',
  experience: '经验',
  gold: '金币',
  farmLevel: '农田等级',
  farmSize: '农田大小',
  createdAt: '创建时间',
  gameTips: '游戏提示',
  tips: [
    '1. 在商店购买种子',
    '2. 在农田种植并浇水（浇水可加速生长25%）',
    '3. 等待作物成熟（可使用时间加速或睡觉跳过）',
    '4. 收获成熟的作物获得金币和经验',
    '5. 出售收获物或直接收获获得金币',
    '6. 升级农田扩大种植面积',
    '7. 使用道具加速生长',
    '8. 睡觉可以跳到第二天（浇水状态会重置）',
  ],

  // 称号
  titles: [
    '新手农夫', '见习农夫', '初级农夫', '中级农夫', '高级农夫',
    '资深农夫', '大师农夫', '宗师农夫', '传奇农夫', '神话农夫',
    '仙境农夫', '天界农夫', '星辰农夫', '宇宙农夫', '永恒农夫',
  ],

  // 设置
  settings: '设置',
  language: '语言',
  languageDesc: '选择游戏显示语言',
  chinese: '中文',
  english: 'English',
  resetData: '重置数据',
  resetDataDesc: '清除所有游戏存档数据',
  resetConfirm: '确定要重置吗？此操作不可恢复！',
  resetSuccess: '数据已重置',
  about: '关于',
  aboutDesc: '像素农场 v1.0 - 一个有趣的种田模拟游戏',

  // 通知
  welcome: '欢迎来到像素农场！',
  sleepSuccess: '一夜过去了，新的一天开始了！',
  levelUp: '恭喜升级到 Lv.{level}！',
};

const en = {
  appTitle: 'Pixel Farm',
  appSubtitle: 'Plant hope, harvest joy',
  startBtn: 'Start Farming',
  namePlaceholder: 'Enter your name',
  startTips: 'Plant → Water → Grow → Harvest → Sell → Upgrade',

  navFarm: 'Farm',
  navInventory: 'Bag',
  navShop: 'Shop',
  navUpgrade: 'Upgrade',
  navCharacter: 'Character',
  navSettings: 'Settings',

  exp: 'EXP',
  timeAdvance10: '+10m',
  timeAdvance60: '+1h',
  sleep: 'Sleep',

  spring: 'Spring',
  summer: 'Summer',
  autumn: 'Autumn',
  winter: 'Winter',
  day: 'Day {n}',

  myFarm: 'My Farm',
  modePlant: 'Plant Mode',
  modeWater: 'Water Mode',
  modeHarvest: 'Harvest Mode',
  modeTool: 'Tool Mode',
  modeView: 'View Mode',
  waterAll: 'Water All',
  harvestAll: 'Harvest All',
  selectSeed: 'Select seed:',
  noSeeds: 'No seeds in bag, go to shop!',
  dragHint: 'Drag seed to plot or click to plant',
  selectTool: 'Select tool:',
  noTools: 'No tools in bag',
  plantSuccess: 'Planted {name}',
  waterSuccess: 'Watered! Growth boosted',
  harvestSuccess: 'Harvested {name}! +{gold}💰 +{exp}EXP',
  harvestAllSuccess: 'Harvested {count} crops! +{gold}💰 +{exp}EXP',
  toolSuccess: 'Tool used!',

  farmOverview: 'Farm Overview',
  totalPlots: 'Total',
  planted: 'Planted',
  watered: 'Watered',
  ready: 'Ready',
  empty: 'Empty',
  unit: 'plots',

  growTime: 'Grow Time',
  growStage: 'Stage',
  sellPrice: 'Sell Price',
  expReward: 'EXP Reward',
  waterStatus: 'Water',
  readyStatus: 'Status',
  wateredYes: 'Watered',
  wateredNo: 'Dry',
  readyYes: 'Ready',
  readyNo: 'Growing',
  position: 'Pos',
  second: 'sec',
  testStage: 'Test Stage',
  nextStage: 'Next',
  maxStage: 'Max',

  inventory: 'Inventory',
  itemTypes: 'items',
  all: 'All',
  seeds: 'Seeds',
  harvest: 'Harvest',
  tools: 'Tools',
  emptyInventory: 'Inventory is empty...',
  sell: 'Sell',
  sellAll: 'All',
  sellSuccess: 'Sold! +{gold}💰',
  sellAllSuccess: 'All sold! +{gold}💰',
  cannotSell: 'Only harvest items can be sold',
  typeSeed: 'Seed',
  typeHarvest: 'Crop',
  typeTool: 'Tool',

  shop: 'Shop',
  currentGold: 'Gold',
  buyQty: 'Quantity:',
  buy: 'Buy',
  locked: 'Requires Lv.{level}',
  description: 'Description',

  farmUpgrade: 'Farm Upgrade',
  currentLevel: 'Current Level',
  nextUpgrade: 'Next Upgrade',
  need: 'Need',
  upgrade: 'Upgrade',
  upgradeSuccess: 'Upgraded! Now {rows}×{cols}',
  upgradeRoute: 'Upgrade Path',
  maxLevel: 'Farm is at max level!',
  totalPlotsLabel: 'plots',

  characterInfo: 'Character',
  name: 'Name',
  level: 'Level',
  title: 'Title',
  experience: 'EXP',
  gold: 'Gold',
  farmLevel: 'Farm Lv',
  farmSize: 'Farm Size',
  createdAt: 'Created',
  gameTips: 'Tips',
  tips: [
    '1. Buy seeds at the shop',
    '2. Plant and water crops (water boosts growth 25%)',
    '3. Wait for crops to mature (use time skip or sleep)',
    '4. Harvest mature crops for gold and EXP',
    '5. Sell harvest items for gold',
    '6. Upgrade farm to expand planting area',
    '7. Use tools to speed up growth',
    '8. Sleep to skip to next day (water resets)',
  ],

  titles: [
    'Novice', 'Apprentice', 'Junior', 'Middle', 'Senior',
    'Veteran', 'Master', 'Grandmaster', 'Legend', 'Mythic',
    'Fairy', 'Celestial', 'Stellar', 'Cosmic', 'Eternal',
  ],

  settings: 'Settings',
  language: 'Language',
  languageDesc: 'Choose display language',
  chinese: '中文',
  english: 'English',
  resetData: 'Reset Data',
  resetDataDesc: 'Clear all game save data',
  resetConfirm: 'Are you sure? This cannot be undone!',
  resetSuccess: 'Data has been reset',
  about: 'About',
  aboutDesc: 'Pixel Farm v1.0 - A fun farming simulation game',

  welcome: 'Welcome to Pixel Farm!',
  sleepSuccess: 'A new day has begun!',
  levelUp: 'Leveled up to Lv.{level}!',
};

const locales = { zh, en };

export function getLocale(lang) {
  return locales[lang] || locales.zh;
}

export function t(key, lang, params = {}) {
  const locale = getLocale(lang);
  let text = locale[key] || locales.zh[key] || key;
  Object.entries(params).forEach(([k, v]) => {
    text = text.replace(`{${k}}`, v);
  });
  return text;
}

export default locales;
