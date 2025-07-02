import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const Chat = ({ user, onLogout }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!user?.id || !user?.username) return;

    loadMessages();
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 
      (process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : `${window.location.protocol}//${window.location.hostname}:4000`);
    
    const newSocket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });
    
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      newSocket.emit('user_connected', { 
        username: user.username, 
        userId: user.id 
      });
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    newSocket.on('receive_message', (message) => {
      if (message && message.content && message.username) {
        setMessages(prev => [...prev, message]);
      }
    });

    newSocket.on('users_online', (users) => {
      if (Array.isArray(users)) {
        setOnlineUsers(users);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || (
        process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:4000/api'
      );
      const response = await fetch(`${apiUrl}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !socket || !socket.connected) {
      return;
    }

    const messageContent = newMessage.trim();
    if (messageContent.length > 1000) {
      alert('Message is too long. Maximum 1000 characters allowed.');
      return;
    }

    const messageData = {
      username: user.username,
      content: messageContent,
      userId: user.id,
      timestamp: new Date().toISOString()
    };
    
    socket.emit('send_message', messageData);
    setNewMessage('');
  };

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return new Date().toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-black/30 backdrop-blur-sm border-r border-white/10 flex flex-col">
        {/* User Info */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-semibold">{user.username}</p>
              <p className="text-white/60 text-sm">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="mt-3 w-full bg-red-600/20 hover:bg-red-600/30 text-red-300 py-2 px-4 rounded-lg text-sm transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Online Users */}
        <div className="flex-1 p-4">
          <h3 className="text-white font-semibold mb-3">Online ({onlineUsers.length})</h3>
          <div className="space-y-2">
            {onlineUsers.map((onlineUser, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-white/80 text-sm">{onlineUser}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 p-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
            JammyChat
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-white/60 py-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.userId}-${message.timestamp}-${index}`}
                className={`flex ${message.username === user.username ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.username === user.username
                      ? 'bg-gradient-to-r from-orange-600 to-pink-600 text-white'
                      : 'bg-white/10 text-white border border-white/20'
                  }`}
                >
                  {message.username !== user.username && (
                    <p className="text-xs text-orange-300 mb-1">{message.username}</p>
                  )}
                  <p className="break-words whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-black/30 backdrop-blur-sm border-t border-white/10 p-4">
          <form onSubmit={sendMessage} className="flex space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder="Type a message..."
              maxLength={1000}
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-white/60"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || !socket?.connected}
              className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
