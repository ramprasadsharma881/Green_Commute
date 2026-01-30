import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import db from './database/db.js';
import { nanoid } from 'nanoid';

let io;

export function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:8080',
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId}`);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Join conversation
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, recipientId, message, messageType = 'text' } = data;

        // Save message to database
        const messageId = nanoid();
        db.prepare(`
          INSERT INTO chat_messages (id, conversation_id, sender_id, recipient_id, message, message_type)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(messageId, conversationId, socket.userId, recipientId, message, messageType);

        // Update conversation
        db.prepare(`
          UPDATE conversations
          SET last_message = ?, last_message_at = CURRENT_TIMESTAMP,
              unread_count_p2 = unread_count_p2 + 1
          WHERE id = ?
        `).run(message, conversationId);

        const messageData = {
          id: messageId,
          conversationId,
          senderId: socket.userId,
          recipientId,
          message,
          messageType,
          isRead: false,
          createdAt: new Date().toISOString(),
        };

        // Emit to conversation room
        io.to(`conversation:${conversationId}`).emit('new_message', messageData);

        // Emit to recipient's personal room (for notifications)
        io.to(`user:${recipientId}`).emit('message_notification', {
          conversationId,
          senderId: socket.userId,
          message,
        });

        socket.emit('message_sent', { messageId, success: true });
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('message_error', { error: error.message });
      }
    });

    // Mark messages as read
    socket.on('mark_read', async (data) => {
      try {
        const { conversationId } = data;

        db.prepare(`
          UPDATE chat_messages
          SET is_read = 1
          WHERE conversation_id = ? AND recipient_id = ?
        `).run(conversationId, socket.userId);

        db.prepare(`
          UPDATE conversations
          SET unread_count_p2 = 0
          WHERE id = ? AND participant2_id = ?
        `).run(conversationId, socket.userId);

        io.to(`conversation:${conversationId}`).emit('messages_read', {
          conversationId,
          userId: socket.userId,
        });
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // Typing indicator
    socket.on('typing_start', (data) => {
      const { conversationId, recipientId } = data;
      io.to(`user:${recipientId}`).emit('user_typing', {
        conversationId,
        userId: socket.userId,
      });
    });

    socket.on('typing_stop', (data) => {
      const { conversationId, recipientId } = data;
      io.to(`user:${recipientId}`).emit('user_stopped_typing', {
        conversationId,
        userId: socket.userId,
      });
    });

    // Location sharing
    socket.on('share_location', (data) => {
      const { conversationId, recipientId, location } = data;
      io.to(`user:${recipientId}`).emit('location_shared', {
        conversationId,
        senderId: socket.userId,
        location,
      });
    });

    // Join ride room for live tracking
    socket.on('join:ride', (data) => {
      const { rideId } = data;
      socket.join(`ride:${rideId}`);
      console.log(`📍 User ${socket.userId} joined ride ${rideId} for live tracking`);
    });

    // Live location updates for drivers
    socket.on('location:update', async (data) => {
      try {
        const { rideId, lat, lng } = data;
        
        // Store location in database (optional for history)
        db.prepare(`
          INSERT OR REPLACE INTO live_locations (id, ride_id, user_id, latitude, longitude, updated_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(nanoid(), rideId, socket.userId, lat, lng);

        // Broadcast to all users in the ride room
        io.to(`ride:${rideId}`).emit('driver:location', {
          driverId: socket.userId,
          lat,
          lng,
          timestamp: new Date().toISOString(),
        });

        console.log(`📍 Location update: User ${socket.userId} in ride ${rideId}`);
      } catch (error) {
        console.error('Location update error:', error);
      }
    });

    // Ride updates
    socket.on('ride_update', (data) => {
      const { rideId, update } = data;
      io.to(`ride:${rideId}`).emit('ride_status_update', {
        rideId,
        update,
        timestamp: new Date().toISOString(),
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
    });
  });

  console.log('✅ Socket.IO initialized');
  return io;
}

// Emit notification to specific user
export function emitNotification(userId, notification) {
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification);
  }
}

// Emit to ride room
export function emitToRide(rideId, event, data) {
  if (io) {
    io.to(`ride:${rideId}`).emit(event, data);
  }
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}
