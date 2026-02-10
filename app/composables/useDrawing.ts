// Drawing engine - handles all canvas drawing operations
export function useDrawing() {
  const { state, pushHistory } = usePhotoshop()

  let isDrawing = false
  let lastX = 0
  let lastY = 0
  let startX = 0
  let startY = 0
  // For airbrush continuous spray
  let airbrushInterval: ReturnType<typeof setInterval> | null = null
  // For line tool preview
  let previewCanvas: HTMLCanvasElement | null = null
  let previewCtx: CanvasRenderingContext2D | null = null

  function getCanvasCoords(e: MouseEvent, displayCanvas: HTMLCanvasElement): { x: number; y: number } {
    const rect = displayCanvas.getBoundingClientRect()
    const doc = state.document!
    const scaleX = doc.width / rect.width
    const scaleY = doc.height / rect.height
    return {
      x: Math.floor((e.clientX - rect.left) * scaleX),
      y: Math.floor((e.clientY - rect.top) * scaleY),
    }
  }

  function startDraw(e: MouseEvent, displayCanvas: HTMLCanvasElement) {
    const doc = state.document
    if (!doc || !doc.ctx) return
    const { x, y } = getCanvasCoords(e, displayCanvas)

    isDrawing = true
    lastX = x
    lastY = y
    startX = x
    startY = y

    const tool = state.currentTool
    const ctx = doc.ctx

    switch (tool) {
      case 'pencil':
        ctx.fillStyle = state.foregroundColor
        ctx.fillRect(x, y, 1, 1)
        break

      case 'brush':
        drawBrushStamp(ctx, x, y)
        break

      case 'airbrush':
        drawAirbrushSpray(ctx, x, y)
        airbrushInterval = setInterval(() => {
          if (isDrawing) drawAirbrushSpray(ctx, lastX, lastY)
        }, 50)
        break

      case 'eraser':
        eraseAt(ctx, x, y)
        break

      case 'eyedropper':
        pickColor(ctx, x, y, false)
        break

      case 'bucket':
        floodFill(ctx, x, y, state.foregroundColor, state.wandTolerance)
        pushHistory()
        isDrawing = false
        break

      case 'line':
        // Create preview overlay
        setupPreview(displayCanvas)
        break

      case 'marquee':
      case 'ellipse-marquee':
        // Selection starts
        setupPreview(displayCanvas)
        break

      case 'lasso':
        doc.selection = null
        ;(doc as any)._lassoPath = [{ x, y }]
        setupPreview(displayCanvas)
        break

      case 'wand':
        magicWandSelect(ctx, x, y, state.wandTolerance)
        isDrawing = false
        break

      case 'text':
        // Text placement
        isDrawing = false
        placeText(ctx, x, y)
        break

      case 'stamp':
        if (e.altKey || e.metaKey) {
          state.stampSource = { x, y }
          isDrawing = false
        }
        break

      case 'blur':
      case 'sharpen':
      case 'smudge':
        // These tools work on drag
        break

      case 'gradient':
        setupPreview(displayCanvas)
        break

      case 'zoom':
        if (e.altKey) {
          state.zoom = Math.max(0.1, state.zoom / 2)
        } else {
          state.zoom = Math.min(16, state.zoom * 2)
        }
        isDrawing = false
        break

      case 'crop':
        setupPreview(displayCanvas)
        break
    }
  }

  function moveDraw(e: MouseEvent, displayCanvas: HTMLCanvasElement) {
    const doc = state.document
    if (!doc || !doc.ctx) return
    const { x, y } = getCanvasCoords(e, displayCanvas)
    const ctx = doc.ctx
    const tool = state.currentTool

    if (!isDrawing) return

    switch (tool) {
      case 'pencil':
        drawLine(ctx, lastX, lastY, x, y, state.foregroundColor, 1)
        break

      case 'brush':
        interpolateBrush(ctx, lastX, lastY, x, y)
        break

      case 'airbrush':
        // Position updated for interval
        break

      case 'eraser':
        eraseLineTo(ctx, lastX, lastY, x, y)
        break

      case 'eyedropper':
        pickColor(ctx, x, y, false)
        break

      case 'line':
        drawLinePreview(displayCanvas, startX, startY, x, y, e.shiftKey)
        break

      case 'marquee':
      case 'ellipse-marquee':
        drawSelectionPreview(displayCanvas, startX, startY, x, y, tool, e.shiftKey)
        break

      case 'lasso':
        if ((doc as any)._lassoPath) {
          (doc as any)._lassoPath.push({ x, y })
          drawLassoPreview(displayCanvas, (doc as any)._lassoPath)
        }
        break

      case 'stamp':
        if (state.stampSource) {
          const dx = x - startX
          const dy = y - startY
          stampClone(ctx, x, y, state.stampSource.x + dx, state.stampSource.y + dy)
        }
        break

      case 'blur':
        applyLocalBlur(ctx, x, y)
        break

      case 'sharpen':
        applyLocalSharpen(ctx, x, y)
        break

      case 'smudge':
        applySmudge(ctx, lastX, lastY, x, y)
        break

      case 'gradient':
        drawGradientPreview(displayCanvas, startX, startY, x, y)
        break

      case 'crop':
        drawCropPreview(displayCanvas, startX, startY, x, y)
        break

      case 'move':
        if (doc.selection) {
          doc.selection.x += x - lastX
          doc.selection.y += y - lastY
        }
        break
    }

    lastX = x
    lastY = y
  }

  function endDraw(e: MouseEvent, displayCanvas: HTMLCanvasElement) {
    const doc = state.document
    if (!doc || !doc.ctx) return
    if (!isDrawing) return

    const { x, y } = getCanvasCoords(e, displayCanvas)
    const ctx = doc.ctx
    const tool = state.currentTool

    isDrawing = false

    if (airbrushInterval) {
      clearInterval(airbrushInterval)
      airbrushInterval = null
    }

    switch (tool) {
      case 'pencil':
      case 'brush':
      case 'airbrush':
      case 'eraser':
      case 'stamp':
      case 'blur':
      case 'sharpen':
      case 'smudge':
        pushHistory()
        break

      case 'line': {
        cleanupPreview()
        let endX = x, endY = y
        if (e.shiftKey) {
          ;({ x: endX, y: endY } = constrainAngle(startX, startY, x, y))
        }
        drawLine(ctx, startX, startY, endX, endY, state.foregroundColor, state.lineWidth)
        pushHistory()
        break
      }

      case 'marquee': {
        cleanupPreview()
        const sx = Math.min(startX, x)
        const sy = Math.min(startY, y)
        const sw = Math.abs(x - startX)
        const sh = e.shiftKey ? sw : Math.abs(y - startY)
        if (sw > 1 && sh > 1) {
          doc.selection = { type: 'rect', x: sx, y: sy, width: sw, height: sh }
        }
        break
      }

      case 'ellipse-marquee': {
        cleanupPreview()
        const sx = Math.min(startX, x)
        const sy = Math.min(startY, y)
        const sw = Math.abs(x - startX)
        const sh = e.shiftKey ? sw : Math.abs(y - startY)
        if (sw > 1 && sh > 1) {
          doc.selection = { type: 'ellipse', x: sx, y: sy, width: sw, height: sh }
        }
        break
      }

      case 'lasso': {
        cleanupPreview()
        const path = (doc as any)._lassoPath
        if (path && path.length > 2) {
          const minX = Math.min(...path.map((p: any) => p.x))
          const minY = Math.min(...path.map((p: any) => p.y))
          const maxX = Math.max(...path.map((p: any) => p.x))
          const maxY = Math.max(...path.map((p: any) => p.y))
          doc.selection = {
            type: 'lasso',
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            path,
          }
        }
        delete (doc as any)._lassoPath
        break
      }

      case 'gradient': {
        cleanupPreview()
        drawGradient(ctx, startX, startY, x, y)
        pushHistory()
        break
      }

      case 'crop': {
        cleanupPreview()
        const cx = Math.min(startX, x)
        const cy = Math.min(startY, y)
        const cw = Math.abs(x - startX)
        const ch = Math.abs(y - startY)
        if (cw > 1 && ch > 1) {
          cropImage(ctx, cx, cy, cw, ch)
          pushHistory()
        }
        break
      }
    }
  }

  // --- Drawing primitives ---

  function drawLine(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string, width: number) {
    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.stroke()
    ctx.restore()
  }

  function drawBrushStamp(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const size = state.brushSize
    const hardness = state.brushHardness
    const opacity = state.brushOpacity / 100

    ctx.save()
    ctx.globalAlpha = opacity

    if (hardness >= 0.9) {
      // Hard brush
      ctx.fillStyle = state.foregroundColor
      if (state.brushShape === 'square') {
        ctx.fillRect(x - size / 2, y - size / 2, size, size)
      } else {
        ctx.beginPath()
        ctx.arc(x, y, size / 2, 0, Math.PI * 2)
        ctx.fill()
      }
    } else {
      // Soft brush - radial gradient
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size / 2)
      const col = hexToRgb(state.foregroundColor)
      gradient.addColorStop(0, `rgba(${col.r},${col.g},${col.b},1)`)
      gradient.addColorStop(hardness, `rgba(${col.r},${col.g},${col.b},0.5)`)
      gradient.addColorStop(1, `rgba(${col.r},${col.g},${col.b},0)`)
      ctx.fillStyle = gradient
      ctx.fillRect(x - size / 2, y - size / 2, size, size)
    }

    ctx.restore()
  }

  function interpolateBrush(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
    const dist = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2)
    const spacing = Math.max(1, state.brushSize * (state.brushSpacing / 100))
    const steps = Math.max(1, Math.ceil(dist / spacing))

    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const x = x0 + (x1 - x0) * t
      const y = y0 + (y1 - y0) * t
      drawBrushStamp(ctx, x, y)
    }
  }

  function drawAirbrushSpray(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const size = state.brushSize
    const col = hexToRgb(state.foregroundColor)
    const density = Math.ceil(size * 0.5)

    ctx.save()
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * size / 2
      const px = x + Math.cos(angle) * radius
      const py = y + Math.sin(angle) * radius
      ctx.fillStyle = `rgba(${col.r},${col.g},${col.b},${0.1 + Math.random() * 0.15})`
      ctx.fillRect(px, py, 1, 1)
    }
    ctx.restore()
  }

  function eraseAt(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const size = state.brushSize
    ctx.fillStyle = state.backgroundColor
    ctx.beginPath()
    ctx.arc(x, y, size / 2, 0, Math.PI * 2)
    ctx.fill()
  }

  function eraseLineTo(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
    const dist = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2)
    const steps = Math.max(1, Math.ceil(dist / 2))
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      eraseAt(ctx, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)
    }
  }

  function pickColor(ctx: CanvasRenderingContext2D, x: number, y: number, isBackground: boolean) {
    const doc = state.document
    if (!doc) return
    if (x < 0 || y < 0 || x >= doc.width || y >= doc.height) return
    const pixel = ctx.getImageData(x, y, 1, 1).data
    const hex = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`
    if (isBackground) {
      state.backgroundColor = hex
    } else {
      state.foregroundColor = hex
    }
  }

  function floodFill(ctx: CanvasRenderingContext2D, startX: number, startY: number, fillColor: string, tolerance: number) {
    const doc = state.document
    if (!doc) return
    const width = doc.width
    const height = doc.height
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    const targetIdx = (startY * width + startX) * 4
    const targetR = data[targetIdx]
    const targetG = data[targetIdx + 1]
    const targetB = data[targetIdx + 2]

    const fill = hexToRgb(fillColor)

    // Don't fill if target is same as fill color
    if (targetR === fill.r && targetG === fill.g && targetB === fill.b) return

    const visited = new Uint8Array(width * height)
    const stack = [startX, startY]

    while (stack.length > 0) {
      const y = stack.pop()!
      const x = stack.pop()!

      if (x < 0 || x >= width || y < 0 || y >= height) continue
      const pos = y * width + x
      if (visited[pos]) continue

      const idx = pos * 4
      const dr = Math.abs(data[idx] - targetR)
      const dg = Math.abs(data[idx + 1] - targetG)
      const db = Math.abs(data[idx + 2] - targetB)

      if (dr <= tolerance && dg <= tolerance && db <= tolerance) {
        visited[pos] = 1
        data[idx] = fill.r
        data[idx + 1] = fill.g
        data[idx + 2] = fill.b
        data[idx + 3] = 255

        stack.push(x + 1, y)
        stack.push(x - 1, y)
        stack.push(x, y + 1)
        stack.push(x, y - 1)
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }

  function magicWandSelect(ctx: CanvasRenderingContext2D, startX: number, startY: number, tolerance: number) {
    const doc = state.document
    if (!doc) return
    const width = doc.width
    const height = doc.height
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    const targetIdx = (startY * width + startX) * 4
    const targetR = data[targetIdx]
    const targetG = data[targetIdx + 1]
    const targetB = data[targetIdx + 2]

    const visited = new Uint8Array(width * height)
    const stack = [startX, startY]
    let minX = startX, minY = startY, maxX = startX, maxY = startY

    while (stack.length > 0) {
      const y = stack.pop()!
      const x = stack.pop()!

      if (x < 0 || x >= width || y < 0 || y >= height) continue
      const pos = y * width + x
      if (visited[pos]) continue

      const idx = pos * 4
      const dr = Math.abs(data[idx] - targetR)
      const dg = Math.abs(data[idx + 1] - targetG)
      const db = Math.abs(data[idx + 2] - targetB)

      if (dr <= tolerance && dg <= tolerance && db <= tolerance) {
        visited[pos] = 1
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)

        stack.push(x + 1, y)
        stack.push(x - 1, y)
        stack.push(x, y + 1)
        stack.push(x, y - 1)
      }
    }

    doc.selection = {
      type: 'wand',
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    }
  }

  function drawGradient(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
    const gradient = ctx.createLinearGradient(x0, y0, x1, y1)
    gradient.addColorStop(0, state.foregroundColor)
    gradient.addColorStop(1, state.backgroundColor)
    ctx.fillStyle = gradient

    const doc = state.document!
    if (doc.selection) {
      ctx.fillRect(doc.selection.x, doc.selection.y, doc.selection.width, doc.selection.height)
    } else {
      ctx.fillRect(0, 0, doc.width, doc.height)
    }
  }

  function cropImage(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const doc = state.document
    if (!doc || !doc.canvas) return
    const imageData = ctx.getImageData(x, y, w, h)
    doc.canvas.width = w
    doc.canvas.height = h
    doc.width = w
    doc.height = h
    ctx.putImageData(imageData, 0, 0)
  }

  function stampClone(ctx: CanvasRenderingContext2D, dx: number, dy: number, sx: number, sy: number) {
    const doc = state.document
    if (!doc) return
    const size = state.brushSize
    const half = Math.floor(size / 2)

    if (sx - half < 0 || sy - half < 0 || sx + half >= doc.width || sy + half >= doc.height) return

    const sourceData = ctx.getImageData(sx - half, sy - half, size, size)
    ctx.putImageData(sourceData, dx - half, dy - half)
  }

  function applyLocalBlur(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const doc = state.document
    if (!doc) return
    const size = state.brushSize
    const half = Math.floor(size / 2)
    const sx = Math.max(0, x - half)
    const sy = Math.max(0, y - half)
    const sw = Math.min(size, doc.width - sx)
    const sh = Math.min(size, doc.height - sy)
    if (sw <= 0 || sh <= 0) return

    const imageData = ctx.getImageData(sx, sy, sw, sh)
    const data = imageData.data
    const copy = new Uint8ClampedArray(data)

    for (let py = 1; py < sh - 1; py++) {
      for (let px = 1; px < sw - 1; px++) {
        const idx = (py * sw + px) * 4
        for (let c = 0; c < 3; c++) {
          data[idx + c] = (
            copy[idx + c] +
            copy[((py - 1) * sw + px) * 4 + c] +
            copy[((py + 1) * sw + px) * 4 + c] +
            copy[(py * sw + px - 1) * 4 + c] +
            copy[(py * sw + px + 1) * 4 + c]
          ) / 5
        }
      }
    }

    ctx.putImageData(imageData, sx, sy)
  }

  function applyLocalSharpen(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const doc = state.document
    if (!doc) return
    const size = state.brushSize
    const half = Math.floor(size / 2)
    const sx = Math.max(0, x - half)
    const sy = Math.max(0, y - half)
    const sw = Math.min(size, doc.width - sx)
    const sh = Math.min(size, doc.height - sy)
    if (sw <= 0 || sh <= 0) return

    const imageData = ctx.getImageData(sx, sy, sw, sh)
    const data = imageData.data
    const copy = new Uint8ClampedArray(data)

    for (let py = 1; py < sh - 1; py++) {
      for (let px = 1; px < sw - 1; px++) {
        const idx = (py * sw + px) * 4
        for (let c = 0; c < 3; c++) {
          const center = copy[idx + c]
          const avg = (
            copy[((py - 1) * sw + px) * 4 + c] +
            copy[((py + 1) * sw + px) * 4 + c] +
            copy[(py * sw + px - 1) * 4 + c] +
            copy[(py * sw + px + 1) * 4 + c]
          ) / 4
          data[idx + c] = Math.max(0, Math.min(255, center + (center - avg) * 0.5))
        }
      }
    }

    ctx.putImageData(imageData, sx, sy)
  }

  function applySmudge(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
    const doc = state.document
    if (!doc) return
    const size = state.brushSize
    const half = Math.floor(size / 2)

    // Get source pixel
    if (x0 < 0 || y0 < 0 || x0 >= doc.width || y0 >= doc.height) return
    const srcData = ctx.getImageData(Math.max(0, x0 - half), Math.max(0, y0 - half), size, size)
    ctx.globalAlpha = 0.5
    ctx.putImageData(srcData, Math.max(0, x1 - half), Math.max(0, y1 - half))
    ctx.globalAlpha = 1
  }

  function placeText(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const text = prompt('Enter text:')
    if (!text) return

    ctx.save()
    const style = `${state.textItalic ? 'italic ' : ''}${state.textBold ? 'bold ' : ''}${state.textSize}px ${state.textFont}`
    ctx.font = style
    ctx.fillStyle = state.foregroundColor
    ctx.textAlign = state.textAlignment as CanvasTextAlign
    ctx.textBaseline = 'top'

    const lines = text.split('\n')
    const lineHeight = state.textSize * 1.2
    lines.forEach((line, i) => {
      ctx.fillText(line, x, y + i * lineHeight)
    })

    ctx.restore()
    pushHistory()
  }

  // --- Preview helpers ---

  function setupPreview(displayCanvas: HTMLCanvasElement) {
    previewCanvas = document.createElement('canvas')
    previewCanvas.width = displayCanvas.width
    previewCanvas.height = displayCanvas.height
    previewCanvas.style.position = 'absolute'
    previewCanvas.style.top = '0'
    previewCanvas.style.left = '0'
    previewCanvas.style.pointerEvents = 'none'
    previewCanvas.style.width = displayCanvas.style.width
    previewCanvas.style.height = displayCanvas.style.height
    previewCtx = previewCanvas.getContext('2d')!
    displayCanvas.parentElement?.appendChild(previewCanvas)
  }

  function cleanupPreview() {
    if (previewCanvas) {
      previewCanvas.remove()
      previewCanvas = null
      previewCtx = null
    }
  }

  function drawLinePreview(displayCanvas: HTMLCanvasElement, x0: number, y0: number, x1: number, y1: number, constrain: boolean) {
    if (!previewCtx || !previewCanvas) return
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height)

    if (constrain) {
      ;({ x: x1, y: y1 } = constrainAngle(x0, y0, x1, y1))
    }

    const doc = state.document!
    const scaleX = previewCanvas.width / doc.width
    const scaleY = previewCanvas.height / doc.height

    previewCtx.save()
    previewCtx.strokeStyle = state.foregroundColor
    previewCtx.lineWidth = state.lineWidth * scaleX
    previewCtx.lineCap = 'round'
    previewCtx.beginPath()
    previewCtx.moveTo(x0 * scaleX, y0 * scaleY)
    previewCtx.lineTo(x1 * scaleX, y1 * scaleY)
    previewCtx.stroke()
    previewCtx.restore()
  }

  function drawSelectionPreview(displayCanvas: HTMLCanvasElement, x0: number, y0: number, x1: number, y1: number, tool: string, constrain: boolean) {
    if (!previewCtx || !previewCanvas) return
    const doc = state.document!
    const scaleX = previewCanvas.width / doc.width
    const scaleY = previewCanvas.height / doc.height

    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height)
    previewCtx.save()
    previewCtx.strokeStyle = '#000'
    previewCtx.lineWidth = 1
    previewCtx.setLineDash([4, 4])

    const sx = Math.min(x0, x1) * scaleX
    const sy = Math.min(y0, y1) * scaleY
    let sw = Math.abs(x1 - x0) * scaleX
    let sh = Math.abs(y1 - y0) * scaleY
    if (constrain) sh = sw

    if (tool === 'ellipse-marquee') {
      previewCtx.beginPath()
      previewCtx.ellipse(sx + sw / 2, sy + sh / 2, sw / 2, sh / 2, 0, 0, Math.PI * 2)
      previewCtx.stroke()
    } else {
      previewCtx.strokeRect(sx, sy, sw, sh)
    }

    previewCtx.restore()
  }

  function drawLassoPreview(displayCanvas: HTMLCanvasElement, path: { x: number; y: number }[]) {
    if (!previewCtx || !previewCanvas || path.length < 2) return
    const doc = state.document!
    const scaleX = previewCanvas.width / doc.width
    const scaleY = previewCanvas.height / doc.height

    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height)
    previewCtx.save()
    previewCtx.strokeStyle = '#000'
    previewCtx.lineWidth = 1
    previewCtx.setLineDash([4, 4])

    previewCtx.beginPath()
    previewCtx.moveTo(path[0].x * scaleX, path[0].y * scaleY)
    for (let i = 1; i < path.length; i++) {
      previewCtx.lineTo(path[i].x * scaleX, path[i].y * scaleY)
    }
    previewCtx.stroke()
    previewCtx.restore()
  }

  function drawGradientPreview(displayCanvas: HTMLCanvasElement, x0: number, y0: number, x1: number, y1: number) {
    if (!previewCtx || !previewCanvas) return
    const doc = state.document!
    const scaleX = previewCanvas.width / doc.width
    const scaleY = previewCanvas.height / doc.height

    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height)
    previewCtx.save()
    previewCtx.strokeStyle = '#000'
    previewCtx.lineWidth = 1
    previewCtx.setLineDash([4, 4])
    previewCtx.beginPath()
    previewCtx.moveTo(x0 * scaleX, y0 * scaleY)
    previewCtx.lineTo(x1 * scaleX, y1 * scaleY)
    previewCtx.stroke()
    previewCtx.restore()
  }

  function drawCropPreview(displayCanvas: HTMLCanvasElement, x0: number, y0: number, x1: number, y1: number) {
    if (!previewCtx || !previewCanvas) return
    const doc = state.document!
    const scaleX = previewCanvas.width / doc.width
    const scaleY = previewCanvas.height / doc.height

    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height)
    previewCtx.save()

    // Dim outside
    previewCtx.fillStyle = 'rgba(0,0,0,0.4)'
    previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height)

    const sx = Math.min(x0, x1) * scaleX
    const sy = Math.min(y0, y1) * scaleY
    const sw = Math.abs(x1 - x0) * scaleX
    const sh = Math.abs(y1 - y0) * scaleY

    previewCtx.clearRect(sx, sy, sw, sh)
    previewCtx.strokeStyle = '#fff'
    previewCtx.lineWidth = 1
    previewCtx.setLineDash([4, 4])
    previewCtx.strokeRect(sx, sy, sw, sh)

    previewCtx.restore()
  }

  // --- Utility ---

  function constrainAngle(x0: number, y0: number, x1: number, y1: number): { x: number; y: number } {
    const dx = x1 - x0
    const dy = y1 - y0
    const angle = Math.atan2(dy, dx)
    const dist = Math.sqrt(dx * dx + dy * dy)
    // Snap to 0, 45, 90, 135, 180, etc.
    const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)
    return {
      x: Math.round(x0 + Math.cos(snapped) * dist),
      y: Math.round(y0 + Math.sin(snapped) * dist),
    }
  }

  return {
    startDraw,
    moveDraw,
    endDraw,
    getCanvasCoords,
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}
