import React, { useState, useEffect } from 'react';
import * as api from '../services/api';

export default function UpgradeView({ playerId, player, notify, refresh }) {
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

  const handleUpgrade = async () => {
    try {
      const result = await api.upgradeFarm(playerId);
      notify(`🎉 农田升级成功！现在 ${result.player.max_farm_rows}x${result.player.max_farm_cols}`, 'success');
      loadData();
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const currentUpgrade = upgrades.find(u => u.current);
  const nextUpgrade = upgrades.find(u => u.level === (player?.farm_level || 0) + 1);

  return (
    <div className="panel">
      <div className="panel-title">⬆️ 农田升级</div>

      <div style={{ marginBottom: '15px', padding: '10px', background: 'var(--bg-card)', border: 'var(--pixel-border) var(--border)' }}>
        <div style={{ fontSize: '9px', color: 'var(--gold)', marginBottom: '8px' }}>当前农田等级</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '32px' }}>🌾</span>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text)' }}>
              等级 {player?.farm_level || 1} — {player?.max_farm_rows}x{player?.max_farm_cols} 格
            </div>
            <div style={{ fontSize: '7px', color: 'var(--text-dim)', marginTop: '3px' }}>
              共 {(player?.max_farm_rows || 3) * (player?.max_farm_cols || 3)} 块农田
            </div>
          </div>
        </div>
      </div>

      {nextUpgrade ? (
        <div style={{ marginBottom: '15px', padding: '12px', background: 'var(--bg-card)', border: 'var(--pixel-border) var(--green-dark)' }}>
          <div style={{ fontSize: '9px', color: 'var(--green)', marginBottom: '8px' }}>下一级升级</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text)' }}>
                等级 {nextUpgrade.level} — {nextUpgrade.rows}x{nextUpgrade.cols} 格
              </div>
              <div style={{ fontSize: '7px', color: 'var(--text-dim)', marginTop: '3px' }}>
                需要 💰{nextUpgrade.cost} | 需要 Lv.{nextUpgrade.required_player_level}
              </div>
            </div>
            <button
              className={`btn btn-green ${!nextUpgrade.affordable ? 'btn-disabled' : ''}`}
              onClick={handleUpgrade}
              disabled={!nextUpgrade.affordable}
            >
              💰 升级 ({nextUpgrade.cost})
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '15px', color: 'var(--gold)', fontSize: '9px' }}>
          🎉 农田已达最高等级！
        </div>
      )}

      <div className="panel-title" style={{ marginTop: '15px' }}>📋 升级路线</div>
      <div className="upgrade-list">
        {upgrades.map(u => (
          <div key={u.level} className={`upgrade-item ${u.current ? 'current' : ''} ${u.locked ? 'locked' : ''}`}>
            <div className="upgrade-info">
              <span className="upgrade-level">
                {u.current ? '✅' : u.locked ? '🔒' : '⬜'} 等级 {u.level}
              </span>
              <span className="upgrade-detail">
                {u.rows}x{u.cols} 格 | 💰{u.cost} | Lv.{u.required_player_level}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
