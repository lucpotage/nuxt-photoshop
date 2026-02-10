<template>
  <div class="dialog-overlay" @click.self="close">
    <div class="dialog-window" style="width: 280px">
      <div class="dialog-title-bar">
        <span class="dialog-title-text">Add Noise</span>
      </div>
      <div class="dialog-body">
        <div class="slider-row">
          <span class="slider-label">Amount:</span>
          <input v-model.number="amount" type="range" min="1" max="100">
          <span class="slider-value">{{ amount }}</span>
        </div>
        <div class="dialog-row">
          <label class="dialog-label">Distribution:</label>
          <div class="dialog-radio-group">
            <label class="dialog-radio"><input v-model="distribution" type="radio" value="uniform"> Uniform</label>
            <label class="dialog-radio"><input v-model="distribution" type="radio" value="gaussian"> Gaussian</label>
          </div>
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
const amount = ref(25)
const distribution = ref('uniform')

function apply() {
  ps.applyFilter('noise', { amount: amount.value })
  close()
}

function close() { ps.state.activeDialog = null }
</script>
