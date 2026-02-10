<template>
  <div
    class="floating-palette"
    :style="{ top: position.y + 'px', right: '8px', width: '196px', marginTop: '200px' }"
    @mousedown.stop
  >
    <div class="palette-title" @mousedown="startDrag">
      <div class="palette-close" @click="ps.state.showColorPicker = false"></div>
      <span class="palette-title-text">Colors</span>
    </div>
    <div class="color-picker-body">
      <!-- Saturation/Value square -->
      <canvas
        ref="spectrumCanvas"
        class="color-picker-spectrum"
        width="180"
        height="180"
        @mousedown="onSpectrumDown"
        @mousemove="onSpectrumMove"
        @mouseup="spectrumDragging = false"
        @mouseleave="spectrumDragging = false"
      ></canvas>

      <!-- Hue bar -->
      <canvas
        ref="hueCanvas"
        class="color-picker-hue-bar"
        width="180"
        height="16"
        @mousedown="onHueDown"
        @mousemove="onHueMove"
        @mouseup="hueDragging = false"
        @mouseleave="hueDragging = false"
      ></canvas>

      <!-- Preview -->
      <div class="color-picker-preview">
        <div style="font-size: 10px; line-height: 24px; margin-right: 4px">New:</div>
        <div class="color-preview-box" :style="{ background: ps.state.foregroundColor }"></div>
        <div style="font-size: 10px; line-height: 24px; margin: 0 4px">Old:</div>
        <div class="color-preview-box" :style="{ background: oldColor }"></div>
      </div>

      <!-- RGB inputs -->
      <div class="color-picker-inputs">
        <label>R:</label>
        <input type="number" min="0" max="255" :value="rgb.r" @input="setR">
        <label>G:</label>
        <input type="number" min="0" max="255" :value="rgb.g" @input="setG">
        <label>B:</label>
        <input type="number" min="0" max="255" :value="rgb.b" @input="setB">
        <label>Hex:</label>
        <input
          type="text"
          :value="ps.state.foregroundColor"
          style="width: 60px"
          @change="setHex"
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const ps = usePhotoshop()
const position = reactive({ x: 0, y: 28 })
const spectrumCanvas = ref<HTMLCanvasElement>()
const hueCanvas = ref<HTMLCanvasElement>()
const spectrumDragging = ref(false)
const hueDragging = ref(false)
const oldColor = ref('#000000')

const hue = ref(0) // 0-360
const sat = ref(1) // 0-1
const val = ref(0) // 0-1

const rgb = computed(() => {
  const hex = ps.state.foregroundColor
  const r = parseInt(hex.slice(1, 3), 16) || 0
  const g = parseInt(hex.slice(3, 5), 16) || 0
  const b = parseInt(hex.slice(5, 7), 16) || 0
  return { r, g, b }
})

function drawSpectrum() {
  const canvas = spectrumCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  const w = canvas.width
  const h = canvas.height

  // Draw saturation/value gradient for current hue
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = x / w
      const v = 1 - y / h
      const [r, g, b] = hsvToRgb(hue.value, s, v)
      ctx.fillStyle = `rgb(${r},${g},${b})`
      ctx.fillRect(x, y, 1, 1)
    }
  }

  // Draw crosshair
  const cx = sat.value * w
  const cy = (1 - val.value) * h
  ctx.strokeStyle = val.value > 0.5 ? '#000' : '#fff'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(cx, cy, 5, 0, Math.PI * 2)
  ctx.stroke()
}

function drawHueBar() {
  const canvas = hueCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  const w = canvas.width

  for (let x = 0; x < w; x++) {
    const h = (x / w) * 360
    const [r, g, b] = hsvToRgb(h, 1, 1)
    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.fillRect(x, 0, 1, 16)
  }

  // Draw indicator
  const ix = (hue.value / 360) * w
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 2
  ctx.strokeRect(ix - 2, 0, 4, 16)
}

function onSpectrumDown(e: MouseEvent) {
  spectrumDragging.value = true
  oldColor.value = ps.state.foregroundColor
  updateFromSpectrum(e)
}

function onSpectrumMove(e: MouseEvent) {
  if (!spectrumDragging.value) return
  updateFromSpectrum(e)
}

function updateFromSpectrum(e: MouseEvent) {
  const canvas = spectrumCanvas.value!
  const rect = canvas.getBoundingClientRect()
  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
  sat.value = x
  val.value = 1 - y
  updateColor()
}

function onHueDown(e: MouseEvent) {
  hueDragging.value = true
  updateFromHue(e)
}

function onHueMove(e: MouseEvent) {
  if (!hueDragging.value) return
  updateFromHue(e)
}

function updateFromHue(e: MouseEvent) {
  const canvas = hueCanvas.value!
  const rect = canvas.getBoundingClientRect()
  hue.value = Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360))
  updateColor()
}

function updateColor() {
  const [r, g, b] = hsvToRgb(hue.value, sat.value, val.value)
  ps.state.foregroundColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  drawSpectrum()
  drawHueBar()
}

function setR(e: Event) {
  const r = +(e.target as HTMLInputElement).value
  ps.state.foregroundColor = `#${r.toString(16).padStart(2, '0')}${rgb.value.g.toString(16).padStart(2, '0')}${rgb.value.b.toString(16).padStart(2, '0')}`
  syncFromRgb()
}

function setG(e: Event) {
  const g = +(e.target as HTMLInputElement).value
  ps.state.foregroundColor = `#${rgb.value.r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${rgb.value.b.toString(16).padStart(2, '0')}`
  syncFromRgb()
}

function setB(e: Event) {
  const b = +(e.target as HTMLInputElement).value
  ps.state.foregroundColor = `#${rgb.value.r.toString(16).padStart(2, '0')}${rgb.value.g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  syncFromRgb()
}

function setHex(e: Event) {
  const hex = (e.target as HTMLInputElement).value
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    ps.state.foregroundColor = hex
    syncFromRgb()
  }
}

function syncFromRgb() {
  const { r, g, b } = rgb.value
  const [h, s, v] = rgbToHsv(r, g, b)
  hue.value = h
  sat.value = s
  val.value = v
  drawSpectrum()
  drawHueBar()
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max
  if (d !== 0) {
    switch (max) {
      case r: h = 60 * (((g - b) / d) % 6); break
      case g: h = 60 * ((b - r) / d + 2); break
      case b: h = 60 * ((r - g) / d + 4); break
    }
    if (h < 0) h += 360
  }
  return [h, s, v]
}

// Dragging
let isDragging = false
let dragOffsetY = 0

function startDrag(e: MouseEvent) {
  isDragging = true
  dragOffsetY = e.clientY - position.y
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
}

function onDrag(e: MouseEvent) {
  if (!isDragging) return
  position.y = e.clientY - dragOffsetY
}

function stopDrag() {
  isDragging = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
}

onMounted(() => {
  syncFromRgb()
  drawSpectrum()
  drawHueBar()
})
</script>
