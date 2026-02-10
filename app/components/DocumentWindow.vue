<template>
  <div v-if="ps.state.document" class="document-window">
    <div class="document-title-bar">
      <div class="document-close-box" @click="ps.state.document = null"></div>
      <span class="document-title-text">
        {{ ps.state.document.name }}
        {{ ps.state.document.modified ? ' *' : '' }}
        ({{ ps.state.document.mode.toUpperCase() }}, {{ Math.round(ps.state.zoom * 100) }}%)
      </span>
    </div>

    <div class="ruler-area">
      <!-- Ruler top row -->
      <div v-if="ps.state.showRulers" class="ruler-top-row">
        <div class="ruler-corner"></div>
        <canvas ref="hRulerCanvas" class="ruler-horizontal" height="16"></canvas>
      </div>

      <!-- Content row -->
      <div class="ruler-content-row">
        <canvas
          v-if="ps.state.showRulers"
          ref="vRulerCanvas"
          class="ruler-vertical"
          width="16"
        ></canvas>

        <div ref="canvasContainer" class="canvas-container" @scroll="updateRulers">
          <div
            class="canvas-wrapper"
            :style="canvasWrapperStyle"
          >
            <canvas
              ref="displayCanvas"
              :width="ps.state.document.width"
              :height="ps.state.document.height"
              @mousedown="onMouseDown"
              @mousemove="onMouseMove"
              @mouseup="onMouseUp"
              @mouseleave="onMouseUp"
              @contextmenu.prevent
            ></canvas>
            <!-- Selection overlay -->
            <svg
              v-if="ps.state.document.selection && ps.state.showSelection"
              class="selection-overlay"
              :width="ps.state.document.width"
              :height="ps.state.document.height"
              :style="{ width: displayWidth + 'px', height: displayHeight + 'px' }"
            >
              <rect
                v-if="ps.state.document.selection.type === 'rect' || ps.state.document.selection.type === 'wand'"
                :x="ps.state.document.selection.x * ps.state.zoom"
                :y="ps.state.document.selection.y * ps.state.zoom"
                :width="ps.state.document.selection.width * ps.state.zoom"
                :height="ps.state.document.selection.height * ps.state.zoom"
                class="selection-path"
              />
              <ellipse
                v-if="ps.state.document.selection.type === 'ellipse'"
                :cx="(ps.state.document.selection.x + ps.state.document.selection.width / 2) * ps.state.zoom"
                :cy="(ps.state.document.selection.y + ps.state.document.selection.height / 2) * ps.state.zoom"
                :rx="ps.state.document.selection.width / 2 * ps.state.zoom"
                :ry="ps.state.document.selection.height / 2 * ps.state.zoom"
                class="selection-path"
              />
              <polygon
                v-if="ps.state.document.selection.type === 'lasso' && ps.state.document.selection.path"
                :points="lassoPoints"
                class="selection-path"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Status bar -->
    <div class="status-bar">
      <span>{{ toolName }} | {{ ps.state.document.width }}×{{ ps.state.document.height }} | {{ ps.state.document.mode.toUpperCase() }}</span>
      <span style="margin-left: auto">{{ cursorPos }}</span>
    </div>
  </div>

  <!-- No document state -->
  <div v-else class="document-window" style="align-items: center; justify-content: center; background: var(--mac-bg)">
    <div style="text-align: center; color: var(--mac-darker-gray)">
      <p style="font-size: 14px; margin-bottom: 8px">Adobe Photoshop 1.0</p>
      <p style="font-size: 11px">File &gt; New or File &gt; Open to start</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const ps = usePhotoshop()
const drawing = useDrawing()

const displayCanvas = ref<HTMLCanvasElement>()
const canvasContainer = ref<HTMLDivElement>()
const hRulerCanvas = ref<HTMLCanvasElement>()
const vRulerCanvas = ref<HTMLCanvasElement>()

const mouseX = ref(0)
const mouseY = ref(0)

const cursorPos = computed(() => `X: ${mouseX.value} Y: ${mouseY.value}`)

const toolNames: Record<string, string> = {
  marquee: 'Rectangular Marquee',
  'ellipse-marquee': 'Elliptical Marquee',
  lasso: 'Lasso',
  wand: 'Magic Wand',
  move: 'Move',
  crop: 'Crop',
  pencil: 'Pencil',
  brush: 'Paintbrush',
  airbrush: 'Airbrush',
  eraser: 'Eraser',
  stamp: 'Rubber Stamp',
  smudge: 'Smudge',
  blur: 'Blur',
  sharpen: 'Sharpen',
  bucket: 'Paint Bucket',
  gradient: 'Gradient',
  line: 'Line',
  text: 'Type',
  eyedropper: 'Eyedropper',
  hand: 'Hand',
  zoom: 'Zoom',
}

const toolName = computed(() => toolNames[ps.state.currentTool] || ps.state.currentTool)

const displayWidth = computed(() => {
  const doc = ps.state.document
  return doc ? doc.width * ps.state.zoom : 0
})

const displayHeight = computed(() => {
  const doc = ps.state.document
  return doc ? doc.height * ps.state.zoom : 0
})

const canvasWrapperStyle = computed(() => ({
  width: displayWidth.value + 'px',
  height: displayHeight.value + 'px',
}))

