import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import microApp from '@micro-zoe/micro-app'

function Home() {
  const navigate = useNavigate()

  // 仅接受已知的内部路由，避免子应用触发任意跳转。
  useEffect(() => {
    const handleData = (data: { path?: string }) => {
      if (data.path === '/games') navigate('/games')
    }
    microApp.addDataListener('home-app', handleData)
    return () => microApp.removeDataListener('home-app', handleData)
  }, [navigate])

  return (
    <micro-app
      name="home-app"
      url="http://localhost:3001/"
      baseroute="/"
      iframe
      className="micro-app-container"
    />
  )
}

export default Home
