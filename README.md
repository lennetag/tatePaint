# TatePaint 🎨

A lightweight, minimalist drawing application that runs entirely in your browser.

## Features

- **Simple Drawing Interface**: Clean canvas-focused design
- **Color Palette**: 9 beautiful colors plus eraser
  - Black & White
  - Rainbow colors: Red, Orange, Yellow, Green, Blue, Purple, Pink
  - Eraser: Red cross (✕) at the bottom
  - Click any color circle to select it
  - Visual feedback shows selected color
- **Tool Selection**: Two primary tools
  - **Pen Tool**: Draw freehand with adjustable brush sizes
    - Click pen icon to activate
    - Brush size selector expands vertically below tools
    - Visual size demonstrations (circles showing actual sizes)
    - 5 sizes available: 2, 4, 8, 16, 32 pixels
    - Red circle cursor preview shows exact brush size
  - **Fill Tool**: Flood fill any enclosed area
    - Click fill icon to activate
    - Click anywhere on canvas to fill with selected color
    - Uses smart flood fill algorithm
- **Drag to Draw**: Click and drag to create continuous strokes
- **Visual Cursor Preview**: Red circle follows your mouse showing exact brush size
- **Recording**: Every action is recorded with timestamp, coordinates, pen size, color, and tool type
- **Save Functionality**: Save your drawing data as a JSON file
- **Replay**: Watch your drawing being recreated stroke by stroke (including fill actions)
- **Unified Control Bar**: All controls in one cohesive panel
  - Visual divider separating colors from tools
  - Expandable brush sizes when pen tool is selected
- **Responsive Design**:
  - Desktop: Vertical control bar on the left, 1024x1024 canvas
  - Mobile: Horizontal control bar at the top, 512x1024 canvas

## Running the App

### Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Start the server:**
```bash
npm start
```

Then open your browser to: http://localhost:4000

### Alternative: Direct Browser (without server)

Simply open `index.html` in your browser. Note that some features may be limited without a server.

## Deployment

The app is ready to deploy to any Node.js hosting platform:

- **Vercel**: `vercel deploy`
- **Heroku**: `git push heroku main`
- **Railway**: Connect your GitHub repo
- **Render**: Connect your GitHub repo
- **DigitalOcean App Platform**: Connect your GitHub repo

The server uses the `PORT` environment variable, so it will work out of the box on most platforms.

## How to Use

1. **Select a Tool**: 
   - Click the **pen icon** for drawing (default)
   - Click the **fill icon** for flood fill
2. **Select a Color**: Click any color circle in the palette (or the red cross for eraser)
3. **Choose Brush Size** (pen tool only): When pen tool is selected, click a brush size (2, 4, 8, 16, or 32)
4. **Draw**: 
   - **Pen tool**: Click and drag on the canvas to draw
   - **Fill tool**: Click anywhere to fill that area
5. **Erase**: Click the red cross (✕) at the bottom of the color palette
6. **Save**: Click the "Save ✓" button, then click "Confirm Save ✓" to download your drawing
7. **Replay**: Click the "Replay ▶" button to watch your drawing being recreated

## Project Structure

```
TatePaint/
├── index.html      # Main HTML structure
├── styles.css      # All styling and animations
├── script.js       # Drawing logic and functionality
├── server.js       # Node.js server
├── package.json    # Node.js dependencies
├── .gitignore      # Git ignore rules
└── README.md       # Documentation
```

## Technical Details

- **Canvas Size**: 1024x1024 pixels (desktop), 512x1024 pixels (mobile)
- **Tools**: Pen (drawing) and Fill (flood fill)
- **Brush Sizes**: 2, 4, 8, 16, 32 pixels (multiples of 2)
- **Default Brush Size**: 4 pixels
- **Default Tool**: Pen
- **Default Color**: Black (#000000)
- **Eraser**: Uses white (#FFFFFF) to erase
- **Flood Fill**: Stack-based algorithm for efficient area filling
- **Data Format**: JSON file with timestamp, coordinates, pen size, color, tool type, and eraser state for each action

## Drawing Data Format

The saved JSON file contains:

```json
{
  "canvas_width": 1024,
  "canvas_height": 1024,
  "strokes": [
    [
      {
        "timestamp": 1703347200000,
        "x_coord": 512,
        "y_coord": 512,
        "pen_size": 4,
        "colour_applied": "#000000",
        "is_erasing": false,
        "tool": "pen"
      }
    ]
  ],
  "created_at": "2025-12-23T..."
}
```

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- ES6+ JavaScript
- Mouse and touch events

Enjoy drawing! 🎨