const lassoPoints = computed(() => {
  const sel = ps.state.document?.selection
  if (!sel || sel.type !== 'lasso' || !sel.path) return ''
  return sel.path.map(p => `${p.x * ps.state.zoom},${p.y * ps.state.zoom}`).join(' ')
})

const cursorStyle = computed(() => {
  const tool = ps.state.currentTool
  if (['pencil', 'brush', 'airbrush', 'eraser', 'blur', 'sharpen', 'smudge', 'stamp'].includes(tool)) return 'crosshair'
  if (['marquee', 'ellipse-marquee', 'lasso', 'wand', 'crop', 'bucket', 'gradient', 'line'].includes(tool)) return 'crosshair'
  if (tool === 'eyedropper') return 'crosshair'
  if (tool === 'hand') return 'grab'
  if (tool === 'zoom') return 'zoom-in'
  if (tool === 'text') return 'text'
  if (tool === 'move') return 'move'
  return 'default'
})

// Render the document canvas onto the display canvas
function renderDisplay() {
  const doc = ps.state.document
  if (!doc || !doc.canvas || !displayCanvas.value) return
  const dctx = displayCanvas.value.getContext('2d')
  if (!dctx) return

  displayCanvas.value.style.width = displayWidth.value + 'px'
  displayCanvas.value.style.height = displayHeight.value + 'px'
  displayCanvas.value.style.cursor = cursorStyle.value
  displayCanvas.value.style.imageRendering = ps.state.zoom >= 2 ? 'pixelated' : 'auto'

  dctx.imageSmoothingEnabled = ps.state.zoom < 2
  dctx.clearRect(0, 0, doc.width, doc.height)
  dctx.drawImage(doc.canvas, 0, 0)
}

// Rulers
function drawRulers() {
  drawHorizontalRuler()
  drawVerticalRuler()
}

function drawHorizontalRuler() {
  const canvas = hRulerCanvas.value
  if (!canvas || !ps.state.document) return
  const container = canvasContainer.value
  if (!container) return

  canvas.width = container.clientWidth
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const zoom = ps.state.zoom
  const scroll = container.scrollLeft
  const step = zoom >= 1 ? 50 : 100

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, 16)
  ctx.fillStyle = '#000'
  ctx.font = '9px sans-serif'

  for (let px = 0; px < ps.state.document.width; px += step) {
    const screenX = px * zoom - scroll
    if (screenX < -20 || screenX > canvas.width + 20) continue
    ctx.beginPath()
    ctx.moveTo(screenX, 10)
    ctx.lineTo(screenX, 16)
    ctx.stroke()
    ctx.fillText(String(px), screenX + 2, 9)
  }

  // Minor ticks
  const minorStep = step / 5
  for (let px = 0; px < ps.state.document.width; px += minorStep) {
    const screenX = px * zoom - scroll
    if (screenX < 0 || screenX > canvas.width) continue
    ctx.beginPath()
    ctx.moveTo(screenX, 13)
    ctx.lineTo(screenX, 16)
    ctx.stroke()
  }
}

function drawVerticalRuler() {
  const canvas = vRulerCanvas.value
  if (!canvas || !ps.state.document) return
  const container = canvasContainer.value
  if (!container) return

  canvas.height = container.clientHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const zoom = ps.state.zoom
  const scroll = container.scrollTop
  const step = zoom >= 1 ? 50 : 100

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, 16, canvas.height)
  ctx.fillStyle = '#000'
  ctx.font = '9px sans-serif'

  for (let px = 0; px < ps.state.document.height; px += step) {
    const screenY = px * zoom - scroll
    if (screenY < -20 || screenY > canvas.height + 20) continue
    ctx.beginPath()
    ctx.moveTo(10, screenY)
    ctx.lineTo(16, screenY)
    ctx.stroke()
    ctx.save()
    ctx.translate(9, screenY + 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(String(px), 0, 0)
    ctx.restore()
  }

  const minorStep = step / 5
  for (let px = 0; px < ps.state.document.height; px += minorStep) {
    const screenY = px * zoom - scroll
    if (screenY < 0 || screenY > canvas.height) continue
    ctx.beginPath()
    ctx.moveTo(13, screenY)
    ctx.lineTo(16, screenY)
    ctx.stroke()
  }
}

function updateRulers() {
  drawRulers()
}

// Mouse handlers
function onMouseDown(e: MouseEvent) {
  if (!displayCanvas.value) return
  drawing.startDraw(e, displayCanvas.value)
  renderDisplay()
}

function onMouseMove(e: MouseEvent) {
  if (!displayCanvas.value) return
  const coords = drawing.getCanvasCoords(e, displayCanvas.value)
  mouseX.value = coords.x
  mouseY.value = coords.y
  drawing.moveDraw(e, displayCanvas.value)
  renderDisplay()
}

function onMouseUp(e: MouseEvent) {
  if (!displayCanvas.value) return
  drawing.endDraw(e, displayCanvas.value)
  renderDisplay()
}

// Watch for document changes and re-render
let animFrame: number
function renderLoop() {
  renderDisplay()
  animFrame = requestAnimationFrame(renderLoop)
}

onMounted(() => {
  renderLoop()
  nextTick(() => drawRulers())
})

onUnmounted(() => {
  cancelAnimationFrame(animFrame)
})

watch(() => ps.state.zoom, () => {
  nextTick(() => drawRulers())
})

watch(() => ps.state.showRulers, () => {
  nextTick(() => drawRulers())
})
</script>
