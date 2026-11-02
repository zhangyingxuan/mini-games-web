import { useState } from 'react'
import { Input, Modal } from 'antd'
import { SearchOutlined, PlayCircleOutlined } from '@ant-design/icons'
import TankGame from './components/TankGame'
import GomokuGame from './components/GomokuGame'
import './App.less'

const categories = [
  { id: 'all', name: '全部', icon: '🎮', color: '#2D3436' },
  { id: 'puzzle', name: '益智', icon: '🧩', color: '#4ECDC4' },
  { id: 'creative', name: '创意', icon: '🎨', color: '#FF6B6B' },
  { id: 'math', name: '数学', icon: '🔢', color: '#FFD93D' },
  { id: 'language', name: '语言', icon: '📚', color: '#C3ACD0' },
  { id: 'physical', name: '体能', icon: '⚽', color: '#6C5CE7' },
  { id: 'action', name: '动作', icon: '🎯', color: '#FD79A8' },
]

const games = [
  { id: 11, name: '别惹我的刀', category: 'action', age: '单人游戏', time: '约2分钟', rating: 0, emoji: '⚔️', tags: ['生存挑战', '西游冒险'], isMiniGame: true, color: '#b4d8bb' },
  { id: 10, name: '双人五子棋', category: 'puzzle', age: '6-99岁', time: '10-30分钟', rating: 4.8, emoji: '⚫', tags: ['双人对战', '策略思维'], isMiniGame: true, color: '#4ECDC4' },
  { id: 9, name: '双人坦克大战', category: 'action', age: '6-12岁', time: '不限', rating: 4.9, emoji: '🎯', tags: ['双人对战', '策略'], isMiniGame: true, color: '#FD79A8' },
  { id: 1, name: '拼图大冒险', category: 'puzzle', age: '3-6岁', time: '15-20分钟', rating: 4.9, emoji: '🧩', tags: ['观察力', '动手能力'], color: '#4ECDC4' },
  { id: 2, name: '积木乐园', category: 'creative', age: '2-8岁', time: '20-30分钟', rating: 4.8, emoji: '🏗️', tags: ['创造力', '空间思维'], color: '#FF6B6B' },
  { id: 3, name: '数字大作战', category: 'math', age: '4-10岁', time: '10-15分钟', rating: 4.7, emoji: '🔢', tags: ['数学', '逻辑思维'], color: '#FFD93D' },
  { id: 4, name: '字母猜猜乐', category: 'language', age: '3-7岁', time: '10-15分钟', rating: 4.6, emoji: '🔤', tags: ['语言', '记忆力'], color: '#C3ACD0' },
  { id: 5, name: '亲子跳绳', category: 'physical', age: '5-12岁', time: '10-20分钟', rating: 4.5, emoji: '🤸', tags: ['体能', '协调能力'], color: '#6C5CE7' },
  { id: 6, name: '故事拼图', category: 'puzzle', age: '4-8岁', time: '15-25分钟', rating: 4.7, emoji: '📖', tags: ['想象力', '语言表达'], color: '#4ECDC4' },
  { id: 7, name: '绘画大师', category: 'creative', age: '3-10岁', time: '20-35分钟', rating: 4.8, emoji: '🎨', tags: ['创造力', '色彩感知'], color: '#FF6B6B' },
  { id: 8, name: '成语接龙', category: 'language', age: '6-12岁', time: '15-20分钟', rating: 4.6, emoji: '📜', tags: ['语言', '记忆力'], color: '#C3ACD0' },
]

const bladeUrl = new URL(`${import.meta.env.BASE_URL}blade-survivor/index.html`, import.meta.url).href

