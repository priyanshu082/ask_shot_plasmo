const CANVAS_ID = "askshot-capture-canvas"
const MIN_SELECTION_SIZE = 10

let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let isDrawing = false
let startX = 0
let startY = 0
let currentRect = { x: 0, y: 0, width: 0, height: 0 }

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "start-drawing") {
    startDrawing()
    sendResponse({ status: "started" })
  }
  if (message.action === "cancel-drawing") {
    cleanup()
  }
})

const startDrawing = () => {
  console.log("startDrawing | Overlay activated")

  if (document.getElementById(CANVAS_ID)) return

  createCanvas()
  setupEventListeners()
  drawInitialOverlay()
}

const createCanvas = () => {
  canvas = document.createElement("canvas")
  canvas.id = CANVAS_ID
  Object.assign(canvas.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    zIndex: "9999999",
    cursor: "crosshair"
  })

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  ctx = canvas.getContext("2d")!

  document.body.appendChild(canvas)
}

const drawInitialOverlay = () => {
  if (!ctx || !canvas) return
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

const setupEventListeners = () => {
  if (!canvas) return

  canvas.onmousedown = handleMouseDown
  canvas.onmousemove = handleMouseMove
  canvas.onmouseup = handleMouseUp
  document.onkeydown = handleKeyDown
}

const handleMouseDown = (e: MouseEvent) => {
  isDrawing = true
  startX = e.clientX
  startY = e.clientY
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDrawing || !ctx || !canvas) return

  const currentX = e.clientX
  const currentY = e.clientY

  currentRect = {
    x: Math.min(startX, currentX),
    y: Math.min(startY, currentY),
    width: Math.abs(currentX - startX),
    height: Math.abs(currentY - startY)
  }

  redrawCanvas()
}

const redrawCanvas = () => {
  if (!ctx || !canvas) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.clearRect(
    currentRect.x,
    currentRect.y,
    currentRect.width,
    currentRect.height
  )
  ctx.strokeStyle = "#00f"
  ctx.lineWidth = 2
  ctx.strokeRect(
    currentRect.x,
    currentRect.y,
    currentRect.width,
    currentRect.height
  )
}

const handleMouseUp = async () => {
  isDrawing = false

  if (
    currentRect.width < MIN_SELECTION_SIZE ||
    currentRect.height < MIN_SELECTION_SIZE
  ) {
    console.log("handleMouseUp | Selection too small, cancelling")
    cleanup()
    return
  }

  const selectedRect = { ...currentRect }
  cleanup()
  await captureAndCrop(selectedRect)
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    console.log("handleKeyDown | Drawing cancelled")
    cleanup()
  }
}

const captureAndCrop = async (rect: typeof currentRect) => {
  chrome.runtime.sendMessage(
    { action: "capture-screenshot" },
    async (response) => {
      console.log("captureAndCrop | Screenshot received from background")

      if (!response?.success || !response.data) {
        console.error("captureAndCrop | Failed to capture screenshot")
        return
      }

      try {
        const croppedImage = await cropImage(response.data, rect)
        chrome.runtime.sendMessage({
          action: "store-cropped-screenshot",
          data: croppedImage
        })
        console.log("captureAndCrop | Cropped screenshot sent for storage")
      } catch (error) {
        console.error("captureAndCrop | Error cropping screenshot:", error)
      }
    }
  )
}

const cropImage = async (
  base64: string,
  rect: typeof currentRect
): Promise<string> => {
  const img = new Image()
  img.src = base64
  await img.decode()

  const cropCanvas = document.createElement("canvas")
  cropCanvas.width = rect.width
  cropCanvas.height = rect.height

  const cropCtx = cropCanvas.getContext("2d")!
  cropCtx.drawImage(
    img,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    rect.width,
    rect.height
  )

  return cropCanvas.toDataURL("image/png")
}

const cleanup = () => {
  canvas?.remove()
  canvas = null
  ctx = null
  isDrawing = false
  document.onkeydown = null
}
