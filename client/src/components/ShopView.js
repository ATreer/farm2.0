import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import { t } from '../services/i18n';
import assets from '../config/assets';

export default function ShopView({ playerId, player, notify, refresh, emitParticle, lang }) {
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

  const handleBuy = async (item, event) => {
    try {
      const result = await api.buyItem(playerId, item.id, buyQty);
      notify(`${t('buy', lang)} ${buyQty}× ${item.name}!`, 'success');
      emitParticle('gold', event);
      loadData();
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const filteredItems = filter === 'all'
    ? items
    : items.filter(i => i.item_type === filter);

  const filters = [
    { key: 'all', label: `${assets.filter.all} ${t('all', lang)}` },
    { key: 'seed', label: `${assets.filter.seed} ${t('seeds', lang)}` },
    { key: 'tool', label: `${assets.filter.tool} ${t('tools', lang)}` },
  ];

  return (
    <div className="panel">
      <div className="panel-title">{assets.panel.shop} {t('shop', lang)}　　{assets.stat.gold} {t('currentGold', lang)}：{player?.gold || 0}</div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        {filters.map(f => (
          <button
            key={f.key}
            className={`btn btn-small ${filter === f.key ? 'btn-gold' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
        <span style={{ fontSize: '12px', color: 'var(--text-dim)', marginLeft: '12px' }}>{t('buyQty', lang)}</span>
        {[1, 5, 10].map(q => (
          <button
            key={q}
            className={`btn btn-small ${buyQty === q ? 'btn-primary' : ''}`}
            onClick={() => setBuyQty(q)}
          >
            ×{q}
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
              <div className="shop-lock-info">{assets.status.locked} {t('locked', lang, { level: item.unlock_level })}</div>
            ) : (
              <div className="shop-price">
                <span className="shop-price-value">{assets.stat.gold} {item.price * buyQty}</span>
                <button
                  className={`btn btn-small btn-green ${(player?.gold || 0) < item.price * buyQty ? 'btn-disabled' : ''}`}
                  onClick={(e) => handleBuy(item, e)}
                  disabled={(player?.gold || 0) < item.price * buyQty}
                >
                  {t('buy', lang)} ×{buyQty}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
