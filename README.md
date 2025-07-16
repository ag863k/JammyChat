# JammyChat 🚀

A modern, production-ready real-time chat application built with React, Node.js, Express, Socket.IO, and MongoDB featuring a beautiful dark orange/pink gradient theme.

![JammyChat](https://img.shields.io/badge/Status-Production%20Ready-success)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Real%20Time-orange)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-brightgreen)

## ✨ Features

- 🔐 **Secure Authentication** - JWT-based login and registration with bcrypt password hashing
- 💬 **Real-time Messaging** - Instant message delivery with Socket.IO
- 👥 **Online Users** - See who's currently online in real-time
- 🎨 **Modern UI** - Beautiful dark orange/pink gradient theme with glassmorphism effects
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- �️ **Security Features** - Rate limiting, input validation, CORS protection, and helmet security headers
- �🚀 **Production Ready** - Optimized for deployment with error handling and logging
- ⚡ **Performance** - Compression, caching, and optimized database queries

## 🛠️ Tech Stack

### Frontend
- **React 19.1.0** - Modern React with hooks and concurrent features
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.IO Client** - Real-time communication
- **Modern ES6+** JavaScript

### Backend  
- **Node.js & Express** - Fast, unopinionated web framework
- **Socket.IO** - Real-time bidirectional event-based communication
- **MongoDB & Mongoose** - NoSQL database with object modeling
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing and salting
- **Helmet** - Security middleware for Express
- **Rate Limiting** - Protection against abuse and DoS attacks

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/jammychat.git
   cd jammychat
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   npm start
   ```

3. **Frontend Setup** (in a new terminal)
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   # Edit .env.local with your backend URL
   npm start
   ```

4. **Access the app**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:4000

## 🌐 Deployment

### Quick Deploy Links
- **Frontend**: [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/jammychat)
- **Backend**: Deploy to [Render](https://render.com) or [Railway](https://railway.app)

### Detailed Deployment Instructions
See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for comprehensive deployment instructions.

## 📁 Project Structure

```
jammychat/
├── backend/                 # Node.js backend
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── middleware/         # Authentication middleware
│   └── index.js           # Server entry point
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   └── App.js        # Main app component
│   └── public/           # Static assets
└── docs/                 # Documentation
```

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/jammychat
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
```

### Frontend (.env.local)
```env
REACT_APP_API_URL=http://localhost:4000/api
REACT_APP_BACKEND_URL=http://localhost:4000
```

## 🎯 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/messages` | Get chat history |

## 🔌 Socket.IO Events

| Event | Description |
|-------|-------------|
| `user_connected` | User joins chat |
| `send_message` | Send message |
| `receive_message` | Receive message |
| `users_online` | Online users update |

## 🐛 Issues Fixed

✅ **Module 'dotenv' not found** - Fixed dependencies  
✅ **Port mismatch in Dockerfile** - Updated configuration  
✅ **MongoDB connection errors** - Added error handling  
✅ **Authentication not working** - Implemented complete auth system  
✅ **UI design issues** - Created modern dark theme  
✅ **Netlify deployment issues** - Fixed API routing and CORS  

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

If you encounter any issues or have questions:
- Create an [issue](https://github.com/yourusername/jammychat/issues)
- Check the [deployment guide](./DEPLOYMENT_GUIDE.md)
- Review the [fixes summary](./FIXES_SUMMARY.md)

---

**Made with ❤️ and lots of ☕**

### Git
- This project uses Git for version control. Commit your changes regularly.
