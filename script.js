// Check if we're on the main drawing page (index.html) or gallery page (view.html)
const isMainPage = document.getElementById('canvas') !== null;

// Canvas setup (only on main page)
let canvas, ctx, saveBtn, saveConfirmBtn, cursorPreview;
let undoBtn, redoBtn, toolButtons;
let colorOverlay, penOverlay, eraserOverlay, saveOverlay;
let allColorCircles, brushSizeButtons;

if (isMainPage) {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    saveBtn = document.getElementById('saveBtn');
    saveConfirmBtn = document.getElementById('saveConfirmBtn');
    cursorPreview = document.getElementById('cursorPreview');

    // Toolbar elements
    undoBtn = document.getElementById('undoBtn');
    redoBtn = document.getElementById('redoBtn');
    toolButtons = document.querySelectorAll('.tool-btn[data-tool]');

    // Overlays
    colorOverlay = document.getElementById('colorOverlay');
    penOverlay = document.getElementById('penOverlay');
    eraserOverlay = document.getElementById('eraserOverlay');
    saveOverlay = document.getElementById('saveOverlay');
    allColorCircles = document.querySelectorAll('.color-circle');
    brushSizeButtons = document.querySelectorAll('.brush-size-btn');
}

// Canvas dimensions - will be calculated dynamically
let CANVAS_WIDTH = 1024;
let CANVAS_HEIGHT = 1024;

// Logical pixel grid sizes (powers of 2 for clean scaling)
const GRID_SIZES = [256, 512, 1024, 2048, 4096];

// Calculate optimal canvas size based on viewport
function calculateCanvasSize() {
    const isMobile = window.innerWidth < 769;
    const toolbar = document.getElementById('toolbar');
    const canvasContainer = document.getElementById('canvas-container');
    
    if (!canvas || !toolbar || !canvasContainer) return;
    
    // Get available space
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let availableWidth, availableHeight;
    
    if (isMobile) {
        // Mobile: use full viewport, toolbar is inside canvas
        availableWidth = viewportWidth;
        availableHeight = viewportHeight;
    } else {
        // Desktop: account for toolbar and padding
        const toolbarRect = toolbar.getBoundingClientRect();
        const toolbarWidth = toolbarRect.width;
        const padding = 4; // 2vw on each side
        availableWidth = viewportWidth - toolbarWidth - (padding * viewportWidth / 100);
        availableHeight = viewportHeight - (4 * viewportHeight / 100); // 4vh total padding
    }
    
    // Calculate maximum square size that fits
    const maxSquareSize = Math.min(availableWidth, availableHeight);
    
    // Find the closest logical grid size that fits
    // Use a size that's at most 90% of available space to ensure it fits comfortably
    const targetSize = maxSquareSize * 0.9;
    let logicalSize = GRID_SIZES[0];
    
    for (let i = 0; i < GRID_SIZES.length; i++) {
        if (GRID_SIZES[i] <= targetSize) {
            logicalSize = GRID_SIZES[i];
        } else {
            break;
        }
    }
    
    // Ensure minimum size
    if (logicalSize < GRID_SIZES[0]) {
        logicalSize = GRID_SIZES[0];
    }
    
    CANVAS_WIDTH = logicalSize;
    CANVAS_HEIGHT = logicalSize;
    
    // Store previous dimensions to detect size change
    const prevWidth = canvas.width;
    const prevHeight = canvas.height;
    const hadContent = undoStack.length > 0;
    
    // Update canvas dimensions
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    
    // Redraw canvas if we have existing state
    if (hadContent && prevWidth > 0 && prevHeight > 0) {
        const currentState = undoStack[undoStack.length - 1];
        // If canvas size changed, we need to scale the image data
        if (currentState.width !== CANVAS_WIDTH || currentState.height !== CANVAS_HEIGHT) {
            // Create a temporary canvas to scale the image
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = currentState.width;
            tempCanvas.height = currentState.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.putImageData(currentState, 0, 0);
            
            // Clear and redraw scaled
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.drawImage(tempCanvas, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            
            // Update undo stack with new state
            const newImageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            undoStack[undoStack.length - 1] = newImageData;
        } else {
            ctx.putImageData(currentState, 0, 0);
        }
    } else {
        // Initialize with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        if (!hadContent) {
            saveCanvasState();
        }
    }
}

