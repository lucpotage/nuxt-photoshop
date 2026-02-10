<template>
  <div class="dialog-overlay" @click.self="close">
    <div class="dialog-window" style="width: 280px">
      <div class="dialog-title-bar">
        <span class="dialog-title-text">Mosaic</span>
      </div>
      <div class="dialog-body">
        <div class="slider-row">
          <span class="slider-label">Cell Size:</span>
          <input v-model.number="cellSize" type="range" min="2" max="64">
          <span class="slider-value">{{ cellSize }} px</span>
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
const cellSize = ref(8)

function apply() {
  ps.applyFilter('mosaic', { cellSize: cellSize.value })
  close()
}

function close() { ps.state.activeDialog = null }
</script>
