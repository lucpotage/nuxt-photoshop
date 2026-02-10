<template>
  <div class="dialog-overlay" @click.self="close">
    <div class="dialog-window" style="width: 320px">
      <div class="dialog-title-bar">
        <span class="dialog-title-text">Histogram</span>
      </div>
      <div class="dialog-body">
        <canvas ref="histCanvas" width="256" height="120" class="histogram-canvas" @mousemove="onHover" @mouseleave="hoverLevel = -1"></canvas>
        <div class="histogram-stats">
          <div v-if="hoverLevel >= 0">
            Level: {{ hoverLevel }} | Count: {{ histData[hoverLevel] || 0 }}
          </div>
          <div>Mean: {{ mean.toFixed(1) }} | Std Dev: {{ stdDev.toFixed(1) }}</div>
          <div>Median: {{ median }} | Pixels: {{ totalPixels.toLocaleString() }}</div>
        </div>
        <div class="dialog-buttons">
          <button class="dialog-button dialog-button-primary" @click="close">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const ps = usePhotoshop()
const histCanvas = ref<HTMLCanvasElement>()
const hoverLevel = ref(-1)

const histData = computed(() => ps.getHistogramData())

const totalPixels = computed(() => histData.value.reduce((a, b) => a + b, 0))

const mean = computed(() => {
  const total = totalPixels.value
  if (!total) return 0
  return histData.value.reduce((sum, count, i) => sum + i * count, 0) / total
})

const median = computed(() => {
  const half = totalPixels.value / 2
  let cumulative = 0
  for (let i = 0; i < 256; i++) {
    cumulative += histData.value[i]
    if (cumulative >= half) return i
  }
  return 128
})

const stdDev = computed(() => {
  const m = mean.value
  const total = totalPixels.value
  if (!total) return 0
  const variance = histData.value.reduce((sum, count, i) => sum + count * (i - m) ** 2, 0) / total
  return Math.sqrt(variance)
})

function drawHistogram() {
  const canvas = histCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  const data = histData.value
  const max = Math.max(...data, 1)

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, 256, 120)

  ctx.fillStyle = '#000'
  for (let i = 0; i < 256; i++) {
    const h = (data[i] / max) * 120
    ctx.fillRect(i, 120 - h, 1, h)
  }

  if (hoverLevel.value >= 0) {
    ctx.strokeStyle = 'red'
    ctx.beginPath()
    ctx.moveTo(hoverLevel.value, 0)
    ctx.lineTo(hoverLevel.value, 120)
    ctx.stroke()
  }
}

function onHover(e: MouseEvent) {
  const canvas = histCanvas.value!
  const rect = canvas.getBoundingClientRect()
  hoverLevel.value = Math.floor((e.clientX - rect.left) * (256 / rect.width))
  drawHistogram()
}

function close() { ps.state.activeDialog = null }

onMounted(() => {
  nextTick(() => drawHistogram())
})
</script>
