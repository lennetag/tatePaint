// Overlay management and positioning

import {
    isMainPage, colorOverlay, penOverlay, eraserOverlay, saveOverlay,
    saveBtn, state
} from './state.js';

/**
 * Close all overlays
 */
export function closeAllOverlays() {
    if (colorOverlay) colorOverlay.classList.remove('show');
    if (penOverlay) penOverlay.classList.remove('show');
    if (eraserOverlay) eraserOverlay.classList.remove('show');
    if (saveOverlay) saveOverlay.classList.remove('show');
}

/**
 * Show color picker overlay
 */
export function showColorOverlay() {
    closeAllOverlays();
    if (colorOverlay) {
        colorOverlay.classList.add('show');
        positionOverlayForTool('fill');
    }
}

/**
 * Show pen size overlay
 */
export function showPenOverlay() {
    closeAllOverlays();
    if (penOverlay && state.currentTool === 'pen') {
        penOverlay.classList.add('show');
        positionOverlayForTool('pen');
    }
}

/**
 * Show eraser size overlay
 */
export function showEraserOverlay() {
    closeAllOverlays();
    if (eraserOverlay) {
        eraserOverlay.classList.add('show');
        positionOverlayForTool('eraser');
    }
}

/**
 * Position overlay to align top row center with icon center
 */
export function positionOverlayForTool(tool) {
    const toolbar = document.getElementById('toolbar');
    if (!toolbar) return;
    
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
    
    if (!overlay) return;
    
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
        
        // After positioning, check and adjust if needed
        requestAnimationFrame(() => {
            const overlayRect = overlay.getBoundingClientRect();
            let topPos = parseFloat(overlay.style.top);
            let leftPos = parseFloat(overlay.style.left);
            
            if (topPos + overlayRect.height > window.innerHeight) {
                topPos = Math.max(2, window.innerHeight - overlayRect.height - 2);
                overlay.style.top = `${topPos}px`;
            }
            if (leftPos + overlayRect.width > window.innerWidth) {
                leftPos = Math.max(2, window.innerWidth - overlayRect.width - 2);
                overlay.style.left = `${leftPos}px`;
            }
        });
    } else {
        // Desktop: position to the right of toolbar, vertically aligned
        const overlayTop = iconCenterY - overlayPadding - (topRowHeight / 2);
        overlay.style.top = `${overlayTop}px`;
        overlay.style.left = `${toolbarRect.right + 1}px`;
        overlay.style.transform = 'none';
        
        // After positioning, check and adjust if needed
        requestAnimationFrame(() => {
            const overlayRect = overlay.getBoundingClientRect();
            let topPos = parseFloat(overlay.style.top);
            let leftPos = parseFloat(overlay.style.left);
            
            if (topPos < 2) {
                overlay.style.top = '2px';
            } else if (topPos + overlayRect.height > window.innerHeight) {
                overlay.style.top = `${Math.max(2, window.innerHeight - overlayRect.height - 2)}px`;
            }
            if (leftPos + overlayRect.width > window.innerWidth) {
                overlay.style.left = `${Math.max(2, window.innerWidth - overlayRect.width - 2)}px`;
            }
        });
    }
}

/**
 * Position save overlay
 */
export function positionSaveOverlay() {
    const toolbar = document.getElementById('toolbar');
    if (!toolbar || !saveBtn || !saveOverlay) return;
    
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
        
        // After positioning, check and adjust if needed
        requestAnimationFrame(() => {
            const overlayRect = saveOverlay.getBoundingClientRect();
            let topPos = parseFloat(saveOverlay.style.top);
            let leftPos = parseFloat(saveOverlay.style.left);
            
            if (topPos + overlayRect.height > window.innerHeight) {
                topPos = Math.max(2, window.innerHeight - overlayRect.height - 2);
                saveOverlay.style.top = `${topPos}px`;
            }
            if (leftPos + overlayRect.width > window.innerWidth) {
                leftPos = Math.max(2, window.innerWidth - overlayRect.width - 2);
                saveOverlay.style.left = `${leftPos}px`;
            }
        });
    } else {
        // Desktop: position to the right of toolbar
        const overlayTop = iconCenterY - overlayPadding - (buttonHeight / 2);
        saveOverlay.style.top = `${overlayTop}px`;
        saveOverlay.style.left = `${toolbarRect.right + 1}px`;
        saveOverlay.style.transform = 'none';
        
        // After positioning, check and adjust if needed
        requestAnimationFrame(() => {
            const overlayRect = saveOverlay.getBoundingClientRect();
            let topPos = parseFloat(saveOverlay.style.top);
            let leftPos = parseFloat(saveOverlay.style.left);
            
            if (topPos < 2) {
                saveOverlay.style.top = '2px';
            } else if (topPos + overlayRect.height > window.innerHeight) {
                saveOverlay.style.top = `${Math.max(2, window.innerHeight - overlayRect.height - 2)}px`;
            }
            if (leftPos + overlayRect.width > window.innerWidth) {
                saveOverlay.style.left = `${Math.max(2, window.innerWidth - overlayRect.width - 2)}px`;
            }
        });
    }
}

/**
 * Show save overlay
 */
export function showSaveOverlay() {
    closeAllOverlays();
    positionSaveOverlay();
    if (saveOverlay) {
        saveOverlay.classList.add('show');
    }
}

/**
 * Setup overlay event listeners
 */
export function setupOverlays() {
    if (!isMainPage) return;

    if (colorOverlay) {
        colorOverlay.addEventListener('mouseleave', () => {
            colorOverlay.classList.remove('show');
        });
    }

    if (penOverlay) {
        penOverlay.addEventListener('mouseleave', () => {
            // Only close if not drawing
            if (!state.isDrawing) {
                penOverlay.classList.remove('show');
            }
        });
    }

    if (eraserOverlay) {
        eraserOverlay.addEventListener('mouseleave', () => {
            // Only close if not drawing
            if (!state.isDrawing) {
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

// Export to window for use in other modules
window.closeAllOverlays = closeAllOverlays;