// Initialize canvas size after DOM and layout are ready
if (isMainPage && canvas) {
    // Wait for layout to calculate toolbar size accurately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Use requestAnimationFrame to ensure layout is calculated
            requestAnimationFrame(() => {
                calculateCanvasSize();
            });
        });
    } else {
        requestAnimationFrame(() => {
            calculateCanvasSize();
        });
    }
}

// Drawing configuration
let PEN_SIZE = 4;
let PEN_COLOR = '#000000';
let isErasing = false;
let currentTool = 'pen';
let gridEnabled = false; // Grid snapping state

// Store previous pen settings when switching to eraser
let previousPenColor = '#000000';
let previousPenSize = 4;

// Drawing state
let isDrawing = false;
let strokes = [];
let currentStroke = [];
let isReplaying = false;
let lastX = 0;
let lastY = 0;

// Action history for replay (tracks all actions, not just strokes)
let actionHistory = [];

// Undo/Redo stacks
let undoStack = [];
let redoStack = [];

// Canvas initialization is now handled in calculateCanvasSize()

// Helper function to save canvas state for undo/redo
function saveCanvasState() {
    const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    undoStack.push(imageData);
    redoStack = []; // Clear redo stack when new action is performed
    updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
    undoBtn.disabled = undoStack.length <= 1;
    redoBtn.disabled = redoStack.length === 0;
}

function undo() {
    if (undoStack.length > 1) {
        redoStack.push(undoStack.pop());
        const prevState = undoStack[undoStack.length - 1];
        ctx.putImageData(prevState, 0, 0);
        updateUndoRedoButtons();
    }
}

function redo() {
    if (redoStack.length > 0) {
        const nextState = redoStack.pop();
        undoStack.push(nextState);
        ctx.putImageData(nextState, 0, 0);
        updateUndoRedoButtons();
    }
}

if (isMainPage && undoBtn && redoBtn) {
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);
}

// Overlay management
function closeAllOverlays() {
    colorOverlay.classList.remove('show');
    penOverlay.classList.remove('show');
    eraserOverlay.classList.remove('show');
    saveOverlay.classList.remove('show');
}

function showColorOverlay() {
    closeAllOverlays();
    colorOverlay.classList.add('show');
    positionOverlayForTool('fill');
}

function showPenOverlay() {
    closeAllOverlays();
    if (currentTool === 'pen') {
        penOverlay.classList.add('show');
        positionOverlayForTool('pen');
    }
}

function showEraserOverlay() {
    closeAllOverlays();
    eraserOverlay.classList.add('show');
    positionOverlayForTool('eraser');
}

// Position overlay to align top row center with icon center
function positionOverlayForTool(tool) {
    const toolbar = document.getElementById('toolbar');
    const toolbarRect = toolbar.getBoundingClientRect();
    const isMobile = window.innerWidth < 769;
    
    // Tool button positions (0-indexed)
    const toolIndex = tool === 'pen' ? 0 : tool === 'fill' ? 1 : 2; // eraser is 2
    
    // Get button dimensions dynamically
    const firstButton = toolbar.querySelector('.tool-btn');
    const buttonRect = firstButton ? firstButton.getBoundingClientRect() : null;
    const buttonHeight = buttonRect ? buttonRect.height : 60;
    const buttonGap = parseFloat(getComputedStyle(toolbar).gap) || 10;
    const toolbarPadding = parseFloat(getComputedStyle(toolbar).paddingTop) || 15;
    
    // Calculate icon center position
    const iconCenterY = toolbarRect.top + toolbarPadding + (toolIndex * (buttonHeight + buttonGap)) + (buttonHeight / 2);
    
    // Get the overlay element
    let overlay;
    if (tool === 'pen') {
        overlay = penOverlay;
    } else if (tool === 'fill') {
        overlay = colorOverlay;
    } else {
        overlay = eraserOverlay;
    }
    
    // Get the overlay content to measure its padding
    const overlayContent = overlay.querySelector('.overlay-content');
    const overlayPadding = parseFloat(getComputedStyle(overlayContent).paddingTop) || 20;
    
    // Calculate top row height dynamically
    let topRowHeight = 50; // default color circle height
    if (tool === 'eraser') {
        const firstSizeBtn = overlay.querySelector('.brush-size-btn');
        if (firstSizeBtn) {
            topRowHeight = firstSizeBtn.getBoundingClientRect().height;
        } else {
            topRowHeight = 60;
        }
    } else {
        const firstColorCircle = overlay.querySelector('.color-circle');
        if (firstColorCircle) {
            topRowHeight = firstColorCircle.getBoundingClientRect().height;
        }
    }
    
    if (isMobile) {
        // Mobile: position below toolbar, horizontally aligned
        overlay.style.top = `${toolbarRect.bottom + 2}px`;
        overlay.style.left = `${toolbarRect.left}px`;
        overlay.style.transform = 'none';
    } else {
        // Desktop: position to the right of toolbar, vertically aligned
        const overlayTop = iconCenterY - overlayPadding - (topRowHeight / 2);
        overlay.style.top = `${overlayTop}px`;
        overlay.style.left = `${toolbarRect.right + 1}px`;
        overlay.style.transform = 'none';
    }
}

