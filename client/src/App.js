import React, { useState, useEffect, useCallback } from 'react';
import * as api from './services/api';
import StartScreen from './components/StartScreen';
import TopBar from './components/TopBar';
import FarmView from './components/FarmView';
import InventoryView from './components/InventoryView';
import ShopView from './components/ShopView';
import UpgradeView from './components/UpgradeView';
import CharacterView from './components/CharacterView';

const PAGES = {
  farm: 'farm',
  inventory: 'inventory',
  shop: 'shop',
  upgrade: 'upgrade',
  character: 'character',
};

const PAGE_NAMES = {
  farm: '🌾 农场',
  inventory: '🎒 背包',
  shop: '🏪 商店',
  upgrade: '⬆️ 升级',
  character: '👤 人物',
};

function App() {
  const [playerId, setPlayerId] = useState(() => localStorage.getItem('farmPlayerId'));
  const [player, setPlayer] = useState(null);
  const [time, setTime] = useState(null);
  const [currentPage, setCurrentPage] = useState(PAGES.farm);
  const [notification, setNotification] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const notify = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
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
        const t = await api.getGameTime();
        setTime(t);
      } catch (e) {
        console.error('时间加载失败', e);
      }
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

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
      notify('欢迎来到像素农场！', 'success');
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const handleTimeAdvance = async (minutes) => {
    try {
      const t = await api.advanceTime(minutes);
      setTime(t);
      refresh();
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const handleSleep = async () => {
    try {
      const result = await api.sleepAdvance(playerId);
      setTime(result.time);
      setPlayer(result.player);
      notify('💤 一夜过去了，新的一天开始了！', 'success');
      refresh();
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  if (!playerId || !player) {
    return <StartScreen onStart={handleStart} />;
  }

  return (
    <div className="app-container">
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <TopBar
        player={player}
        time={time}
        onTimeAdvance={handleTimeAdvance}
        onSleep={handleSleep}
      />

      <div className="nav-tabs">
        {Object.entries(PAGES).map(([key, name]) => (
          <button
            key={key}
            className={`nav-tab ${currentPage === key ? 'active' : ''}`}
            onClick={() => setCurrentPage(key)}
          >
            {name}
          </button>
        ))}
      </div>

      {currentPage === PAGES.farm && (
        <FarmView
          playerId={playerId}
          player={player}
          notify={notify}
          refresh={refresh}
        />
      )}
      {currentPage === PAGES.inventory && (
        <InventoryView
          playerId={playerId}
          notify={notify}
          refresh={refresh}
        />
      )}
      {currentPage === PAGES.shop && (
        <ShopView
          playerId={playerId}
          player={player}
          notify={notify}
          refresh={refresh}
        />
      )}
      {currentPage === PAGES.upgrade && (
        <UpgradeView
          playerId={playerId}
          player={player}
          notify={notify}
          refresh={refresh}
        />
      )}
      {currentPage === PAGES.character && (
        <CharacterView player={player} />
      )}
    </div>
  );
}

export default App;
