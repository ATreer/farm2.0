import React from 'react';

export default function CharacterView({ player }) {
  if (!player) return null;

  const avatars = ['🧑‍🌾', '👩‍🌾', '👨‍🌾', '🧙', '🧝', '🦊'];
  const avatarIndex = player.level % avatars.length;
  const titles = [
    '新手农夫', '见习农夫', '初级农夫', '中级农夫', '高级农夫',
    '资深农夫', '大师农夫', '宗师农夫', '传奇农夫', '神话农夫',
    '仙境农夫', '天界农夫', '星辰农夫', '宇宙农夫', '永恒农夫',
  ];
  const title = titles[Math.min(player.level - 1, titles.length - 1)];

  const expPercent = player.nextLevelExp > 0
    ? Math.min(100, (player.currentExp / player.nextLevelExp) * 100)
    : 0;

  return (
    <div className="panel">
      <div className="panel-title">👤 人物信息</div>

      <div className="character-panel">
        <div className="char-avatar">
          <div className="char-emoji">{avatars[avatarIndex]}</div>
          <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '16px', color: 'var(--gold)', marginTop: '8px' }}>
            {player.name}
          </div>
          <div className="char-title">{title}</div>
          <div style={{ fontFamily: 'var(--pixel-font)', fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px' }}>
            Lv.{player.level}
          </div>
          <div style={{ marginTop: '12px', width: '100%' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px', textAlign: 'center' }}>
              经验 {player.currentExp}/{player.nextLevelExp}
            </div>
            <div className="exp-bar" style={{ width: '100%', height: '14px' }}>
              <div className="exp-bar-fill" style={{ width: `${expPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="char-stats">
          <div className="char-stat-row">
            <span className="char-stat-label">👤 名字</span>
            <span className="char-stat-value">{player.name}</span>
          </div>
          <div className="char-stat-row">
            <span className="char-stat-label">⭐ 等级</span>
            <span className="char-stat-value">Lv.{player.level}</span>
          </div>
          <div className="char-stat-row">
            <span className="char-stat-label">🏅 称号</span>
            <span className="char-stat-value">{title}</span>
          </div>
          <div className="char-stat-row">
            <span className="char-stat-label">✨ 经验</span>
            <span className="char-stat-value">{player.currentExp}/{player.nextLevelExp}</span>
          </div>
          <div className="char-stat-row">
            <span className="char-stat-label">💰 金币</span>
            <span className="char-stat-value">{player.gold}</span>
          </div>
          <div className="char-stat-row">
            <span className="char-stat-label">🌾 农田等级</span>
            <span className="char-stat-value">Lv.{player.farm_level}</span>
          </div>
          <div className="char-stat-row">
            <span className="char-stat-label">📐 农田大小</span>
            <span className="char-stat-value">{player.max_farm_rows}×{player.max_farm_cols}</span>
          </div>
          <div className="char-stat-row">
            <span className="char-stat-label">📅 创建时间</span>
            <span className="char-stat-value" style={{ fontSize: '11px' }}>
              {player.created_at ? new Date(player.created_at).toLocaleDateString('zh-CN') : '-'}
            </span>
          </div>
        </div>
      </div>

      <div className="tips-panel">
        <div className="tips-title">🎮 游戏提示</div>
        <div className="tip-item">
          🌱 1. 在商店购买种子<br/>
          💧 2. 在农田种植并浇水（浇水可加速生长25%）<br/>
          ⏳ 3. 等待作物成熟（可使用时间加速或睡觉跳过）<br/>
          🌾 4. 收获成熟的作物获得金币和经验<br/>
          🏪 5. 出售收获物或直接收获获得金币<br/>
          ⬆️ 6. 升级农田扩大种植面积<br/>
          🧪 7. 使用道具加速生长<br/>
          🌙 8. 睡觉可以跳到第二天（浇水状态会重置）
        </div>
      </div>
    </div>
  );
}
