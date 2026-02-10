<template>
  <div class="toolbar">
    <div class="toolbar-title"></div>
    <div class="toolbar-grid">
      <div
        v-for="tool in tools"
        :key="tool.name"
        class="tool-button"
        :class="{ active: ps.state.currentTool === tool.name }"
        :title="tool.label"
        @click="ps.setTool(tool.name)"
      >
        <svg v-if="tool.icon" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" v-html="tool.icon"></svg>
      </div>
    </div>
    <div class="color-swatches">
      <div
        class="color-swatch color-swatch-fg"
        :style="{ background: ps.state.foregroundColor }"
        title="Foreground Color"
        @click="editFgColor"
      ></div>
      <div
        class="color-swatch color-swatch-bg"
        :style="{ background: ps.state.backgroundColor }"
        title="Background Color"
        @click="editBgColor"
      ></div>
      <div class="color-swap" title="Swap Colors (X)" @click="ps.swapColors()">&#8644;</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToolName } from '~/composables/usePhotoshop'

const ps = usePhotoshop()

interface ToolDef {
  name: ToolName
  label: string
  icon: string
}

const tools: ToolDef[] = [
  // Row 1: Selection tools
  {
    name: 'marquee',
    label: 'Marquee (M)',
    icon: '<rect x="2" y="2" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>',
  },
  {
    name: 'lasso',
    label: 'Lasso (L)',
    icon: '<path d="M8 2C5 2 3 4 3 6C3 9 6 10 6 12C6 13 5 14 4 14C6 14 8 13 9 11C10 9 8 8 8 6C8 4 10 3 11 4C12 5 11 7 9 7" fill="none" stroke="currentColor" stroke-width="1.2"/>',
  },
  // Row 2
  {
    name: 'wand',
    label: 'Magic Wand (W)',
    icon: '<path d="M2 14L10 6M10 6L9 3L12 5L10 6M4 4L5 3M3 6L2 6M12 2L12 3M14 4L13 4M13 7L12 7" fill="none" stroke="currentColor" stroke-width="1"/>',
  },
  {
    name: 'move',
    label: 'Move (V)',
    icon: '<path d="M8 1L8 15M1 8L15 8M8 1L5 4M8 1L11 4M8 15L5 12M8 15L11 12M1 8L4 5M1 8L4 11M15 8L12 5M15 8L12 11" fill="none" stroke="currentColor" stroke-width="1"/>',
  },
  // Row 3
  {
    name: 'crop',
    label: 'Crop (C)',
    icon: '<path d="M4 1L4 12L15 12M12 15L12 4L1 4" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  },
  {
    name: 'eyedropper',
    label: 'Eyedropper (I)',
    icon: '<path d="M10 2L14 6L7 13L3 13L3 9L10 2M10 2L11 1L15 5L14 6" fill="none" stroke="currentColor" stroke-width="1"/>',
  },
  // Row 4: Drawing tools
  {
    name: 'pencil',
    label: 'Pencil (P)',
    icon: '<path d="M2 14L4 12L12 4L14 2L14 4L6 12L4 14L2 14M4 12L6 12L14 4" fill="none" stroke="currentColor" stroke-width="1"/>',
  },
  {
    name: 'brush',
    label: 'Brush (B)',
    icon: '<path d="M12 1C12 1 14 3 12 5C10 7 7 7 6 8C5 9 5 11 4 12C3 13 2 14 2 14C2 14 3 13 4 13C5 13 6 12 7 11C8 10 9 9 11 8C13 7 14 5 12 1" fill="none" stroke="currentColor" stroke-width="1"/>',
  },
  // Row 5
  {
    name: 'airbrush',
    label: 'Airbrush',
    icon: '<path d="M6 14L6 6L8 4L10 4L10 6L8 8L8 14M3 3L5 3M2 5L4 5M3 7L5 7" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="5" cy="5" r="0.5"/>',
  },
  {
    name: 'eraser',
    label: 'Eraser (E)',
    icon: '<path d="M5 14L2 11L8 5L13 10L8 14L5 14M8 5L11 2L15 6L13 10" fill="none" stroke="currentColor" stroke-width="1"/>',
  },
  // Row 6
  {
    name: 'bucket',
    label: 'Paint Bucket (K)',
    icon: '<path d="M10 3L5 8L3 12L7 14L12 9L10 3M10 3L8 1M13 10C13 10 15 12 15 13C15 14 14 15 13 15C12 15 11 14 11 13C11 12 13 10 13 10" fill="none" stroke="currentColor" stroke-width="1"/>',
  },
  {
    name: 'gradient',
    label: 'Gradient (G)',
    icon: '<rect x="2" y="3" width="12" height="10" fill="none" stroke="currentColor" stroke-width="1"/><line x1="5" y1="3" x2="5" y2="13" stroke="currentColor" stroke-width="0.5" opacity="0.3"/><line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" stroke-width="0.5" opacity="0.6"/><line x1="11" y1="3" x2="11" y2="13" stroke="currentColor" stroke-width="0.5" opacity="0.9"/>',
  },
  // Row 7
  {
    name: 'line',
    label: 'Line (U)',
    icon: '<line x1="2" y1="14" x2="14" y2="2" stroke="currentColor" stroke-width="1.5"/>',
  },
  {
    name: 'text',
    label: 'Text (T)',
    icon: '<text x="4" y="13" font-size="13" font-weight="bold" font-family="serif">T</text>',
  },
  // Row 8
  {
    name: 'stamp',
    label: 'Stamp (J)',
    icon: '<circle cx="8" cy="5" r="4" fill="none" stroke="currentColor" stroke-width="1"/><path d="M6 9L5 14L11 14L10 9" fill="none" stroke="currentColor" stroke-width="1"/>',
  },
  {
    name: 'smudge',
    label: 'Smudge',
    icon: '<path d="M3 13C3 13 4 10 6 8C8 6 10 5 11 4C12 3 13 2 12 2C11 2 9 4 7 6C5 8 3 12 3 13" fill="none" stroke="currentColor" stroke-width="1.2"/>',
  },
  // Row 9
  {
    name: 'blur',
    label: 'Blur (R)',
    icon: '<circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/><circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1" opacity="0.4"/><circle cx="8" cy="8" r="1" fill="currentColor" opacity="0.3"/>',
  },
  {
    name: 'sharpen',
    label: 'Sharpen',
    icon: '<polygon points="8,2 14,14 2,14" fill="none" stroke="currentColor" stroke-width="1.2"/>',
  },
  // Row 10
  {
    name: 'hand',
    label: 'Hand (H)',
    icon: '<path d="M8 14C5 14 3 12 3 10L3 7L4 7L4 9M4 7L4 4L5 4L5 8M5 4L5 3L6 3L6 8M6 3L7 3L7 8M7 3L8 3L8 5L10 5L12 7L12 10C12 12 10 14 8 14" fill="none" stroke="currentColor" stroke-width="1"/>',
  },
  {
    name: 'zoom',
    label: 'Zoom (Z)',
    icon: '<circle cx="7" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="1.2"/><line x1="10" y1="10" x2="14" y2="14" stroke="currentColor" stroke-width="1.5"/>',
  },
]

function editFgColor() {
  const color = prompt('Foreground color (hex):', ps.state.foregroundColor)
  if (color) ps.state.foregroundColor = color
}

function editBgColor() {
  const color = prompt('Background color (hex):', ps.state.backgroundColor)
  if (color) ps.state.backgroundColor = color
}
</script>
