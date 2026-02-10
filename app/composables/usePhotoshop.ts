// Main Photoshop application state
export interface PhotoshopDocument {
  name: string
  width: number
  height: number
  mode: 'bitmap' | 'grayscale' | 'indexed' | 'rgb' | 'cmyk' | 'hsl' | 'hsb' | 'multichannel'
  resolution: number
  zoom: number
  canvas: HTMLCanvasElement | null
  ctx: CanvasRenderingContext2D | null
  // For undo
  history: ImageData[]
  historyIndex: number
  // Selection
  selection: SelectionData | null
  modified: boolean
}

export interface SelectionData {
  type: 'rect' | 'ellipse' | 'lasso' | 'wand'
  x: number
  y: number
  width: number
  height: number
  path?: { x: number; y: number }[]
  mask?: ImageData
}

export interface BrushTip {
  size: number
  hardness: number // 0-1
  shape: 'round' | 'square'
}

export type ToolName =
  | 'marquee' | 'ellipse-marquee' | 'lasso' | 'wand'
  | 'move' | 'crop'
  | 'pencil' | 'brush' | 'airbrush' | 'eraser'
  | 'stamp' | 'smudge' | 'blur' | 'sharpen'
  | 'bucket' | 'gradient'
  | 'line' | 'text'
  | 'eyedropper' | 'hand' | 'zoom'

export type DrawingMode = 'normal' | 'darken' | 'lighten' | 'colorOnly'

const state = reactive({
  // Current document
  document: null as PhotoshopDocument | null,

  // Tool state
  currentTool: 'pencil' as ToolName,
  previousTool: 'pencil' as ToolName,

  // Colors
  foregroundColor: '#000000',
  backgroundColor: '#ffffff',

  // Brush settings
  brushSize: 3,
  brushHardness: 1,
  brushOpacity: 100,
  brushShape: 'round' as 'round' | 'square',
  brushSpacing: 25,

  // Drawing mode
  drawingMode: 'normal' as DrawingMode,

  // Line tool
  lineWidth: 1,
  lineArrowStart: false,
  lineArrowEnd: false,

  // Magic wand
  wandTolerance: 32,

  // Text tool
  textFont: 'Chicago',
  textSize: 24,
  textBold: false,
  textItalic: false,
  textAlignment: 'left' as 'left' | 'center' | 'right',

  // View state
  showRulers: true,
  showBrushes: true,
  showColorPicker: true,
  showSelection: true,
  zoom: 1,

  // UI state
  activeDialog: null as string | null,
  activeMenu: null as string | null,

  // Predefined brush tips
  brushTips: [
    { size: 1, hardness: 1, shape: 'round' },
    { size: 3, hardness: 1, shape: 'round' },
    { size: 5, hardness: 1, shape: 'round' },
    { size: 9, hardness: 1, shape: 'round' },
    { size: 13, hardness: 1, shape: 'round' },
    { size: 19, hardness: 1, shape: 'round' },
    { size: 27, hardness: 0.8, shape: 'round' },
    { size: 35, hardness: 0.6, shape: 'round' },
    { size: 45, hardness: 0.4, shape: 'round' },
    { size: 65, hardness: 0.3, shape: 'round' },
    { size: 5, hardness: 1, shape: 'square' },
    { size: 9, hardness: 1, shape: 'square' },
  ] as BrushTip[],

  // Pattern for stamp tool
  pattern: null as ImageData | null,

  // Stamp source
  stampSource: null as { x: number; y: number } | null,
})

