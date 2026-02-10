<template>
  <div class="menu-bar" @click.stop>
    <!-- Apple menu -->
    <div
      class="menu-bar-item"
      :class="{ active: ps.state.activeMenu === 'apple' }"
      @mousedown.prevent="toggleMenu('apple')"
      @mouseenter="hoverMenu('apple')"
    >
      &#63743;
      <div v-if="ps.state.activeMenu === 'apple'" class="menu-dropdown">
        <div class="menu-item" @click="doAction('about')">About Photoshop...</div>
      </div>
    </div>

    <!-- File menu -->
    <div
      class="menu-bar-item"
      :class="{ active: ps.state.activeMenu === 'file' }"
      @mousedown.prevent="toggleMenu('file')"
      @mouseenter="hoverMenu('file')"
    >
      File
      <div v-if="ps.state.activeMenu === 'file'" class="menu-dropdown">
        <div class="menu-item" @click="doAction('new')">
          New<span class="menu-shortcut">&#8984;N</span>
        </div>
        <div class="menu-item" @click="doAction('open')">
          Open...<span class="menu-shortcut">&#8984;O</span>
        </div>
        <div class="menu-item menu-separator"></div>
        <div class="menu-item" :class="{ 'menu-disabled': !hasDoc }" @click="doAction('close')">
          Close<span class="menu-shortcut">&#8984;W</span>
        </div>
        <div class="menu-item" :class="{ 'menu-disabled': !hasDoc }" @click="doAction('save')">
          Save<span class="menu-shortcut">&#8984;S</span>
        </div>
        <div class="menu-item" :class="{ 'menu-disabled': !hasDoc }" @click="doAction('save-as')">
          Save As...
        </div>
        <div class="menu-item menu-separator"></div>
        <div class="menu-item" :class="{ 'menu-disabled': !hasDoc }" @click="doAction('revert')">
          Revert
        </div>
        <div class="menu-item menu-separator"></div>
        <div class="menu-item" :class="{ 'menu-disabled': !hasDoc }" @click="doAction('page-setup')">
          Page Setup...
        </div>
        <div class="menu-item" :class="{ 'menu-disabled': !hasDoc }" @click="doAction('print')">
          Print...<span class="menu-shortcut">&#8984;P</span>
        </div>
        <div class="menu-item menu-separator"></div>
        <div class="menu-item" @click="doAction('quit')">
          Quit<span class="menu-shortcut">&#8984;Q</span>
        </div>
      </div>
    </div>

    <!-- Edit menu -->
    <div
      class="menu-bar-item"
      :class="{ active: ps.state.activeMenu === 'edit' }"
      @mousedown.prevent="toggleMenu('edit')"
      @mouseenter="hoverMenu('edit')"
    >
      Edit
      <div v-if="ps.state.activeMenu === 'edit'" class="menu-dropdown">
        <div class="menu-item" :class="{ 'menu-disabled': !canUndo }" @click="doAction('undo')">
          Undo<span class="menu-shortcut">&#8984;Z</span>
        </div>
        <div class="menu-item menu-separator"></div>
        <div class="menu-item" :class="{ 'menu-disabled': !hasSelection }" @click="doAction('cut')">
          Cut<span class="menu-shortcut">&#8984;X</span>
        </div>
        <div class="menu-item" :class="{ 'menu-disabled': !hasSelection }" @click="doAction('copy')">
          Copy<span class="menu-shortcut">&#8984;C</span>
        </div>
        <div class="menu-item" @click="doAction('paste')">
          Paste<span class="menu-shortcut">&#8984;V</span>
        </div>
        <div class="menu-item" :class="{ 'menu-disabled': !hasSelection }" @click="doAction('clear')">
          Clear
        </div>
        <div class="menu-item menu-separator"></div>
        <div class="menu-item" :class="{ 'menu-disabled': !hasDoc }" @click="doAction('fill')">
          Fill...<span class="menu-shortcut">&#9003;</span>
        </div>
        <div class="menu-item menu-separator"></div>
        <div class="menu-item" :class="{ 'menu-disabled': !hasDoc }" @click="doAction('define-brush')">
          Define Brush
        </div>
        <div class="menu-item" :class="{ 'menu-disabled': !hasDoc }" @click="doAction('define-pattern')">
          Define Pattern
        </div>
      </div>
    </div>

    <!-- Mode menu -->
    <div
      class="menu-bar-item"
      :class="{ active: ps.state.activeMenu === 'mode' }"
      @mousedown.prevent="toggleMenu('mode')"
      @mouseenter="hoverMenu('mode')"
    >
      Mode
      <div v-if="ps.state.activeMenu === 'mode'" class="menu-dropdown">
        <div class="menu-item" @click="doAction('mode-bitmap')">
          {{ ps.state.document?.mode === 'bitmap' ? '✓ ' : '&nbsp;&nbsp;' }}Bitmap
        </div>
        <div class="menu-item" @click="doAction('mode-grayscale')">
          {{ ps.state.document?.mode === 'grayscale' ? '✓ ' : '&nbsp;&nbsp;' }}Grayscale
        </div>
        <div class="menu-item" @click="doAction('mode-indexed')">
          {{ ps.state.document?.mode === 'indexed' ? '✓ ' : '&nbsp;&nbsp;' }}Indexed Color
        </div>
        <div class="menu-item" @click="doAction('mode-rgb')">
          {{ ps.state.document?.mode === 'rgb' ? '✓ ' : '&nbsp;&nbsp;' }}RGB Color
        </div>
        <div class="menu-item" @click="doAction('mode-cmyk')">
          {{ ps.state.document?.mode === 'cmyk' ? '✓ ' : '&nbsp;&nbsp;' }}CMYK Color
        </div>
        <div class="menu-item" @click="doAction('mode-hsl')">
          {{ ps.state.document?.mode === 'hsl' ? '✓ ' : '&nbsp;&nbsp;' }}HSL Color
        </div>
        <div class="menu-item" @click="doAction('mode-hsb')">
          {{ ps.state.document?.mode === 'hsb' ? '✓ ' : '&nbsp;&nbsp;' }}HSB Color
        </div>
        <div class="menu-item" @click="doAction('mode-multichannel')">
          {{ ps.state.document?.mode === 'multichannel' ? '✓ ' : '&nbsp;&nbsp;' }}Multichannel
        </div>
      </div>
    </div>

    <!-- Image menu -->
    <div
      class="menu-bar-item"
      :class="{ active: ps.state.activeMenu === 'image' }"
      @mousedown.prevent="toggleMenu('image')"
      @mouseenter="hoverMenu('image')"
    >
      Image
      <div v-if="ps.state.activeMenu === 'image'" class="menu-dropdown" style="min-width: 220px">
        <!-- Map submenu -->
        <div class="menu-item" @mouseenter="subMenu = 'map'" @mouseleave="subMenu = ''">
          Map<span class="menu-submenu-arrow">&#9654;</span>
          <div v-if="subMenu === 'map'" class="menu-submenu">
            <div class="menu-item" @click="doAction('invert')">Invert<span class="menu-shortcut">&#8984;I</span></div>
            <div class="menu-item" @click="doAction('equalize')">Equalize</div>
            <div class="menu-item" @click="doAction('threshold')">Threshold...</div>
            <div class="menu-item" @click="doAction('posterize')">Posterize...</div>
          </div>
        </div>
        <!-- Adjust submenu -->
        <div class="menu-item" @mouseenter="subMenu = 'adjust'" @mouseleave="subMenu = ''">
          Adjust<span class="menu-submenu-arrow">&#9654;</span>
          <div v-if="subMenu === 'adjust'" class="menu-submenu">
            <div class="menu-item" @click="doAction('levels')">Levels...</div>
            <div class="menu-item" @click="doAction('brightness-contrast')">Brightness/Contrast...</div>
            <div class="menu-item" @click="doAction('color-balance')">Color Balance...</div>
            <div class="menu-item" @click="doAction('hue-saturation')">Hue/Saturation...</div>
          </div>
        </div>
        <div class="menu-item menu-separator"></div>
        <!-- Filter submenu -->
        <div class="menu-item" @mouseenter="subMenu = 'filter'" @mouseleave="subMenu = ''">
          Filter<span class="menu-submenu-arrow">&#9654;</span>
          <div v-if="subMenu === 'filter'" class="menu-submenu" style="min-width: 180px">
            <div class="menu-item" @click="doAction('blur')">Blur</div>
            <div class="menu-item" @click="doAction('blur-more')">Blur More</div>
            <div class="menu-item" @click="doAction('gaussian-blur')">Gaussian Blur...</div>
            <div class="menu-item menu-separator"></div>
            <div class="menu-item" @click="doAction('sharpen')">Sharpen</div>
            <div class="menu-item" @click="doAction('sharpen-more')">Sharpen More</div>
            <div class="menu-item menu-separator"></div>
            <div class="menu-item" @click="doAction('noise')">Add Noise...</div>
            <div class="menu-item" @click="doAction('mosaic')">Mosaic...</div>
            <div class="menu-item" @click="doAction('diffuse')">Diffuse</div>
            <div class="menu-item menu-separator"></div>
            <div class="menu-item" @click="doAction('edge-detect')">Find Edges</div>
            <div class="menu-item" @click="doAction('emboss')">Emboss</div>
          </div>
        </div>
        <div class="menu-item menu-separator"></div>
        <!-- Flip submenu -->
        <div class="menu-item" @mouseenter="subMenu = 'flip'" @mouseleave="subMenu = ''">
          Flip<span class="menu-submenu-arrow">&#9654;</span>
          <div v-if="subMenu === 'flip'" class="menu-submenu">
            <div class="menu-item" @click="doAction('flip-h')">Horizontal</div>
            <div class="menu-item" @click="doAction('flip-v')">Vertical</div>
          </div>
        </div>
        <!-- Rotate submenu -->
        <div class="menu-item" @mouseenter="subMenu = 'rotate'" @mouseleave="subMenu = ''">
          Rotate<span class="menu-submenu-arrow">&#9654;</span>
          <div v-if="subMenu === 'rotate'" class="menu-submenu">
            <div class="menu-item" @click="doAction('rotate-180')">180&deg;</div>
            <div class="menu-item" @click="doAction('rotate-90cw')">90&deg; CW</div>
            <div class="menu-item" @click="doAction('rotate-90ccw')">90&deg; CCW</div>
          </div>
        </div>
        <div class="menu-item menu-separator"></div>
        <div class="menu-item" :class="{ 'menu-disabled': !hasDoc }" @click="doAction('resize')">
          Resize...
        </div>
        <div class="menu-item" :class="{ 'menu-disabled': !hasDoc }" @click="doAction('canvas-size')">
          Canvas Size...
        </div>
        <div class="menu-item" :class="{ 'menu-disabled': !hasDoc }" @click="doAction('histogram')">
          Histogram...
        </div>
      </div>
    </div>

    <!-- Select menu -->
    <div
      class="menu-bar-item"
      :class="{ active: ps.state.activeMenu === 'select' }"
      @mousedown.prevent="toggleMenu('select')"
      @mouseenter="hoverMenu('select')"
    >
      Select
      <div v-if="ps.state.activeMenu === 'select'" class="menu-dropdown">
        <div class="menu-item" @click="doAction('select-all')">
          All<span class="menu-shortcut">&#8984;A</span>
        </div>
        <div class="menu-item" @click="doAction('select-none')">
          None<span class="menu-shortcut">&#8984;D</span>
        </div>
        <div class="menu-item" @click="doAction('select-inverse')">Inverse</div>
        <div class="menu-item menu-separator"></div>
        <div class="menu-item" @click="doAction('feather')">Feather...</div>
        <div class="menu-item menu-separator"></div>
        <div class="menu-item" @click="doAction('hide-edges')">
          {{ ps.state.showSelection ? 'Hide' : 'Show' }} Edges<span class="menu-shortcut">&#8984;H</span>
        </div>
      </div>
    </div>

    <!-- Window menu -->
    <div
      class="menu-bar-item"
      :class="{ active: ps.state.activeMenu === 'window' }"
      @mousedown.prevent="toggleMenu('window')"
      @mouseenter="hoverMenu('window')"
    >
      Window
      <div v-if="ps.state.activeMenu === 'window'" class="menu-dropdown">
        <div class="menu-item" :class="{ 'menu-disabled': !hasDoc }" @click="doAction('zoom-in')">
          Zoom In<span class="menu-shortcut">&#8984;+</span>
        </div>
        <div class="menu-item" :class="{ 'menu-disabled': !hasDoc }" @click="doAction('zoom-out')">
          Zoom Out<span class="menu-shortcut">&#8984;-</span>
        </div>
        <div class="menu-item" :class="{ 'menu-disabled': !hasDoc }" @click="doAction('zoom-fit')">
          Fit on Screen
        </div>
        <div class="menu-item" :class="{ 'menu-disabled': !hasDoc }" @click="doAction('zoom-actual')">
          Actual Pixels
        </div>
        <div class="menu-item menu-separator"></div>
        <div class="menu-item" @click="doAction('toggle-rulers')">
          {{ ps.state.showRulers ? 'Hide' : 'Show' }} Rulers
        </div>
        <div class="menu-item" @click="doAction('toggle-palette')">
          {{ ps.state.showColorPicker ? 'Hide' : 'Show' }} Palette
        </div>
        <div class="menu-item" @click="doAction('toggle-brushes')">
          {{ ps.state.showBrushes ? 'Hide' : 'Show' }} Brushes
        </div>
        <div class="menu-item menu-separator"></div>
        <div v-if="hasDoc" class="menu-item menu-disabled">
          {{ ps.state.document?.name }}
        </div>
      </div>
    </div>

    <!-- Spacer to push document info to the right -->
    <div style="flex: 1"></div>
    <div v-if="hasDoc" style="font-size: 10px; padding-right: 8px; font-weight: normal">
      {{ ps.state.document?.width }} x {{ ps.state.document?.height }} | {{ Math.round(ps.state.zoom * 100) }}%
    </div>
  </div>
