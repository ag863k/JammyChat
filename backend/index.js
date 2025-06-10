const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const mongoose = require('mongoose');
const Message = require('./models/Message');
const authRoutes = require('./routes/auth');
require('dotenv').config();

// App Setup
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000; 

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-netlify-domain.netlify.app'],
  credentials: true
})); 
app.use(express.json()); // For parsing application/json

// Routes
app.use('/api/auth', authRoutes);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jammychat';
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    // Continue running the server even if MongoDB fails
    console.log('Server continuing without MongoDB connection');
  });

// Socket.IO Setup
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "https://your-netlify-domain.netlify.app"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

// REST endpoint to get chat history
app.get('/api/messages', async (req, res) => {
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


// Socket.IO connection handling
let onlineUsers = new Map(); // userId -> {username, socketId}

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on('user_connected', (data) => {
        const { username, userId } = data;
        onlineUsers.set(userId, { username, socketId: socket.id });
        
        // Broadcast updated online users list
        const usersList = Array.from(onlineUsers.values()).map(user => user.username);
        io.emit('users_online', usersList);
        
        console.log(`${username} joined the chat`);
    });

    socket.on('send_message', async (data) => {
        try {
            const { username, content, userId } = data;
            const message = new Message({ 
                username, 
                content, 
                userId,
                timestamp: new Date()
            });
            await message.save();
            io.emit('receive_message', message);
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });
    
    socket.on('disconnect', () => {
        // Find and remove the disconnected user
        for (const [userId, userData] of onlineUsers.entries()) {
            if (userData.socketId === socket.id) {
                onlineUsers.delete(userId);
                console.log(`${userData.username} left the chat`);
                break;
            }
        }
        
        // Broadcast updated online users list
        const usersList = Array.from(onlineUsers.values()).map(user => user.username);
        io.emit('users_online', usersList);
        
        console.log(`User Disconnected: ${socket.id}`);
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});