const canvas = document.getElementById('pixelCanvas')
const ctx = canvas.getContext('2d')
const colorPicker = document.getElementById('colorPicker')
const undoBtn = document.getElementById('undo')
const redoBtn = document.getElementById('redo')
const clearBtn = document.getElementById('clear')
const downloadBtn = document.getElementById('download')
const downloadJpgBtn = document.getElementById('downloadJpg')
const imageUpload = document.getElementById('imageUpload')
const drawMode = document.getElementById('drawMode')
const glitchBtn = document.getElementById('glitch')

const CANVAS_SIZE = 32
let PIXEL_SIZE = 16
let currentColor = '#000000'
let isDrawing = false
let history = []
let historyIndex = -1

function resizeCanvas() {
    const screenContainer = document.querySelector('.screen-container')
    const containerWidth = screenContainer.offsetWidth - 40 // Account for padding
    PIXEL_SIZE = Math.floor(containerWidth / CANVAS_SIZE)
    canvas.width = CANVAS_SIZE * PIXEL_SIZE
    canvas.height = CANVAS_SIZE * PIXEL_SIZE
    redrawCanvas()
}

function redrawCanvas() {
    if (history.length > 0) {
        setCanvasState(history[historyIndex])
    }
}

function getCanvasState() {
    return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

function setCanvasState(state) {
    ctx.putImageData(state, 0, 0)
}

function addToHistory() {
    historyIndex++
    history = history.slice(0, historyIndex)
    history.push(getCanvasState())
    updateButtons()
}

// function updateButtons() {
//     undoBtn.disabled = historyIndex <= 0
//     redoBtn.disabled = historyIndex >= history.length - 1
// }
function updateButtons() {
    undoBtn.disabled = historyIndex <= 0
    redoBtn.disabled = historyIndex >= history.length - 1
    console.log('History length:', history.length, 'Current index:', historyIndex) // Para debug
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--
        setCanvasState(history[historyIndex])
        updateButtons()
    }
}

function redo() {
    if (historyIndex < history.length - 1) {
        historyIndex++
        setCanvasState(history[historyIndex])
        updateButtons()
    }
}

// function clear() {
//     ctx.clearRect(0, 0, canvas.width, canvas.height)
//     addToHistory()
// }
function clear() {
    ctx.fillStyle = '#FFFFFF' // O el color que quieras como fondo
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    addToHistory()
}

function fillArea(startX, startY) {
    const pixelX = Math.floor(startX / PIXEL_SIZE)
    const pixelY = Math.floor(startY / PIXEL_SIZE)

    // Get the color of the clicked pixel
    const imageData = ctx.getImageData(pixelX * PIXEL_SIZE, pixelY * PIXEL_SIZE, 1, 1)
    const targetColor = `rgb(${imageData.data[0]}, ${imageData.data[1]}, ${imageData.data[2]})`

    // Flood fill algorithm
    const stack = [[pixelX, pixelY]]
    const visited = new Set()

    while (stack.length > 0) {
        const [x, y] = stack.pop()
        const key = `${x},${y}`

        if (visited.has(key)) continue
        if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) continue

        const pixelData = ctx.getImageData(x * PIXEL_SIZE, y * PIXEL_SIZE, 1, 1)
        const currentPixelColor = `rgb(${pixelData.data[0]}, ${pixelData.data[1]}, ${pixelData.data[2]})`

        if (currentPixelColor !== targetColor) continue

        ctx.fillStyle = currentColor
        ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE)
        visited.add(key)

        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
    }
}
function fillAll() {
    ctx.fillStyle = currentColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    addToHistory()
}

function applyGlitchEffect() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Random glitch parameters
    const intensity = Math.random() * 0.3 + 0.1
    const channelOffset = Math.floor(Math.random() * 20)

    // Apply various glitch effects
    for (let i = 0; i < data.length; i += 4) {
        // Random color channel shift
        if (Math.random() < intensity) {
            data[i] = data[i + channelOffset] || data[i]
            data[i + 2] = data[i - channelOffset] || data[i + 2]
        }

        // Random vertical lines
        if (Math.random() < 0.01) {
            const lineHeight = Math.floor(Math.random() * 50)
            const lineWidth = Math.floor(Math.random() * 4) + 1
            for (let j = 0; j < lineHeight; j++) {
                for (let k = 0; k < lineWidth; k++) {
                    const pos = i + j * canvas.width * 4 + k * 4
                    if (pos < data.length) {
                        data[pos] = Math.random() * 255
                        data[pos + 1] = Math.random() * 255
                        data[pos + 2] = Math.random() * 255
                    }
                }
            }
        }
    }

    ctx.putImageData(imageData, 0, 0)
    addToHistory()
}

