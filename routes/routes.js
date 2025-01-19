const express = require('express');
const router = express.Router();
const { createClient } = require('redis');


const redisClient = createClient();
redisClient.connect().catch(console.error);

const REDIS_KEY = 'events';

// EVENT_TTL in seconds
const EVENT_TTL = 300; 

// POST: Store the event
router.post('/listener', async (req, res) => {
    try {
        const activity = req.body.activity || 'Unknown';
        const data = { ...req.body };
        delete data.activity;

        const response = 'Success';
        const eventId = `event:${Date.now()}`; 

        const newEvent = {
            id: eventId,
            activity,
            data: JSON.stringify(data, null, 2),
            response,
            timestamp: new Date().toLocaleString(),
        };

        const result = await redisClient.set(eventId, JSON.stringify(newEvent), { EX: EVENT_TTL });
        const ttl = await redisClient.ttl(eventId);
        const broadcastEvent = req.app.locals.broadcastEvent;
        broadcastEvent(newEvent);
        res.status(200).send({ message: 'Event received' });

    } catch (err) {
        console.error('Error saving event to Redis:', err);
        res.status(500).send({ error: 'Failed to save event' });
    }
});

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

        
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            res.json(events); 
        } else {
            res.render('listener', { events }); 
        }
    } catch (err) {
        console.error('Error fetching events from Redis:', err);
        res.status(500).send({ error: 'Failed to retrieve events' });
    }
});


router.delete('/listener/:id', async (req, res) => {
    try {
        const eventId = req.params.id;

        // Delete the event from Redis
        const result = await redisClient.del(eventId);

        if (result === 1) {
            console.log(`Event ${eventId} deleted from Redis`);
            const broadcastEvent = req.app.locals.broadcastEvent;
            broadcastEvent({ id: eventId, deleted: true });

            res.status(200).send({ message: 'Event deleted successfully' });
        } else {
            console.warn(`Event ${eventId} not found in Redis`);
            res.status(404).send({ error: 'Event not found' });
        }
    } catch (err) {
        console.error('Error deleting event from Redis:', err);
        res.status(500).send({ error: 'Failed to delete event' });
    }
});


module.exports = router;

