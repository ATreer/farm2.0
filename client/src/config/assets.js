/**
 * 游戏素材配置 - 集中管理所有视觉素材
 *
 * 替换素材方法：
 * 1. 将新素材文件放入 client/src/assets/ 对应目录
 * 2. 修改下方对应字段为新的素材路径或 emoji
 * 3. 如果使用图片，将 emoji 替换为 <img> 标签的 src 路径
 */

const assets = {
  // ==================== 角色头像 ====================
  avatars: {
    // 按等级切换的头像列表（可替换为图片路径）
    list: ['🧑‍🌾', '👩‍🌾', '👨‍🌾', '🧙', '🧝', '🦊'],
    // 顶部栏头像
    topbar: '🧑‍🌾',
    // 开始界面默认头像
    default: '🧑‍🌾',
  },

  // ==================== 导航图标 ====================
  nav: {
    farm: '🌾',
    inventory: '🎒',
    shop: '🏪',
    upgrade: '⬆️',
    character: '👤',
    settings: '⚙️',
  },

  // ==================== 面板图标 ====================
  panel: {
    farm: '🌾',
    inventory: '🎒',
    shop: '🏪',
    upgrade: '⬆️',
    character: '👤',
    settings: '⚙️',
    overview: '📊',
    tips: '🎮',
    upgradeRoute: '📋',
  },

  // ==================== 操作模式图标 ====================
  mode: {
    view: '👀',
    plant: '🌱',
    water: '💧',
    harvest: '🌾',
    tool: '🧪',
  },

  // ==================== 按钮图标 ====================
  btn: {
    plant: '🌱',
    water: '💧',
    harvest: '🌾',
    tool: '🧪',
    waterAll: '💧',
    harvestAll: '🌾',
    upgrade: '💰',
    sell: '💰',
    sellAll: '💰',
    buy: '💰',
    sleep: '💤',
  },

  // ==================== 状态图标 ====================
  status: {
    locked: '🔒',
    current: '✅',
    available: '⬜',
    watered: '💧',
    ready: '✅',
    empty: '+',
    unknown: '❓',
  },

  // ==================== 统计标签图标 ====================
  stat: {
    name: '👤',
    level: '⭐',
    title: '🏅',
    exp: '✨',
    gold: '💰',
    farmLevel: '🌾',
    farmSize: '📐',
    created: '📅',
    growTime: '⏱',
    growStage: '📊',
    sellPrice: '💰',
    expReward: '⭐',
    waterStatus: '💧',
    readyStatus: '✅',
  },

  // ==================== 筛选/类型图标 ====================
  filter: {
    all: '📦',
    seed: '🌱',
    harvest: '🌾',
    tool: '🔧',
  },
  type: {
    seed: '🌱',
    harvest: '🌾',
    tool: '🔧',
  },

  // ==================== 通知前缀图标 ====================
  notify: {
    plant: '🌱',
    water: '💧',
    harvest: '🎉',
    tool: '✨',
    upgrade: '🎉',
    gold: '💰',
    sleep: '💤',
    error: '❌',
    success: '✅',
    info: 'ℹ️',
  },

  // ==================== 设置图标 ====================
  settings: {
    language: '🌐',
    reset: '🗑️',
    about: 'ℹ️',
  },

  // ==================== 季节图标 ====================
  season: {
    spring: '🌸',
    summer: '☀️',
    autumn: '🍂',
    winter: '❄️',
  },

  // ==================== 时间图标 ====================
  time: {
    clock: '🕐',
    day: '📅',
  },

  // ==================== 作物默认阶段 emoji（兜底值） ====================
  crop: {
    // 作物四个生长阶段的默认 emoji
    stageDefault: ['🌱', '🌿', '🪴', '🌾'],
    // 成熟作物默认 emoji
    readyDefault: '🌾',
    // 空地格子显示
    emptyPlot: '+',
  },

  // ==================== 农田格子图标 ====================
  plot: {
    waterIndicator: '💧',
  },

  // ==================== 标题装饰 ====================
  title: {
    wheat: '🌾',
  },

  // ==================== 升级相关图标 ====================
  upgrade: {
    farm: '🌾',
    next: '⬆️',
    cost: '💰',
    maxLevel: '🎉',
    success: '🎉',
  },
};

export default assets;
