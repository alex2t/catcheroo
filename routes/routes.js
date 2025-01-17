const express = require('express');
const router = express.Router();
const { createClient } = require('redis');

// Create a Redis client
const redisClient = createClient();
redisClient.connect().catch(console.error);

// Use a key prefix for events
const REDIS_KEY = 'events';

// TTL for events in seconds (24 hours)
//const EVENT_TTL = 24 * 60 * 60; // 24 hours
const EVENT_TTL = 300; 

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
            timestamp: new Date().toLocaleString(),
        };

        const eventId = `event:${Date.now()}`;

        // Store the event in Redis with a TTL of 24 hours
        const result = await redisClient.set(eventId, JSON.stringify(newEvent), { EX: EVENT_TTL });
        //console.log(`Redis set result for ${eventId}: ${result}`);
        const ttl = await redisClient.ttl(eventId);
        //console.log(`TTL for ${eventId}: ${ttl}`);

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
        const keys = await redisClient.keys('event:*');
        const events = [];

        for (const key of keys) {
            const ttl = await redisClient.ttl(key);
            if (ttl > 0) { // Ensure the key has not expired
                const event = await redisClient.get(key);
                if (event) {
                    events.push(JSON.parse(event));
                }
            } else {
                console.warn(`Skipping expired or invalid key: ${key}`);
            }
        }
        
        console.log("event "+JSON.stringify(events, null, 2));


        res.render('listener', { events });
    } catch (err) {
        console.error('Error fetching events from Redis:', err);
        res.status(500).send({ error: 'Failed to retrieve events' });
    }
});


module.exports = router;

