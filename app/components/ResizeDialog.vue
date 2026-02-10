<template>
  <div class="dialog-overlay" @click.self="close">
    <div class="dialog-window" style="width: 320px">
      <div class="dialog-title-bar">
        <span class="dialog-title-text">Image Size</span>
      </div>
      <div class="dialog-body">
        <div style="font-size: 11px; margin-bottom: 8px; color: var(--mac-darker-gray)">
          Current: {{ ps.state.document?.width }} × {{ ps.state.document?.height }} pixels
        </div>
        <div class="dialog-row">
          <label class="dialog-label">Width:</label>
          <input v-model.number="width" class="dialog-input" type="number" min="1" max="8192" @input="constrainW">
          <span style="font-size: 11px">pixels</span>
        </div>
        <div class="dialog-row">
          <label class="dialog-label">Height:</label>
          <input v-model.number="height" class="dialog-input" type="number" min="1" max="8192" @input="constrainH">
          <span style="font-size: 11px">pixels</span>
        </div>
        <div class="dialog-row">
          <label class="dialog-checkbox">
            <input v-model="constrain" type="checkbox"> Constrain Proportions
          </label>
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
const origW = doc.width
const origH = doc.height
const ratio = origW / origH

const width = ref(origW)
const height = ref(origH)
const constrain = ref(true)

function constrainW() {
  if (constrain.value) {
    height.value = Math.round(width.value / ratio)
  }
}

function constrainH() {
  if (constrain.value) {
    width.value = Math.round(height.value * ratio)
  }
}

function apply() {
  ps.resizeImage(width.value, height.value)
  close()
}

function close() {
  ps.state.activeDialog = null
}
</script>
