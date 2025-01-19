const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const setupWebSocket = require('./utils/websocket');
const routes = require('./routes/routes');
const expressLayouts = require('express-ejs-layouts'); // Add this for layouts support

const app = express();
const server = http.createServer(app);


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

app.locals.broadcastEvent = (event) => { 
    wss.broadcast([event]);
};


const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost'; // Use 'localhost' for local development, and '0.0.0.0' for production

server.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});
