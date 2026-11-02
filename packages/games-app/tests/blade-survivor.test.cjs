const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const root = path.join(__dirname, '../public/blade-survivor')
const { World } = require(path.join(root, 'src/world.js'))
const { SoundBank } = require(path.join(root, 'src/audio.js'))

test('游戏入口引用的脚本、图集和音效均已随应用交付', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  for (const file of ['src/world.js', 'src/audio.js', 'game.js']) {
    assert.ok(html.includes(file))
    assert.ok(fs.statSync(path.join(root, file)).size > 0)
  }
  for (const file of ['assets/journey-characters.png', 'assets/huaguo-ground.png', ...['start', 'hit', 'defeat', 'pickup', 'upgrade', 'choose', 'hurt', 'win', 'lose'].map(name => `assets/audio/${name}.wav`)]) {
    assert.ok(fs.statSync(path.join(root, file)).size > 0)
  }
})

test('集成后的游戏保持开局、升级和胜利规则', () => {
  const world = new World(() => 0)
  assert.equal(world.player.blades, 6)
  world.xp = world.nextXp
  world.update(0)
  assert.equal(world.status, 'upgrade')
  world.choose(0)
  assert.equal(world.status, 'playing')
  world.time = 89.99
  world.update(0.02)
  assert.equal(world.status, 'won')
  assert.equal(typeof SoundBank, 'function')
})

test('三种难度分别设置生命、刷怪与敌人强度，中等保持原有规则', () => {
  const easy = new World(() => 0, 'easy')
  const normal = new World(() => 0, 'normal')
  const hard = new World(() => 0, 'hard')
  assert.deepEqual([easy.player.hp, normal.player.hp, hard.player.hp], [10, 7, 5])
  for (const world of [easy, normal, hard]) world.update(0)
  assert.ok(easy.spawnClock > normal.spawnClock && normal.spawnClock > hard.spawnClock)
  assert.deepEqual([easy.enemies[0].hp, normal.enemies[0].hp, hard.enemies[0].hp], [2, 2, 3])
  for (const world of [easy, normal, hard]) { world.time = 45; world.spawn() }
  assert.equal(easy.enemies[1].elite, false)
  assert.equal(normal.enemies[1].elite, false)
  assert.equal(hard.enemies[1].elite, true)
  assert.equal(new World(() => 0, 'invalid').player.hp, 7)
})

test('开局切换难度并分别读取纪录，战败后可以重新选择', () => {
  const labels = [], events = {}, storage = { 'blade-best': 12, 'blade-best-easy': 20, 'blade-best-hard': 4 }
  let next, world
  class TestWorld extends World { constructor(...args) { super(...args); world = this } }
  const context = new Proxy({ fillText: value => labels.push(String(value)) }, { get: (target, key) => target[key] || (() => {}) })
  const runtime = {
    GameGlobal: {}, console, Math,
    require: file => file.includes('audio') ? { SoundBank } : { World: TestWorld },
    requestAnimationFrame: callback => { next = callback },
    tt: {
      createCanvas: () => ({ getContext: () => context }),
      getSystemInfoSync: () => ({ windowWidth: 390, windowHeight: 844, pixelRatio: 1 }),
      createImage: () => ({ addEventListener() {}, set src(value) {} }),
      createInnerAudioContext: () => ({ stop() {}, play() {}, onPlay() {}, onError() {} }),
      getStorageSync: key => storage[key], setStorageSync: (key, value) => { storage[key] = value },
      onTouchStart: callback => { events.start = callback }, onTouchMove() {}, onTouchEnd() {}, onTouchCancel() {}, onHide() {}, onShow() {},
    },
  }
  vm.runInNewContext(fs.readFileSync(path.join(root, 'game.js'), 'utf8'), runtime)
  let now = 100
  const frame = () => { labels.length = 0; next(now); now += 16 }
  const tap = (x, y) => events.start({ changedTouches: [{ clientX: x, clientY: y, identifier: 1 }] })
  frame()
  assert.ok(labels.includes('最高击败 12  /  v0.5.0'))
  tap(320, 440); frame()
  assert.ok(labels.includes('最高击败 4  /  v0.5.0'))
  tap(195, 530); frame()
  assert.equal(world.difficulty, 'hard')
  assert.equal(world.player.hp, 5)
  world.player.hp = 0; frame()
  tap(195, 610); frame()
  tap(70, 440); frame()
  assert.ok(labels.includes('最高击败 20  /  v0.5.0'))
  tap(195, 530); frame()
  assert.equal(world.difficulty, 'easy')
  assert.equal(world.player.hp, 10)
})
