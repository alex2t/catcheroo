const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const setupWebSocket = require('./utils/websocket');
const authRoutes = require('./routes/registration');
const eventListenerRoutes = require('./routes/eventlistener');

const expressLayouts = require('express-ejs-layouts');

const app = express();
const server = http.createServer(app);

// Set up EJS for templating
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(expressLayouts);
app.set('layout', 'layout');

// Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));



app.use(passport.initialize());


// Routes

app.use('/', authRoutes);
app.use('/', eventListenerRoutes);

// Set up WebSocket server
const wss = setupWebSocket(server);

wss.on('connection', (ws) => {
    console.log('New client connected');

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
