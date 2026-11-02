import { useState } from 'react'
import { Tabs } from 'antd'
import { ControlOutlined, HeartOutlined, TrophyOutlined, SettingOutlined, CalendarOutlined, StarOutlined } from '@ant-design/icons'
import './App.less'

const userData = {
  name: '快乐家庭',
  avatar: '👨‍👩‍👧',
  level: 12,
  exp: 780,
  totalExp: 1000,
  memberSince: '2023年6月',
  gamesPlayed: 156,
  favoriteCount: 12,
  achievements: [
    { id: 1, name: '游戏新手', icon: '🌟', progress: 100 },
    { id: 2, name: '亲子达人', icon: '👨‍👩‍👧', progress: 100 },
    { id: 3, name: '坚持不懈', icon: '💪', progress: 75 },
    { id: 4, name: '全能玩家', icon: '🎯', progress: 40 },
  ],
  recentGames: [
    { id: 1, name: '拼图大冒险', time: '今天 14:30', status: 'done' as const },
    { id: 2, name: '数字大作战', time: '昨天 16:00', status: 'done' as const },
    { id: 3, name: '积木乐园', time: '昨天 10:30', status: 'playing' as const },
    { id: 4, name: '亲子猜猜乐', time: '前天 19:00', status: 'done' as const },
  ],
  favoriteGames: [
    { id: 1, name: '拼图大冒险', rating: 4.9, category: '益智游戏' },
    { id: 2, name: '积木乐园', rating: 4.8, category: '创意游戏' },
    { id: 3, name: '亲子猜猜乐', rating: 4.8, category: '互动游戏' },
  ],
}

function App() {
  const [activeTab, setActiveTab] = useState('recent')

  const expPercent = Math.round((userData.exp / userData.totalExp) * 100)

  return (
    <div className="user-app">
      <p className="demo-notice">以下为示例资料，游戏记录与收藏尚未接入个人账户。</p>
      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-top">
          <div className="avatar-wrap">
            <div className="avatar-circle">{userData.avatar}</div>
            <span className="level-tag">Lv.{userData.level}</span>
          </div>
          <div className="profile-info">
            <h2 className="profile-name">{userData.name}</h2>
            <div className="profile-joined">
              <CalendarOutlined /> {userData.memberSince} 加入
            </div>
            <div className="exp-bar-wrap">
              <div className="exp-bar-bg">
                <div className="exp-bar-fill" style={{ width: `${expPercent}%` }} />
              </div>
              <span className="exp-text">{userData.exp} / {userData.totalExp} EXP</span>
            </div>
          </div>
          <button className="settings-btn">
            <SettingOutlined /> 设置
          </button>
        </div>

        <div className="stats-row">
          <div className="stat-box">
            <div className="stat-box-icon">🎮</div>
            <div className="stat-box-value">{userData.gamesPlayed}</div>
            <div className="stat-box-label">已玩游戏</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-icon">❤️</div>
            <div className="stat-box-value">{userData.favoriteCount}</div>
            <div className="stat-box-label">收藏游戏</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-icon">🏆</div>
            <div className="stat-box-value">{userData.achievements.filter(a => a.progress === 100).length}</div>
            <div className="stat-box-label">获得成就</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="user-tabs"
        items={[
          {
            key: 'recent',
            label: <span><ControlOutlined /> 最近游戏</span>,
            children: (
              <div>
                {userData.recentGames.map((game) => (
                  <div key={game.id} className="recent-item">
                    <div className="recent-left">
                      <h4>{game.name}</h4>
                      <span className="recent-time">{game.time}</span>
                    </div>
                    <span className={`recent-status ${game.status}`}>
                      {game.status === 'done' ? '✓ 完成' : '● 进行中'}
                    </span>
                  </div>
                ))}
              </div>
            ),
          },
          {
            key: 'favorites',
            label: <span><HeartOutlined /> 收藏游戏</span>,
            children: (
              <div className="fav-grid">
                {userData.favoriteGames.map((game) => (
                  <div key={game.id} className="fav-card">
                    <h4>{game.name}</h4>
                    <span className="fav-rating"><StarOutlined /> {game.rating}</span>
                    <span className="fav-cat">{game.category}</span>
                  </div>
                ))}
              </div>
            ),
          },
          {
            key: 'achievements',
            label: <span><TrophyOutlined /> 成就系统</span>,
            children: (
              <div className="ach-grid">
                {userData.achievements.map((ach) => (
                  <div key={ach.id} className={`ach-card ${ach.progress === 100 ? 'completed' : ''}`}>
                    <div className="ach-icon">{ach.icon}</div>
                    <h4>{ach.name}</h4>
                    <div className="ach-progress-bg">
                      <div
                        className={`ach-progress-fill ${ach.progress === 100 ? 'full' : 'partial'}`}
                        style={{ width: `${ach.progress}%` }}
                      />
                    </div>
                    <div className="ach-percent">{ach.progress}%</div>
                  </div>
                ))}
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}

export default App
