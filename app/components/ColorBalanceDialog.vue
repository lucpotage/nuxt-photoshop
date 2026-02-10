<template>
  <div class="dialog-overlay" @click.self="close">
    <div class="dialog-window" style="width: 340px">
      <div class="dialog-title-bar">
        <span class="dialog-title-text">Color Balance</span>
      </div>
      <div class="dialog-body">
        <div style="font-size: 11px; margin-bottom: 6px; font-weight: bold">Tone Balance:</div>
        <div class="dialog-row" style="margin-bottom: 12px">
          <label class="dialog-radio"><input v-model="tone" type="radio" value="shadows"> Shadows</label>
          <label class="dialog-radio"><input v-model="tone" type="radio" value="midtones"> Midtones</label>
          <label class="dialog-radio"><input v-model="tone" type="radio" value="highlights"> Highlights</label>
        </div>

        <div class="slider-row">
          <span style="font-size: 10px; min-width: 40px">Cyan</span>
          <input v-model.number="currentTone[0]" type="range" min="-100" max="100">
          <span style="font-size: 10px; min-width: 30px">Red</span>
        </div>
        <div class="slider-row">
          <span style="font-size: 10px; min-width: 40px">Magenta</span>
          <input v-model.number="currentTone[1]" type="range" min="-100" max="100">
          <span style="font-size: 10px; min-width: 30px">Green</span>
        </div>
        <div class="slider-row">
          <span style="font-size: 10px; min-width: 40px">Yellow</span>
          <input v-model.number="currentTone[2]" type="range" min="-100" max="100">
          <span style="font-size: 10px; min-width: 30px">Blue</span>
        </div>

        <div style="font-size: 10px; text-align: center; margin-top: 4px; color: var(--mac-darker-gray)">
          Color Levels: {{ currentTone[0] }} {{ currentTone[1] }} {{ currentTone[2] }}
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

const tone = ref('midtones')
const shadows = reactive([0, 0, 0])
const midtones = reactive([0, 0, 0])
const highlights = reactive([0, 0, 0])

const currentTone = computed(() => {
  switch (tone.value) {
    case 'shadows': return shadows
    case 'highlights': return highlights
    default: return midtones
  }
})

function apply() {
  ps.adjustColorBalance(
    shadows.map(v => v * 2.55),
    midtones.map(v => v * 2.55),
    highlights.map(v => v * 2.55)
  )
  close()
}

function close() {
  ps.state.activeDialog = null
}
</script>
