<template>
  <div class="dialog-overlay" @click.self="close">
    <div class="dialog-window" style="width: 340px">
      <div class="dialog-title-bar">
        <span class="dialog-title-text">New</span>
      </div>
      <div class="dialog-body">
        <div class="dialog-row">
          <label class="dialog-label">Name:</label>
          <input v-model="name" class="dialog-input" style="width: 180px">
        </div>
        <div class="dialog-row">
          <label class="dialog-label">Width:</label>
          <input v-model.number="width" class="dialog-input" type="number" min="1" max="4096">
          <span style="font-size: 11px">pixels</span>
        </div>
        <div class="dialog-row">
          <label class="dialog-label">Height:</label>
          <input v-model.number="height" class="dialog-input" type="number" min="1" max="4096">
          <span style="font-size: 11px">pixels</span>
        </div>
        <div class="dialog-row">
          <label class="dialog-label">Resolution:</label>
          <input v-model.number="resolution" class="dialog-input" type="number" min="1" max="1200">
          <span style="font-size: 11px">pixels/inch</span>
        </div>
        <div class="dialog-row">
          <label class="dialog-label">Mode:</label>
          <select v-model="mode" class="dialog-select">
            <option value="rgb">RGB Color</option>
            <option value="grayscale">Grayscale</option>
            <option value="bitmap">Bitmap</option>
            <option value="cmyk">CMYK Color</option>
          </select>
        </div>
        <div class="dialog-row">
          <label class="dialog-label">Contents:</label>
          <div class="dialog-radio-group">
            <label class="dialog-radio">
              <input v-model="contents" type="radio" value="white"> White
            </label>
            <label class="dialog-radio">
              <input v-model="contents" type="radio" value="background"> Background Color
            </label>
            <label class="dialog-radio">
              <input v-model="contents" type="radio" value="transparent"> Transparent
            </label>
          </div>
        </div>
        <div class="dialog-buttons">
          <button class="dialog-button" @click="close">Cancel</button>
          <button class="dialog-button dialog-button-primary" @click="create">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const ps = usePhotoshop()

const name = ref('Untitled-1')
const width = ref(512)
const height = ref(512)
const resolution = ref(72)
const mode = ref('rgb')
const contents = ref('white')

function create() {
  ps.newDocument(name.value, width.value, height.value, mode.value as any, resolution.value)
  if (contents.value === 'background') {
    ps.fill(ps.state.backgroundColor)
  } else if (contents.value === 'transparent') {
    const doc = ps.state.document
    if (doc?.ctx) {
      doc.ctx.clearRect(0, 0, doc.width, doc.height)
      ps.pushHistory()
    }
  }
  close()
}

function close() {
  ps.state.activeDialog = null
}
</script>
