import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import "./App.css";

const ENDPOINT = "http://localhost:4000";
const socket = io(ENDPOINT);

function randomWalletAddress() {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let addr = "1";
  for (let i = 0; i < 33; i++) addr += chars[Math.floor(Math.random() * chars.length)];
  return addr;
}

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [wallet, setWallet] = useState(randomWalletAddress());
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetch(`${ENDPOINT}/messages`)
      .then(res => res.json())
      .then(data => setMessages(data));
  }, []);

  useEffect(() => {
    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => socket.off("receive_message");
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = { username: wallet, content: input };
    socket.emit("send_message", msg);
    setInput("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gradient-start to-gradient-end">
      <div className="chat-container">
        <div className="wallet-address">{wallet}</div>
        <div style={{ maxHeight: 400, overflowY: "auto", marginBottom: 16 }}>
          {messages.map((msg, i) => (
            <div
              key={msg._id || i}
              className={`message ${msg.username === wallet ? "sent" : "received"}`}
            >
              <div className="bubble">{msg.content}</div>
              <div style={{ fontSize: 12, color: "#ff5f6d", marginLeft: 4 }}>
                {msg.username.slice(0, 8)}...{msg.username.slice(-4)}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form className="input-bar" onSubmit={sendMessage} autoComplete="off">
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            maxLength={300}
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default App;
