<template>
  <div class="photoshop-app" @click="closeMenus">
    <MenuBar />
    <div class="workspace">
      <Toolbar />
      <DocumentWindow />
      <BrushesPalette v-if="ps.state.showBrushes && ps.state.document" />
      <ColorPicker v-if="ps.state.showColorPicker && ps.state.document" />
    </div>
    <!-- Dialogs -->
    <NewDocumentDialog v-if="ps.state.activeDialog === 'new'" />
    <ResizeDialog v-if="ps.state.activeDialog === 'resize'" />
    <BrightnessContrastDialog v-if="ps.state.activeDialog === 'brightness-contrast'" />
    <HueSaturationDialog v-if="ps.state.activeDialog === 'hue-saturation'" />
    <LevelsDialog v-if="ps.state.activeDialog === 'levels'" />
    <ColorBalanceDialog v-if="ps.state.activeDialog === 'color-balance'" />
    <GaussianBlurDialog v-if="ps.state.activeDialog === 'gaussian-blur'" />
    <NoiseDialog v-if="ps.state.activeDialog === 'noise'" />
    <MosaicDialog v-if="ps.state.activeDialog === 'mosaic'" />
    <PosterizeDialog v-if="ps.state.activeDialog === 'posterize'" />
    <ThresholdDialog v-if="ps.state.activeDialog === 'threshold'" />
    <HistogramDialog v-if="ps.state.activeDialog === 'histogram'" />
    <AboutDialog v-if="ps.state.activeDialog === 'about'" />
    <FillDialog v-if="ps.state.activeDialog === 'fill'" />
    <CanvasSizeDialog v-if="ps.state.activeDialog === 'canvas-size'" />
  </div>
</template>

<script setup lang="ts">
const ps = usePhotoshop()

function closeMenus() {
  ps.state.activeMenu = null
}

// Create default document on mount
onMounted(() => {
  ps.newDocument('Untitled-1', 512, 512)

  // Keyboard shortcuts
  window.addEventListener('keydown', handleKeyboard)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyboard)
})

function handleKeyboard(e: KeyboardEvent) {
  const cmd = e.metaKey || e.ctrlKey

  if (cmd && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    ps.undo()
  } else if (cmd && e.key === 'z' && e.shiftKey) {
    e.preventDefault()
    ps.redo()
  } else if (cmd && e.key === 'n') {
    e.preventDefault()
    ps.state.activeDialog = 'new'
  } else if (cmd && e.key === 'o') {
    e.preventDefault()
    ps.openFile()
  } else if (cmd && e.key === 's') {
    e.preventDefault()
    ps.saveAsPNG()
  } else if (cmd && e.key === 'a') {
    e.preventDefault()
    ps.selectAll()
  } else if (cmd && e.key === 'd') {
    e.preventDefault()
    ps.deselectAll()
  } else if (cmd && e.key === 'i' && !e.shiftKey) {
    e.preventDefault()
    ps.invertImage()
  } else if (cmd && e.key === 'h') {
    e.preventDefault()
    ps.state.showSelection = !ps.state.showSelection
  } else if (e.key === 'x') {
    ps.swapColors()
  } else if (e.key === 'd' && !cmd) {
    ps.resetColors()
  }
  // Tool shortcuts
  else if (!cmd) {
    const toolMap: Record<string, any> = {
      m: 'marquee',
      l: 'lasso',
      w: 'wand',
      v: 'move',
      c: 'crop',
      n: undefined, // skip (conflicts with cmd+n)
      b: 'brush',
      p: 'pencil',
      e: 'eraser',
      s: undefined, // skip
      r: 'blur',
      g: 'gradient',
      k: 'bucket',
      u: 'line',
      t: 'text',
      i: 'eyedropper',
      h: 'hand',
      z: 'zoom',
      a: undefined, // skip (conflicts with cmd+a)
      j: 'stamp',
    }
    const tool = toolMap[e.key.toLowerCase()]
    if (tool) {
      ps.setTool(tool)
    }
  }
}
</script>

<style>
.photoshop-app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
