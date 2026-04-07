import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as api from './services/api';
import { createParticleOverlay } from './services/particles';
import { t } from './services/i18n';
import assets from './config/assets';
import StartScreen from './components/StartScreen';
import TopBar from './components/TopBar';
import FarmView from './components/FarmView';
import InventoryView from './components/InventoryView';
import ShopView from './components/ShopView';
import SettingsView from './components/SettingsView';

const PAGES = {
  farm: 'farm',
  inventory: 'inventory',
  shop: 'shop',
  settings: 'settings',
};

function App() {
  const [playerId, setPlayerId] = useState(() => localStorage.getItem('farmPlayerId'));
  const [player, setPlayer] = useState(null);
  const [time, setTime] = useState(null);
  const [currentPage, setCurrentPage] = useState(PAGES.farm);

  // 切换页面时控制 body 背景图
  useEffect(() => {
    if (currentPage === PAGES.farm) {
      document.body.classList.add('farm-bg');
      document.body.style.backgroundImage = 'url(/background.png)';
      document.body.style.backgroundSize = '100% 100%';
    } else {
      document.body.classList.remove('farm-bg');
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
    }
    return () => {
      document.body.classList.remove('farm-bg');
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
    };
  }, [currentPage]);

  const [notification, setNotification] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lang, setLang] = useState(() => localStorage.getItem('farmLang') || 'zh');
  const [uiScale, setUiScale] = useState(1);
  const phaserRef = useRef(null);

  // 初始化 Phaser 粒子覆盖层
  useEffect(() => {
    if (playerId && !phaserRef.current) {
      phaserRef.current = createParticleOverlay('root');
    }
    return () => {
      if (phaserRef.current) {
        phaserRef.current.destroy();
        phaserRef.current = null;
      }
    };
  }, [playerId]);

  const notify = useCallback((message, type = 'info') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  // 获取粒子效果发射器
  // 支持两种调用方式：
  //   emitParticle(type, event)  — 从 React 事件自动获取坐标
  //   emitParticle(type, x, y)   — 直接传入屏幕坐标
  const emitParticle = useCallback((type, eventOrX, y) => {
    if (!phaserRef.current) return undefined;
    let x, yy;
    if (typeof eventOrX === 'number' && typeof y === 'number') {
      x = eventOrX;
      yy = y;
    } else {
      const rect = eventOrX?.currentTarget?.getBoundingClientRect();
      if (!rect) return undefined;
      x = rect.left + rect.width / 2;
      yy = rect.top + rect.height / 2;
    }
    return phaserRef.current.emitEffect(type, x, yy);
  }, []);

  // 加载玩家数据
  useEffect(() => {
    if (!playerId) return;
    const load = async () => {
      try {
        const p = await api.getPlayer(playerId);
        setPlayer(p);
        // 加载玩家设置
        const settings = await api.getPlayerSettings(playerId);
        if (settings.ui_scale) {
          const scale = parseFloat(settings.ui_scale);
          if (!isNaN(scale) && scale >= 0.5 && scale <= 2) {
            setUiScale(scale);
          }
        }
      } catch {
        localStorage.removeItem('farmPlayerId');
        setPlayerId(null);
      }
    };
    load();
  }, [playerId, refreshKey]);

  // 加载时间
  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getGameTime();
        setTime(data);
      } catch (e) {
        console.error('时间加载失败', e);
      }
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  // 自动刷新农田（生长更新）
  useEffect(() => {
    if (!playerId) return;
    const interval = setInterval(() => {
      refresh();
    }, 6000);
    return () => clearInterval(interval);
  }, [playerId, refresh]);

  const handleStart = async (name) => {
    try {
      const p = await api.createPlayer(name);
      setPlayer(p);
      setPlayerId(p.id);
      localStorage.setItem('farmPlayerId', p.id);
      notify(t('welcome', lang), 'success');
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const handleTimeAdvance = async (minutes) => {
    try {
      const data = await api.advanceTime(minutes);
      setTime(data);
      refresh();
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const handleSleep = async (hours = 8) => {
    try {
      // 睡觉 = 推进 hours * 6 分钟（每游戏小时=6真实分钟）
      const minutes = hours * 6;
      const data = await api.advanceTime(minutes);
      setTime(data);
      refresh();
      setTimeout(() => refresh(), 500);
      notify(`💤 ${t('sleepSuccess', lang)}`, 'success');
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  if (!playerId || !player) {
    return <StartScreen onStart={handleStart} lang={lang} />;
  }

  const navItems = [
    { key: PAGES.farm, icon: assets.nav.farm, label: t('navFarm', lang) },
    { key: PAGES.inventory, icon: assets.nav.inventory, label: t('navInventory', lang) },
    { key: PAGES.shop, icon: assets.nav.shop, label: t('navShop', lang) },
  ];

  // 应用UI缩放到body（使用zoom避免影响fixed定位）
  useEffect(() => {
    document.body.style.zoom = uiScale;
    return () => {
      document.body.style.zoom = '';
    };
  }, [uiScale]);

  return (
    <div className="app-container">
      {notification && (
        <div key={notification.id} className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <TopBar
        player={player}
        time={time}
        lang={lang}
        onSleep={handleSleep}
        onOpenSettings={() => setCurrentPage(PAGES.settings)}
        refresh={refresh}
      />

      <div className="nav-tabs">
        {navItems.map(item => (
          <button
            key={item.key}
            className={`nav-tab ${currentPage === item.key ? 'active' : ''}`}
            onClick={() => setCurrentPage(item.key)}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      {currentPage === PAGES.farm && (
        <FarmView
          playerId={playerId}
          player={player}
          lang={lang}
          notify={notify}
          refresh={refresh}
          emitParticle={emitParticle}
        />
      )}
      {currentPage === PAGES.inventory && (
        <InventoryView
          playerId={playerId}
          lang={lang}
          notify={notify}
          refresh={refresh}
          emitParticle={emitParticle}
        />
      )}
      {currentPage === PAGES.shop && (
        <ShopView
          playerId={playerId}
          player={player}
          lang={lang}
          notify={notify}
          refresh={refresh}
          emitParticle={emitParticle}
        />
      )}
      {currentPage === PAGES.settings && (
        <SettingsView lang={lang} setLang={setLang} notify={notify} playerId={playerId} uiScale={uiScale} setUiScale={setUiScale} />
      )}
    </div>
  );
}

export default App;
