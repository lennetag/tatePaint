// Global state and configuration management

// Check if we're on the main drawing page (index.html) or gallery page (view.html)
export const isMainPage = document.getElementById('canvas') !== null;

// State object - all mutable state
export const state = {
    // Canvas dimensions
    CANVAS_WIDTH: 1024,
    CANVAS_HEIGHT: 1024,
    
    // Drawing configuration
    PEN_SIZE: 4,
    PEN_COLOR: '#000000',
    isErasing: false,
    currentTool: 'pen',
    gridEnabled: false,
    
    // Previous pen settings
    previousPenColor: '#000000',
    previousPenSize: 4,
    
    // Drawing state
    isDrawing: false,
    strokes: [],
    currentStroke: [],
    isReplaying: false,
    lastX: 0,
    lastY: 0,
    
    // Action history
    actionHistory: [],
    
    // Undo/Redo stacks
    undoStack: [],
    redoStack: []
};

// Logical pixel grid sizes (powers of 2 for clean scaling)
export const GRID_SIZES = [256, 512, 1024, 2048, 4096];

// Canvas and UI element references
export let canvas, ctx, saveBtn, saveConfirmBtn, cursorPreview;
export let undoBtn, redoBtn, toolButtons;
export let colorOverlay, penOverlay, eraserOverlay, saveOverlay;
export let allColorCircles, brushSizeButtons;

// Initialize DOM element references
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

// Convenience getters (for backward compatibility)
export const CANVAS_WIDTH = () => state.CANVAS_WIDTH;
export const CANVAS_HEIGHT = () => state.CANVAS_HEIGHT;
export const PEN_SIZE = () => state.PEN_SIZE;
export const PEN_COLOR = () => state.PEN_COLOR;
export const isErasing = () => state.isErasing;
export const currentTool = () => state.currentTool;
export const gridEnabled = () => state.gridEnabled;
export const isDrawing = () => state.isDrawing;
export const strokes = () => state.strokes;
export const currentStroke = () => state.currentStroke;
export const isReplaying = () => state.isReplaying;
export const lastX = () => state.lastX;
export const lastY = () => state.lastY;
export const actionHistory = () => state.actionHistory;
export const undoStack = () => state.undoStack;
export const redoStack = () => state.redoStack;
