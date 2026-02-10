<template>
  <div class="dialog-overlay" @click.self="close">
    <div class="dialog-window" style="width: 320px">
      <div class="dialog-title-bar">
        <span class="dialog-title-text">Canvas Size</span>
      </div>
      <div class="dialog-body">
        <div style="font-size: 11px; margin-bottom: 8px; color: var(--mac-darker-gray)">
          Current Size: {{ ps.state.document?.width }} × {{ ps.state.document?.height }} pixels
        </div>
        <div class="dialog-row">
          <label class="dialog-label">Width:</label>
          <input v-model.number="width" class="dialog-input" type="number" min="1" max="8192">
          <span style="font-size: 11px">pixels</span>
        </div>
        <div class="dialog-row">
          <label class="dialog-label">Height:</label>
          <input v-model.number="height" class="dialog-input" type="number" min="1" max="8192">
          <span style="font-size: 11px">pixels</span>
        </div>
        <!-- Anchor grid -->
        <div style="font-size: 11px; margin-bottom: 4px">Anchor:</div>
        <div style="display: grid; grid-template-columns: repeat(3, 20px); gap: 2px; margin-bottom: 8px">
          <div
            v-for="(pos, i) in anchorPositions"
            :key="i"
            :style="{
              width: '20px', height: '20px', border: '1px solid #000',
              background: anchor === pos ? '#000' : '#fff',
              cursor: 'pointer'
            }"
            @click="anchor = pos"
          ></div>
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
const doc = ps.state.document!

const width = ref(doc.width)
const height = ref(doc.height)
const anchor = ref('center')

const anchorPositions = ['top-left', 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom', 'bottom-right']

function apply() {
  const ctx = doc.ctx
  if (!ctx || !doc.canvas) return

  const imageData = ctx.getImageData(0, 0, doc.width, doc.height)
  const oldW = doc.width
  const oldH = doc.height

  doc.canvas.width = width.value
  doc.canvas.height = height.value
  doc.width = width.value
  doc.height = height.value

  ctx.fillStyle = ps.state.backgroundColor
  ctx.fillRect(0, 0, width.value, height.value)

  // Calculate offset based on anchor
  let ox = 0, oy = 0
  if (anchor.value.includes('right')) ox = width.value - oldW
  else if (!anchor.value.includes('left')) ox = Math.floor((width.value - oldW) / 2)
  if (anchor.value.includes('bottom')) oy = height.value - oldH
  else if (!anchor.value.includes('top')) oy = Math.floor((height.value - oldH) / 2)

  ctx.putImageData(imageData, ox, oy)
  ps.pushHistory()
  close()
}

function close() { ps.state.activeDialog = null }
</script>
