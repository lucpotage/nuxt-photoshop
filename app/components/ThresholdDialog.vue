<template>
  <div class="dialog-overlay" @click.self="close">
    <div class="dialog-window" style="width: 280px">
      <div class="dialog-title-bar">
        <span class="dialog-title-text">Threshold</span>
      </div>
      <div class="dialog-body">
        <div class="slider-row">
          <span class="slider-label">Level:</span>
          <input v-model.number="threshold" type="range" min="1" max="255">
          <span class="slider-value">{{ threshold }}</span>
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
const threshold = ref(128)

function apply() {
  ps.applyFilter('threshold', { threshold: threshold.value })
  close()
}

function close() { ps.state.activeDialog = null }
</script>