// Position save overlay
function positionSaveOverlay() {
    const toolbar = document.getElementById('toolbar');
    const toolbarRect = toolbar.getBoundingClientRect();
    const saveBtnRect = saveBtn.getBoundingClientRect();
    const isMobile = window.innerWidth < 769;
    
    // Calculate save button center position
    const iconCenterY = saveBtnRect.top + (saveBtnRect.height / 2);
    
    // Get the overlay content to measure its padding
    const overlayContent = saveOverlay.querySelector('.overlay-content');
    const overlayPadding = parseFloat(getComputedStyle(overlayContent).paddingTop) || 20;
    
    // Save confirmation button height
    const confirmBtn = saveOverlay.querySelector('.save-confirm-btn');
    const buttonHeight = confirmBtn ? confirmBtn.getBoundingClientRect().height : 60;
    
    if (isMobile) {
        // Mobile: position below toolbar
        saveOverlay.style.top = `${toolbarRect.bottom + 2}px`;
        saveOverlay.style.left = `${toolbarRect.left}px`;
        saveOverlay.style.transform = 'none';
    } else {
        // Desktop: position to the right of toolbar
        const overlayTop = iconCenterY - overlayPadding - (buttonHeight / 2);
        saveOverlay.style.top = `${overlayTop}px`;
        saveOverlay.style.left = `${toolbarRect.right + 1}px`;
        saveOverlay.style.transform = 'none';
    }
}

function showSaveOverlay() {
    closeAllOverlays();
    positionSaveOverlay();
    saveOverlay.classList.add('show');
}

// Close overlays when mouse leaves overlay area (only on main page)
if (isMainPage) {
    if (colorOverlay) {
        colorOverlay.addEventListener('mouseleave', () => {
            colorOverlay.classList.remove('show');
        });
    }

    if (penOverlay) {
        penOverlay.addEventListener('mouseleave', () => {
            // Only close if not drawing
            if (!isDrawing) {
                penOverlay.classList.remove('show');
            }
        });
    }

    if (eraserOverlay) {
        eraserOverlay.addEventListener('mouseleave', () => {
            // Only close if not drawing
            if (!isDrawing) {
                eraserOverlay.classList.remove('show');
            }
        });
    }

    if (saveOverlay) {
        saveOverlay.addEventListener('mouseleave', () => {
            saveOverlay.classList.remove('show');
        });
    }
}

// Tool selection (only on main page)
if (isMainPage && toolButtons) {
    toolButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tool = btn.getAttribute('data-tool');
            selectTool(tool);
        });
    });
}

// Toggle button functionality (only on main page)
if (isMainPage) {
    const toggleBtn = document.getElementById('toggleBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (isReplaying) return;
            
            const currentState = toggleBtn.getAttribute('data-state');
            const newState = currentState === 'on' ? 'off' : 'on';
            toggleBtn.setAttribute('data-state', newState);
            
            // Update grid enabled state
            gridEnabled = newState === 'on';
            
            // Close any open overlays when toggling
            closeAllOverlays();
            
            console.log(`Grid snapping is now: ${gridEnabled ? 'enabled' : 'disabled'}`);
        });
    }
}

