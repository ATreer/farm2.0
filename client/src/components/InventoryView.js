import React, { useState, useEffect } from 'react';
import * as api from '../services/api';

export default function InventoryView({ playerId, notify, refresh }) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');

  const loadData = async () => {
    try {
      const data = await api.getInventory(playerId);
      setItems(data);
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, [playerId, refresh]);

  const handleSell = async (item) => {
    if (item.item_type !== 'harvest') {
      notify('只有收获物可以出售', 'error');
      return;
    }
    try {
      const result = await api.sellItem(playerId, item.item_type, item.item_id, 1);
      setItems(result.inventory);
      notify(`出售成功！+${result.earned}💰`, 'success');
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const handleSellAll = async (item) => {
    if (item.item_type !== 'harvest') return;
    try {
      const result = await api.sellItem(playerId, item.item_type, item.item_id, item.quantity);
      setItems(result.inventory);
      notify(`全部出售成功！+${result.earned}💰`, 'success');
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const filteredItems = filter === 'all'
    ? items
    : items.filter(i => i.item_type === filter);

  const typeLabels = {
    seed: '🌱 种子',
    harvest: '🌾 收获',
    tool: '🔧 道具',
  };

  const filters = [
    { key: 'all', label: '📦 全部' },
    { key: 'seed', label: '🌱 种子' },
    { key: 'harvest', label: '🌾 收获' },
    { key: 'tool', label: '🔧 道具' },
  ];

  return (
    <div className="panel">
      <div className="panel-title">🎒 背包 ({items.length}种物品)</div>

      <div style={{ display: 'flex', gap: '5px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button
            key={f.key}
            className={`btn btn-small ${filter === f.key ? 'btn-gold' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#555', fontSize: '9px' }}>
          背包空空如也...
        </div>
      ) : (
        <div className="inventory-grid">
          {filteredItems.map(item => (
            <div key={item.id} className="inventory-item">
              <span className="inv-type">{typeLabels[item.item_type] || item.item_type}</span>
              <span className="inv-emoji">{item.emoji || '❓'}</span>
              <div className="inv-name">{item.name || item.item_id}</div>
              <div className="inv-qty">x{item.quantity}</div>
              {item.item_type === 'harvest' && (
                <div style={{ marginTop: '5px', display: 'flex', gap: '3px', justifyContent: 'center' }}>
                  <button
                    className="btn btn-small btn-gold"
                    onClick={() => handleSell(item)}
                  >
                    出售
                  </button>
                  {item.quantity > 1 && (
                    <button
                      className="btn btn-small"
                      onClick={() => handleSellAll(item)}
                    >
                      全部
                    </button>
                  )}
                </div>
              )}
              {item.item_type === 'tool' && item.description && (
                <div style={{ fontSize: '6px', color: '#8899aa', marginTop: '3px', lineHeight: '1.3' }}>
                  {item.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
