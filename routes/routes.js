// routes.js
const express = require('express');
const router = express.Router();

let events = []; // Store events in memory (or move to a database if needed)

router.post('/listener', (req, res) => {
    const activity = req.body.activity || 'Unknown';
    const data = { ...req.body };
    delete data.activity;

    const response = 'Success';

    const newEvent = {
        activity,
        data: JSON.stringify(data, null, 2),
        response,
    };
    events.unshift(newEvent);

    // Notify WebSocket clients
    const broadcastEvent = req.app.locals.broadcastEvent;
    broadcastEvent(newEvent);

    res.status(200).send({ message: 'Event received' });
});
router.get('/listener', (req, res) => {
    res.render('listener', { events }); // Render events for GET /listener
});
module.exports = router;