function selectTool(tool) {
    if (isReplaying) return;
    
    const previousTool = currentTool;
    currentTool = tool;
    
    // Record tool change action
    actionHistory.push({
        type: 'tool_change',
        timestamp: Date.now(),
        tool: tool
    });
    
    // Update tool button selection
    toolButtons.forEach(btn => {
        btn.classList.remove('selected');
    });
    const selectedBtn = document.querySelector(`.tool-btn[data-tool="${tool}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('selected');
    }
    
    // Handle eraser
    if (tool === 'eraser') {
        // Store current pen settings before switching to eraser (only if coming from pen)
        if (previousTool === 'pen') {
            previousPenColor = PEN_COLOR;
            previousPenSize = PEN_SIZE;
        }
        isErasing = true;
        PEN_COLOR = '#FFFFFF';
    } else {
        isErasing = false;
        // When switching back to pen from eraser, restore previous settings
        if (tool === 'pen' && previousTool === 'eraser') {
            PEN_COLOR = previousPenColor;
            PEN_SIZE = previousPenSize;
            // Update UI to reflect restored settings
            updateColorSelectionUI(previousPenColor);
            updateBrushSizeSelectionUI(previousPenSize);
        }
    }
    
    // Show appropriate overlay based on tool
    if (tool === 'pen') {
        showPenOverlay();
    } else if (tool === 'fill') {
        showColorOverlay();
    } else if (tool === 'eraser') {
        showEraserOverlay();
    } else {
        closeAllOverlays();
    }
    
    // Update cursor preview when tool changes
    updateCursorPreview();
}

// Color selection (only on main page)
if (isMainPage && allColorCircles) {
    allColorCircles.forEach(circle => {
        circle.addEventListener('click', () => {
            const color = circle.getAttribute('data-color');
            selectColor(color);
        });
    });
}

// Helper function to update color selection UI
function updateColorSelectionUI(color) {
    allColorCircles.forEach(c => {
        c.classList.remove('selected');
        if (c.getAttribute('data-color') === color) {
            c.classList.add('selected');
        }
    });
}

function selectColor(color) {
    if (isReplaying) return;
    
    PEN_COLOR = color;
    isErasing = false;
    
    // Update previous pen color if currently using pen tool
    if (currentTool === 'pen') {
        previousPenColor = color;
    }
    
    // Record color change action
    actionHistory.push({
        type: 'color_change',
        timestamp: Date.now(),
        color: color
    });
    
    // Update selected state for all color circles
    updateColorSelectionUI(color);
    
    // Close color overlay
    colorOverlay.classList.remove('show');
    
    // If pen tool is active, show pen overlay after color selection
    if (currentTool === 'pen') {
        showPenOverlay();
    }
}

// Brush size selection (for both pen and eraser overlays)
// Use event delegation to handle all brush size buttons
document.addEventListener('click', (e) => {
    if (e.target.closest('.brush-size-btn')) {
        const btn = e.target.closest('.brush-size-btn');
        const size = btn.getAttribute('data-size');
        selectBrushSize(size);
    }
});

// Helper function to update brush size selection UI
function updateBrushSizeSelectionUI(size) {
    const allBrushSizeButtons = document.querySelectorAll('.brush-size-btn');
    allBrushSizeButtons.forEach(btn => {
        btn.classList.remove('selected');
        if (btn.getAttribute('data-size') === String(size)) {
            btn.classList.add('selected');
        }
    });
}

function selectBrushSize(size) {
    if (isReplaying) return;
    
    PEN_SIZE = parseInt(size);
    
    // Update previous pen size if currently using pen tool
    if (currentTool === 'pen') {
        previousPenSize = PEN_SIZE;
    }
    
    // Record brush size change action
    actionHistory.push({
        type: 'brush_size_change',
        timestamp: Date.now(),
        size: PEN_SIZE
    });
    
    // Update selected state for all brush size buttons (pen and eraser overlays)
    updateBrushSizeSelectionUI(size);
    
    // Update cursor preview
    updateCursorPreview();
}

// Update cursor preview appearance
function updateCursorPreview() {
    // Remove any existing tool icons
    const bucketIcon = cursorPreview.querySelector('.bucket-icon');
    const eraserIcon = cursorPreview.querySelector('.eraser-icon');
    if (bucketIcon) bucketIcon.remove();
    if (eraserIcon) eraserIcon.remove();
    
    if (currentTool === 'fill') {
        // For fill tool, show bucket icon above a small red circle
        cursorPreview.style.width = '12px';
        cursorPreview.style.height = '12px';
        cursorPreview.classList.add('fill-cursor');
        
        // Add bucket icon if not already present
        if (!cursorPreview.querySelector('.bucket-icon')) {
            const bucketIcon = document.createElement('div');
            bucketIcon.className = 'bucket-icon';
            bucketIcon.innerHTML = `
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15c-.59.59-.59 1.54 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10L10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z"/>
                </svg>
            `;
            cursorPreview.appendChild(bucketIcon);
        }
    } else if (currentTool === 'eraser') {
        // For eraser tool, show eraser icon above the circle preview
        cursorPreview.style.width = `${PEN_SIZE}px`;
        cursorPreview.style.height = `${PEN_SIZE}px`;
        cursorPreview.classList.remove('fill-cursor');
        cursorPreview.classList.add('eraser-cursor');
        
        // Add eraser icon if not already present
        if (!cursorPreview.querySelector('.eraser-icon')) {
            const eraserIcon = document.createElement('div');
            eraserIcon.className = 'eraser-icon';
            eraserIcon.innerHTML = `
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l9.19-9.19c.79-.78 2.05-.78 2.84 0zM4.22 15.58l2.83 2.83c.39.39 1.02.39 1.41 0l9.19-9.19c.39-.39.39-1.02 0-1.41l-2.83-2.83c-.39-.39-1.02-.39-1.41 0L4.22 14.17c-.39.39-.39 1.02 0 1.41zM3 21h18v2H3v-2z"/>
                </svg>
            `;
            cursorPreview.appendChild(eraserIcon);
        }
    } else {
        // For pen tool, show the regular circle preview
        cursorPreview.style.width = `${PEN_SIZE}px`;
        cursorPreview.style.height = `${PEN_SIZE}px`;
        cursorPreview.classList.remove('fill-cursor');
        cursorPreview.classList.remove('eraser-cursor');
    }
}

// Cursor preview functionality (only on main page)
if (isMainPage && canvas && cursorPreview) {
    canvas.addEventListener('mouseenter', () => {
        cursorPreview.style.display = 'block';
        updateCursorPreview();
    });

    canvas.addEventListener('mouseleave', () => {
        cursorPreview.style.display = 'none';
    });

    canvas.addEventListener('mousemove', (e) => {
        cursorPreview.style.left = `${e.clientX}px`;
        cursorPreview.style.top = `${e.clientY}px`;
    });
}

// Grid snapping function - snaps coordinates to grid subdivisions based on PEN_SIZE
function snapToGrid(x, y) {
    if (!gridEnabled) {
        return { x, y };
    }
    // Grid cell size equals PEN_SIZE
    const gridSize = PEN_SIZE;
    // Snap to top-left corner of the grid cell containing the point
    // Use Math.floor to always snap to the cell that contains the click
    const snappedX = Math.floor(x / gridSize) * gridSize;
    const snappedY = Math.floor(y / gridSize) * gridSize;
    return { x: snappedX, y: snappedY };
}

// Helper function to interpolate points between two coordinates
function interpolatePoints(x0, y0, x1, y1) {
    const points = [];
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let x = x0;
    let y = y0;

    while (true) {
        points.push({ x, y });

        if (x === x1 && y === y1) break;

        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x += sx;
        }
        if (e2 < dx) {
            err += dx;
            y += sy;
        }
    }

    return points;
}

// Drawing functions
function startDrawing(e) {
    if (isReplaying) return;
    
    // Close overlays when starting to draw
    closeAllOverlays();
    
    const rect = canvas.getBoundingClientRect();
    let x = Math.floor(e.clientX - rect.left);
    let y = Math.floor(e.clientY - rect.top);
    
    // Apply grid snapping if enabled
    const snapped = snapToGrid(x, y);
    x = snapped.x;
    y = snapped.y;
    
    if (currentTool === 'fill') {
        // Record fill action
        actionHistory.push({
            type: 'fill',
            timestamp: Date.now(),
            x_coord: x,
            y_coord: y,
            colour_applied: PEN_COLOR
        });
        floodFill(x, y, PEN_COLOR);
        saveCanvasState();
    } else {
        isDrawing = true;
        currentStroke = [];
        lastX = x;
        lastY = y;
        
        // When grid is enabled, draw immediately on click
        if (gridEnabled) {
            const strokeData = {
                timestamp: Date.now(),
                x_coord: x,
                y_coord: y,
                pen_size: PEN_SIZE,
                colour_applied: PEN_COLOR,
                is_erasing: isErasing,
                tool: currentTool === 'eraser' ? 'eraser' : 'pen'
            };

            currentStroke.push(strokeData);

            ctx.fillStyle = PEN_COLOR;
            // Fill the entire grid cell
            ctx.fillRect(x, y, PEN_SIZE, PEN_SIZE);
        } else {
            // Normal drawing - call draw() which will interpolate
            draw(e);
        }
    }
}

function stopDrawing() {
    if (isDrawing && currentStroke.length > 0) {
        strokes.push([...currentStroke]);
        // Record drawing stroke action (use first point's timestamp for chronological ordering)
        actionHistory.push({
            type: 'stroke',
            timestamp: currentStroke[0].timestamp,
            stroke: [...currentStroke]
        });
        currentStroke = [];
        saveCanvasState();
    }
    isDrawing = false;
}

function draw(e) {
    if (!isDrawing || (currentTool !== 'pen' && currentTool !== 'eraser')) return;

    const rect = canvas.getBoundingClientRect();
    let x = Math.floor(e.clientX - rect.left);
    let y = Math.floor(e.clientY - rect.top);
    
    // Apply grid snapping if enabled
    const snapped = snapToGrid(x, y);
    x = snapped.x;
    y = snapped.y;
    
    // When grid is enabled, draw at grid intersections only (no interpolation needed)
    if (gridEnabled) {
        // Only draw if we've moved to a new grid cell
        if (x !== lastX || y !== lastY) {
            const strokeData = {
                timestamp: Date.now(),
                x_coord: x,
                y_coord: y,
                pen_size: PEN_SIZE,
                colour_applied: PEN_COLOR,
                is_erasing: isErasing,
                tool: currentTool === 'eraser' ? 'eraser' : 'pen'
            };

            currentStroke.push(strokeData);

            ctx.fillStyle = PEN_COLOR;
            // When grid is enabled, fill the entire grid cell
            ctx.fillRect(x, y, PEN_SIZE, PEN_SIZE);
            
            lastX = x;
            lastY = y;
        }
    } else {
        // Normal drawing with interpolation when grid is off
        const points = interpolatePoints(lastX, lastY, x, y);

        points.forEach(point => {
            const strokeData = {
                timestamp: Date.now(),
                x_coord: point.x,
                y_coord: point.y,
                pen_size: PEN_SIZE,
                colour_applied: PEN_COLOR,
                is_erasing: isErasing,
                tool: currentTool === 'eraser' ? 'eraser' : 'pen'
            };

            currentStroke.push(strokeData);

            ctx.fillStyle = PEN_COLOR;
            ctx.fillRect(point.x - PEN_SIZE / 2, point.y - PEN_SIZE / 2, PEN_SIZE, PEN_SIZE);
        });

        lastX = x;
        lastY = y;
    }
}

// Mouse events (only on main page)
if (isMainPage && canvas) {
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    // Touch events for mobile
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        let x = Math.floor(touch.clientX - rect.left);
        let y = Math.floor(touch.clientY - rect.top);
        // Apply grid snapping if enabled
        const snapped = snapToGrid(x, y);
        lastX = snapped.x;
        lastY = snapped.y;
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {});
        canvas.dispatchEvent(mouseEvent);
    });
}

// Flood fill algorithm (optimized for speed - all cells updated at once)
function floodFill(startX, startY, fillColor) {
    const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const pixels = imageData.data;
    
    const startPos = (startY * CANVAS_WIDTH + startX) * 4;
    const startR = pixels[startPos];
    const startG = pixels[startPos + 1];
    const startB = pixels[startPos + 2];
    
    const fillRgb = hexToRgb(fillColor);
    
    // Early exit if already filled with target color
    if (startR === fillRgb.r && startG === fillRgb.g && startB === fillRgb.b) {
        return;
    }
    
    // Use Uint8Array for visited tracking (much faster than Set with string keys)
    const visited = new Uint8Array(CANVAS_WIDTH * CANVAS_HEIGHT);
    const getKey = (x, y) => y * CANVAS_WIDTH + x;
    
    const stack = [[startX, startY]];
    
    // Process all pixels synchronously
    while (stack.length > 0) {
        const [x, y] = stack.pop();
        
        // Bounds check
        if (x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) continue;
        
        const key = getKey(x, y);
        if (visited[key]) continue;
        
        const pos = key * 4;
        const r = pixels[pos];
        const g = pixels[pos + 1];
        const b = pixels[pos + 2];
        
        // Color match check
        if (r !== startR || g !== startG || b !== startB) continue;
        
        // Mark as visited and update pixel
        visited[key] = 1;
        pixels[pos] = fillRgb.r;
        pixels[pos + 1] = fillRgb.g;
        pixels[pos + 2] = fillRgb.b;
        pixels[pos + 3] = 255;
        
        // Add neighbors to stack
        stack.push([x + 1, y]);
        stack.push([x - 1, y]);
        stack.push([x, y + 1]);
        stack.push([x, y - 1]);
    }
    
    // Update canvas once with all changes
    ctx.putImageData(imageData, 0, 0);
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// Save button functionality (only on main page)
if (isMainPage && saveBtn) {
    saveBtn.addEventListener('click', () => {
        if (isReplaying) return;
        showSaveOverlay();
    });
}

// Save confirmation button functionality (only on main page)
if (isMainPage && saveConfirmBtn) {
    saveConfirmBtn.addEventListener('click', () => {
    if (isReplaying) return;
    
    const drawingData = {
        id: `drawing_${Date.now()}`,
        canvas_width: CANVAS_WIDTH,
        canvas_height: CANVAS_HEIGHT,
        strokes: strokes,
        actionHistory: [...actionHistory],
        created_at: new Date().toISOString()
    };

    // Save to localStorage
    const savedDrawings = JSON.parse(localStorage.getItem('tatepaint_drawings') || '[]');
    savedDrawings.push(drawingData);
    localStorage.setItem('tatepaint_drawings', JSON.stringify(savedDrawings));

    // Also download as JSON file
    const dataStr = JSON.stringify(drawingData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${drawingData.id}.json`;
    link.click();
    URL.revokeObjectURL(url);

    console.log('Drawing saved:', drawingData);

    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Clear drawing state
    strokes = [];
    actionHistory = [];
    undoStack = [];
    redoStack = [];
    saveCanvasState();
    updateUndoRedoButtons();
    
    // Close overlay
    saveOverlay.classList.remove('show');
    
    alert('Drawing saved successfully!');
    });
}

