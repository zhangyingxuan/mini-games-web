import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import './Layout.less'

const pages: Record<string, { title: string; description: string }> = {
  '/': { title: '亲子乐园 | 和孩子一起玩点什么', description: '在亲子乐园发现适合家庭的双人游戏，一起体验五子棋、坦克大战等趣味游戏。' },
  '/games': { title: '游戏乐园 | 亲子乐园', description: '浏览亲子游戏，和孩子一起玩双人五子棋、双人坦克大战。' },
  '/user': { title: '我的乐园 | 亲子乐园', description: '在亲子乐园查看游戏记录与收藏。' },
}

function Layout() {
  const { pathname } = useLocation()

  // 路由切换时同步页面摘要，避免所有页面显示首页信息。
  useEffect(() => {
    const page = pages[pathname] || pages['/']
    document.title = page.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', page.description)
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', page.title)
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', page.description)
  }, [pathname])

  return (
    <div className="main-layout">
      <header className="main-header"><div className="header-inner">
        <Link className="logo" to="/" aria-label="亲子乐园首页"><span className="logo-mark" aria-hidden="true">✳</span><span>亲子乐园<small>PLAY TOGETHER</small></span></Link>
        <nav className="main-nav" aria-label="主导航"><NavLink to="/" end>首页</NavLink><NavLink to="/games">游戏乐园</NavLink><NavLink to="/user">我的乐园</NavLink></nav>
        <Link className="header-action" to="/games">一起玩 <span aria-hidden="true">↗</span></Link>
      </div></header>
      <main className="main-content"><Outlet /></main>
      <footer className="main-footer"><div><Link className="footer-brand" to="/">✳ 亲子乐园</Link><p>把每一次陪伴，变成快乐的回忆。</p></div><span>PLAY TOGETHER, GROW TOGETHER.</span></footer>
    </div>
  )
}

export default Layout
