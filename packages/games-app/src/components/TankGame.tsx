import { useState, useEffect, useCallback, useRef } from 'react'
import { Button, Modal, Tag } from 'antd'
import { TrophyOutlined, RestOutlined } from '@ant-design/icons'
import './TankGame.less'

// ============ Types ============
type Direction = 'up' | 'down' | 'left' | 'right'

interface Tank {
  x: number
  y: number
  direction: Direction
  color: string
  player: number
  respawnTimer: number
  isAlive: boolean
  shield: number
  speed: number
}

interface Bullet {
  id: number
  x: number
  y: number
  direction: Direction
  player: number
  speed: number
}

interface Wall {
  x: number
  y: number
  type: 'brick' | 'steel' | 'water' | 'grass'
  hp: number
}

interface Explosion {
  id: number
  x: number
  y: number
  frame: number
  maxFrames: number
  size: number
}

interface PowerUp {
  id: number
  x: number
  y: number
  type: 'speed' | 'shield' | 'rapid' | 'life'
  timer: number
}

// ============ Constants ============
const BASE_COLS = 20
const BASE_ROWS = 16
const SHOOT_COOLDOWN = 280
const RAPID_COOLDOWN = 140
const RESPAWN_TIME = 60
const SHIELD_TIME = 180
const POWERUP_INTERVAL = 600
const POWERUP_LIFETIME = 480
const TICK_RATE = 1000 / 20 // 20 FPS game logic

// ============ Map Generator ============
function generateWalls(): Wall[] {
  const walls: Wall[] = []
  const map = [
    '....................', // 0
    '..BB..SSSS..BB.....',  // 1
    '..BB..........BB...',  // 2
    '....BB..SS..BB.....',  // 3
    '.BB....BBBB....BB..',  // 4
    '.BB..SS....SS..BB..',  // 5
    '......BB..BB.......',  // 6
    '..SS..........SS...',  // 7
    '..SS..........SS...',  // 8
    '......BB..BB.......',  // 9
    '.BB..SS....SS..BB..',  // 10
    '.BB....BBBB....BB..',  // 11
    '....BB..SS..BB.....',  // 12
    '..BB..........BB...',  // 13
    '..BB..SSSS..BB.....',  // 14
    '....................',  // 15
  ]
  for (let r = 0; r < map.length && r < BASE_ROWS; r++) {
    for (let c = 0; c < map[r].length && c < BASE_COLS; c++) {
      const ch = map[r][c]
      if (ch === 'B') walls.push({ x: c, y: r, type: 'brick', hp: 2 })
      else if (ch === 'S') walls.push({ x: c, y: r, type: 'steel', hp: 999 })
      else if (ch === 'W') walls.push({ x: c, y: r, type: 'water', hp: 999 })
      else if (ch === 'G') walls.push({ x: c, y: r, type: 'grass', hp: 999 })
    }
  }
  return walls
}

