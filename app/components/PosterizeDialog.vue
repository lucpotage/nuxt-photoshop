<template>
  <div class="dialog-overlay" @click.self="close">
    <div class="dialog-window" style="width: 260px">
      <div class="dialog-title-bar">
        <span class="dialog-title-text">Posterize</span>
      </div>
      <div class="dialog-body">
        <div class="dialog-row">
          <label class="dialog-label">Levels:</label>
          <input v-model.number="levels" class="dialog-input" type="number" min="2" max="255">
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
const levels = ref(4)

function apply() {
  ps.applyFilter('posterize', { levels: levels.value })
  close()
}

function close() { ps.state.activeDialog = null }
</script>
