# JammyChat

# JammyChat

A real-time chat application using React, Tailwind CSS, Node.js, Express, Socket.IO, and MongoDB.

## Features
- Real-time messaging with Socket.IO
- User authentication (JWT)
- Multiple chat rooms
- File upload support
- Message edit/delete functionality
- Admin controls
- Typing indicators
- User notifications
- Modern UI with Tailwind CSS
- Wallet-style address display
- Avatar generation

## Project Structure
- `backend/` — Node.js + Express + Socket.IO server
- `frontend/` — React + Tailwind CSS client

## Getting Started

### Backend
1. Copy `.env.example` to `.env` and configure your environment variables
2. Run `npm install` in `backend/`
3. Start the server: `npm run dev` for development or `npm start` for production

### Frontend
1. Copy `.env.example` to `.env` and set your backend URL
2. Run `npm install` in `frontend/`
3. Start the client: `npm start` for development or `npm run build` for production

### Environment Variables

Check the `.env.example` files in both `backend/` and `frontend/` directories for required environment variables.

## Deployment

The application is configured for deployment on:
- Backend: Render.com or similar Node.js hosting
- Frontend: Netlify.com or similar static hosting

Make sure to set the appropriate environment variables in your hosting platform.

### Git
- This project uses Git for version control. Commit your changes regularly.
