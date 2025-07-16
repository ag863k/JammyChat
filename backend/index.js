const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const mongoose = require('mongoose');
const Message = require('./models/Message');
const authRoutes = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

// --- Environment validation ---
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is required in production');
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is required in production');
    process.exit(1);
  }
}

// --- CORS configuration ---
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : process.env.NODE_ENV === 'production'
    ? ['https://your-domain.netlify.app']
    : ['http://localhost:3000'];

// --- Security middleware ---
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());

// --- Rate limiting ---
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
})); 

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

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


const onlineUsers = new Map();
const userSockets = new Map();

io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('user_connected', (data) => {
        try {
            const { username, userId } = data;
            
            if (!username?.trim() || !userId) {
                socket.emit('error', { message: 'Invalid user data' });
                return;
            }

            const sanitizedUsername = username.trim().substring(0, 50);
            
            if (userSockets.has(userId)) {
                const oldSocketId = userSockets.get(userId);
                const oldSocket = io.sockets.sockets.get(oldSocketId);
                if (oldSocket) {
                    oldSocket.disconnect();
                }
            }

            onlineUsers.set(userId, { username: sanitizedUsername, socketId: socket.id });
            userSockets.set(userId, socket.id);
            
            const usersList = Array.from(onlineUsers.values()).map(user => user.username);
            io.emit('users_online', usersList);
            
            console.log(`${sanitizedUsername} joined the chat`);
        } catch (error) {
            console.error('Error handling user connection:', error);
            socket.emit('error', { message: 'Connection failed' });
        }
    });

    socket.on('send_message', async (data) => {
        try {
            const { username, content, userId, timestamp } = data;
            
            if (!username?.trim() || !content?.trim() || !userId) {
                socket.emit('error', { message: 'Invalid message data' });
                return;
            }

            if (content.trim().length > 1000) {
                socket.emit('error', { message: 'Message too long (max 1000 characters)' });
                return;
            }

            if (!onlineUsers.has(userId)) {
                socket.emit('error', { message: 'User not connected' });
                return;
            }

            const messageData = {
                username: username.trim().substring(0, 50),
                content: content.trim().substring(0, 1000),
                userId,
                timestamp: timestamp || new Date().toISOString()
            };

            const message = new Message(messageData);
            await message.save();
            
            io.emit('receive_message', {
                ...messageData,
                _id: message._id
            });
        } catch (error) {
            console.error('Error saving message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });
    
    socket.on('disconnect', () => {
        try {
            let disconnectedUser = null;
            for (const [userId, userData] of onlineUsers.entries()) {
                if (userData.socketId === socket.id) {
                    disconnectedUser = userData;
                    onlineUsers.delete(userId);
                    userSockets.delete(userId);
                    break;
                }
            }
            
            if (disconnectedUser) {
                console.log(`${disconnectedUser.username} left the chat`);
                const usersList = Array.from(onlineUsers.values()).map(user => user.username);
                io.emit('users_online', usersList);
            }
            
            console.log(`Socket disconnected: ${socket.id}`);
        } catch (error) {
            console.error('Error handling disconnect:', error);
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