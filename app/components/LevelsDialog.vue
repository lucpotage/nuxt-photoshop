<template>
  <div class="dialog-overlay" @click.self="close">
    <div class="dialog-window" style="width: 380px">
      <div class="dialog-title-bar">
        <span class="dialog-title-text">Levels</span>
      </div>
      <div class="dialog-body">
        <!-- Histogram -->
        <div class="levels-histogram">
          <canvas ref="histCanvas" width="256" height="100" class="histogram-canvas"></canvas>
        </div>

        <div style="font-size: 11px; margin-bottom: 4px">Input Levels:</div>
        <div class="slider-row">
          <input v-model.number="inputMin" class="dialog-input" type="number" min="0" max="255" style="width: 40px">
          <input v-model.number="gamma" type="range" min="0.1" max="3" step="0.05" style="flex: 1">
          <input v-model.number="inputMax" class="dialog-input" type="number" min="0" max="255" style="width: 40px">
        </div>
        <div style="font-size: 10px; text-align: center; margin-bottom: 6px">Gamma: {{ gamma.toFixed(2) }}</div>

        <div style="font-size: 11px; margin-bottom: 4px">Output Levels:</div>
        <div class="slider-row">
          <input v-model.number="outputMin" class="dialog-input" type="number" min="0" max="255" style="width: 40px">
          <input v-model.number="outputMin" type="range" min="0" max="255" style="flex: 1">
          <input v-model.number="outputMax" class="dialog-input" type="number" min="0" max="255" style="width: 40px">
        </div>

        <div class="dialog-buttons">
          <button class="dialog-button" @click="close">Cancel</button>
          <button class="dialog-button dialog-button-primary" @click="apply">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const ps = usePhotoshop()

const histCanvas = ref<HTMLCanvasElement>()
const inputMin = ref(0)
const inputMax = ref(255)
const gamma = ref(1.0)
const outputMin = ref(0)
const outputMax = ref(255)

function drawHistogram() {
  const canvas = histCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  const data = ps.getHistogramData()
  const max = Math.max(...data, 1)

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, 256, 100)

  ctx.fillStyle = '#000'
  for (let i = 0; i < 256; i++) {
    const h = (data[i] / max) * 100
    ctx.fillRect(i, 100 - h, 1, h)
  }
}

function apply() {
  ps.adjustLevels(inputMin.value, inputMax.value, gamma.value, outputMin.value, outputMax.value)
  close()
}

function close() {
  ps.state.activeDialog = null
}

onMounted(() => {
  nextTick(() => drawHistogram())
})
</script>
