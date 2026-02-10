<template>
  <div class="dialog-overlay" @click.self="close">
    <div class="dialog-window" style="width: 280px">
      <div class="dialog-title-bar">
        <span class="dialog-title-text">Fill</span>
      </div>
      <div class="dialog-body">
        <div class="dialog-row">
          <label class="dialog-label">Use:</label>
          <select v-model="fillWith" class="dialog-select" style="width: 140px">
            <option value="foreground">Foreground Color</option>
            <option value="background">Background Color</option>
            <option value="white">White</option>
            <option value="black">Black</option>
            <option value="50gray">50% Gray</option>
          </select>
        </div>
        <div class="slider-row">
          <span class="slider-label">Opacity:</span>
          <input v-model.number="opacity" type="range" min="1" max="100">
          <span class="slider-value">{{ opacity }}%</span>
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
const fillWith = ref('foreground')
const opacity = ref(100)

function apply() {
  let color: string
  switch (fillWith.value) {
    case 'foreground': color = ps.state.foregroundColor; break
    case 'background': color = ps.state.backgroundColor; break
    case 'white': color = '#ffffff'; break
    case 'black': color = '#000000'; break
    case '50gray': color = '#808080'; break
    default: color = ps.state.foregroundColor
  }
  // Apply with opacity
  const doc = ps.state.document
  if (doc?.ctx) {
    doc.ctx.save()
    doc.ctx.globalAlpha = opacity.value / 100
    ps.fill(color)
    doc.ctx.restore()
  }
  close()
}

function close() { ps.state.activeDialog = null }
</script>
