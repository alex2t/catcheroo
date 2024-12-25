const express = require('express');
const router = express.Router();
const { createClient } = require('redis');

// Create a Redis client
const redisClient = createClient();
redisClient.connect().catch(console.error);

// Use a key prefix for events
const REDIS_KEY = 'events';

// TTL for events in seconds (24 hours)
const EVENT_TTL = 24 * 60 * 60; // 24 hours

// POST: Store the event
router.post('/listener', async (req, res) => {
    try {
        const activity = req.body.activity || 'Unknown';
        const data = { ...req.body };
        delete data.activity;

        const response = 'Success';

        const newEvent = {
            activity,
            data: JSON.stringify(data, null, 2),
            response,
        };

        // Generate a unique ID for the event (timestamp can be used as part of the ID)
        const eventId = `event:${Date.now()}`;

        // Store the event in Redis with a TTL of 24 hours
        await redisClient.set(eventId, JSON.stringify(newEvent), { EX: EVENT_TTL });

        // Notify WebSocket clients
        const broadcastEvent = req.app.locals.broadcastEvent;
        broadcastEvent(newEvent);

        res.status(200).send({ message: 'Event received' });
    } catch (err) {
        console.error('Error saving event to Redis:', err);
        res.status(500).send({ error: 'Failed to save event' });
    }
});

// GET: Retrieve all events
router.get('/listener', async (req, res) => {
    try {
        // Retrieve all event keys
        const keys = await redisClient.keys('event:*');

        // Fetch and parse all events
        const events = [];
        for (const key of keys) {
            const event = await redisClient.get(key);
            if (event) {
                events.push(JSON.parse(event));
            }
        }

        // Render the events
        res.render('listener', { events });
    } catch (err) {
        console.error('Error fetching events from Redis:', err);
        res.status(500).send({ error: 'Failed to retrieve events' });
    }
});

module.exports = router;

