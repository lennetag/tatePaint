// Tool selection, color selection, brush size, and cursor preview

import {
    isMainPage, toolButtons, allColorCircles, cursorPreview, canvas,
    state, colorOverlay, gridProjection, gridProjectionCanvas, gridProjectionCtx, ctx
} from './state.js';
import { showPenOverlay, showColorOverlay, showEraserOverlay, closeAllOverlays } from './overlays.js';

/**
 * Update color selection UI
 */
export function updateColorSelectionUI(color) {
    if (!allColorCircles) return;
    allColorCircles.forEach(c => {
        c.classList.remove('selected');
        if (c.getAttribute('data-color') === color) {
            c.classList.add('selected');
        }
    });
}

/**
 * Update brush size selection UI
 */
export function updateBrushSizeSelectionUI(size) {
    const allBrushSizeButtons = document.querySelectorAll('.brush-size-btn');
    allBrushSizeButtons.forEach(btn => {
        btn.classList.remove('selected');
        if (btn.getAttribute('data-size') === String(size)) {
            btn.classList.add('selected');
        }
    });
}

/**
 * Select tool
 */
export function selectTool(tool) {
    if (state.isReplaying) return;
    
    const previousTool = state.currentTool;
    state.currentTool = tool;
    
    // Record tool change action
    state.actionHistory.push({
        type: 'tool_change',
        timestamp: Date.now(),
        tool: tool
    });
    
    // Update tool button selection
    if (toolButtons) {
        toolButtons.forEach(btn => {
            btn.classList.remove('selected');
        });
        const selectedBtn = document.querySelector(`.tool-btn[data-tool="${tool}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
        }
    }
    
    // Handle eraser
    if (tool === 'eraser') {
        // Store current pen settings before switching to eraser (only if coming from pen)
        if (previousTool === 'pen') {
            state.previousPenColor = state.PEN_COLOR;
            state.previousPenSize = state.PEN_SIZE;
        }
        state.isErasing = true;
        state.PEN_COLOR = '#FFFFFF';
    } else {
        state.isErasing = false;
        // When switching back to pen from eraser, restore previous settings
        if (tool === 'pen' && previousTool === 'eraser') {
            state.PEN_COLOR = state.previousPenColor;
            state.PEN_SIZE = state.previousPenSize;
            // Update UI to reflect restored settings
            updateColorSelectionUI(state.previousPenColor);
            updateBrushSizeSelectionUI(state.previousPenSize);
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

/**
 * Select color
 */
export function selectColor(color) {
    if (state.isReplaying) return;
    
    state.PEN_COLOR = color;
    state.isErasing = false;
    
    // Update previous pen color if currently using pen tool
    if (state.currentTool === 'pen') {
        state.previousPenColor = color;
    }
    
    // Record color change action
    state.actionHistory.push({
        type: 'color_change',
        timestamp: Date.now(),
        color: color
    });
    
    // Update selected state for all color circles
    updateColorSelectionUI(color);
    
    // Close color overlay
    if (colorOverlay) {
        colorOverlay.classList.remove('show');
    }
    
    // If pen tool is active, show pen overlay after color selection
    if (state.currentTool === 'pen') {
        showPenOverlay();
    }
}

/**
 * Select brush size
 */
export function selectBrushSize(size) {
    if (state.isReplaying) return;
    
    state.PEN_SIZE = parseInt(size);
    
    // Update previous pen size if currently using pen tool
    if (state.currentTool === 'pen') {
        state.previousPenSize = state.PEN_SIZE;
    }
    
    // Record brush size change action
    state.actionHistory.push({
        type: 'brush_size_change',
        timestamp: Date.now(),
        size: state.PEN_SIZE
    });
    
    // Update selected state for all brush size buttons (pen and eraser overlays)
    updateBrushSizeSelectionUI(size);
    
    // Update cursor preview
    updateCursorPreview();
}

/**
 * Update cursor preview appearance
 */
export function updateCursorPreview() {
    if (!cursorPreview) return;
    
    // Remove any existing tool icons
    const bucketIcon = cursorPreview.querySelector('.bucket-icon');
    const eraserIcon = cursorPreview.querySelector('.eraser-icon');
    if (bucketIcon) bucketIcon.remove();
    if (eraserIcon) eraserIcon.remove();
    
    if (state.currentTool === 'fill') {
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
    } else if (state.currentTool === 'eraser') {
        // For eraser tool, show eraser icon above the circle preview
        cursorPreview.style.width = `${state.PEN_SIZE}px`;
        cursorPreview.style.height = `${state.PEN_SIZE}px`;
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
        cursorPreview.style.width = `${state.PEN_SIZE}px`;
        cursorPreview.style.height = `${state.PEN_SIZE}px`;
        cursorPreview.classList.remove('fill-cursor');
        cursorPreview.classList.remove('eraser-cursor');
    }
}

/**
 * Calculate average brightness of surrounding grid cells
 */
function getAverageBrightness(canvasX, canvasY, gridSize) {
    const sampleSize = gridSize;
    const halfSize = Math.floor(sampleSize / 2);
    let totalR = 0, totalG = 0, totalB = 0, count = 0;
    
    // Sample surrounding cells
    for (let dy = -halfSize; dy <= halfSize; dy += gridSize) {
        for (let dx = -halfSize; dx <= halfSize; dx += gridSize) {
            const x = canvasX + dx;
            const y = canvasY + dy;
            
            if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
                const imageData = ctx.getImageData(x, y, 1, 1);
                totalR += imageData.data[0];
                totalG += imageData.data[1];
                totalB += imageData.data[2];
                count++;
            }
        }
    }
    
    if (count === 0) return 255; // Default to white if no samples
    
    const avgR = totalR / count;
    const avgG = totalG / count;
    const avgB = totalB / count;
    
    // Calculate luminance (perceived brightness)
    return (0.299 * avgR + 0.587 * avgG + 0.114 * avgB);
}

/**
 * Update grid projection overlay
 */
function updateGridProjection(e) {
    if (!gridProjection || !gridProjectionCanvas || !gridProjectionCtx || !canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = Math.floor((e.clientX - rect.left) * scaleX);
    const canvasY = Math.floor((e.clientY - rect.top) * scaleY);
    
    // Snap to grid
    const gridSize = state.PEN_SIZE;
    const snappedX = Math.floor(canvasX / gridSize) * gridSize;
    const snappedY = Math.floor(canvasY / gridSize) * gridSize;
    
    // Calculate average brightness of surrounding cells
    const avgBrightness = getAverageBrightness(snappedX, snappedY, gridSize);
    
    // Choose grid color with good contrast
    // Use a more visible color with slight transparency for the outline
    const isDark = avgBrightness <= 128;
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)';
    const outlineColor = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)';
    
    // Calculate the screen size of one grid cell
    const screenCellSizeX = gridSize / scaleX;
    const screenCellSizeY = gridSize / scaleY;
    
    // Set overlay size to show multiple grid cells (5x5 grid with padding)
    const cellsPerSide = 5;
    const paddingScreen = 20; // padding in screen pixels
    const overlaySizeX = (cellsPerSide * screenCellSizeX) + paddingScreen;
    const overlaySizeY = (cellsPerSide * screenCellSizeY) + paddingScreen;
    
    // Set canvas size for high-DPI rendering
    const dpr = window.devicePixelRatio || 1;
    gridProjectionCanvas.width = overlaySizeX * dpr;
    gridProjectionCanvas.height = overlaySizeY * dpr;
    gridProjectionCanvas.style.width = `${overlaySizeX}px`;
    gridProjectionCanvas.style.height = `${overlaySizeY}px`;
    gridProjection.style.width = `${overlaySizeX}px`;
    gridProjection.style.height = `${overlaySizeY}px`;
    
    // Scale context for high-DPI
    gridProjectionCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    // Clear and draw grid with radial fade
    gridProjectionCtx.clearRect(0, 0, overlaySizeX, overlaySizeY);
    
    // Create radial gradient mask - keep center more visible
    const centerX = overlaySizeX / 2;
    const centerY = overlaySizeY / 2;
    const maxRadius = Math.max(overlaySizeX, overlaySizeY) / 2;
    const gradient = gridProjectionCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.7)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    // Offset for padding
    const offsetX = paddingScreen / 2;
    const offsetY = paddingScreen / 2;
    
    // Draw outline first (for contrast)
    gridProjectionCtx.strokeStyle = outlineColor;
    gridProjectionCtx.lineWidth = 3;
    
    // Draw vertical outline lines
    for (let i = 0; i <= cellsPerSide; i++) {
        const x = offsetX + (i * screenCellSizeX);
        gridProjectionCtx.beginPath();
        gridProjectionCtx.moveTo(x, offsetY);
        gridProjectionCtx.lineTo(x, overlaySizeY - offsetY);
        gridProjectionCtx.stroke();
    }
    
    // Draw horizontal outline lines
    for (let i = 0; i <= cellsPerSide; i++) {
        const y = offsetY + (i * screenCellSizeY);
        gridProjectionCtx.beginPath();
        gridProjectionCtx.moveTo(offsetX, y);
        gridProjectionCtx.lineTo(overlaySizeX - offsetX, y);
        gridProjectionCtx.stroke();
    }
    
    // Draw main grid lines on top
    gridProjectionCtx.strokeStyle = gridColor;
    gridProjectionCtx.lineWidth = 1.5;
    
    // Draw vertical lines
    for (let i = 0; i <= cellsPerSide; i++) {
        const x = offsetX + (i * screenCellSizeX);
        gridProjectionCtx.beginPath();
        gridProjectionCtx.moveTo(x, offsetY);
        gridProjectionCtx.lineTo(x, overlaySizeY - offsetY);
        gridProjectionCtx.stroke();
    }
    
    // Draw horizontal lines
    for (let i = 0; i <= cellsPerSide; i++) {
        const y = offsetY + (i * screenCellSizeY);
        gridProjectionCtx.beginPath();
        gridProjectionCtx.moveTo(offsetX, y);
        gridProjectionCtx.lineTo(overlaySizeX - offsetX, y);
        gridProjectionCtx.stroke();
    }
    
    // Apply radial fade mask
    gridProjectionCtx.globalCompositeOperation = 'destination-in';
    gridProjectionCtx.fillStyle = gradient;
    gridProjectionCtx.fillRect(0, 0, overlaySizeX, overlaySizeY);
    gridProjectionCtx.globalCompositeOperation = 'source-over';
    
    // Position overlay so the center cell aligns with the snapped grid position
    // Convert snapped canvas coordinates to screen coordinates
    const screenSnappedX = rect.left + (snappedX / scaleX);
    const screenSnappedY = rect.top + (snappedY / scaleY);
    
    // The overlay uses transform: translate(-50%, -50%), so left/top positions the center
    // The center cell (index 2) starts at: offsetX + centerCellIndex * screenCellSizeX
    const centerCellIndex = Math.floor(cellsPerSide / 2);
    const centerCellStartX = offsetX + (centerCellIndex * screenCellSizeX);
    const centerCellStartY = offsetY + (centerCellIndex * screenCellSizeY);
    
    // Offset from overlay center to center cell top-left
    const offsetFromCenterX = centerCellStartX - (overlaySizeX / 2);
    const offsetFromCenterY = centerCellStartY - (overlaySizeY / 2);
    
    // Position overlay: set center at snapped position minus the offset
    gridProjection.style.left = `${screenSnappedX - offsetFromCenterX}px`;
    gridProjection.style.top = `${screenSnappedY - offsetFromCenterY}px`;
    gridProjection.classList.add('show');
}

/**
 * Setup tool event listeners
 */
export function setupTools() {
    if (!isMainPage) return;

    // Tool selection
    if (toolButtons) {
        toolButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.getAttribute('data-tool');
                selectTool(tool);
            });
        });
    }

    // Color selection
    if (allColorCircles) {
        allColorCircles.forEach(circle => {
            circle.addEventListener('click', () => {
                const color = circle.getAttribute('data-color');
                selectColor(color);
            });
        });
    }

    // Brush size selection (event delegation)
    document.addEventListener('click', (e) => {
        if (e.target.closest('.brush-size-btn')) {
            const btn = e.target.closest('.brush-size-btn');
            const size = btn.getAttribute('data-size');
            selectBrushSize(size);
        }
    });

    // Toggle button (grid)
    const toggleBtn = document.getElementById('toggleBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (state.isReplaying) return;
            
            const currentState = toggleBtn.getAttribute('data-state');
            const newState = currentState === 'on' ? 'off' : 'on';
            toggleBtn.setAttribute('data-state', newState);
            
            // Update grid enabled state
            state.gridEnabled = newState === 'on';
            
            // Close any open overlays when toggling
            closeAllOverlays();
            
            // Hide grid projection if disabled
            if (!state.gridEnabled && gridProjection) {
                gridProjection.classList.remove('show');
            }
            
            console.log(`Grid snapping is now: ${state.gridEnabled ? 'enabled' : 'disabled'}`);
        });
    }

    // Cursor preview functionality
    if (canvas && cursorPreview) {
        canvas.addEventListener('mouseenter', () => {
            cursorPreview.style.display = 'block';
            updateCursorPreview();
            document.body.style.cursor = 'none';
        });

        canvas.addEventListener('mouseleave', () => {
            cursorPreview.style.display = 'none';
            document.body.style.cursor = 'pointer';
            // Hide grid projection when leaving canvas
            if (gridProjection) {
                gridProjection.classList.remove('show');
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            cursorPreview.style.left = `${e.clientX}px`;
            cursorPreview.style.top = `${e.clientY}px`;
            // Update grid projection if enabled
            if (state.gridEnabled && gridProjection) {
                updateGridProjection(e);
            }
        });
    }
}

