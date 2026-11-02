import './App.less'

declare global {
  interface Window {
    microApp?: { dispatch: (data: { path: string }, nextStep?: () => void, force?: boolean) => void }
  }
}

// 子应用运行在独立端口，交给主应用路由处理跨应用跳转。
function openGames(event: React.MouseEvent<HTMLAnchorElement>) {
  if (window.microApp && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0) {
    event.preventDefault()
    window.microApp.dispatch({ path: '/games' }, undefined, true)
  }
}

const games = [
  { name: '双人五子棋', description: '一黑一白，下一局有来有回。', label: '双人对弈 · 策略思考', icon: '◒', className: 'chess' },
  { name: '双人坦克大战', description: '驾驶坦克，来一场趣味对决。', label: '双人对战 · 趣味挑战', icon: '✦', className: 'tank' },
]

function App() {
  return (
    <div className="home-app">
      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-content">
          <p className="hero-eyebrow"><span /> 给陪伴多一点想象</p>
          <h1 id="hero-title">今天，一起<br /><em>玩点什么？</em></h1>
          <p className="hero-desc">放下忙碌，和孩子一起进入游戏的世界。<br className="desktop-break" />好玩的时光，从这里开始。</p>
          <div className="hero-actions">
            <a className="primary-action" href="/games" target="_top" onClick={openGames}>探索游戏 <span aria-hidden="true">↗</span></a>
            <a className="text-action" href="#featured">看看有什么好玩 <span aria-hidden="true">↓</span></a>
          </div>
          <p className="hero-note"><span>✳</span> 简单上手，快乐一起分享</p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
          <span className="art-spark spark-one">✳</span><span className="art-spark spark-two">✦</span>
          <div className="art-card art-card-back"><span>LET'S</span><strong>PLAY!</strong><small>TOGETHER IS BETTER</small></div>
          <div className="art-card art-card-front"><div className="art-face"><i /><i /><b /></div><span>好好玩耍<br />好好长大</span></div>
          <div className="art-stamp">PLAY<br />TIME <span>✴</span></div>
        </div>
      </section>
      <section className="featured-section" id="featured" aria-labelledby="featured-title">
        <div className="section-heading">
          <div><p className="section-kicker">PICK A GAME / 选一个开始</p><h2 id="featured-title">好玩的，现在就开始<span> ✳</span></h2><p>两个人，一点时间，就能收获一段快乐回忆。</p></div>
          <a href="/games" target="_top" onClick={openGames} className="all-games">查看全部游戏 <span aria-hidden="true">↗</span></a>
        </div>
        <div className="featured-grid">
          {games.map((game, index) => (
            <a href="/games" target="_top" onClick={openGames} className={`featured-card ${game.className}`} key={game.name}>
              <div className="game-art"><span className="game-number">0{index + 1} / PLAY TOGETHER</span><span className="game-symbol" aria-hidden="true">{game.icon}</span><span className="game-art-note">READY TO PLAY ↗</span></div>
              <div className="game-copy"><div><p>{game.label}</p><h3>{game.name}</h3><span>{game.description}</span></div><span className="game-arrow" aria-hidden="true">↗</span></div>
            </a>
          ))}
        </div>
      </section>
      <section className="together-banner"><span className="banner-star" aria-hidden="true">✺</span><div><p>MAKE LITTLE MOMENTS BIG</p><h2>好玩的不只是游戏，<br />还有一起玩的你们。</h2></div><a href="/games" target="_top" onClick={openGames}>去游戏乐园 <span aria-hidden="true">↗</span></a></section>
    </div>
  )
}

export default App