// Replay functionality (exported for use in view.html)
// Define the function and assign to window immediately
window.replayDrawing = async function(actionHistory, targetCanvas, targetCtx, targetWidth, targetHeight) {
    console.log('replayDrawing called with:', {
        actionHistoryLength: actionHistory?.length,
        canvasWidth: targetWidth,
        canvasHeight: targetHeight
    });
    
    if (!actionHistory || actionHistory.length === 0) {
        console.warn('No action history to replay');
        return;
    }

    // Clear canvas
    targetCtx.fillStyle = 'white';
    targetCtx.fillRect(0, 0, targetWidth, targetHeight);

    // Sort actions by timestamp to ensure chronological order
    const sortedActions = [...actionHistory].sort((a, b) => a.timestamp - b.timestamp);
    
    // Flatten all actions including individual stroke points for smooth animation
    const allActions = [];
    
    for (const action of sortedActions) {
        if (action.type === 'stroke' && action.stroke && action.stroke.length > 0) {
            // For strokes, add each point as a separate action for smooth animation
            action.stroke.forEach((point) => {
                allActions.push({
                    type: 'stroke_point',
                    timestamp: point.timestamp,
                    point: point
                });
            });
        } else {
            // For other actions, add them as-is
            allActions.push(action);
        }
    }
    
    if (allActions.length === 0) {
        console.warn('No actions to replay after processing');
        return;
    }
    
    // Re-sort all actions (including individual stroke points) by timestamp
    allActions.sort((a, b) => a.timestamp - b.timestamp);
    
    // Calculate time compression: condense entire timeline to exactly 30 seconds
    const firstActionTime = allActions[0].timestamp;
    const lastActionTime = allActions[allActions.length - 1].timestamp;
    const actualDuration = lastActionTime - firstActionTime;
    const targetDuration = 30000; // 30 seconds in milliseconds
    const timeRatio = actualDuration > 0 ? targetDuration / actualDuration : 1;
    
    // If all actions happen at same time, distribute evenly over 30 seconds
    const evenDistributionDelay = actualDuration === 0 && allActions.length > 1 
        ? targetDuration / (allActions.length - 1)
        : 0;
    
    const replayStartTime = Date.now();
    
    // Replay all actions in chronological order with smooth animation
    for (let i = 0; i < allActions.length; i++) {
        const action = allActions[i];
        
        // Calculate delay based on compressed timeline
        if (i > 0) {
            let delay;
            if (actualDuration === 0) {
                // All actions at same time - distribute evenly
                delay = evenDistributionDelay;
            } else {
                // Normal time compression
                const originalDelay = action.timestamp - allActions[i - 1].timestamp;
                delay = originalDelay * timeRatio;
            }
            await new Promise(resolve => setTimeout(resolve, Math.max(1, delay)));
        }
        
        // Execute action based on type
        if (action.type === 'stroke_point') {
            // Draw individual stroke point for smooth animation
            const point = action.point;
            targetCtx.fillStyle = point.colour_applied || '#000000';
            const size = point.pen_size || 4;
            targetCtx.fillRect(
                point.x_coord - size / 2,
                point.y_coord - size / 2,
                size,
                size
            );
        } else {
            switch (action.type) {
                case 'tool_change':
                    // Apply tool change
                    break;
                
                case 'color_change':
                    // Color changes are handled per stroke point
                    break;
                
                case 'brush_size_change':
                    // Size changes are handled per stroke point
                    break;
                
                case 'fill':
                    // Use a local flood fill function for the target canvas
                    if (window.floodFillOnCanvas) {
                        window.floodFillOnCanvas(action.x_coord, action.y_coord, action.colour_applied, targetCtx, targetWidth, targetHeight);
                    }
                    break;
            }
        }
    }
    
    // Ensure the animation takes exactly 30 seconds by waiting for remaining time
    const elapsedTime = Date.now() - replayStartTime;
    const remainingTime = targetDuration - elapsedTime;
    if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
    }
};

