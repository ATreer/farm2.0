import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import { t } from '../services/i18n';

export default function InventoryView({ playerId, notify, refresh, emitParticle, lang }) {
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

  const handleSell = async (item, event) => {
    if (item.item_type !== 'harvest') {
      notify(t('cannotSell', lang), 'error');
      return;
    }
    try {
      const result = await api.sellItem(playerId, item.item_type, item.item_id, 1);
      setItems(result.inventory);
      notify(t('sellSuccess', lang, { gold: result.earned }), 'success');
      emitParticle('gold', event);
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const handleSellAll = async (item, event) => {
    if (item.item_type !== 'harvest') return;
    try {
      const result = await api.sellItem(playerId, item.item_type, item.item_id, item.quantity);
      setItems(result.inventory);
      notify(t('sellAllSuccess', lang, { gold: result.earned }), 'success');
      emitParticle('gold', event);
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const filteredItems = filter === 'all'
    ? items
    : items.filter(i => i.item_type === filter);

  const typeLabels = {
    seed: `🌱 ${t('typeSeed', lang)}`,
    harvest: `🌾 ${t('typeHarvest', lang)}`,
    tool: `🔧 ${t('typeTool', lang)}`,
  };

  const filters = [
    { key: 'all', label: `📦 ${t('all', lang)}` },
    { key: 'seed', label: `🌱 ${t('seeds', lang)}` },
    { key: 'harvest', label: `🌾 ${t('harvest', lang)}` },
    { key: 'tool', label: `🔧 ${t('tools', lang)}` },
  ];

  return (
    <div className="panel">
      <div className="panel-title">🎒 {t('inventory', lang)} ({items.length}{t('itemTypes', lang)})</div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
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
        <div style={{ textAlign: 'center', padding: '40px', color: '#555', fontSize: '14px' }}>
          {t('emptyInventory', lang)}
        </div>
      ) : (
        <div className="inventory-grid">
          {filteredItems.map(item => (
            <div key={item.id} className="inventory-item">
              <span className="inv-type">{typeLabels[item.item_type] || item.item_type}</span>
              <span className="inv-emoji">{item.emoji || '❓'}</span>
              <div className="inv-name">{item.name || item.item_id}</div>
              <div className="inv-qty">×{item.quantity}</div>
              {item.item_type === 'harvest' && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '6px', justifyContent: 'center' }}>
                  <button
                    className="btn btn-small btn-gold"
                    onClick={(e) => handleSell(item, e)}
                  >
                    {t('sell', lang)}
                  </button>
                  {item.quantity > 1 && (
                    <button
                      className="btn btn-small"
                      onClick={(e) => handleSellAll(item, e)}
                    >
                      {t('sellAll', lang)}
                    </button>
                  )}
                </div>
              )}
              {item.item_type === 'tool' && item.description && (
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', lineHeight: '1.4' }}>
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
