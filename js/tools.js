// Tool selection, color selection, brush size, and cursor preview

import {
    isMainPage, toolButtons, allColorCircles, cursorPreview, canvas,
    state, colorOverlay
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
            
            console.log(`Grid snapping is now: ${state.gridEnabled ? 'enabled' : 'disabled'}`);
        });
    }

    // Cursor preview functionality
    if (canvas && cursorPreview) {
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
}

