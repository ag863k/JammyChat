const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  username: { type: String, required: true },
  content: { type: String },
  room: { type: String, required: true },
  fileUrl: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
