// Utility functions

import { state, ctx } from './state.js';

/**
 * Convert hex color to RGB object
 */
export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Flood fill algorithm (optimized for speed - all cells updated at once)
 */
export function floodFill(startX, startY, fillColor, targetCtx = null, canvasWidth = null, canvasHeight = null) {
    // Use provided context or default to imported ctx
    const fillCtx = targetCtx || ctx;
    if (!fillCtx) {
        console.error('Canvas context not available for flood fill');
        return;
    }
    
    const width = canvasWidth || state.CANVAS_WIDTH;
    const height = canvasHeight || state.CANVAS_HEIGHT;
    
    const imageData = fillCtx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    
    const startPos = (startY * width + startX) * 4;
    const startR = pixels[startPos];
    const startG = pixels[startPos + 1];
    const startB = pixels[startPos + 2];
    
    const fillRgb = hexToRgb(fillColor);
    
    // Early exit if already filled with target color
    if (startR === fillRgb.r && startG === fillRgb.g && startB === fillRgb.b) {
        return;
    }
    
    // Use Uint8Array for visited tracking (much faster than Set with string keys)
    const visited = new Uint8Array(width * height);
    const getKey = (x, y) => y * width + x;
    
    const stack = [[startX, startY]];
    
    // Process all pixels synchronously
    while (stack.length > 0) {
        const [x, y] = stack.pop();
        
        // Bounds check
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        
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
    fillCtx.putImageData(imageData, 0, 0);
}

/**
 * Helper function for flood fill on any canvas (exported for replay)
 */
export function floodFillOnCanvas(startX, startY, fillColor, targetCtx, canvasWidth, canvasHeight) {
    return floodFill(startX, startY, fillColor, targetCtx, canvasWidth, canvasHeight);
}

// Export to window for use in view.html
window.floodFillOnCanvas = floodFillOnCanvas;
window.hexToRgb = hexToRgb;