// ============ Touch Joystick Component ============
function TouchJoystick({ side, onDirection, onShoot }: {
  side: 'left' | 'right'
  onDirection: (dir: Direction | null) => void
  onShoot: () => void
}) {
  const joystickRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const activeTouchRef = useRef<number | null>(null)
  const centerRef = useRef({ x: 0, y: 0 })
  const DEAD_ZONE = 15
  const MAX_DIST = 40

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (activeTouchRef.current !== null) return
    const touch = e.changedTouches[0]
    activeTouchRef.current = touch.identifier
    const rect = joystickRef.current!.getBoundingClientRect()
    centerRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      if (touch.identifier !== activeTouchRef.current) continue
      const dx = touch.clientX - centerRef.current.x
      const dy = touch.clientY - centerRef.current.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (knobRef.current) {
        const clampDist = Math.min(dist, MAX_DIST)
        const angle = Math.atan2(dy, dx)
        knobRef.current.style.transform = `translate(${Math.cos(angle) * clampDist}px, ${Math.sin(angle) * clampDist}px)`
      }

      if (dist < DEAD_ZONE) {
        onDirection(null)
      } else {
        const angle = Math.atan2(dy, dx) * 180 / Math.PI
        if (angle > -45 && angle <= 45) onDirection('right')
        else if (angle > 45 && angle <= 135) onDirection('down')
        else if (angle > -135 && angle <= -45) onDirection('up')
        else onDirection('left')
      }
    }
  }, [onDirection])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchRef.current) {
        activeTouchRef.current = null
        onDirection(null)
        if (knobRef.current) {
          knobRef.current.style.transform = 'translate(0px, 0px)'
        }
      }
    }
  }, [onDirection])

  const playerColor = side === 'left' ? '#1890ff' : '#ff4d4f'

  return (
    <div className={`touch-controls touch-controls-${side}`}>
      <div
        className="joystick-area"
        ref={joystickRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="joystick-base" style={{ borderColor: playerColor }}>
          <div className="joystick-knob" ref={knobRef} style={{ background: playerColor }} />
        </div>
        <div className="joystick-arrows">
          <span className="arrow arrow-up">▲</span>
          <span className="arrow arrow-down">▼</span>
          <span className="arrow arrow-left">◀</span>
          <span className="arrow arrow-right">▶</span>
        </div>
      </div>
      <button
        className="shoot-button"
        style={{ background: playerColor, borderColor: playerColor }}
        onTouchStart={(e) => { e.preventDefault(); onShoot() }}
      >
        🔥
      </button>
      <div className="player-label" style={{ color: playerColor }}>
        P{side === 'left' ? 1 : 2}
      </div>
    </div>
  )
}