// Helper function for flood fill on any canvas
function floodFillOnCanvas(startX, startY, fillColor, targetCtx, canvasWidth, canvasHeight) {
    const imageData = targetCtx.getImageData(0, 0, canvasWidth, canvasHeight);
    const pixels = imageData.data;
    
    const startPos = (startY * canvasWidth + startX) * 4;
    const startR = pixels[startPos];
    const startG = pixels[startPos + 1];
    const startB = pixels[startPos + 2];
    
    const fillRgb = hexToRgb(fillColor);
    
    // Early exit if already filled with target color
    if (startR === fillRgb.r && startG === fillRgb.g && startB === fillRgb.b) {
        return;
    }
    
    // Use Uint8Array for visited tracking
    const visited = new Uint8Array(canvasWidth * canvasHeight);
    const getKey = (x, y) => y * canvasWidth + x;
    
    const stack = [[startX, startY]];
    
    while (stack.length > 0) {
        const [x, y] = stack.pop();
        
        if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) continue;
        
        const key = getKey(x, y);
        if (visited[key]) continue;
        
        const pos = key * 4;
        const r = pixels[pos];
        const g = pixels[pos + 1];
        const b = pixels[pos + 2];
        
        if (r !== startR || g !== startG || b !== startB) continue;
        
        visited[key] = 1;
        pixels[pos] = fillRgb.r;
        pixels[pos + 1] = fillRgb.g;
        pixels[pos + 2] = fillRgb.b;
        pixels[pos + 3] = 255;
        
        stack.push([x + 1, y]);
        stack.push([x - 1, y]);
        stack.push([x, y + 1]);
        stack.push([x, y - 1]);
    }
    
    targetCtx.putImageData(imageData, 0, 0);
}