export function usePhotoshop() {
  // Create a new document
  function newDocument(name: string, width: number, height: number, mode: PhotoshopDocument['mode'] = 'rgb', resolution = 72) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    state.document = {
      name,
      width,
      height,
      mode,
      resolution,
      zoom: 1,
      canvas,
      ctx,
      history: [ctx.getImageData(0, 0, width, height)],
      historyIndex: 0,
      selection: null,
      modified: false,
    }
    state.zoom = fitZoom(width, height)
  }

  function fitZoom(width: number, height: number): number {
    const maxW = window.innerWidth - 200
    const maxH = window.innerHeight - 100
    const scale = Math.min(maxW / width, maxH / height, 1)
    return Math.round(scale * 100) / 100
  }

  // Push state for undo
  function pushHistory() {
    const doc = state.document
    if (!doc || !doc.ctx) return
    // Trim forward history
    doc.history = doc.history.slice(0, doc.historyIndex + 1)
    doc.history.push(doc.ctx.getImageData(0, 0, doc.width, doc.height))
    doc.historyIndex = doc.history.length - 1
    doc.modified = true
    // Keep max 50 history states
    if (doc.history.length > 50) {
      doc.history.shift()
      doc.historyIndex--
    }
  }

  function undo() {
    const doc = state.document
    if (!doc || !doc.ctx || doc.historyIndex <= 0) return
    doc.historyIndex--
    doc.ctx.putImageData(doc.history[doc.historyIndex], 0, 0)
  }

  function redo() {
    const doc = state.document
    if (!doc || !doc.ctx || doc.historyIndex >= doc.history.length - 1) return
    doc.historyIndex++
    doc.ctx.putImageData(doc.history[doc.historyIndex], 0, 0)
  }

  // Swap colors
  function swapColors() {
    const tmp = state.foregroundColor
    state.foregroundColor = state.backgroundColor
    state.backgroundColor = tmp
  }

  // Reset colors to default (black/white)
  function resetColors() {
    state.foregroundColor = '#000000'
    state.backgroundColor = '#ffffff'
  }

  function setTool(tool: ToolName) {
    state.previousTool = state.currentTool
    state.currentTool = tool
  }

  function selectAll() {
    const doc = state.document
    if (!doc) return
    doc.selection = {
      type: 'rect',
      x: 0,
      y: 0,
      width: doc.width,
      height: doc.height,
    }
  }

  function deselectAll() {
    if (state.document) {
      state.document.selection = null
    }
  }

  function invertSelection() {
    // For now, toggle between all and none
    const doc = state.document
    if (!doc) return
    if (doc.selection) {
      doc.selection = null
    } else {
      selectAll()
    }
  }

  function invertImage() {
    const doc = state.document
    if (!doc || !doc.ctx) return
    const imageData = doc.ctx.getImageData(0, 0, doc.width, doc.height)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i]
      data[i + 1] = 255 - data[i + 1]
      data[i + 2] = 255 - data[i + 2]
    }
    doc.ctx.putImageData(imageData, 0, 0)
    pushHistory()
  }

  function flipHorizontal() {
    const doc = state.document
    if (!doc || !doc.ctx) return
    const imageData = doc.ctx.getImageData(0, 0, doc.width, doc.height)
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = doc.width
    tempCanvas.height = doc.height
    const tempCtx = tempCanvas.getContext('2d')!
    tempCtx.putImageData(imageData, 0, 0)
    doc.ctx.save()
    doc.ctx.scale(-1, 1)
    doc.ctx.drawImage(tempCanvas, -doc.width, 0)
    doc.ctx.restore()
    pushHistory()
  }

  function flipVertical() {
    const doc = state.document
    if (!doc || !doc.ctx) return
    const imageData = doc.ctx.getImageData(0, 0, doc.width, doc.height)
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = doc.width
    tempCanvas.height = doc.height
    const tempCtx = tempCanvas.getContext('2d')!
    tempCtx.putImageData(imageData, 0, 0)
    doc.ctx.save()
    doc.ctx.scale(1, -1)
    doc.ctx.drawImage(tempCanvas, 0, -doc.height)
    doc.ctx.restore()
    pushHistory()
  }

  function rotateImage(degrees: number) {
    const doc = state.document
    if (!doc || !doc.ctx) return
    const imageData = doc.ctx.getImageData(0, 0, doc.width, doc.height)
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = doc.width
    tempCanvas.height = doc.height
    const tempCtx = tempCanvas.getContext('2d')!
    tempCtx.putImageData(imageData, 0, 0)

    if (degrees === 90 || degrees === -90 || degrees === 270) {
      const newWidth = doc.height
      const newHeight = doc.width
      doc.canvas!.width = newWidth
      doc.canvas!.height = newHeight
      doc.width = newWidth
      doc.height = newHeight
    }

    doc.ctx.clearRect(0, 0, doc.width, doc.height)
    doc.ctx.save()
    doc.ctx.translate(doc.width / 2, doc.height / 2)
    doc.ctx.rotate((degrees * Math.PI) / 180)
    doc.ctx.drawImage(tempCanvas, -tempCanvas.width / 2, -tempCanvas.height / 2)
    doc.ctx.restore()
    pushHistory()
  }

  function applyFilter(filterName: string, params?: Record<string, number>) {
    const doc = state.document
    if (!doc || !doc.ctx) return
    const imageData = doc.ctx.getImageData(0, 0, doc.width, doc.height)
    const data = imageData.data
    const width = doc.width
    const height = doc.height

    switch (filterName) {
      case 'blur':
        applyBoxBlur(data, width, height, params?.radius || 1)
        break
      case 'blur-more':
        applyBoxBlur(data, width, height, 3)
        break
      case 'gaussian-blur':
        applyGaussianBlur(data, width, height, params?.radius || 2)
        break
      case 'sharpen':
        applyConvolution(data, width, height, [0, -1, 0, -1, 5, -1, 0, -1, 0])
        break
      case 'sharpen-more':
        applyConvolution(data, width, height, [-1, -1, -1, -1, 9, -1, -1, -1, -1])
        break
      case 'emboss':
        applyConvolution(data, width, height, [-2, -1, 0, -1, 1, 1, 0, 1, 2])
        break
      case 'edge-detect':
        applyConvolution(data, width, height, [-1, -1, -1, -1, 8, -1, -1, -1, -1])
        break
      case 'noise': {
        const amount = params?.amount || 25
        for (let i = 0; i < data.length; i += 4) {
          const noise = (Math.random() - 0.5) * amount * 2
          data[i] = Math.max(0, Math.min(255, data[i] + noise))
          data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise))
          data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise))
        }
        break
      }
      case 'mosaic': {
        const cellSize = params?.cellSize || 8
        for (let y = 0; y < height; y += cellSize) {
          for (let x = 0; x < width; x += cellSize) {
            let r = 0, g = 0, b = 0, count = 0
            for (let dy = 0; dy < cellSize && y + dy < height; dy++) {
              for (let dx = 0; dx < cellSize && x + dx < width; dx++) {
                const idx = ((y + dy) * width + (x + dx)) * 4
                r += data[idx]
                g += data[idx + 1]
                b += data[idx + 2]
                count++
              }
            }
            r = Math.round(r / count)
            g = Math.round(g / count)
            b = Math.round(b / count)
            for (let dy = 0; dy < cellSize && y + dy < height; dy++) {
              for (let dx = 0; dx < cellSize && x + dx < width; dx++) {
                const idx = ((y + dy) * width + (x + dx)) * 4
                data[idx] = r
                data[idx + 1] = g
                data[idx + 2] = b
              }
            }
          }
        }
        break
      }
      case 'posterize': {
        const levels = params?.levels || 4
        const step = 255 / (levels - 1)
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.round(Math.round(data[i] / step) * step)
          data[i + 1] = Math.round(Math.round(data[i + 1] / step) * step)
          data[i + 2] = Math.round(Math.round(data[i + 2] / step) * step)
        }
        break
      }
      case 'threshold': {
        const threshold = params?.threshold || 128
        for (let i = 0; i < data.length; i += 4) {
          const gray = (data[i] + data[i + 1] + data[i + 2]) / 3
          const val = gray >= threshold ? 255 : 0
          data[i] = val
          data[i + 1] = val
          data[i + 2] = val
        }
        break
      }
      case 'grayscale':
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
          data[i] = gray
          data[i + 1] = gray
          data[i + 2] = gray
        }
        break
      case 'sepia':
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2]
          data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189)
          data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168)
          data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131)
        }
        break
      case 'diffuse': {
        const copy = new Uint8ClampedArray(data)
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const dx = Math.floor(Math.random() * 3) - 1
            const dy = Math.floor(Math.random() * 3) - 1
            const srcIdx = ((y + dy) * width + (x + dx)) * 4
            const dstIdx = (y * width + x) * 4
            data[dstIdx] = copy[srcIdx]
            data[dstIdx + 1] = copy[srcIdx + 1]
            data[dstIdx + 2] = copy[srcIdx + 2]
          }
        }
        break
      }
    }

    doc.ctx.putImageData(imageData, 0, 0)
    pushHistory()
  }

  function adjustBrightnessContrast(brightness: number, contrast: number) {
    const doc = state.document
    if (!doc || !doc.ctx) return
    const imageData = doc.ctx.getImageData(0, 0, doc.width, doc.height)
    const data = imageData.data
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))

    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp(factor * (data[i] - 128 + brightness) + 128)
      data[i + 1] = clamp(factor * (data[i + 1] - 128 + brightness) + 128)
      data[i + 2] = clamp(factor * (data[i + 2] - 128 + brightness) + 128)
    }

    doc.ctx.putImageData(imageData, 0, 0)
    pushHistory()
  }

  function adjustHueSaturation(hue: number, saturation: number, lightness: number) {
    const doc = state.document
    if (!doc || !doc.ctx) return
    const imageData = doc.ctx.getImageData(0, 0, doc.width, doc.height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      let [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2])
      h = (h + hue / 360 + 1) % 1
      s = clamp01(s + saturation / 100)
      l = clamp01(l + lightness / 100)
      const [r, g, b] = hslToRgb(h, s, l)
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
    }

    doc.ctx.putImageData(imageData, 0, 0)
    pushHistory()
  }

  function adjustLevels(inputMin: number, inputMax: number, gamma: number, outputMin: number, outputMax: number) {
    const doc = state.document
    if (!doc || !doc.ctx) return
    const imageData = doc.ctx.getImageData(0, 0, doc.width, doc.height)
    const data = imageData.data
    const inputRange = inputMax - inputMin || 1
    const outputRange = outputMax - outputMin

    for (let i = 0; i < data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        let val = data[i + c]
        val = (val - inputMin) / inputRange
        val = Math.max(0, Math.min(1, val))
        val = Math.pow(val, 1 / gamma)
        val = outputMin + val * outputRange
        data[i + c] = clamp(val)
      }
    }

    doc.ctx.putImageData(imageData, 0, 0)
    pushHistory()
  }

  function adjustColorBalance(shadows: number[], midtones: number[], highlights: number[]) {
    const doc = state.document
    if (!doc || !doc.ctx) return
    const imageData = doc.ctx.getImageData(0, 0, doc.width, doc.height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const lum = (data[i] + data[i + 1] + data[i + 2]) / 3 / 255
      for (let c = 0; c < 3; c++) {
        let adj = 0
        // Shadows: lum < 0.33
        adj += shadows[c] * Math.max(0, 1 - lum * 3)
        // Midtones: 0.33 < lum < 0.66
        adj += midtones[c] * (1 - Math.abs(lum - 0.5) * 4)
        // Highlights: lum > 0.66
        adj += highlights[c] * Math.max(0, (lum - 0.33) * 3 - 1)
        data[i + c] = clamp(data[i + c] + adj)
      }
    }

    doc.ctx.putImageData(imageData, 0, 0)
    pushHistory()
  }

  function getHistogramData(): number[] {
    const doc = state.document
    if (!doc || !doc.ctx) return new Array(256).fill(0)
    const imageData = doc.ctx.getImageData(0, 0, doc.width, doc.height)
    const data = imageData.data
    const histogram = new Array(256).fill(0)

    for (let i = 0; i < data.length; i += 4) {
      const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
      histogram[lum]++
    }

    return histogram
  }

  function resizeImage(newWidth: number, newHeight: number) {
    const doc = state.document
    if (!doc || !doc.ctx || !doc.canvas) return
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = doc.width
    tempCanvas.height = doc.height
    const tempCtx = tempCanvas.getContext('2d')!
    tempCtx.drawImage(doc.canvas, 0, 0)

    doc.canvas.width = newWidth
    doc.canvas.height = newHeight
    doc.width = newWidth
    doc.height = newHeight
    doc.ctx.imageSmoothingEnabled = true
    doc.ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight)
    pushHistory()
  }

  // Fill the document or selection
  function fill(color: string) {
    const doc = state.document
    if (!doc || !doc.ctx) return
    doc.ctx.fillStyle = color
    if (doc.selection) {
      doc.ctx.fillRect(doc.selection.x, doc.selection.y, doc.selection.width, doc.selection.height)
    } else {
      doc.ctx.fillRect(0, 0, doc.width, doc.height)
    }
    pushHistory()
  }

  function clearSelection() {
    const doc = state.document
    if (!doc || !doc.ctx) return
    if (doc.selection) {
      doc.ctx.fillStyle = state.backgroundColor
      doc.ctx.fillRect(doc.selection.x, doc.selection.y, doc.selection.width, doc.selection.height)
      pushHistory()
    }
  }

  // Save document as PNG
  function saveAsPNG() {
    const doc = state.document
    if (!doc || !doc.canvas) return
    const link = document.createElement('a')
    link.download = doc.name.replace(/\.\w+$/, '') + '.png'
    link.href = doc.canvas.toDataURL('image/png')
    link.click()
  }

  // Open image file
  function openFile() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const img = new Image()
      img.onload = () => {
        newDocument(file.name, img.width, img.height)
        state.document!.ctx!.drawImage(img, 0, 0)
        pushHistory()
      }
      img.src = URL.createObjectURL(file)
    }
    input.click()
  }

  // Revert to saved (first history state)
  function revert() {
    const doc = state.document
    if (!doc || !doc.ctx || doc.history.length === 0) return
    doc.ctx.putImageData(doc.history[0], 0, 0)
    doc.historyIndex = 0
    doc.history = [doc.history[0]]
  }

  return {
    state,
    newDocument,
    pushHistory,
    undo,
    redo,
    swapColors,
    resetColors,
    setTool,
    selectAll,
    deselectAll,
    invertSelection,
    invertImage,
    flipHorizontal,
    flipVertical,
    rotateImage,
    applyFilter,
    adjustBrightnessContrast,
    adjustHueSaturation,
    adjustLevels,
    adjustColorBalance,
    getHistogramData,
    resizeImage,
    fill,
    clearSelection,
    saveAsPNG,
    openFile,
    revert,
  }
}

