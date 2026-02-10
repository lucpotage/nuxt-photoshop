<template>
  <div class="dialog-overlay" @click.self="close">
    <div class="dialog-window" style="width: 320px">
      <div class="dialog-title-bar">
        <span class="dialog-title-text">Hue/Saturation</span>
      </div>
      <div class="dialog-body">
        <div class="slider-row">
          <span class="slider-label">Hue:</span>
          <input v-model.number="hue" type="range" min="-180" max="180">
          <span class="slider-value">{{ hue }}°</span>
        </div>
        <div class="slider-row">
          <span class="slider-label">Saturation:</span>
          <input v-model.number="saturation" type="range" min="-100" max="100">
          <span class="slider-value">{{ saturation }}</span>
        </div>
        <div class="slider-row">
          <span class="slider-label">Lightness:</span>
          <input v-model.number="lightness" type="range" min="-100" max="100">
          <span class="slider-value">{{ lightness }}</span>
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
const hue = ref(0)
const saturation = ref(0)
const lightness = ref(0)

function apply() {
  ps.adjustHueSaturation(hue.value, saturation.value, lightness.value)
  close()
}

function close() {
  ps.state.activeDialog = null
}
</script>