// Export helper functions
window.floodFillOnCanvas = floodFillOnCanvas;
window.hexToRgb = hexToRgb;

// Reposition overlays and recalculate canvas on window resize (only on main page)
if (isMainPage) {
    let resizeTimeout;
    window.addEventListener('resize', () => {
        // Debounce resize events
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Recalculate canvas size
            calculateCanvasSize();
            
            // Reposition overlays if they're visible
            if (currentTool === 'pen' && penOverlay && penOverlay.classList.contains('show')) {
                positionOverlayForTool('pen');
            } else if (currentTool === 'fill' && colorOverlay && colorOverlay.classList.contains('show')) {
                positionOverlayForTool('fill');
            } else if (currentTool === 'eraser' && eraserOverlay && eraserOverlay.classList.contains('show')) {
                positionOverlayForTool('eraser');
            } else if (saveOverlay && saveOverlay.classList.contains('show')) {
                positionSaveOverlay();
            }
        }, 100);
    });

    // Initialize - show pen overlay by default
    showPenOverlay();

    console.log('TatePaint initialized');
    console.log(`Canvas size: ${CANVAS_WIDTH}x${CANVAS_HEIGHT}`);
    console.log(`Pen size: ${PEN_SIZE}px`);
} else {
    console.log('TatePaint script loaded (gallery mode)');
}