// ---- Helper functions ----

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)))
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [h, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255)
    return [v, v, v]
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ]
}

function applyBoxBlur(data: Uint8ClampedArray, width: number, height: number, radius: number) {
  const copy = new Uint8ClampedArray(data)
  const size = radius * 2 + 1
  const area = size * size

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const sx = Math.min(width - 1, Math.max(0, x + dx))
          const sy = Math.min(height - 1, Math.max(0, y + dy))
          const idx = (sy * width + sx) * 4
          r += copy[idx]
          g += copy[idx + 1]
          b += copy[idx + 2]
        }
      }
      const idx = (y * width + x) * 4
      data[idx] = r / area
      data[idx + 1] = g / area
      data[idx + 2] = b / area
    }
  }
}

function applyGaussianBlur(data: Uint8ClampedArray, width: number, height: number, radius: number) {
  // Use box blur approximation (3 passes)
  applyBoxBlur(data, width, height, radius)
  applyBoxBlur(data, width, height, radius)
  applyBoxBlur(data, width, height, radius)
}

function applyConvolution(data: Uint8ClampedArray, width: number, height: number, kernel: number[]) {
  const copy = new Uint8ClampedArray(data)
  const kSize = Math.sqrt(kernel.length)
  const half = Math.floor(kSize / 2)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0
      for (let ky = 0; ky < kSize; ky++) {
        for (let kx = 0; kx < kSize; kx++) {
          const sx = Math.min(width - 1, Math.max(0, x + kx - half))
          const sy = Math.min(height - 1, Math.max(0, y + ky - half))
          const idx = (sy * width + sx) * 4
          const weight = kernel[ky * kSize + kx]
          r += copy[idx] * weight
          g += copy[idx + 1] * weight
          b += copy[idx + 2] * weight
        }
      }
      const idx = (y * width + x) * 4
      data[idx] = clamp(r)
      data[idx + 1] = clamp(g)
      data[idx + 2] = clamp(b)
    }
  }
}
