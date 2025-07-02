const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const Message = require('./models/Message');
const authRoutes = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000; 

const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.netlify.app'] 
    : ['http://localhost:3000'];

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
})); 
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authRoutes);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jammychat';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    console.log('Server continuing without MongoDB connection');
  }
};

connectDB();

const io = new Server(server, {
    cors: {
        origin: corsOrigins,
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
});

app.get('/api/messages', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const messages = await Message.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
    
    res.json(messages.reverse());
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.send('Jammy Chat server is running!');
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use(errorHandler);


let onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on('user_connected', (data) => {
        try {
            const { username, userId } = data;
            
            if (!username || !userId) {
                console.log('Invalid user data received');
                return;
            }

            onlineUsers.set(userId, { username, socketId: socket.id });
            
            const usersList = Array.from(onlineUsers.values()).map(user => user.username);
            io.emit('users_online', usersList);
            
            console.log(`${username} joined the chat`);
        } catch (error) {
            console.error('Error handling user connection:', error);
        }
    });

    socket.on('send_message', async (data) => {
        try {
            const { username, content, userId, timestamp } = data;
            
            if (!username || !content || !userId) {
                console.log('Invalid message data received');
                return;
            }

            if (content.length > 1000) {
                console.log('Message too long, rejecting');
                return;
            }

            const messageData = {
                username: username.substring(0, 50),
                content: content.substring(0, 1000),
                userId,
                timestamp: timestamp || new Date().toISOString()
            };

            const message = new Message(messageData);
            await message.save();
            
            io.emit('receive_message', messageData);
        } catch (error) {
            console.error('Error saving message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });
    
    socket.on('disconnect', () => {
        try {
            for (const [userId, userData] of onlineUsers.entries()) {
                if (userData.socketId === socket.id) {
                    onlineUsers.delete(userId);
                    console.log(`${userData.username} left the chat`);
                    break;
                }
            }
            
            const usersList = Array.from(onlineUsers.values()).map(user => user.username);
            io.emit('users_online', usersList);
            
            console.log(`User Disconnected: ${socket.id}`);
        } catch (error) {
            console.error('Error handling user disconnect:', error);
        }
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
});

const gracefulShutdown = (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close((err) => {
        if (err) {
            console.error('Error during server shutdown:', err);
            process.exit(1);
        }
        console.log('Server closed');
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});