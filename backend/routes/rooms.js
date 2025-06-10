const express = require('express');
const Room = require('../models/Room');
const router = express.Router();

// Create room
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Room name required' });
  try {
    const existing = await Room.findOne({ name });
    if (existing) return res.status(409).json({ error: 'Room already exists' });
    const room = new Room({ name });
    await room.save();
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// List rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find().sort({ createdAt: 1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

module.exports = router;
