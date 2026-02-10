<template>
  <div class="dialog-overlay" @click.self="close">
    <div class="dialog-window" style="width: 380px">
      <div class="dialog-title-bar">
        <span class="dialog-title-text">About Photoshop</span>
      </div>
      <div class="dialog-body about-content">
        <div style="border: 2px solid #000; padding: 16px; background: #fff; margin-bottom: 12px">
          <h2 style="font-size: 18px; margin-bottom: 4px; letter-spacing: 2px">Adobe Photoshop</h2>
          <p style="font-size: 13px; margin-bottom: 12px">Version 1.0.1</p>
          <div style="width: 100%; height: 1px; background: #000; margin: 8px 0"></div>
          <p style="font-size: 10px; margin-bottom: 2px">&copy; 1990 Adobe Systems Incorporated</p>
          <p style="font-size: 10px; margin-bottom: 8px">All Rights Reserved</p>
          <div style="width: 100%; height: 1px; background: #000; margin: 8px 0"></div>
          <p style="font-size: 10px; margin-bottom: 2px">Written by Thomas Knoll</p>
          <p style="font-size: 10px; margin-bottom: 8px">UI Design by John Knoll</p>
          <div style="width: 100%; height: 1px; background: #ccc; margin: 8px 0"></div>
          <p style="font-size: 9px; color: #888; margin-bottom: 2px">Web clone built with Nuxt + HTML5 Canvas</p>
        </div>
        <button class="dialog-button dialog-button-primary" @click="close">OK</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const ps = usePhotoshop()
function close() { ps.state.activeDialog = null }
</script>