function App() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedGame, setSelectedGame] = useState<typeof games[0] | null>(null)
  const [showGameModal, setShowGameModal] = useState(false)

  // 电脑端使用独立页面占满浏览器视口，触屏端保留站内操作方式。
  const openGame = (game: typeof games[0]) => {
    if (game.id === 11 && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      window.open(bladeUrl, '_blank', 'noopener,noreferrer')
      return
    }
    setSelectedGame(game)
    setShowGameModal(true)
  }

  const filteredGames = games.filter((game) => {
    const matchCategory = activeCategory === 'all' || game.category === activeCategory
    const matchKeyword = game.name.toLowerCase().includes(searchKeyword.toLowerCase())
    return matchCategory && matchKeyword
  })

  return (
    <div className="games-app">
      <div className="games-heading">
        <p>FIND YOUR NEXT FAVORITE</p>
        <h1>一起玩，快乐加倍<span> ✳</span></h1>
        <p>找到喜欢的游戏，开启一段亲子时光。</p>
      </div>
      {/* Search */}
      <div className="search-bar">
        <SearchOutlined className="search-icon" />
        <Input
          placeholder="搜索游戏..."
          aria-label="搜索游戏"
          bordered={false}
          className="search-input"
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
      </div>

      {/* Category Pills */}
      <div className="category-row">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`cat-pill ${activeCategory === cat.id ? 'active' : ''}`}
            aria-pressed={activeCategory === cat.id}
            style={{ '--pill-color': cat.color } as React.CSSProperties}
            onClick={() => setActiveCategory(cat.id)}
          >
            <span className="cat-icon">{cat.icon}</span>
            <span className="cat-name">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Games Grid */}
      <div className="games-grid">
        {filteredGames.map((game, index) => (
          <div
            key={game.id}
            className={`game-tile ${game.isMiniGame ? 'playable' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={`${game.name}，${game.isMiniGame ? '立即游玩' : '查看详情'}`}
            style={{ '--tile-color': game.color, animationDelay: `${index * 0.05}s` } as React.CSSProperties}
            onClick={() => openGame(game)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                openGame(game)
              }
            }}
          >
            <div className="tile-top">
              <span className="tile-emoji">{game.emoji}</span>
              <span className="tile-live-badge">
                {game.isMiniGame ? <><PlayCircleOutlined /> 可玩</> : '开发中'}
              </span>
            </div>
            <div className="tile-body">
              <h3 className="tile-name">{game.name}</h3>
              <div className="tile-meta">
                <span>{game.id === 11 ? '👤' : '👶'} {game.age}</span>
              </div>
              <div className="tile-tags">
                {game.tags.map((tag, i) => (
                  <span key={i} className="tile-tag">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      {filteredGames.length === 0 && <p className="games-empty">没有找到相关游戏，换个关键词试试吧。</p>}

      {/* Game Modal */}
      <Modal
        title={selectedGame?.isMiniGame ? null : selectedGame?.name}
        open={showGameModal}
        onCancel={() => setShowGameModal(false)}
        destroyOnClose
        footer={null}
        width={selectedGame?.isMiniGame ? '92vw' : 640}
        centered
        className={selectedGame?.isMiniGame ? 'game-fullscreen-modal' : 'game-detail-modal'}
        style={selectedGame?.isMiniGame ? { maxWidth: 960, top: 20 } : undefined}
      >
        {selectedGame?.isMiniGame && selectedGame.name === '双人坦克大战' && <TankGame />}
        {selectedGame?.isMiniGame && selectedGame.name === '双人五子棋' && <GomokuGame />}
        {showGameModal && selectedGame?.id === 11 && (
          // 独立页面承载原游戏，关闭弹窗时销毁画布与音效。
          <iframe className="blade-game-frame" title="别惹我的刀" src={bladeUrl} />
        )}
        {selectedGame && !selectedGame.isMiniGame && (
          <div className="detail-content">
            <div className="detail-emoji" style={{ background: selectedGame.color }}>{selectedGame.emoji}</div>
            <h2>{selectedGame.name}</h2>
            <div className="detail-info">
              <span>👶 {selectedGame.age}</span>
              <span>⏱ {selectedGame.time}</span>
              <span>⭐ {selectedGame.rating}</span>
            </div>
            <div className="detail-tags">
              {selectedGame.tags.map((tag, i) => (
                <span key={i} className="detail-tag">{tag}</span>
              ))}
            </div>
            <p className="detail-coming">🚧 游戏开发中，敬请期待...</p>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default App
