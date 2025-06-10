# JammyChat - Real-time Chat Application

A modern real-time chat application built with React, Node.js, Express, Socket.IO, and MongoDB.

## Features

- 🔐 **User Authentication** - Secure login and registration
- 💬 **Real-time Messaging** - Instant message delivery with Socket.IO
- 👥 **Online Users** - See who's currently online
- 🎨 **Modern UI** - Beautiful dark orange/pink gradient theme
- 📱 **Responsive Design** - Works on desktop and mobile
- 🚀 **Production Ready** - Optimized for deployment

## Tech Stack

### Frontend
- React 19.1.0
- Socket.IO Client
- Tailwind CSS
- Modern ES6+ JavaScript

### Backend
- Node.js
- Express.js
- Socket.IO
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jammychat
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Setup**
   
   Create `.env` file in backend directory:
   ```env
   PORT=4000
   MONGODB_URI=mongodb://localhost:27017/jammychat
   JWT_SECRET=your-super-secret-jwt-key
   NODE_ENV=development
   ```

   Create `.env.local` file in frontend directory:
   ```env
   REACT_APP_API_URL=http://localhost:4000/api
   REACT_APP_BACKEND_URL=http://localhost:4000
   ```

5. **Start the Application**
   
   Terminal 1 (Backend):
   ```bash
   cd backend
   npm run dev
   ```
   
   Terminal 2 (Frontend):
   ```bash
   cd frontend
   npm start
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000

## Deployment

### Backend Deployment (Render/Railway/Heroku)

1. **Environment Variables**
   Set these environment variables in your hosting platform:
   ```
   PORT=10000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jammychat
   JWT_SECRET=your-production-secret-key
   NODE_ENV=production
   ```

2. **MongoDB Atlas Setup**
   - Create a MongoDB Atlas account
   - Create a new cluster
   - Add your connection string to MONGODB_URI
   - Whitelist your server's IP address

### Frontend Deployment (Netlify)

1. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `build`

2. **Environment Variables**
   Set these in Netlify dashboard:
   ```
   REACT_APP_API_URL=https://your-backend-url.com/api
   REACT_APP_BACKEND_URL=https://your-backend-url.com
   ```

3. **Redirects Configuration**
   The `netlify.toml` file is already configured for proper routing.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Messages
- `GET /api/messages` - Get chat history

### Socket.IO Events
- `user_connected` - User joins chat
- `send_message` - Send message
- `receive_message` - Receive message
- `users_online` - Get online users list

## Project Structure

```
jammychat/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   └── Message.js
│   ├── routes/
│   │   └── auth.js
│   ├── middleware/
│   │   └── auth.js
│   ├── index.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   └── Chat.js
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   └── package.json
└── README.md
```

## Fixed Issues

✅ **Module 'dotenv' not found** - Fixed by proper npm install
✅ **Port mismatch in Dockerfile** - Updated to use PORT 4000
✅ **MongoDB connection errors** - Added error handling and fallback
✅ **Authentication not working** - Implemented complete auth system
✅ **UI design issues** - Created modern dark orange/pink theme
✅ **Netlify deployment issues** - Fixed API routing and CORS
✅ **Socket.IO connection problems** - Updated CORS configuration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

If you encounter any issues or have questions, please create an issue in the repository.
