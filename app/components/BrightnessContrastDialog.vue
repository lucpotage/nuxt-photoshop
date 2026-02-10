<template>
  <div class="dialog-overlay" @click.self="close">
    <div class="dialog-window" style="width: 320px">
      <div class="dialog-title-bar">
        <span class="dialog-title-text">Brightness/Contrast</span>
      </div>
      <div class="dialog-body">
        <div class="slider-row">
          <span class="slider-label">Brightness:</span>
          <input v-model.number="brightness" type="range" min="-100" max="100">
          <span class="slider-value">{{ brightness }}</span>
        </div>
        <div class="slider-row">
          <span class="slider-label">Contrast:</span>
          <input v-model.number="contrast" type="range" min="-100" max="100">
          <span class="slider-value">{{ contrast }}</span>
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
const brightness = ref(0)
const contrast = ref(0)

function apply() {
  ps.adjustBrightnessContrast(brightness.value, contrast.value)
  close()
}

function close() {
  ps.state.activeDialog = null
}
</script>
