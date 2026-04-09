const express = require('express');
const router = express.Router();
const botEngine = require('../services/botEngine');

// Webhook for WhatsApp incoming messages 
router.post('/', async (req, res) => {
    try {
        const { from, text } = req.body;
        console.log(`Incoming message: ${from}: ${text}`);

        if (!from || !text) {
            return res.status(400).json({ error: 'Missing from/text fields' });
        }

        const responseString = await botEngine.handleIncomingMessage(from, text);
        
        // Mock response send logic (depends on WA provider)
        console.log(`Responding to ${from}: ${responseString}`);
        
        // Final response to let webhook provider know we processed it
        return res.json({ success: true, message: responseString });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
