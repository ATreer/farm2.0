/**
 * 游戏主题配置 - 集中管理所有颜色、尺寸、布局参数
 *
 * 替换主题方法：
 * 1. 修改下方颜色值即可全局更换主题
 * 2. 修改尺寸值可调整整体布局
 * 3. CSS 变量会自动同步（通过 applyTheme() 函数）
 */

const theme = {
  // ==================== 颜色主题 ====================
  colors: {
    // 背景色
    bgDark: '#1a1a2e',
    bgMain: '#16213e',
    bgCard: '#0f3460',
    bgCardHover: '#1a4a7a',
    bgInput: '#0d1b33',

    // 强调色
    accent: '#e94560',
    accentHover: '#ff6b81',

    // 金色系
    gold: '#ffd700',
    goldDark: '#b8960f',

    // 功能色
    green: '#4ecca3',
    greenDark: '#2d8a6e',
    blue: '#4a9eff',

    // 文字色
    text: '#eaeaea',
    textDim: '#8899aa',
    textBright: '#ffffff',

    // 农田色
    soil: '#8B4513',
    soilWet: '#654321',
    soilEmpty: '#6b3a1f',

    // 边框色
    border: '#2a4a6b',
    borderLight: '#3a5a7b',

    // 按钮衍生色
    badgeGradientEnd: '#c73550',
    badgeBorder: '#a02040',
    btnPrimaryGradientEnd: '#c73550',
    btnPrimaryBorder: '#a02040',
    btnGoldText: '#333',
    btnBlueStart: '#1565c0',
    btnBlueBorder: '#0d47a1',
    navActiveGradientEnd: '#c73550',
    navActiveBorder: '#a02040',

    // 面板衍生色
    panelGradientEnd: '#1a2744',
    topbarGradientEnd: '#1a2744',

    // 农田衍生色
    farmGridGradientEnd: '#7a3a10',
    farmGridBorder: '#5a3010',
    plotBorder: '#5a3010',
    plotHoverBg: '#7a4a2a',
    plotWateredGradientEnd: '#4a2a10',
    plotReadyBg: 'rgba(255, 215, 0, 0.1)',
    plotReadyPulseShadow: 'rgba(255, 215, 0, 0.4)',
    plotReadyPulsePeak: 'rgba(255, 215, 0, 0.6)',
    plotStageBg: 'rgba(0,0,0,0.5)',
    plotEmptyPlusColor: '#5a3010',

    // 功能衍生色
    goldBgAlpha: 'rgba(255, 215, 0, 0.08)',
    goldBorderAlpha: 'rgba(255, 215, 0, 0.2)',
    modeIndicatorBg: 'rgba(233, 69, 96, 0.15)',
    upgradeCurrentBg: 'rgba(78, 204, 163, 0.1)',
    inventoryHoverShadow: 'rgba(0,0,0,0.3)',
    inventorySelectedShadow: 'rgba(255, 215, 0, 0.4)',
    invTypeBg: 'rgba(0,0,0,0.3)',
    shopHoverShadow: 'rgba(0,0,0,0.3)',
    farmStatBorder: 'rgba(42, 74, 107, 0.4)',
    startScreenGradientCenter: '#1a2744',
    titleGlowStart: 'rgba(255, 215, 0, 0.2)',
    titleGlowEnd: 'rgba(255, 215, 0, 0.4)',
    inputFocusShadow: 'rgba(255, 215, 0, 0.3)',
    startTipsText: '#555',
    emptyInventoryText: '#555',
  },

  // ==================== 布局参数 ====================
  layout: {
    // 全局
    maxContentWidth: '1400px',
    appPadding: '12px 16px',
    baseFontSize: '14px',

    // 顶部栏
    topbarPadding: '12px 20px',
    topbarMarginBottom: '12px',
    topbarLeftGap: '20px',
    playerInfoGap: '10px',
    avatarFontSize: '28px',
    playerNameFontSize: '13px',
    badgePadding: '4px 10px',
    badgeFontSize: '10px',
    expBarGap: '8px',
    expBarFontSize: '11px',
    expBarWidth: '120px',
    expBarHeight: '12px',
    goldFontSize: '14px',
    goldPadding: '6px 14px',
    timeGap: '12px',
    timeFontSize: '13px',
    seasonIconSize: '20px',
    timeControlsGap: '6px',

    // 按钮
    btnFontSize: '11px',
    btnPadding: '8px 16px',
    btnSmallFontSize: '10px',
    btnSmallPadding: '6px 12px',

    // 导航
    navGap: '6px',
    navMarginBottom: '12px',
    navTabFontSize: '12px',
    navTabPadding: '10px 20px',

    // 面板
    panelPadding: '20px',
    panelMarginBottom: '12px',
    panelTitleFontSize: '14px',
    panelTitleMarginBottom: '16px',
    panelTitlePaddingBottom: '10px',

    // 农田
    farmContainerGap: '20px',
    farmMinWidth: '400px',
    farmActionsGap: '8px',
    farmActionsMarginBottom: '14px',
    farmGridGap: '4px',
    farmGridPadding: '14px',
    farmPlotSize: '68px',          // 农田格子尺寸（宽=高）
    plotEmojiFontSize: '28px',
    plotEmojiDisplaySize: '30px',
    plotStageFontSize: '8px',
    plotWaterIconSize: '12px',
    farmSidebarWidth: '320px',
    selectionBarMarginBottom: '14px',
    selectionBarPadding: '12px',

    // 背包
    inventoryMinColWidth: '140px',
    inventoryGridGap: '10px',
    inventoryItemPadding: '14px 10px',
    invEmojiFontSize: '36px',
    invNameFontSize: '12px',
    invQtyFontSize: '11px',
    invTypeFontSize: '10px',

    // 商店
    shopMinColWidth: '240px',
    shopGridGap: '12px',
    shopItemPadding: '16px',
    shopEmojiFontSize: '36px',
    shopNameFontSize: '13px',
    shopDescFontSize: '12px',
    shopPriceFontSize: '13px',

    // 作物信息
    cropInfoEmojiSize: '44px',
    cropInfoNameFontSize: '14px',
    cropStatFontSize: '12px',
    growthProcessFontSize: '14px',
    growthProcessLetterSpacing: '4px',

    // 通知
    notificationOffset: '16px',
    notificationPadding: '14px 20px',
    notificationFontSize: '13px',
    notificationMaxWidth: '380px',

    // 开始界面
    startScreenGap: '24px',
    startTitleFontSize: '32px',
    startSubtitleFontSize: '16px',
    startCharacterSize: '80px',
    startInputFontSize: '14px',
    startInputPadding: '14px 20px',
    startInputWidth: '300px',
    startBtnFontSize: '16px',
    startBtnPadding: '16px 40px',

    // 人物面板
    charPanelGap: '20px',
    charAvatarPadding: '30px',
    charAvatarMinHeight: '280px',
    charEmojiSize: '80px',
    charTitleFontSize: '12px',
    charStatPadding: '12px 16px',
    charStatLabelSize: '13px',
    charStatValueSize: '13px',
    charNameFontSize: '16px',
    charLevelFontSize: '12px',
    charExpFontSize: '11px',
    charExpBarHeight: '14px',
    charCreatedFontSize: '11px',

    // 提示
    tipsTitleFontSize: '13px',
    tipItemFontSize: '13px',
    farmStatsFontSize: '13px',

    // 设置
    settingsItemPadding: '16px 20px',
    settingsLabelFontSize: '14px',
    settingsDescFontSize: '12px',

    // 响应式断点
    breakpointTablet: '900px',
    breakpointMobile: '600px',
    // 平板
    farmPlotSizeTablet: '56px',
    plotEmojiSizeTablet: '24px',
    startTitleSizeTablet: '22px',
    baseFontSizeTablet: '13px',
    // 手机
    farmPlotSizeMobile: '46px',
    plotEmojiSizeMobile: '20px',
    navTabSizeMobile: '10px',
    navTabPaddingMobile: '8px 12px',
    inventoryMinColMobile: '110px',
  },

  // ==================== 游戏参数（客户端） ====================
  params: {
    notificationDuration: 3000,   // 通知消失时间(ms)
    timeRefreshInterval: 10000,  // 时间刷新间隔(ms)
    farmRefreshInterval: 6000,   // 农田自动刷新间隔(ms)
    sleepRefreshDelay: 500,      // 睡觉后延迟刷新(ms)
    plotAnimDuration: 500,       // 格子动画持续时间(ms)
  },

  // ==================== 粒子效果颜色 ====================
  particles: {
    waterDrop: { primary: 0x4fc3f7, highlight: 0xb3e5fc },
    goldCoin: { primary: 0xffd700, highlight: 0xffeb3b },
    star: { primary: 0xffffff, highlight: 0xffeb3b },
    leaf: { primary: 0x4caf50 },
    heart: { primary: 0xff4081 },
    expOrb: { primary: 0x7c4dff, highlight: 0xb388ff },
    dirt: { primary: 0x8B4513 },
    sparkle: { primary: 0xffffff },
    // tint 色组
    waterTint: [0x4fc3f7, 0x29b6f6, 0x81d4fa],
    goldTint: [0xffd700, 0xffc107, 0xffeb3b],
    leafTint: [0x4caf50, 0x66bb6a, 0x81c784],
    dirtTint: [0x8B4513, 0xa0522d, 0x6b3a1f],
    goldSplashTint: [0xffd700, 0xffc107],
    expTint: [0x7c4dff, 0xb388ff, 0x448aff],
  },
};

/**
 * 将主题颜色应用到 CSS 变量（在应用启动时调用）
 */
export function applyTheme() {
  const root = document.documentElement;
  const c = theme.colors;
  const vars = {
    '--bg-dark': c.bgDark,
    '--bg-main': c.bgMain,
    '--bg-card': c.bgCard,
    '--bg-card-hover': c.bgCardHover,
    '--bg-input': c.bgInput,
    '--accent': c.accent,
    '--accent-hover': c.accentHover,
    '--gold': c.gold,
    '--gold-dark': c.goldDark,
    '--green': c.green,
    '--green-dark': c.greenDark,
    '--blue': c.blue,
    '--text': c.text,
    '--text-dim': c.textDim,
    '--text-bright': c.textBright,
    '--soil': c.soil,
    '--soil-wet': c.soilWet,
    '--soil-empty': c.soilEmpty,
    '--border': c.border,
    '--border-light': c.borderLight,
  };
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export default theme;
