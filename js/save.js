// Save functionality

import {
    isMainPage, saveBtn, saveConfirmBtn, saveOverlay,
    ctx, state
} from './state.js';
import { showSaveOverlay } from './overlays.js';
import { saveCanvasState } from './undo-redo.js';
import { updateUndoRedoButtons } from './undo-redo.js';

/**
 * Save drawing
 */
export function saveDrawing() {
    if (state.isReplaying) return;
    
    const drawingData = {
        id: `drawing_${Date.now()}`,
        canvas_width: state.CANVAS_WIDTH,
        canvas_height: state.CANVAS_HEIGHT,
        strokes: state.strokes,
        actionHistory: [...state.actionHistory],
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
    ctx.fillRect(0, 0, state.CANVAS_WIDTH, state.CANVAS_HEIGHT);
    
    // Clear drawing state
    state.strokes = [];
    state.actionHistory = [];
    state.undoStack = [];
    state.redoStack = [];
    saveCanvasState();
    updateUndoRedoButtons();
    
    // Close overlay
    if (saveOverlay) {
        saveOverlay.classList.remove('show');
    }
    
    alert('Drawing saved successfully!');
}

/**
 * Setup save event listeners
 */
export function setupSave() {
    if (!isMainPage) return;

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (state.isReplaying) return;
            showSaveOverlay();
        });
    }

    if (saveConfirmBtn) {
        saveConfirmBtn.addEventListener('click', saveDrawing);
    }
}

