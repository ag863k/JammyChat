const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const mongoose = require('mongoose');
const Message = require('./models/Message');
const authRoutes = require('./routes/auth');
const roomsRoutes = require('./routes/rooms');
const uploadRoutes = require('./routes/upload');
const authMiddleware = require('./middleware/auth');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// App Setup
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000; 

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'https://jammychat.netlify.app', // Add your Netlify domain
  'http://localhost:3000'
];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json()); // For parsing application/json

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jammychat';
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.IO Setup
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in environment variables');
}

// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

app.use('/api/auth', authRoutes);
app.use('/api/rooms', authMiddleware, roomsRoutes);
app.use('/api/upload', authMiddleware, uploadRoutes);
app.use('/uploads', express.static(uploadsDir));

// REST endpoint to get chat history for a room
app.get('/messages/:room', async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room }).sort({ timestamp: 1 }).limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.get('/', (req, res) => {
    res.send('Jammy Chat server is running!');
});

// Health check endpoint
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Socket.IO with rooms and auth
const users = {};

io.on('connection', (socket) => {
    socket.on('join_room', ({ room, username }) => {
        socket.join(room);
        users[socket.id] = { username, room };
        io.to(room).emit('user_joined', { username, id: socket.id });
    });
    socket.on('leave_room', () => {
        const user = users[socket.id];
        if (user) {
            socket.leave(user.room);
            io.to(user.room).emit('user_left', { username: user.username, id: socket.id });
            delete users[socket.id];
        }
    });
    socket.on('typing', (data) => {
        const user = users[socket.id];
        if (user) socket.to(user.room).emit('typing', data);
    });
    socket.on('send_message', async (data) => {
        try {
            const { username, content, room, fileUrl } = data;
            if (!username || !content && !fileUrl || (content && content.length > 300)) {
                socket.emit('error_message', { error: 'Invalid message' });
                return;
            }
            const message = new Message({ username, content, room, fileUrl });
            await message.save();
            io.to(room).emit('receive_message', message);
        } catch (err) {
            socket.emit('error_message', { error: 'Failed to send message' });
        }
    });
    // Message edit
    socket.on('edit_message', async ({ id, content, room }) => {
        try {
            if (!content.trim()) return;
            const msg = await Message.findById(id);
            if (!msg) return;
            // Only allow edit by sender or admin
            const user = users[socket.id];
            if (!user || (msg.username !== user.username && user.username !== 'admin')) return;
            msg.content = content;
            await msg.save();
            io.to(room).emit('message_edited', { id, content });
        } catch {}
    });
    socket.on('delete_message', async ({ id, room }) => {
        try {
            const msg = await Message.findById(id);
            if (!msg) return;
            const user = users[socket.id];
            if (!user || (msg.username !== user.username && user.username !== 'admin')) return;
            await msg.deleteOne();
            io.to(room).emit('message_deleted', { id });
        } catch {}
    });
    socket.on('disconnect', () => {
        const user = users[socket.id];
        if (user) {
            io.to(user.room).emit('user_left', { username: user.username, id: socket.id });
            delete users[socket.id];
        }
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});