// Gallery functionality
const galleryContainer = document.getElementById('galleryContainer');
const emptyGallery = document.getElementById('emptyGallery');

// Load and display all saved drawings
function loadDrawings() {
    const savedDrawings = JSON.parse(localStorage.getItem('tatepaint_drawings') || '[]');
    
    if (savedDrawings.length === 0) {
        galleryContainer.style.display = 'none';
        emptyGallery.style.display = 'flex';
        return;
    }

    galleryContainer.style.display = 'grid';
    emptyGallery.style.display = 'none';
    galleryContainer.innerHTML = '';
    
    savedDrawings.forEach((drawing, index) => {
        createDrawingFrame(drawing, index);
    });
}

function createDrawingFrame(drawing, index) {
    // Create picture frame container
    const frame = document.createElement('div');
    frame.className = 'drawing-frame';
    frame.dataset.drawingId = drawing.id;
    
    // Create canvas for this drawing
    const canvas = document.createElement('canvas');
    canvas.width = drawing.canvas_width;
    canvas.height = drawing.canvas_height;
    const ctx = canvas.getContext('2d');
    
    // Initialize canvas with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, drawing.canvas_width, drawing.canvas_height);
    
    // Create delete button (cross)
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '✕';
    deleteBtn.title = 'Delete drawing';
    deleteBtn.setAttribute('aria-label', 'Delete drawing');
    
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteDrawing(drawing.id);
    });
    
    // Create drawing info
    const info = document.createElement('div');
    info.className = 'drawing-info';
    const date = new Date(drawing.created_at);
    info.innerHTML = `
        <span class="drawing-date">Created: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span>
    `;
    
    frame.appendChild(canvas);
    frame.appendChild(deleteBtn);
    frame.appendChild(info);
    galleryContainer.appendChild(frame);
    
    // Start replay loop for this drawing
    // Wait for script.js to load and DOM to be ready
    const startReplay = () => {
        if (drawing.actionHistory && drawing.actionHistory.length > 0) {
            console.log(`Starting replay for drawing ${drawing.id} with ${drawing.actionHistory.length} actions`);
            replayLoop(canvas, ctx, drawing);
        } else if (drawing.strokes && drawing.strokes.length > 0) {
            // Fallback: if no actionHistory, render strokes statically
            console.log(`Rendering static strokes for drawing ${drawing.id}`);
            renderStrokes(ctx, drawing);
        } else {
            console.warn(`No replay data for drawing ${drawing.id}`);
        }
    };
    
    // Wait for replayDrawing function to be available
    if (window.replayDrawing) {
        startReplay();
    } else {
        // Poll for function availability
        let attempts = 0;
        const checkFunction = setInterval(() => {
            attempts++;
            if (window.replayDrawing) {
                clearInterval(checkFunction);
                startReplay();
            } else if (attempts > 50) {
                // Give up after 5 seconds
                clearInterval(checkFunction);
                console.error('replayDrawing function not available after 5 seconds');
                if (drawing.strokes && drawing.strokes.length > 0) {
                    renderStrokes(ctx, drawing);
                }
            }
        }, 100);
    }
}

async function replayLoop(canvas, ctx, drawing) {
    console.log(`Replay loop started for drawing ${drawing.id}`);
    
    while (true) {
        // Check if the drawing still exists in the DOM
        const frame = document.querySelector(`[data-drawing-id="${drawing.id}"]`);
        if (!frame) {
            // Drawing was deleted, stop the loop
            console.log(`Drawing ${drawing.id} deleted, stopping replay`);
            break;
        }
        
        // Clear canvas before replay
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, drawing.canvas_width, drawing.canvas_height);
        
        // Replay the drawing using the exported function
        try {
            console.log(`Replaying drawing ${drawing.id}...`);
            await window.replayDrawing(
                drawing.actionHistory,
                canvas,
                ctx,
                drawing.canvas_width,
                drawing.canvas_height
            );
            console.log(`Replay completed for drawing ${drawing.id}`);
        } catch (error) {
            console.error('Replay error for drawing', drawing.id, ':', error);
            console.error('Error stack:', error.stack);
            // Fallback to static rendering if replay fails
            renderStrokes(ctx, drawing);
            break;
        }
        
        // Small delay before looping
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// Fallback rendering for drawings without actionHistory
function renderStrokes(ctx, drawing) {
    drawing.strokes.forEach(stroke => {
        stroke.forEach(point => {
            ctx.fillStyle = point.colour_applied || '#000000';
            const size = point.pen_size || 4;
            ctx.fillRect(
                point.x_coord - size / 2,
                point.y_coord - size / 2,
                size,
                size
            );
        });
    });
}

function deleteDrawing(drawingId) {
    if (confirm('Are you sure you want to delete this drawing?')) {
        const savedDrawings = JSON.parse(localStorage.getItem('tatepaint_drawings') || '[]');
        const filtered = savedDrawings.filter(d => d.id !== drawingId);
        localStorage.setItem('tatepaint_drawings', JSON.stringify(filtered));
        
        // Remove the frame from DOM
        const frame = document.querySelector(`[data-drawing-id="${drawingId}"]`);
        if (frame) {
            frame.style.transform = 'scale(0)';
            frame.style.opacity = '0';
            setTimeout(() => {
                frame.remove();
                
                // Check if gallery is now empty
                if (filtered.length === 0) {
                    galleryContainer.style.display = 'none';
                    emptyGallery.style.display = 'flex';
                }
            }, 300);
        }
    }
}

// Load drawings when page loads
loadDrawings();

