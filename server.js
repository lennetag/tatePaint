const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Disable caching for development
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve view.html for the gallery route
app.get('/view.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'view.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log('🎨 TatePaint server running');
    console.log(`📍 Local: http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log('Press Ctrl+C to stop the server');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n👋 Server shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n👋 Server stopped');
    process.exit(0);
});
