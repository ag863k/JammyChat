import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import "./App.css";

const ENDPOINT = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getAvatarUrl(username) {
  // Use DiceBear Avatars API for unique avatars
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(username)}`;
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || "");
  const [username, setUsername] = useState(localStorage.getItem('username') || "");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState('login');
  const [rooms, setRooms] = useState([]);
  const [room, setRoom] = useState(localStorage.getItem('room') || "general");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [typing, setTyping] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [file, setFile] = useState(null);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editInput, setEditInput] = useState("");
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const socket = useRef(null);
  const isAdmin = username === 'admin';

  // Auth
  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${ENDPOINT}/api/auth/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Auth failed');
      if (authMode === 'login') {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
      } else {
        setAuthMode('login');
        setPassword("");
        setError('Registration successful! Please log in.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch rooms
  useEffect(() => {
    if (!token) return;
    fetch(`${ENDPOINT}/api/rooms`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setRooms(data));
  }, [token]);

  // Socket and messages
  useEffect(() => {
    if (!token || !username || !room) return;
    if (socket.current) {
      socket.current.disconnect();
    }
    socket.current = io(ENDPOINT, { transports: ["websocket"], auth: { token } });
    socket.current.on("connect", () => {
      setConnected(true);
      socket.current.emit("join_room", { room, username });
    });
    socket.current.on("disconnect", () => setConnected(false));
    socket.current.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    socket.current.on("error_message", (err) => setError(err.error));
    socket.current.on("typing", (data) => {
      setTyping(data.username !== username ? `${data.username.slice(0, 8)}... is typing...` : "");
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setTyping(""), 2000);
    });
    socket.current.on("user_joined", ({ username }) => {
      setNotifications((prev) => [...prev, `${username.slice(0,8)}... joined the chat`]);
      setTimeout(() => setNotifications((prev) => prev.slice(1)), 3000);
    });
    socket.current.on("user_left", ({ username }) => {
      setNotifications((prev) => [...prev, `${username.slice(0,8)}... left the chat`]);
      setTimeout(() => setNotifications((prev) => prev.slice(1)), 3000);
    });
    socket.current.on("message_edited", ({ id, content }) => {
      setMessages((prev) => prev.map(m => m._id === id ? { ...m, content } : m));
    });
    socket.current.on("message_deleted", ({ id }) => {
      setMessages((prev) => prev.filter(m => m._id !== id));
    });
    return () => {
      if (socket.current) {
        socket.current.off();
        socket.current.disconnect();
      }
    };
  }, [token, username, room]);

  // Fetch messages for room
  useEffect(() => {
    if (!room) return;
    fetch(`${ENDPOINT}/messages/${room}`)
      .then(res => res.json())
      .then(data => setMessages(data));
    localStorage.setItem('room', room);
  }, [room]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    setError("");
    let fileUrl = null;
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch(`${ENDPOINT}/api/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'File upload failed');
        fileUrl = data.url;
      } catch (err) {
        setError(err.message);
        return;
      }
      setFile(null);
    }
    if (!input.trim() && !fileUrl) return;
    socket.current.emit("send_message", { username, content: input, room, fileUrl });
    setInput("");
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    if (socket.current) {
      socket.current.emit("typing", { username });
    }
  };

  // Message edit
  const startEdit = (msg) => {
    setEditingMsgId(msg._id);
    setEditInput(msg.content);
  };
  const saveEdit = () => {
    if (!editInput.trim()) return;
    if (socket.current) {
      socket.current.emit('edit_message', { id: editingMsgId, content: editInput, room });
    }
    setEditingMsgId(null);
    setEditInput("");
  };
  const deleteMsg = (id) => {
    if (socket.current) {
      socket.current.emit('delete_message', { id, room });
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gradient-start to-gradient-end">
        <div className="chat-container">
          <h2 style={{ color: '#ff5f6d', fontWeight: 700, fontSize: 24, marginBottom: 16 }}>JammyChat Login</h2>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit">{authMode === 'login' ? 'Login' : 'Register'}</button>
          </form>
          <button style={{ marginTop: 12, color: '#ff5f6d', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
            {authMode === 'login' ? 'No account? Register' : 'Have an account? Login'}
          </button>
          {error && <div style={{ color: '#dc2626', marginTop: 8 }}>{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gradient-start to-gradient-end">
      <div className="chat-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <img src="https://cdn-icons-png.flaticon.com/512/1384/1384031.png" alt="chat" style={{ width: 36, height: 36, borderRadius: '50%' }} />
          <span style={{ fontWeight: 700, fontSize: 24, color: '#ff5f6d' }}>JammyChat</span>
        </div>
        <div className="wallet-address">{username}{isAdmin && <span style={{ color: '#16a34a', marginLeft: 8 }}>(admin)</span>}</div>
        <div style={{ marginBottom: 8, fontSize: 13, color: connected ? '#16a34a' : '#dc2626' }}>
          {connected ? 'Connected' : 'Disconnected'}
        </div>
        <div style={{ marginBottom: 8 }}>
          <select value={room} onChange={e => setRoom(e.target.value)}>
            {rooms.map(r => <option key={r._id} value={r.name}>{r.name}</option>)}
            {!rooms.find(r => r.name === 'general') && <option value="general">general</option>}
          </select>
        </div>
        {notifications.map((note, i) => (
          <div key={i} style={{ color: '#f472b6', marginBottom: 4, fontWeight: 500 }}>{note}</div>
        ))}
        {error && <div style={{ color: '#dc2626', marginBottom: 8 }}>{error}</div>}
        <div style={{ maxHeight: 400, overflowY: "auto", marginBottom: 16 }}>
          {messages.map((msg, i) => (
            <div
              key={msg._id || i}
              className={`message ${msg.username === username ? "sent" : "received"}`}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}
            >
              <img src={getAvatarUrl(msg.username)} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
              <div style={{ flex: 1 }}>
                {editingMsgId === msg._id ? (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <input value={editInput} onChange={e => setEditInput(e.target.value)} style={{ flex: 1 }} />
                    <button onClick={saveEdit}>Save</button>
                    <button onClick={() => setEditingMsgId(null)}>Cancel</button>
                  </div>
                ) : (
                  <>
                    {msg.fileUrl && (
                      <a href={msg.fileUrl.startsWith('http') ? msg.fileUrl : ENDPOINT + msg.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#ff5f6d', textDecoration: 'underline' }}>File</a>
                    )}
                    {msg.content && <div className="bubble">{msg.content}</div>}
                  </>
                )}
                <div style={{ fontSize: 12, color: "#ff5f6d", marginLeft: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {msg.username.slice(0, 8)}...{msg.username.slice(-4)}
                  {msg.timestamp && (
                    <span style={{ marginLeft: 8, color: '#888' }}>{formatTime(msg.timestamp)}</span>
                  )}
                  {(isAdmin || msg.username === username) && !editingMsgId && (
                    <>
                      <button onClick={() => startEdit(msg)} style={{ color: '#f472b6', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>Edit</button>
                      <button onClick={() => deleteMsg(msg._id)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>Delete</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {typing && <div style={{ color: '#f472b6', marginBottom: 8 }}>{typing}</div>}
        <form className="input-bar" onSubmit={sendMessage} autoComplete="off">
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={handleInput}
            maxLength={300}
          />
          <input type="file" onChange={e => setFile(e.target.files[0])} style={{ color: '#ff5f6d', background: 'none', border: 'none' }} />
          <button type="submit">Send</button>
        </form>
        <button style={{ marginTop: 12, color: '#ff5f6d', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => { setToken(""); localStorage.clear(); }}>Logout</button>
      </div>
    </div>
  );
}

export default App;
