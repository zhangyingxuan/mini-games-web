import { useState, useCallback, useRef, useEffect } from 'react'
import { Button, Modal, Tag } from 'antd'
import { TrophyOutlined, UndoOutlined, RestOutlined } from '@ant-design/icons'
import './GomokuGame.less'

// ============ Constants ============
const BOARD_SIZE = 15
const WIN_COUNT = 5

type Stone = 0 | 1 | 2 // 0=empty, 1=black, 2=white
type Board = Stone[][]

interface Move {
  row: number
  col: number
  player: Stone
}

interface WinLine {
  cells: { row: number; col: number }[]
}

// ============ Game Logic ============
function createBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0))
}

function checkWin(board: Board, row: number, col: number, player: Stone): WinLine | null {
  const directions = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diagonal
    [1, -1],  // anti-diagonal
  ]

  for (const [dr, dc] of directions) {
    const cells: { row: number; col: number }[] = [{ row, col }]

    // Forward
    for (let i = 1; i < WIN_COUNT; i++) {
      const r = row + dr * i
      const c = col + dc * i
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) break
      if (board[r][c] !== player) break
      cells.push({ row: r, col: c })
    }

    // Backward
    for (let i = 1; i < WIN_COUNT; i++) {
      const r = row - dr * i
      const c = col - dc * i
      if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) break
      if (board[r][c] !== player) break
      cells.push({ row: r, col: c })
    }

    if (cells.length >= WIN_COUNT) {
      return { cells }
    }
  }

  return null
}

function isBoardFull(board: Board): boolean {
  return board.every(row => row.every(cell => cell !== 0))
}