function download(format) {
    const link = document.createElement('a')
    link.download = `pixel_art.${format}`
    if (format === 'png') {
        link.href = canvas.toDataURL()
    } else if (format === 'jpg') {
        link.href = canvas.toDataURL('image/jpeg')
    }
    link.click()
}

function drawPixel(x, y) {
    const pixelX = Math.floor(x / PIXEL_SIZE) * PIXEL_SIZE
    const pixelY = Math.floor(y / PIXEL_SIZE) * PIXEL_SIZE

    switch (drawMode.value) {
        case 'pixel':
            ctx.fillStyle = currentColor
            ctx.fillRect(pixelX, pixelY, PIXEL_SIZE, PIXEL_SIZE)
            break
        case 'fill':
            fillArea(x, y)
            break
        case 'fillAll':
            fillAll()
            break
    }
}

// Event Listeners
window.addEventListener('resize', resizeCanvas)

// canvas.addEventListener('mousedown', (e) => {
//     isDrawing = true
//     drawPixel(e.offsetX, e.offsetY)
//     if (drawMode.value !== 'pixel') {
//         addToHistory()
//     }
// })
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true
    const prevState = getCanvasState() // Guarda el estado antes de dibujar
    drawPixel(e.offsetX, e.offsetY)
    if (drawMode.value === 'pixel') {
        addToHistory() // Añade al historial después de cada pixel
    }
})

canvas.addEventListener('mousemove', (e) => {
    if (isDrawing && drawMode.value === 'pixel') {
        drawPixel(e.offsetX, e.offsetY)
    }
})

canvas.addEventListener('mouseup', () => {
    if (isDrawing) {
        isDrawing = false
        addToHistory()
    }
})

canvas.addEventListener('mouseleave', () => {
    if (isDrawing) {
        isDrawing = false
        addToHistory()
    }
})

// Touch events
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault()
    isDrawing = true
    const touch = e.touches[0]
    const rect = canvas.getBoundingClientRect()
    drawPixel(touch.clientX - rect.left, touch.clientY - rect.top)
    if (drawMode.value !== 'pixel') {
        addToHistory()
    }
})

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault()
    if (isDrawing) {
        const touch = e.touches[0]
        const rect = canvas.getBoundingClientRect()
        drawPixel(touch.clientX - rect.left, touch.clientY - rect.top)
    }
})

canvas.addEventListener('touchend', () => {
    if (isDrawing) {
        isDrawing = false
        addToHistory()
    }
})

// Other event listeners
colorPicker.addEventListener('change', (e) => {
    currentColor = e.target.value
})

undoBtn.addEventListener('click', undo)
redoBtn.addEventListener('click', redo)
clearBtn.addEventListener('click', clear)
downloadBtn.addEventListener('click', () => download('png'))
downloadJpgBtn.addEventListener('click', () => download('jpg'))
glitchBtn.addEventListener('click', applyGlitchEffect)

imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0]
    if (file) {
        const reader = new FileReader()
        reader.onload = function (event) {
            const img = new Image()
            img.onload = function () {
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                addToHistory()
            }
            img.src = event.target.result
        }
        reader.readAsDataURL(file)
    }
})
// Agrega este event listener para los atajos de teclado
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        // metaKey para soporte en Mac
        if (e.key === 'z') {
            e.preventDefault() // Previene el comportamiento por defecto
            if (e.shiftKey) {
                redo() // Ctrl+Shift+Z para redo
            } else {
                undo() // Ctrl+Z para undo
            }
        } else if (e.key === 'y') {
            e.preventDefault()
            redo() // Ctrl+Y también para redo
        }
    }
})

// Función para guardar el estado del canvas
function saveCanvasState() {
    const imageData = canvas.toDataURL()
    localStorage.setItem('pixelaoCanvasState', imageData)
}

// Función para cargar el estado del canvas
function loadCanvasState() {
    const savedState = localStorage.getItem('pixelaoCanvasState')
    if (savedState) {
        const img = new Image()
        img.onload = function () {
            ctx.drawImage(img, 0, 0)
        }
        img.src = savedState
    }
}

// Modifica las funciones existentes de dibujo para que guarden el estado
// Después de cada acción de dibujo, agregar:

function addToHistory() {
    // Elimina todos los estados después del índice actual
    history = history.slice(0, historyIndex + 1)
    history.push(getCanvasState())
    historyIndex = history.length - 1
    updateButtons()
}
// Initialize canvas
saveCanvasState()

resizeCanvas()
clear()
addToHistory()
