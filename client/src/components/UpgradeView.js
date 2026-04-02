import React, { useState, useEffect } from 'react';
import * as api from '../services/api';

export default function UpgradeView({ playerId, player, notify, refresh, emitParticle }) {
  const [upgrades, setUpgrades] = useState([]);

  const loadData = async () => {
    try {
      const data = await api.getFarmUpgrades(playerId);
      setUpgrades(data);
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, [playerId, refresh]);

  const handleUpgrade = async (event) => {
    try {
      const result = await api.upgradeFarm(playerId);
      notify(`🎉 农田升级成功！现在 ${result.player.max_farm_rows}×${result.player.max_farm_cols}`, 'success');
      emitParticle('levelup', event);
      loadData();
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const nextUpgrade = upgrades.find(u => u.level === (player?.farm_level || 0) + 1);

  return (
    <div className="panel">
      <div className="panel-title">⬆️ 农田升级</div>

      <div style={{ marginBottom: '18px', padding: '16px', background: 'var(--bg-card)', border: 'var(--pixel-border) var(--green)', borderRadius: 'var(--radius)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '40px' }}>🌾</span>
          <div>
            <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '14px', color: 'var(--text)' }}>
              等级 {player?.farm_level || 1} — {player?.max_farm_rows}×{player?.max_farm_cols} 格
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '4px' }}>
              共 {(player?.max_farm_rows || 3) * (player?.max_farm_cols || 3)} 块农田
            </div>
          </div>
        </div>
      </div>

      {nextUpgrade ? (
        <div style={{ marginBottom: '18px', padding: '16px', background: 'var(--bg-card)', border: 'var(--pixel-border) var(--gold)', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: '13px', color: 'var(--gold)', marginBottom: '10px', fontWeight: 'bold' }}>⬆️ 下一级升级</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '14px', color: 'var(--text)' }}>
                等级 {nextUpgrade.level} — {nextUpgrade.rows}×{nextUpgrade.cols} 格
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '4px' }}>
                需要 💰{nextUpgrade.cost}　|　需要 Lv.{nextUpgrade.required_player_level}
              </div>
            </div>
            <button
              className={`btn btn-gold ${!nextUpgrade.affordable ? 'btn-disabled' : ''}`}
              onClick={(e) => handleUpgrade(e)}
              disabled={!nextUpgrade.affordable}
            >
              💰 升级 ({nextUpgrade.cost})
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--gold)', fontSize: '14px' }}>
          🎉 农田已达最高等级！
        </div>
      )}

      <div className="panel-title" style={{ marginTop: '18px' }}>📋 升级路线</div>
      <div className="upgrade-list">
        {upgrades.map(u => (
          <div key={u.level} className={`upgrade-item ${u.current ? 'current' : ''} ${u.locked ? 'locked' : ''}`}>
            <div className="upgrade-info">
              <span className="upgrade-level">
                {u.current ? '✅' : u.locked ? '🔒' : '⬜'} 等级 {u.level}
              </span>
              <span className="upgrade-detail">
                {u.rows}×{u.cols} 格　|　💰{u.cost}　|　Lv.{u.required_player_level}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
