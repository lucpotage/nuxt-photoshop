<template>
  <div
    class="floating-palette"
    :style="{ top: position.y + 'px', right: '8px', width: '156px' }"
    @mousedown.stop
  >
    <div
      class="palette-title"
      @mousedown="startDrag"
    >
      <div class="palette-close" @click="ps.state.showBrushes = false"></div>
      <span class="palette-title-text">Brushes</span>
    </div>
    <div class="brushes-grid">
      <div
        v-for="(brush, i) in ps.state.brushTips"
        :key="i"
        class="brush-item"
        :class="{ active: ps.state.brushSize === brush.size && ps.state.brushHardness === brush.hardness }"
        :title="`${brush.size}px ${brush.shape} ${Math.round(brush.hardness * 100)}%`"
        @click="selectBrush(brush)"
      >
        <div
          class="brush-dot"
          :style="{
            width: Math.min(20, brush.size) + 'px',
            height: Math.min(20, brush.size) + 'px',
            borderRadius: brush.shape === 'round' ? '50%' : '0',
            opacity: brush.hardness,
          }"
        ></div>
      </div>
    </div>
    <!-- Brush options -->
    <div style="padding: 4px; border-top: 1px solid var(--mac-dark-gray); font-size: 10px">
      <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 3px">
        <label style="min-width: 44px; text-align: right">Size:</label>
        <input
          type="range"
          :value="ps.state.brushSize"
          min="1"
          max="100"
          style="flex: 1"
          @input="ps.state.brushSize = +($event.target as HTMLInputElement).value"
        >
        <span style="min-width: 22px; text-align: right">{{ ps.state.brushSize }}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 3px">
        <label style="min-width: 44px; text-align: right">Opacity:</label>
        <input
          type="range"
          :value="ps.state.brushOpacity"
          min="1"
          max="100"
          style="flex: 1"
          @input="ps.state.brushOpacity = +($event.target as HTMLInputElement).value"
        >
        <span style="min-width: 22px; text-align: right">{{ ps.state.brushOpacity }}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 4px">
        <label style="min-width: 44px; text-align: right">Mode:</label>
        <select
          :value="ps.state.drawingMode"
          style="flex: 1; font-size: 10px; height: 16px; border: 1px solid #000; font-family: var(--mac-font)"
          @change="ps.state.drawingMode = ($event.target as HTMLSelectElement).value as any"
        >
          <option value="normal">Normal</option>
          <option value="darken">Darken Only</option>
          <option value="lighten">Lighten Only</option>
          <option value="colorOnly">Color Only</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BrushTip } from '~/composables/usePhotoshop'

const ps = usePhotoshop()
const position = reactive({ x: 0, y: 28 })

function selectBrush(brush: BrushTip) {
  ps.state.brushSize = brush.size
  ps.state.brushHardness = brush.hardness
  ps.state.brushShape = brush.shape
}

// Drag support
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
</script>
