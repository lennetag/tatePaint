// Replay functionality (used by view.html)

import { hexToRgb, floodFillOnCanvas } from './utils.js';

/**
 * Replay drawing from action history
 */
window.replayDrawing = async function(actionHistory, targetCanvas, targetCtx, targetWidth, targetHeight) {
    console.log('replayDrawing called with:', {
        actionHistoryLength: actionHistory?.length,
        canvasWidth: targetWidth,
        canvasHeight: targetHeight
    });
    
    if (!actionHistory || actionHistory.length === 0) {
        console.warn('No action history to replay');
        return;
    }

    // Clear canvas
    targetCtx.fillStyle = 'white';
    targetCtx.fillRect(0, 0, targetWidth, targetHeight);

    // Sort actions by timestamp to ensure chronological order
    const sortedActions = [...actionHistory].sort((a, b) => a.timestamp - b.timestamp);
    
    // Flatten all actions including individual stroke points for smooth animation
    const allActions = [];
    
    for (const action of sortedActions) {
        if (action.type === 'stroke' && action.stroke && action.stroke.length > 0) {
            // For strokes, add each point as a separate action for smooth animation
            action.stroke.forEach((point) => {
                allActions.push({
                    type: 'stroke_point',
                    timestamp: point.timestamp,
                    point: point
                });
            });
        } else {
            // For other actions, add them as-is
            allActions.push(action);
        }
    }
    
    if (allActions.length === 0) {
        console.warn('No actions to replay after processing');
        return;
    }
    
    // Re-sort all actions (including individual stroke points) by timestamp
    allActions.sort((a, b) => a.timestamp - b.timestamp);
    
    // Calculate time compression: condense entire timeline to exactly 30 seconds
    const firstActionTime = allActions[0].timestamp;
    const lastActionTime = allActions[allActions.length - 1].timestamp;
    const actualDuration = lastActionTime - firstActionTime;
    const targetDuration = 30000; // 30 seconds in milliseconds
    const timeRatio = actualDuration > 0 ? targetDuration / actualDuration : 1;
    
    // If all actions happen at same time, distribute evenly over 30 seconds
    const evenDistributionDelay = actualDuration === 0 && allActions.length > 1 
        ? targetDuration / (allActions.length - 1)
        : 0;
    
    const replayStartTime = Date.now();
    
    // Replay all actions in chronological order with smooth animation
    for (let i = 0; i < allActions.length; i++) {
        const action = allActions[i];
        
        // Calculate delay based on compressed timeline
        if (i > 0) {
            let delay;
            if (actualDuration === 0) {
                // All actions at same time - distribute evenly
                delay = evenDistributionDelay;
            } else {
                // Normal time compression
                const originalDelay = action.timestamp - allActions[i - 1].timestamp;
                delay = originalDelay * timeRatio;
            }
            await new Promise(resolve => setTimeout(resolve, Math.max(1, delay)));
        }
        
        // Execute action based on type
        if (action.type === 'stroke_point') {
            // Draw individual stroke point for smooth animation
            const point = action.point;
            targetCtx.fillStyle = point.colour_applied || '#000000';
            const size = point.pen_size || 4;
            targetCtx.fillRect(
                point.x_coord - size / 2,
                point.y_coord - size / 2,
                size,
                size
            );
        } else {
            switch (action.type) {
                case 'tool_change':
                    // Apply tool change
                    break;
                
                case 'color_change':
                    // Color changes are handled per stroke point
                    break;
                
                case 'brush_size_change':
                    // Size changes are handled per stroke point
                    break;
                
                case 'fill':
                    // Use a local flood fill function for the target canvas
                    if (floodFillOnCanvas) {
                        floodFillOnCanvas(action.x_coord, action.y_coord, action.colour_applied, targetCtx, targetWidth, targetHeight);
                    }
                    break;
            }
        }
    }
    
    // Ensure the animation takes exactly 30 seconds by waiting for remaining time
    const elapsedTime = Date.now() - replayStartTime;
    const remainingTime = targetDuration - elapsedTime;
    if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
    }
};