// ============ Canvas Renderer ============
function drawGame(
  ctx: CanvasRenderingContext2D,
  cellSize: number,
  tanks: Tank[],
  bullets: Bullet[],
  walls: Wall[],
  explosions: Explosion[],
  powerUps: PowerUp[]
) {
  const W = BASE_COLS * cellSize
  const H = BASE_ROWS * cellSize

  // Background
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, W, H)

  // Grid lines (subtle)
  ctx.strokeStyle = 'rgba(255,255,255,0.03)'
  ctx.lineWidth = 1
  for (let x = 0; x <= BASE_COLS; x++) {
    ctx.beginPath(); ctx.moveTo(x * cellSize, 0); ctx.lineTo(x * cellSize, H); ctx.stroke()
  }
  for (let y = 0; y <= BASE_ROWS; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * cellSize); ctx.lineTo(W, y * cellSize); ctx.stroke()
  }

  // Walls
  for (const wall of walls) {
    const wx = wall.x * cellSize
    const wy = wall.y * cellSize
    if (wall.type === 'brick') {
      ctx.fillStyle = '#92400e'
      ctx.fillRect(wx, wy, cellSize, cellSize)
      ctx.fillStyle = '#b45309'
      ctx.fillRect(wx + 1, wy + 1, cellSize / 2 - 1, cellSize / 2 - 1)
      ctx.fillRect(wx + cellSize / 2, wy + cellSize / 2, cellSize / 2 - 1, cellSize / 2 - 1)
      ctx.strokeStyle = '#5c3317'
      ctx.lineWidth = 1
      ctx.strokeRect(wx, wy, cellSize, cellSize)
    } else if (wall.type === 'steel') {
      const grad = ctx.createLinearGradient(wx, wy, wx + cellSize, wy + cellSize)
      grad.addColorStop(0, '#9ca3af')
      grad.addColorStop(0.5, '#6b7280')
      grad.addColorStop(1, '#4b5563')
      ctx.fillStyle = grad
      ctx.fillRect(wx, wy, cellSize, cellSize)
      ctx.strokeStyle = '#374151'
      ctx.lineWidth = 2
      ctx.strokeRect(wx, wy, cellSize, cellSize)
      // Rivet details
      ctx.fillStyle = '#d1d5db'
      const r = cellSize * 0.1
      ctx.beginPath(); ctx.arc(wx + r * 2, wy + r * 2, r, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(wx + cellSize - r * 2, wy + r * 2, r, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(wx + r * 2, wy + cellSize - r * 2, r, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(wx + cellSize - r * 2, wy + cellSize - r * 2, r, 0, Math.PI * 2); ctx.fill()
    } else if (wall.type === 'water') {
      ctx.fillStyle = '#1e40af'
      ctx.fillRect(wx, wy, cellSize, cellSize)
      ctx.fillStyle = 'rgba(96,165,250,0.4)'
      for (let i = 0; i < 3; i++) {
        const waveY = wy + (cellSize / 4) * (i + 0.5)
        ctx.beginPath()
        ctx.moveTo(wx, waveY)
        ctx.quadraticCurveTo(wx + cellSize / 4, waveY - 3, wx + cellSize / 2, waveY)
        ctx.quadraticCurveTo(wx + cellSize * 3 / 4, waveY + 3, wx + cellSize, waveY)
        ctx.lineTo(wx + cellSize, waveY + 3)
        ctx.lineTo(wx, waveY + 3)
        ctx.fill()
      }
    } else if (wall.type === 'grass') {
      ctx.fillStyle = '#166534'
      ctx.fillRect(wx, wy, cellSize, cellSize)
      ctx.fillStyle = '#22c55e'
      for (let i = 0; i < 5; i++) {
        const gx = wx + Math.random() * cellSize
        const gy = wy + cellSize
        ctx.beginPath()
        ctx.moveTo(gx, gy)
        ctx.lineTo(gx - 2, gy - cellSize * 0.6)
        ctx.lineTo(gx + 2, gy - cellSize * 0.6)
        ctx.fill()
      }
    }
  }

  // Power-ups
  for (const pu of powerUps) {
    const px = pu.x * cellSize + cellSize / 2
    const py = pu.y * cellSize + cellSize / 2
    const r = cellSize * 0.35
    const pulse = 0.9 + 0.1 * Math.sin(Date.now() / 200)

    ctx.save()
    ctx.translate(px, py)
    ctx.scale(pulse, pulse)

    // Glow
    ctx.shadowColor = pu.type === 'speed' ? '#facc15' : pu.type === 'shield' ? '#60a5fa' : pu.type === 'rapid' ? '#f97316' : '#ef4444'
    ctx.shadowBlur = 12

    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fillStyle = pu.type === 'speed' ? '#fbbf24' : pu.type === 'shield' ? '#3b82f6' : pu.type === 'rapid' ? '#f97316' : '#ef4444'
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.shadowBlur = 0
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${cellSize * 0.35}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const icon = pu.type === 'speed' ? '⚡' : pu.type === 'shield' ? '🛡' : pu.type === 'rapid' ? '🔥' : '❤'
    ctx.fillText(icon, 0, 1)
    ctx.restore()
  }

  // Tanks
  for (const tank of tanks) {
    if (!tank.isAlive) continue
    const tx = tank.x * cellSize + cellSize / 2
    const ty = tank.y * cellSize + cellSize / 2

    ctx.save()
    ctx.translate(tx, ty)
    const angles: Record<Direction, number> = { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }
    ctx.rotate(angles[tank.direction])

    // Shield effect
    if (tank.shield > 0) {
      ctx.beginPath()
      ctx.arc(0, 0, cellSize * 0.55, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(96,165,250,${0.4 + 0.3 * Math.sin(Date.now() / 100)})`
      ctx.lineWidth = 3
      ctx.stroke()
    }

    const s = cellSize * 0.4

    // Tracks
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(-s - 2, -s, 4, s * 2)
    ctx.fillRect(s - 2, -s, 4, s * 2)

    // Body
    ctx.fillStyle = tank.color
    ctx.fillRect(-s + 3, -s + 2, (s - 3) * 2, (s - 2) * 2)

    // Turret
    ctx.fillStyle = tank.color
    ctx.beginPath()
    ctx.arc(0, 2, s * 0.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1
    ctx.stroke()

    // Cannon
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.fillRect(-2.5, -s - cellSize * 0.2, 5, s * 0.7)

    ctx.restore()

    // Player label
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${Math.max(10, cellSize * 0.3)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(`P${tank.player}`, tx, ty + s + 2)
  }

  // Bullets
  for (const bullet of bullets) {
    const bx = bullet.x * cellSize + cellSize / 2
    const by = bullet.y * cellSize + cellSize / 2
    const br = cellSize * 0.12

    ctx.save()
    ctx.shadowColor = bullet.player === 1 ? '#1890ff' : '#ff4d4f'
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(bx, by, br, 0, Math.PI * 2)
    ctx.fillStyle = bullet.player === 1 ? '#60a5fa' : '#f87171'
    ctx.fill()
    ctx.restore()
  }

  // Explosions
  for (const exp of explosions) {
    const ex = exp.x * cellSize + cellSize / 2
    const ey = exp.y * cellSize + cellSize / 2
    const progress = exp.frame / exp.maxFrames
    const r = exp.size * cellSize * (0.3 + progress * 0.7)
    const alpha = 1 - progress

    ctx.save()
    ctx.globalAlpha = alpha

    // Outer ring
    ctx.beginPath()
    ctx.arc(ex, ey, r, 0, Math.PI * 2)
    const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, r)
    grad.addColorStop(0, '#fbbf24')
    grad.addColorStop(0.4, '#f97316')
    grad.addColorStop(0.7, '#ef4444')
    grad.addColorStop(1, 'rgba(239,68,68,0)')
    ctx.fillStyle = grad
    ctx.fill()

    // Sparks
    const sparkCount = 6
    for (let i = 0; i < sparkCount; i++) {
      const angle = (Math.PI * 2 / sparkCount) * i + progress * 2
      const dist = r * (0.5 + progress * 0.5)
      ctx.beginPath()
      ctx.arc(ex + Math.cos(angle) * dist, ey + Math.sin(angle) * dist, 2, 0, Math.PI * 2)
      ctx.fillStyle = '#fef08a'
      ctx.fill()
    }

    ctx.restore()
  }
}


// ============ Main Game Component ============
function TankGame() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<number | null>(null)
  const [score1, setScore1] = useState(0)
  const [score2, setScore2] = useState(0)
  const [player1Lives, setPlayer1Lives] = useState(3)
  const [player2Lives, setPlayer2Lives] = useState(3)
  const [isMobile, setIsMobile] = useState(false)
  const [, forceUpdate] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cellSizeRef = useRef(30)

  const tank1Ref = useRef<Tank>({ x: 2, y: BASE_ROWS - 2, direction: 'up', color: '#1890ff', player: 1, respawnTimer: 0, isAlive: true, shield: SHIELD_TIME, speed: 1 })
  const tank2Ref = useRef<Tank>({ x: BASE_COLS - 3, y: BASE_ROWS - 2, direction: 'up', color: '#ff4d4f', player: 2, respawnTimer: 0, isAlive: true, shield: SHIELD_TIME, speed: 1 })
  const bulletsRef = useRef<Bullet[]>([])
  const wallsRef = useRef<Wall[]>([])
  const explosionsRef = useRef<Explosion[]>([])
  const powerUpsRef = useRef<PowerUp[]>([])
  const keysRef = useRef<Set<string>>(new Set())
  const bulletIdRef = useRef(0)
  const explosionIdRef = useRef(0)
  const powerUpIdRef = useRef(0)
  const gameLoopRef = useRef<number | null>(null)
  const lastShootTimeRef = useRef<Record<number, number>>({ 1: 0, 2: 0 })
  const rapidFireRef = useRef<Record<number, number>>({ 1: 0, 2: 0 })
  const tickCountRef = useRef(0)
  const lastTickRef = useRef(0)
  const touchDirRef = useRef<Record<number, Direction | null>>({ 1: null, 2: null })
  const touchShootRef = useRef<Record<number, boolean>>({ 1: false, 2: false })
  const livesRef = useRef({ p1: 3, p2: 3 })
  const scoresRef = useRef({ p1: 0, p2: 0 })
  const gameOverRef = useRef(false)

  // Detect mobile/tablet
  useEffect(() => {
    const check = () => {
      const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const narrow = window.innerWidth <= 1024
      setIsMobile(touch && narrow)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Resize canvas
  useEffect(() => {
    const resize = () => {
      if (!containerRef.current || !canvasRef.current) return
      const container = containerRef.current
      const maxW = container.clientWidth
      const maxH = isMobile ? window.innerHeight * 0.5 : window.innerHeight * 0.65
      const cellW = Math.floor(maxW / BASE_COLS)
      const cellH = Math.floor(maxH / BASE_ROWS)
      const cell = Math.max(16, Math.min(cellW, cellH, 40))
      cellSizeRef.current = cell
      canvasRef.current.width = BASE_COLS * cell
      canvasRef.current.height = BASE_ROWS * cell
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [isMobile])

  const addExplosion = useCallback((x: number, y: number, size: number = 1) => {
    explosionsRef.current.push({
      id: explosionIdRef.current++,
      x, y,
      frame: 0,
      maxFrames: 12,
      size
    })
  }, [])

  const spawnPowerUp = useCallback(() => {
    const types: PowerUp['type'][] = ['speed', 'shield', 'rapid', 'life']
    let x: number, y: number
    let attempts = 0
    do {
      x = Math.floor(Math.random() * (BASE_COLS - 4)) + 2
      y = Math.floor(Math.random() * (BASE_ROWS - 4)) + 2
      attempts++
    } while (
      attempts < 50 &&
      (wallsRef.current.some(w => w.x === x && w.y === y) ||
       powerUpsRef.current.some(p => p.x === x && p.y === y))
    )
    if (attempts < 50) {
      powerUpsRef.current.push({
        id: powerUpIdRef.current++,
        x, y,
        type: types[Math.floor(Math.random() * types.length)],
        timer: POWERUP_LIFETIME
      })
    }
  }, [])

  const resetGame = useCallback(() => {
    tank1Ref.current = { x: 2, y: BASE_ROWS - 2, direction: 'up', color: '#1890ff', player: 1, respawnTimer: 0, isAlive: true, shield: SHIELD_TIME, speed: 1 }
    tank2Ref.current = { x: BASE_COLS - 3, y: BASE_ROWS - 2, direction: 'up', color: '#ff4d4f', player: 2, respawnTimer: 0, isAlive: true, shield: SHIELD_TIME, speed: 1 }
    bulletsRef.current = []
    wallsRef.current = generateWalls()
    explosionsRef.current = []
    powerUpsRef.current = []
    bulletIdRef.current = 0
    tickCountRef.current = 0
    livesRef.current = { p1: 3, p2: 3 }
    scoresRef.current = { p1: 0, p2: 0 }
    gameOverRef.current = false
    rapidFireRef.current = { 1: 0, 2: 0 }
    setScore1(0)
    setScore2(0)
    setPlayer1Lives(3)
    setPlayer2Lives(3)
    setGameOver(false)
    setWinner(null)
  }, [])

  const moveTank = useCallback((tank: Tank, dx: number, dy: number): boolean => {
    const newX = tank.x + dx
    const newY = tank.y + dy
    if (newX < 0 || newX >= BASE_COLS || newY < 0 || newY >= BASE_ROWS) return false
    for (const wall of wallsRef.current) {
      if (wall.x === newX && wall.y === newY && wall.type !== 'grass') return false
    }
    const otherTank = tank.player === 1 ? tank2Ref.current : tank1Ref.current
    if (otherTank.isAlive && otherTank.x === newX && otherTank.y === newY) return false
    tank.x = newX
    tank.y = newY
    return true
  }, [])

  const shoot = useCallback((player: number) => {
    const now = Date.now()
    const cooldown = rapidFireRef.current[player] > 0 ? RAPID_COOLDOWN : SHOOT_COOLDOWN
    if (now - lastShootTimeRef.current[player] < cooldown) return
    lastShootTimeRef.current[player] = now

    const tank = player === 1 ? tank1Ref.current : tank2Ref.current
    if (!tank.isAlive) return

    let dx = 0, dy = 0
    switch (tank.direction) {
      case 'up': dy = -1; break
      case 'down': dy = 1; break
      case 'left': dx = -1; break
      case 'right': dx = 1; break
    }
    bulletsRef.current.push({
      id: bulletIdRef.current++,
      x: tank.x + dx,
      y: tank.y + dy,
      direction: tank.direction,
      player,
      speed: 1
    })
  }, [])

  const collectPowerUp = useCallback((tank: Tank) => {
    for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
      const pu = powerUpsRef.current[i]
      if (pu.x === tank.x && pu.y === tank.y) {
        powerUpsRef.current.splice(i, 1)
        switch (pu.type) {
          case 'speed': tank.speed = 2; setTimeout(() => { tank.speed = 1 }, 8000); break
          case 'shield': tank.shield = SHIELD_TIME; break
          case 'rapid': rapidFireRef.current[tank.player] = 300; break
          case 'life':
            if (tank.player === 1) {
              livesRef.current.p1 = Math.min(livesRef.current.p1 + 1, 5)
              setPlayer1Lives(livesRef.current.p1)
            } else {
              livesRef.current.p2 = Math.min(livesRef.current.p2 + 1, 5)
              setPlayer2Lives(livesRef.current.p2)
            }
            break
        }
        addExplosion(pu.x, pu.y, 0.5)
      }
    }
  }, [addExplosion])

  const updateBullets = useCallback(() => {
    const bullets = bulletsRef.current
    const walls = wallsRef.current
    const tank1 = tank1Ref.current
    const tank2 = tank2Ref.current

    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i]
      let dx = 0, dy = 0
      switch (bullet.direction) {
        case 'up': dy = -1; break
        case 'down': dy = 1; break
        case 'left': dx = -1; break
        case 'right': dx = 1; break
      }
      bullet.x += dx
      bullet.y += dy

      if (bullet.x < 0 || bullet.x >= BASE_COLS || bullet.y < 0 || bullet.y >= BASE_ROWS) {
        bullets.splice(i, 1)
        continue
      }

      // Wall collision
      let hitWall = -1
      for (let j = 0; j < walls.length; j++) {
        if (walls[j].x === bullet.x && walls[j].y === bullet.y && walls[j].type !== 'grass') {
          hitWall = j
          break
        }
      }
      if (hitWall !== -1) {
        const wall = walls[hitWall]
        if (wall.type === 'brick') {
          wall.hp--
          if (wall.hp <= 0) {
            walls.splice(hitWall, 1)
          }
          addExplosion(bullet.x, bullet.y, 0.6)
        } else if (wall.type === 'steel') {
          addExplosion(bullet.x, bullet.y, 0.3)
        }
        if (wall.type !== 'water') {
          bullets.splice(i, 1)
        }
        continue
      }

      // Bullet-bullet collision
      for (let j = bullets.length - 1; j >= 0; j--) {
        if (i === j) continue
        if (bullets[j] && bullet.x === bullets[j].x && bullet.y === bullets[j].y && bullet.player !== bullets[j].player) {
          addExplosion(bullet.x, bullet.y, 0.4)
          bullets.splice(Math.max(i, j), 1)
          bullets.splice(Math.min(i, j), 1)
          i--
          break
        }
      }
      if (i < 0 || i >= bullets.length) continue

      // Tank collision
      const targetTank = bullet.player === 1 ? tank2 : tank1
      if (targetTank.isAlive && bullet.x === targetTank.x && bullet.y === targetTank.y) {
        bullets.splice(i, 1)

        if (targetTank.shield > 0) {
          targetTank.shield = 0
          addExplosion(targetTank.x, targetTank.y, 0.5)
          continue
        }

        addExplosion(targetTank.x, targetTank.y, 1.2)

        if (bullet.player === 1) {
          scoresRef.current.p1 += 100
          setScore1(scoresRef.current.p1)
          livesRef.current.p2--
          setPlayer2Lives(livesRef.current.p2)
          if (livesRef.current.p2 <= 0) {
            gameOverRef.current = true
            setGameOver(true)
            setWinner(1)
          } else {
            targetTank.isAlive = false
            targetTank.respawnTimer = RESPAWN_TIME
          }
        } else {
          scoresRef.current.p2 += 100
          setScore2(scoresRef.current.p2)
          livesRef.current.p1--
          setPlayer1Lives(livesRef.current.p1)
          if (livesRef.current.p1 <= 0) {
            gameOverRef.current = true
            setGameOver(true)
            setWinner(2)
          } else {
            targetTank.isAlive = false
            targetTank.respawnTimer = RESPAWN_TIME
          }
        }
      }
    }
  }, [addExplosion])


  // Initialize walls
  useEffect(() => {
    wallsRef.current = generateWalls()
  }, [])

  // Keyboard input
  useEffect(() => {
    if (!gameStarted || gameOver) return
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase())
      e.preventDefault()
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase())
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameStarted, gameOver])

  // Touch direction handlers
  const handleP1Direction = useCallback((dir: Direction | null) => { touchDirRef.current[1] = dir }, [])
  const handleP2Direction = useCallback((dir: Direction | null) => { touchDirRef.current[2] = dir }, [])
  const handleP1Shoot = useCallback(() => { touchShootRef.current[1] = true }, [])
  const handleP2Shoot = useCallback(() => { touchShootRef.current[2] = true }, [])

  // Main game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return

    const loop = () => {
      const now = Date.now()
      if (now - lastTickRef.current >= TICK_RATE) {
        lastTickRef.current = now
        if (!gameOverRef.current) {
          tickCountRef.current++
          const keys = keysRef.current
          const tank1 = tank1Ref.current
          const tank2 = tank2Ref.current

          // Respawn logic
          for (const tank of [tank1, tank2]) {
            if (!tank.isAlive) {
              tank.respawnTimer--
              if (tank.respawnTimer <= 0) {
                tank.isAlive = true
                tank.shield = SHIELD_TIME
                tank.x = tank.player === 1 ? 2 : BASE_COLS - 3
                tank.y = BASE_ROWS - 2
                tank.direction = 'up'
              }
            }
          }

          // Shield countdown
          if (tank1.shield > 0) tank1.shield--
          if (tank2.shield > 0) tank2.shield--

          // Rapid fire countdown
          if (rapidFireRef.current[1] > 0) rapidFireRef.current[1]--
          if (rapidFireRef.current[2] > 0) rapidFireRef.current[2]--

          // Player 1 movement (keyboard: WASD + F, touch: joystick)
          if (tank1.isAlive) {
            const dir1 = touchDirRef.current[1]
            if (keys.has('w') || dir1 === 'up') { tank1.direction = 'up'; moveTank(tank1, 0, -1) }
            else if (keys.has('s') || dir1 === 'down') { tank1.direction = 'down'; moveTank(tank1, 0, 1) }
            else if (keys.has('a') || dir1 === 'left') { tank1.direction = 'left'; moveTank(tank1, -1, 0) }
            else if (keys.has('d') || dir1 === 'right') { tank1.direction = 'right'; moveTank(tank1, 1, 0) }
            if (keys.has('f') || touchShootRef.current[1]) { shoot(1); touchShootRef.current[1] = false }
            collectPowerUp(tank1)
          }

          // Player 2 movement (keyboard: arrows + Enter, touch: joystick)
          if (tank2.isAlive) {
            const dir2 = touchDirRef.current[2]
            if (keys.has('arrowup') || dir2 === 'up') { tank2.direction = 'up'; moveTank(tank2, 0, -1) }
            else if (keys.has('arrowdown') || dir2 === 'down') { tank2.direction = 'down'; moveTank(tank2, 0, 1) }
            else if (keys.has('arrowleft') || dir2 === 'left') { tank2.direction = 'left'; moveTank(tank2, -1, 0) }
            else if (keys.has('arrowright') || dir2 === 'right') { tank2.direction = 'right'; moveTank(tank2, 1, 0) }
            if (keys.has('enter') || touchShootRef.current[2]) { shoot(2); touchShootRef.current[2] = false }
            collectPowerUp(tank2)
          }

          updateBullets()

          // Update explosions
          for (let i = explosionsRef.current.length - 1; i >= 0; i--) {
            explosionsRef.current[i].frame++
            if (explosionsRef.current[i].frame >= explosionsRef.current[i].maxFrames) {
              explosionsRef.current.splice(i, 1)
            }
          }

          // Power-up spawning
          if (tickCountRef.current % POWERUP_INTERVAL === 0) {
            spawnPowerUp()
          }

          // Power-up lifetime
          for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
            powerUpsRef.current[i].timer--
            if (powerUpsRef.current[i].timer <= 0) {
              powerUpsRef.current.splice(i, 1)
            }
          }
        }
      }

      // Render
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          drawGame(ctx, cellSizeRef.current, [tank1Ref.current, tank2Ref.current], bulletsRef.current, wallsRef.current, explosionsRef.current, powerUpsRef.current)
        }
      }

      gameLoopRef.current = requestAnimationFrame(loop)
    }

    lastTickRef.current = Date.now()
    gameLoopRef.current = requestAnimationFrame(loop)
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)
    }
  }, [gameStarted, gameOver, moveTank, shoot, updateBullets, collectPowerUp, spawnPowerUp])

  return (
    <div className={`tank-game-container ${isMobile ? 'is-mobile' : ''}`}>
      <div className="game-header">
        <div className="player-info player1">
          <Tag color="blue">P1 蓝</Tag>
          <span className="score">得分: {score1}</span>
          <span className="lives">{'❤️'.repeat(Math.max(0, player1Lives))}</span>
        </div>
        <h2 className="game-title">🎮 双人坦克大战</h2>
        <div className="player-info player2">
          <Tag color="red">P2 红</Tag>
          <span className="score">得分: {score2}</span>
          <span className="lives">{'❤️'.repeat(Math.max(0, player2Lives))}</span>
        </div>
      </div>

      <div className="game-area" ref={containerRef}>
        <div className="canvas-wrapper">
          <canvas
            ref={canvasRef}
            className="game-canvas"
            style={{ touchAction: 'none' }}
          />
          {!gameStarted && (
            <div className="start-overlay">
              <h3>🎮 双人坦克大战</h3>
              <p className="subtitle">支持触屏 & 键盘操作</p>
              <Button type="primary" size="large" onClick={() => { resetGame(); setGameStarted(true) }}>
                开始游戏
              </Button>
            </div>
          )}
        </div>

        {/* Touch controls for mobile/tablet */}
        {isMobile && gameStarted && !gameOver && (
          <div className="touch-controls-row">
            <TouchJoystick side="left" onDirection={handleP1Direction} onShoot={handleP1Shoot} />
            <TouchJoystick side="right" onDirection={handleP2Direction} onShoot={handleP2Shoot} />
          </div>
        )}

        {/* Keyboard controls info for desktop */}
        {!isMobile && (
          <div className="controls-info">
            <div className="player-controls">
              <h4>🔵 玩家1</h4>
              <p><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 移动</p>
              <p><kbd>F</kbd> 射击</p>
            </div>
            <div className="player-controls">
              <h4>🔴 玩家2</h4>
              <p><kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd> 移动</p>
              <p><kbd>Enter</kbd> 射击</p>
            </div>
            <div className="powerup-legend">
              <h4>道具说明</h4>
              <p>⚡ 加速 &nbsp; 🛡 护盾</p>
              <p>🔥 连射 &nbsp; ❤ 加命</p>
            </div>
          </div>
        )}
      </div>

      <Modal
        title={null}
        open={gameOver}
        footer={null}
        centered
        closable={false}
        className="game-over-modal"
      >
        <div className="game-over-content">
          <TrophyOutlined className="trophy-icon" />
          <h2>🏆 玩家{winner} 获胜！</h2>
          <div className="final-scores">
            <div className="score-item">
              <Tag color="blue">玩家1</Tag>
              <span>{score1} 分</span>
            </div>
            <div className="score-item">
              <Tag color="red">玩家2</Tag>
              <span>{score2} 分</span>
            </div>
          </div>
          <Button type="primary" size="large" onClick={() => { resetGame(); setGameStarted(true) }} icon={<RestOutlined />}>
            再来一局
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default TankGame