</template>

<script setup lang="ts">
const ps = usePhotoshop()
const subMenu = ref('')

const hasDoc = computed(() => !!ps.state.document)
const canUndo = computed(() => ps.state.document && ps.state.document.historyIndex > 0)
const hasSelection = computed(() => !!ps.state.document?.selection)

function toggleMenu(menu: string) {
  ps.state.activeMenu = ps.state.activeMenu === menu ? null : menu
  subMenu.value = ''
}

function hoverMenu(menu: string) {
  if (ps.state.activeMenu) {
    ps.state.activeMenu = menu
    subMenu.value = ''
  }
}

function doAction(action: string) {
  ps.state.activeMenu = null
  subMenu.value = ''

  switch (action) {
    case 'about': ps.state.activeDialog = 'about'; break
    case 'new': ps.state.activeDialog = 'new'; break
    case 'open': ps.openFile(); break
    case 'close':
      ps.state.document = null
      break
    case 'save': ps.saveAsPNG(); break
    case 'save-as': ps.saveAsPNG(); break
    case 'revert': ps.revert(); break
    case 'undo': ps.undo(); break
    case 'fill': ps.state.activeDialog = 'fill'; break
    case 'clear': ps.clearSelection(); break
    case 'invert': ps.invertImage(); break
    case 'threshold': ps.state.activeDialog = 'threshold'; break
    case 'posterize': ps.state.activeDialog = 'posterize'; break
    case 'levels': ps.state.activeDialog = 'levels'; break
    case 'brightness-contrast': ps.state.activeDialog = 'brightness-contrast'; break
    case 'color-balance': ps.state.activeDialog = 'color-balance'; break
    case 'hue-saturation': ps.state.activeDialog = 'hue-saturation'; break
    case 'blur': ps.applyFilter('blur'); break
    case 'blur-more': ps.applyFilter('blur-more'); break
    case 'gaussian-blur': ps.state.activeDialog = 'gaussian-blur'; break
    case 'sharpen': ps.applyFilter('sharpen'); break
    case 'sharpen-more': ps.applyFilter('sharpen-more'); break
    case 'noise': ps.state.activeDialog = 'noise'; break
    case 'mosaic': ps.state.activeDialog = 'mosaic'; break
    case 'diffuse': ps.applyFilter('diffuse'); break
    case 'edge-detect': ps.applyFilter('edge-detect'); break
    case 'emboss': ps.applyFilter('emboss'); break
    case 'flip-h': ps.flipHorizontal(); break
    case 'flip-v': ps.flipVertical(); break
    case 'rotate-180': ps.rotateImage(180); break
    case 'rotate-90cw': ps.rotateImage(90); break
    case 'rotate-90ccw': ps.rotateImage(-90); break
    case 'resize': ps.state.activeDialog = 'resize'; break
    case 'canvas-size': ps.state.activeDialog = 'canvas-size'; break
    case 'histogram': ps.state.activeDialog = 'histogram'; break
    case 'select-all': ps.selectAll(); break
    case 'select-none': ps.deselectAll(); break
    case 'select-inverse': ps.invertSelection(); break
    case 'hide-edges': ps.state.showSelection = !ps.state.showSelection; break
    case 'zoom-in':
      ps.state.zoom = Math.min(16, ps.state.zoom * 2)
      break
    case 'zoom-out':
      ps.state.zoom = Math.max(0.1, ps.state.zoom / 2)
      break
    case 'zoom-fit':
      if (ps.state.document) {
        const maxW = window.innerWidth - 200
        const maxH = window.innerHeight - 100
        ps.state.zoom = Math.min(maxW / ps.state.document.width, maxH / ps.state.document.height, 1)
      }
      break
    case 'zoom-actual':
      ps.state.zoom = 1
      break
    case 'toggle-rulers': ps.state.showRulers = !ps.state.showRulers; break
    case 'toggle-palette': ps.state.showColorPicker = !ps.state.showColorPicker; break
    case 'toggle-brushes': ps.state.showBrushes = !ps.state.showBrushes; break
    case 'mode-bitmap': if (ps.state.document) ps.state.document.mode = 'bitmap'; break
    case 'mode-grayscale':
      if (ps.state.document) {
        ps.state.document.mode = 'grayscale'
        ps.applyFilter('grayscale')
      }
      break
    case 'mode-indexed': if (ps.state.document) ps.state.document.mode = 'indexed'; break
    case 'mode-rgb': if (ps.state.document) ps.state.document.mode = 'rgb'; break
    case 'mode-cmyk': if (ps.state.document) ps.state.document.mode = 'cmyk'; break
    case 'mode-hsl': if (ps.state.document) ps.state.document.mode = 'hsl'; break
    case 'mode-hsb': if (ps.state.document) ps.state.document.mode = 'hsb'; break
    case 'mode-multichannel': if (ps.state.document) ps.state.document.mode = 'multichannel'; break
  }
}
</script>
