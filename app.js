const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const setupWebSocket = require('./utils/websocket');
const routes = require('./routes/routes');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const server = http.createServer(app);

// Set up EJS for templating
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(expressLayouts);
app.set('layout', 'layout');

// Middleware and routes
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/', routes);

// Set up WebSocket server
const wss = setupWebSocket(server);

wss.on('connection', (ws) => {
    console.log('New client connected');

    // Ping every 30 seconds
    const interval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
            ws.ping();
        }
    }, 30000);

    ws.on('close', () => {
        clearInterval(interval);
        console.log('Client disconnected');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

app.locals.broadcastEvent = (event) => {
    wss.broadcast([event]);
};

// Start server
const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
