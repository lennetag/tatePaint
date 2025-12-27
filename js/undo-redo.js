// Undo/Redo functionality

import { ctx, undoBtn, redoBtn, isMainPage, state } from './state.js';

/**
 * Save canvas state for undo/redo
 */
export function saveCanvasState() {
    const imageData = ctx.getImageData(0, 0, state.CANVAS_WIDTH, state.CANVAS_HEIGHT);
    state.undoStack.push(imageData);
    state.redoStack = []; // Clear redo stack when new action is performed
    updateUndoRedoButtons();
}

/**
 * Update undo/redo button states
 */
export function updateUndoRedoButtons() {
    if (undoBtn && redoBtn) {
        undoBtn.disabled = state.undoStack.length <= 1;
        redoBtn.disabled = state.redoStack.length === 0;
    }
}

/**
 * Undo last action
 */
export function undo() {
    if (state.undoStack.length > 1) {
        state.redoStack.push(state.undoStack.pop());
        const prevState = state.undoStack[state.undoStack.length - 1];
        ctx.putImageData(prevState, 0, 0);
        updateUndoRedoButtons();
    }
}

/**
 * Redo last undone action
 */
export function redo() {
    if (state.redoStack.length > 0) {
        const nextState = state.redoStack.pop();
        state.undoStack.push(nextState);
        ctx.putImageData(nextState, 0, 0);
        updateUndoRedoButtons();
    }
}

/**
 * Setup undo/redo event listeners
 */
export function setupUndoRedo() {
    if (isMainPage && undoBtn && redoBtn) {
        undoBtn.addEventListener('click', undo);
        redoBtn.addEventListener('click', redo);
    }
}