// ============ Canvas Renderer ============
function drawBoard(
  ctx: CanvasRenderingContext2D,
  cellSize: number,
  board: Board,
  lastMove: Move | null,
  winLine: WinLine | null,
  hoverCell: { row: number; col: number } | null,
  currentPlayer: Stone
) {
  const padding = cellSize
  const boardPixelSize = (BOARD_SIZE - 1) * cellSize + padding * 2
  const W = boardPixelSize
  const H = boardPixelSize

  // Background - wood texture
  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, '#deb887')
  grad.addColorStop(0.3, '#d2a86e')
  grad.addColorStop(0.7, '#c49a5c')
  grad.addColorStop(1, '#b8894a')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Wood grain lines
  ctx.strokeStyle = 'rgba(139, 90, 43, 0.08)'
  ctx.lineWidth = 1
  for (let i = 0; i < H; i += 6) {
    ctx.beginPath()
    ctx.moveTo(0, i + Math.sin(i * 0.05) * 3)
    for (let x = 0; x < W; x += 20) {
      ctx.lineTo(x, i + Math.sin((i + x) * 0.03) * 4)
    }
    ctx.stroke()
  }

  // Grid lines
  ctx.strokeStyle = '#5c3d1a'
  ctx.lineWidth = 1
  for (let i = 0; i < BOARD_SIZE; i++) {
    const pos = padding + i * cellSize
    // Horizontal
    ctx.beginPath()
    ctx.moveTo(padding, pos)
    ctx.lineTo(padding + (BOARD_SIZE - 1) * cellSize, pos)
    ctx.stroke()
    // Vertical
    ctx.beginPath()
    ctx.moveTo(pos, padding)
    ctx.lineTo(pos, padding + (BOARD_SIZE - 1) * cellSize)
    ctx.stroke()
  }

  // Star points (天元 and 星位)
  const starPoints = BOARD_SIZE === 15
    ? [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11], [3, 7], [7, 3], [7, 11], [11, 7]]
    : [[3, 3], [3, 9], [6, 6], [9, 3], [9, 9]]
  ctx.fillStyle = '#5c3d1a'
  for (const [r, c] of starPoints) {
    if (r < BOARD_SIZE && c < BOARD_SIZE) {
      ctx.beginPath()
      ctx.arc(padding + c * cellSize, padding + r * cellSize, cellSize * 0.12, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Hover indicator
  if (hoverCell && board[hoverCell.row][hoverCell.col] === 0) {
    const hx = padding + hoverCell.col * cellSize
    const hy = padding + hoverCell.row * cellSize
    ctx.globalAlpha = 0.35
    ctx.beginPath()
    ctx.arc(hx, hy, cellSize * 0.42, 0, Math.PI * 2)
    ctx.fillStyle = currentPlayer === 1 ? '#1a1a1a' : '#f0f0f0'
    ctx.fill()
    ctx.globalAlpha = 1
  }

  // Stones
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const stone = board[r][c]
      if (stone === 0) continue

      const sx = padding + c * cellSize
      const sy = padding + r * cellSize
      const radius = cellSize * 0.43

      ctx.save()

      if (stone === 1) {
        // Black stone
        const bGrad = ctx.createRadialGradient(sx - radius * 0.3, sy - radius * 0.3, radius * 0.1, sx, sy, radius)
        bGrad.addColorStop(0, '#555')
        bGrad.addColorStop(0.6, '#222')
        bGrad.addColorStop(1, '#000')
        ctx.fillStyle = bGrad
      } else {
        // White stone
        const wGrad = ctx.createRadialGradient(sx - radius * 0.3, sy - radius * 0.3, radius * 0.1, sx, sy, radius)
        wGrad.addColorStop(0, '#fff')
        wGrad.addColorStop(0.7, '#e8e8e8')
        wGrad.addColorStop(1, '#c0c0c0')
        ctx.fillStyle = wGrad
      }

      // Shadow
      ctx.shadowColor = 'rgba(0,0,0,0.3)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2

      ctx.beginPath()
      ctx.arc(sx, sy, radius, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }
  }

  // Last move marker
  if (lastMove) {
    const lx = padding + lastMove.col * cellSize
    const ly = padding + lastMove.row * cellSize
    ctx.strokeStyle = lastMove.player === 1 ? '#ff4d4f' : '#ff4d4f'
    ctx.lineWidth = 2
    const markSize = cellSize * 0.15
    ctx.beginPath()
    ctx.moveTo(lx - markSize, ly - markSize)
    ctx.lineTo(lx + markSize, ly + markSize)
    ctx.moveTo(lx + markSize, ly - markSize)
    ctx.lineTo(lx - markSize, ly + markSize)
    ctx.stroke()
  }

  // Win line highlight
  if (winLine) {
    ctx.save()
    const pulse = 0.6 + 0.4 * Math.abs(Math.sin(Date.now() / 300))
    ctx.globalAlpha = pulse

    for (const cell of winLine.cells) {
      const wx = padding + cell.col * cellSize
      const wy = padding + cell.row * cellSize
      ctx.beginPath()
      ctx.arc(wx, wy, cellSize * 0.48, 0, Math.PI * 2)
      ctx.strokeStyle = '#faad14'
      ctx.lineWidth = 3
      ctx.stroke()
    }

    // Connect line
    if (winLine.cells.length >= 2) {
      const sorted = [...winLine.cells].sort((a, b) => a.row - b.row || a.col - b.col)
      const first = sorted[0]
      const last = sorted[sorted.length - 1]
      ctx.beginPath()
      ctx.moveTo(padding + first.col * cellSize, padding + first.row * cellSize)
      ctx.lineTo(padding + last.col * cellSize, padding + last.row * cellSize)
      ctx.strokeStyle = 'rgba(250, 173, 20, 0.7)'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.stroke()
    }

    ctx.restore()
  }

  // Coordinate labels
  ctx.fillStyle = '#8b6914'
  ctx.font = `${Math.max(10, cellSize * 0.35)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < BOARD_SIZE; i++) {
    // Column labels (A-O)
    ctx.fillText(String.fromCharCode(65 + i), padding + i * cellSize, padding * 0.4)
    // Row labels (1-15)
    ctx.fillText(`${i + 1}`, padding * 0.35, padding + i * cellSize)
  }
}

// ============ Main Component ============
function GomokuGame() {
  const [board, setBoard] = useState<Board>(createBoard)
  const [currentPlayer, setCurrentPlayer] = useState<Stone>(1)
  const [history, setHistory] = useState<Move[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<Stone | null>(null)
  const [winLine, setWinLine] = useState<WinLine | null>(null)
  const [isDraw, setIsDraw] = useState(false)
  const [scores, setScores] = useState({ black: 0, white: 0, draw: 0 })
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cellSizeRef = useRef(32)
  const animFrameRef = useRef<number>(0)

  // Responsive cell size — maximize board within available space
  useEffect(() => {
    const resize = () => {
      if (!containerRef.current || !canvasRef.current) return
      const containerW = containerRef.current.clientWidth
      // Use the container's own height if available, otherwise estimate from viewport
      const containerH = containerRef.current.clientHeight > 100
        ? containerRef.current.clientHeight
        : window.innerHeight * 0.78 - 50 // toolbar ~40px + margins
      const maxBoardPx = Math.min(containerW, containerH)
      // Board needs (BOARD_SIZE - 1) cells + 2 * padding(=1 cell) = BOARD_SIZE + 1 cells
      const cell = Math.max(16, Math.floor(maxBoardPx / (BOARD_SIZE + 1)))
      cellSizeRef.current = cell
      const totalSize = (BOARD_SIZE - 1) * cell + cell * 2
      canvasRef.current.width = totalSize
      canvasRef.current.height = totalSize
    }
    // Delay first resize to let modal finish opening
    const timer = setTimeout(resize, 50)
    window.addEventListener('resize', resize)
    const observer = new ResizeObserver(resize)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => { clearTimeout(timer); window.removeEventListener('resize', resize); observer.disconnect() }
  }, [])

  // Render loop (for win line animation)
  useEffect(() => {
    const render = () => {
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          drawBoard(ctx, cellSizeRef.current, board, history.length > 0 ? history[history.length - 1] : null, winLine, hoverCell, currentPlayer)
        }
      }
      animFrameRef.current = requestAnimationFrame(render)
    }
    animFrameRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [board, history, winLine, hoverCell, currentPlayer])

  const getCellFromEvent = useCallback((e: React.MouseEvent | React.TouchEvent): { row: number; col: number } | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    let clientX: number, clientY: number
    if ('touches' in e) {
      if (e.touches.length === 0) return null
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY
    const padding = cellSizeRef.current
    const col = Math.round((x - padding) / cellSizeRef.current)
    const row = Math.round((y - padding) / cellSizeRef.current)

    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return null
    return { row, col }
  }, [])

  const placeStone = useCallback((row: number, col: number) => {
    if (gameOver) return
    if (board[row][col] !== 0) return

    const newBoard = board.map(r => [...r])
    newBoard[row][col] = currentPlayer

    const move: Move = { row, col, player: currentPlayer }
    const newHistory = [...history, move]

    setBoard(newBoard)
    setHistory(newHistory)

    // Check win
    const win = checkWin(newBoard, row, col, currentPlayer)
    if (win) {
      setWinLine(win)
      setWinner(currentPlayer)
      setGameOver(true)
      setScores(prev => ({
        ...prev,
        [currentPlayer === 1 ? 'black' : 'white']: prev[currentPlayer === 1 ? 'black' : 'white'] + 1
      }))
      return
    }

    // Check draw
    if (isBoardFull(newBoard)) {
      setIsDraw(true)
      setGameOver(true)
      setScores(prev => ({ ...prev, draw: prev.draw + 1 }))
      return
    }

    setCurrentPlayer(currentPlayer === 1 ? 2 : 1)
  }, [board, currentPlayer, gameOver, history])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const cell = getCellFromEvent(e)
    if (cell) placeStone(cell.row, cell.col)
  }, [getCellFromEvent, placeStone])

  const handleCanvasTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    const cell = getCellFromEvent(e)
    if (cell) placeStone(cell.row, cell.col)
  }, [getCellFromEvent, placeStone])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (gameOver) { setHoverCell(null); return }
    const cell = getCellFromEvent(e)
    setHoverCell(cell)
  }, [getCellFromEvent, gameOver])

  const handleMouseLeave = useCallback(() => {
    setHoverCell(null)
  }, [])

  const undoMove = useCallback(() => {
    if (history.length === 0 || gameOver) return
    const newHistory = [...history]
    const lastMove = newHistory.pop()!
    const newBoard = board.map(r => [...r])
    newBoard[lastMove.row][lastMove.col] = 0
    setBoard(newBoard)
    setHistory(newHistory)
    setCurrentPlayer(lastMove.player)
  }, [board, history, gameOver])

  const resetGame = useCallback(() => {
    setBoard(createBoard())
    setCurrentPlayer(1)
    setHistory([])
    setGameOver(false)
    setWinner(null)
    setWinLine(null)
    setIsDraw(false)
    setHoverCell(null)
  }, [])

  return (
    <div className="gomoku-container">
      <div className="gomoku-toolbar">
        <div className={`turn-indicator ${currentPlayer === 1 ? 'black-turn' : 'white-turn'}`}>
          <div className={`stone-icon ${currentPlayer === 1 ? 'black' : 'white'}`} />
          <span>{currentPlayer === 1 ? '黑棋' : '白棋'}落子</span>
        </div>
        <div className="score-board">
          <span className="score-item">⚫{scores.black}</span>
          <span className="score-sep">:</span>
          <span className="score-item">{scores.white}⚪</span>
          {scores.draw > 0 && <span className="score-draw">平{scores.draw}</span>}
        </div>
        <div className="toolbar-actions">
          <Button size="small" icon={<UndoOutlined />} onClick={undoMove} disabled={history.length === 0 || gameOver}>
            悔棋
          </Button>
          <span className="move-count">第{history.length}手</span>
          <Button size="small" icon={<RestOutlined />} onClick={resetGame}>
            重开
          </Button>
        </div>
      </div>

      <div className="gomoku-board-area" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="gomoku-canvas"
          onClick={handleCanvasClick}
          onTouchStart={handleCanvasTouch}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ touchAction: 'none' }}
        />
      </div>

      <Modal
        title={null}
        open={gameOver}
        footer={null}
        centered
        closable={false}
        className="gomoku-result-modal"
      >
        <div className="gomoku-result-content">
          {isDraw ? (
            <>
              <div className="result-icon">🤝</div>
              <h2>平局！</h2>
              <p>棋逢对手，势均力敌</p>
            </>
          ) : (
            <>
              <TrophyOutlined className="trophy-icon" />
              <h2>{winner === 1 ? '⚫ 黑棋' : '⚪ 白棋'} 获胜！</h2>
              <p>五子连珠，精彩对局</p>
            </>
          )}
          <div className="result-stats">
            <Tag color="#1a1a1a">⚫ 黑棋 {scores.black} 胜</Tag>
            <Tag color="#d9d9d9" style={{ color: '#333' }}>平局 {scores.draw}</Tag>
            <Tag color="#f0f0f0" style={{ color: '#333' }}>⚪ 白棋 {scores.white} 胜</Tag>
          </div>
          <Button type="primary" size="large" onClick={resetGame} icon={<RestOutlined />}>
            再来一局
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default GomokuGame
