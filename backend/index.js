const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const mongoose = require('mongoose');
const Message = require('./models/Message');
require('dotenv').config();

// App Setup
const app = express();
const server = http.createServer(app);
const PORT = 4000; 

// Middleware
app.use(cors()); 
app.use(express.json()); // For parsing application/json

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jammychat';
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.IO Setup
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", 
        methods: ["GET", "POST"]
    }
});

// REST endpoint to get chat history
app.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 }).limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.get('/', (req, res) => {
    res.send('Jammy Chat server is running!');
});


io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on('send_message', async (data) => {
        const { username, content } = data;
        const message = new Message({ username, content });
        await message.save();
        io.emit('receive_message', message);
    });
    
    socket.on('disconnect', () => {
        console.log(`User Disconnected: ${socket.id}`);
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});