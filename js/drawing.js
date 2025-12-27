// Drawing logic, interpolation, and grid snapping

import {
    canvas, ctx, isMainPage, state
} from './state.js';
import { floodFill } from './utils.js';
import { saveCanvasState } from './undo-redo.js';

/**
 * Grid snapping function - snaps coordinates to grid subdivisions based on PEN_SIZE
 */
export function snapToGrid(x, y) {
    if (!state.gridEnabled) {
        return { x, y };
    }
    // Grid cell size equals PEN_SIZE
    const gridSize = state.PEN_SIZE;
    // Snap to top-left corner of the grid cell containing the point
    // Use Math.floor to always snap to the cell that contains the click
    const snappedX = Math.floor(x / gridSize) * gridSize;
    const snappedY = Math.floor(y / gridSize) * gridSize;
    return { x: snappedX, y: snappedY };
}

/**
 * Helper function to interpolate points between two coordinates
 */
export function interpolatePoints(x0, y0, x1, y1) {
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

/**
 * Start drawing
 */
export function startDrawing(e) {
    if (state.isReplaying) return;
    
    // Close overlays when starting to draw
    if (window.closeAllOverlays) {
        window.closeAllOverlays();
    }
    
    const rect = canvas.getBoundingClientRect();
    // Scale from screen coordinates to canvas coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x = Math.floor((e.clientX - rect.left) * scaleX);
    let y = Math.floor((e.clientY - rect.top) * scaleY);
    
    // Apply grid snapping if enabled
    const snapped = snapToGrid(x, y);
    x = snapped.x;
    y = snapped.y;
    
    if (state.currentTool === 'fill') {
        // Record fill action
        state.actionHistory.push({
            type: 'fill',
            timestamp: Date.now(),
            x_coord: x,
            y_coord: y,
            colour_applied: state.PEN_COLOR
        });
        floodFill(x, y, state.PEN_COLOR);
        saveCanvasState();
    } else {
        state.isDrawing = true;
        state.currentStroke = [];
        state.lastX = x;
        state.lastY = y;
        
        // When grid is enabled, draw immediately on click
        if (state.gridEnabled) {
            const strokeData = {
                timestamp: Date.now(),
                x_coord: x,
                y_coord: y,
                pen_size: state.PEN_SIZE,
                colour_applied: state.PEN_COLOR,
                is_erasing: state.isErasing,
                tool: state.currentTool === 'eraser' ? 'eraser' : 'pen'
            };

            state.currentStroke.push(strokeData);

            ctx.fillStyle = state.PEN_COLOR;
            // Fill the entire grid cell
            ctx.fillRect(x, y, state.PEN_SIZE, state.PEN_SIZE);
        } else {
            // Normal drawing - call draw() which will interpolate
            draw(e);
        }
    }
}

/**
 * Stop drawing
 */
export function stopDrawing() {
    if (state.isDrawing && state.currentStroke && state.currentStroke.length > 0) {
        state.strokes.push([...state.currentStroke]);
        // Record drawing stroke action (use first point's timestamp for chronological ordering)
        state.actionHistory.push({
            type: 'stroke',
            timestamp: state.currentStroke[0].timestamp,
            stroke: [...state.currentStroke]
        });
        state.currentStroke = [];
        saveCanvasState();
    }
    state.isDrawing = false;
}

/**
 * Draw on canvas
 */
export function draw(e) {
    if (!state.isDrawing || (state.currentTool !== 'pen' && state.currentTool !== 'eraser')) return;

    const rect = canvas.getBoundingClientRect();
    // Scale from screen coordinates to canvas coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x = Math.floor((e.clientX - rect.left) * scaleX);
    let y = Math.floor((e.clientY - rect.top) * scaleY);
    
    // Apply grid snapping if enabled
    const snapped = snapToGrid(x, y);
    x = snapped.x;
    y = snapped.y;
    
    // When grid is enabled, draw at grid intersections only (no interpolation needed)
    if (state.gridEnabled) {
        // Only draw if we've moved to a new grid cell
        if (x !== state.lastX || y !== state.lastY) {
            const strokeData = {
                timestamp: Date.now(),
                x_coord: x,
                y_coord: y,
                pen_size: state.PEN_SIZE,
                colour_applied: state.PEN_COLOR,
                is_erasing: state.isErasing,
                tool: state.currentTool === 'eraser' ? 'eraser' : 'pen'
            };

            state.currentStroke.push(strokeData);

            ctx.fillStyle = state.PEN_COLOR;
            // When grid is enabled, fill the entire grid cell
            ctx.fillRect(x, y, state.PEN_SIZE, state.PEN_SIZE);
            
            state.lastX = x;
            state.lastY = y;
        }
    } else {
        // Normal drawing with interpolation when grid is off
        const points = interpolatePoints(state.lastX, state.lastY, x, y);

        points.forEach(point => {
            const strokeData = {
                timestamp: Date.now(),
                x_coord: point.x,
                y_coord: point.y,
                pen_size: state.PEN_SIZE,
                colour_applied: state.PEN_COLOR,
                is_erasing: state.isErasing,
                tool: state.currentTool === 'eraser' ? 'eraser' : 'pen'
            };

            state.currentStroke.push(strokeData);

            ctx.fillStyle = state.PEN_COLOR;
            ctx.fillRect(point.x - state.PEN_SIZE / 2, point.y - state.PEN_SIZE / 2, state.PEN_SIZE, state.PEN_SIZE);
        });

        state.lastX = x;
        state.lastY = y;
    }
}

/**
 * Setup drawing event listeners
 */
export function setupDrawingEvents() {
    if (!isMainPage || !canvas) return;

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    // Touch events for mobile
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
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

