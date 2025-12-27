// Main initialization and event handlers

import { isMainPage, state, penOverlay, colorOverlay, eraserOverlay, saveOverlay } from './state.js';
import { initializeCanvas, calculateCanvasSize } from './canvas.js';
import { setupDrawingEvents } from './drawing.js';
import { setupUndoRedo, saveCanvasState } from './undo-redo.js';
import { setupOverlays, showPenOverlay, positionOverlayForTool, positionSaveOverlay } from './overlays.js';
import { setupTools } from './tools.js';
import { setupSave } from './save.js';

/**
 * Initialize the application
 */
export function initialize() {
    if (!isMainPage) {
        console.log('TatePaint script loaded (gallery mode)');
        return;
    }

    // Setup event listeners first (they need to be ready)
    setupDrawingEvents();
    setupUndoRedo();
    setupOverlays();
    setupTools();
    setupSave();

    // Initialize canvas (this will also save initial state)
    initializeCanvas();
    
    // Save initial canvas state after a brief delay to ensure canvas is ready
    setTimeout(() => {
        if (state.undoStack.length === 0) {
            saveCanvasState();
        }
    }, 100);

    // Setup resize handler
    let resizeTimeout;
    window.addEventListener('resize', () => {
        // Debounce resize events
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Recalculate canvas size
            calculateCanvasSize();
            
            // Reposition overlays if they're visible
            if (state.currentTool === 'pen' && penOverlay && penOverlay.classList.contains('show')) {
                positionOverlayForTool('pen');
            } else if (state.currentTool === 'fill' && colorOverlay && colorOverlay.classList.contains('show')) {
                positionOverlayForTool('fill');
            } else if (state.currentTool === 'eraser' && eraserOverlay && eraserOverlay.classList.contains('show')) {
                positionOverlayForTool('eraser');
            } else if (saveOverlay && saveOverlay.classList.contains('show')) {
                positionSaveOverlay();
            }
        }, 100);
    });

    // Initialize - show pen overlay
    showPenOverlay();

    console.log('TatePaint initialized');
    console.log(`Canvas size: ${state.CANVAS_WIDTH}x${state.CANVAS_HEIGHT}`);
    console.log(`Pen size: ${state.PEN_SIZE}px`);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

