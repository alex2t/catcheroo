const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const { WebSocketServer } = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine and layouts
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory events
let events = [];

// Route for /listener
app.get('/listener', (req, res) => {
    res.render('listener', { events });
});

// WebSocket server
const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    ws.send(JSON.stringify(events));
});

// POST route
// Handle incoming events via POST request
app.post('/listener', (req, res) => {
    const activity = req.body.activity || 'Unknown';
    const data = { ...req.body };
    delete data.activity;

    // Add a response field (you can adjust this as needed)
    const response = 'Success'; // This is just an example response

    // Add the new event at the beginning of the events array
    const newEvent = {
        activity,
        data: JSON.stringify(data, null, 2),
        response, // Add the response field
    };
    events.unshift(newEvent);

    // Broadcast the new event to all connected WebSocket clients
    wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify([newEvent]));
        }
    });

    res.status(200).send({ message: 'Event received' });
});

