const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: [true, 'Username is required'],
    maxlength: [50, 'Username cannot exceed 50 characters'],
    trim: true
  },
  content: { 
    type: String, 
    required: [true, 'Message content is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters'],
    trim: true
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'User ID is required']
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

MessageSchema.index({ timestamp: -1 });
MessageSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('Message', MessageSchema);
