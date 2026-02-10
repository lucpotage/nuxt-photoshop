<template>
  <div class="dialog-overlay" @click.self="close">
    <div class="dialog-window" style="width: 280px">
      <div class="dialog-title-bar">
        <span class="dialog-title-text">Gaussian Blur</span>
      </div>
      <div class="dialog-body">
        <div class="slider-row">
          <span class="slider-label">Radius:</span>
          <input v-model.number="radius" type="range" min="1" max="20">
          <span class="slider-value">{{ radius }} px</span>
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
const radius = ref(2)

function apply() {
  ps.applyFilter('gaussian-blur', { radius: radius.value })
  close()
}

function close() { ps.state.activeDialog = null }
</script>
