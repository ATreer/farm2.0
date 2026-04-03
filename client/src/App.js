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
import UpgradeView from './components/UpgradeView';
import CharacterView from './components/CharacterView';
import SettingsView from './components/SettingsView';

const PAGES = {
  farm: 'farm',
  inventory: 'inventory',
  shop: 'shop',
  upgrade: 'upgrade',
  character: 'character',
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
    } else {
      document.body.classList.remove('farm-bg');
      document.body.style.backgroundImage = '';
    }
    return () => {
      document.body.classList.remove('farm-bg');
      document.body.style.backgroundImage = '';
    };
  }, [currentPage]);

  const [notification, setNotification] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lang, setLang] = useState(() => localStorage.getItem('farmLang') || 'zh');
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
  const emitParticle = useCallback((type, event) => {
    if (phaserRef.current && event) {
      const rect = event.currentTarget?.getBoundingClientRect();
      if (rect) {
        phaserRef.current.emitEffect(type, rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
    }
  }, []);

  // 加载玩家数据
  useEffect(() => {
    if (!playerId) return;
    const load = async () => {
      try {
        const p = await api.getPlayer(playerId);
        setPlayer(p);
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

  const handleSleep = async () => {
    try {
      const result = await api.sleepAdvance(playerId);
      // 立即更新所有数据
      setTime(result.time);
      setPlayer(result.player);
      // 强制刷新所有子组件
      setRefreshKey(k => k + 1);
      // 延迟再刷一次，确保子组件拿到最新数据
      setTimeout(() => {
        setRefreshKey(k => k + 1);
      }, 500);
      notify('💤 ' + t('sleepSuccess', lang), 'success');
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
    { key: PAGES.upgrade, icon: assets.nav.upgrade, label: t('navUpgrade', lang) },
    { key: PAGES.character, icon: assets.nav.character, label: t('navCharacter', lang) },
    { key: PAGES.settings, icon: assets.nav.settings, label: t('navSettings', lang) },
  ];

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
        onTimeAdvance={handleTimeAdvance}
        onSleep={handleSleep}
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
      {currentPage === PAGES.upgrade && (
        <UpgradeView
          playerId={playerId}
          player={player}
          lang={lang}
          notify={notify}
          refresh={refresh}
          emitParticle={emitParticle}
        />
      )}
      {currentPage === PAGES.character && (
        <CharacterView player={player} lang={lang} />
      )}
      {currentPage === PAGES.settings && (
        <SettingsView lang={lang} setLang={setLang} notify={notify} />
      )}
    </div>
  );
}

export default App;
