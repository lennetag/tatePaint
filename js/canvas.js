// Canvas setup and sizing management

import { 
    canvas, ctx, isMainPage, 
    state, GRID_SIZES
} from './state.js';

/**
 * Calculate optimal canvas size based on viewport
 */
export function calculateCanvasSize() {
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
    
    state.CANVAS_WIDTH = logicalSize;
    state.CANVAS_HEIGHT = logicalSize;
    
    // Store previous dimensions to detect size change
    const prevWidth = canvas.width;
    const prevHeight = canvas.height;
    const hadContent = state.undoStack.length > 0;
    
    // Update canvas dimensions
    canvas.width = state.CANVAS_WIDTH;
    canvas.height = state.CANVAS_HEIGHT;
    
    // Redraw canvas if we have existing state
    if (hadContent && prevWidth > 0 && prevHeight > 0) {
        const currentState = state.undoStack[state.undoStack.length - 1];
        // If canvas size changed, we need to scale the image data
        if (currentState.width !== state.CANVAS_WIDTH || currentState.height !== state.CANVAS_HEIGHT) {
            // Create a temporary canvas to scale the image
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = currentState.width;
            tempCanvas.height = currentState.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.putImageData(currentState, 0, 0);
            
            // Clear and redraw scaled
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, state.CANVAS_WIDTH, state.CANVAS_HEIGHT);
            ctx.drawImage(tempCanvas, 0, 0, state.CANVAS_WIDTH, state.CANVAS_HEIGHT);
            
            // Update undo stack with new state
            const newImageData = ctx.getImageData(0, 0, state.CANVAS_WIDTH, state.CANVAS_HEIGHT);
            state.undoStack[state.undoStack.length - 1] = newImageData;
        } else {
            ctx.putImageData(currentState, 0, 0);
        }
    } else {
        // Initialize with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, state.CANVAS_WIDTH, state.CANVAS_HEIGHT);
    }
}

/**
 * Initialize canvas size after DOM and layout are ready
 */
export function initializeCanvas() {
    if (!isMainPage || !canvas) return;
    
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

