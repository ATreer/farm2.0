import React, { useState, useEffect } from 'react';
import * as api from '../services/api';

export default function ShopView({ playerId, player, notify, refresh }) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [buyQty, setBuyQty] = useState(1);

  const loadData = async () => {
    try {
      const data = await api.getShopItems(playerId);
      setItems(data);
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, [playerId, refresh]);

  const handleBuy = async (item) => {
    try {
      const result = await api.buyItem(playerId, item.id, buyQty);
      setItems(prev => prev.map(i => i.id === item.id ? i : i)); // trigger re-render
      notify(`购买了 ${buyQty}x ${item.name}！`, 'success');
      loadData();
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const filteredItems = filter === 'all'
    ? items
    : items.filter(i => i.item_type === filter);

  const filters = [
    { key: 'all', label: '📦 全部' },
    { key: 'seed', label: '🌱 种子' },
    { key: 'tool', label: '🔧 道具' },
  ];

  return (
    <div className="panel">
      <div className="panel-title">🏪 商店 💰 {player?.gold || 0}</div>

      <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        {filters.map(f => (
          <button
            key={f.key}
            className={`btn btn-small ${filter === f.key ? 'btn-gold' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
        <span style={{ fontSize: '7px', color: '#8899aa', marginLeft: '10px' }}>购买数量：</span>
        {[1, 5, 10].map(q => (
          <button
            key={q}
            className={`btn btn-small ${buyQty === q ? 'btn-primary' : ''}`}
            onClick={() => setBuyQty(q)}
          >
            x{q}
          </button>
        ))}
      </div>

      <div className="shop-grid">
        {filteredItems.map(item => (
          <div key={item.id} className={`shop-item ${item.locked ? 'locked' : ''}`}>
            <div className="shop-item-header">
              <span className="shop-emoji">{item.emoji}</span>
              <div className="shop-info">
                <div className="shop-name">{item.name}</div>
                <div className="shop-desc">{item.description}</div>
              </div>
            </div>

            {item.locked ? (
              <div className="shop-lock-info">🔒 需要 Lv.{item.unlock_level} 解锁</div>
            ) : (
              <div className="shop-price">
                <span className="shop-price-value">💰 {item.price * buyQty}</span>
                <button
                  className={`btn btn-small btn-green ${(player?.gold || 0) < item.price * buyQty ? 'btn-disabled' : ''}`}
                  onClick={() => handleBuy(item)}
                  disabled={(player?.gold || 0) < item.price * buyQty}
                >
                  购买 x{buyQty}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
