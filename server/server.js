// server.js - Main server file
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// Fixed doctor ID - this is the only doctor in the system
const MAIN_DOCTOR_ID = 'main_doctor';

// Store active connections
const activeUsers = new Map(); // userId -> socket
const activeChats = new Map(); // chatId -> chat object
const patientsList = new Map(); // patientId -> basic info

// Basic routes
app.get('/', (req, res) => {
  res.send('Healthcare Chat Server Running');
});

// Socket connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  const userId = socket.handshake.query.userId;
  const userType = socket.handshake.query.userType || 'patient';
  
  // Store user connection
  activeUsers.set(userId, socket);
  
  console.log(`User connected: ${userId} (${userType})`);
  
  // If this is the doctor connecting
  if (userType === 'doctor') {
    // Send list of all patients to the doctor
    const patients = Array.from(patientsList.values());
    socket.emit('patientsList', patients);
    
    // Join all existing chat rooms
    for (const [chatId, chat] of activeChats.entries()) {
      socket.join(chatId);
    }
  }
  
  // If this is a patient connecting
  if (userType === 'patient') {
    // Add patient to the list
    const patientInfo = {
      id: userId,
      chatId: `${userId}-${MAIN_DOCTOR_ID}`,
      lastMessage: '',
      unreadCount: 0
    };
    
    patientsList.set(userId, patientInfo);
    
    // Notify doctor if online
    const doctorSocket = activeUsers.get(MAIN_DOCTOR_ID);
    if (doctorSocket) {
      doctorSocket.emit('newPatient', patientInfo);
    }
  }
  
  // When a user joins a chat
  socket.on('joinChat', ({ patientId, doctorId }) => {
    // Always use main doctor
    const actualDoctorId = MAIN_DOCTOR_ID;
    const chatId = `${patientId}-${actualDoctorId}`;
    
    // Initialize chat if it doesn't exist
    if (!activeChats.has(chatId)) {
      activeChats.set(chatId, {
        patientId,
        doctorId: actualDoctorId,
        messages: []
      });
      
      console.log(`New chat created: ${chatId}`);
    }
    
    // Join the socket room for this chat
    socket.join(chatId);
    
    // Send previous messages
    socket.emit('previousMessages', {
      chatId,
      messages: activeChats.get(chatId).messages
    });
    
    console.log(`User ${userId} joined chat ${chatId}`);
  });
  
  // Handle new messages
  socket.on('message', (message) => {
    const { text, chatId, timestamp } = message;
    
    // Validate chat exists
    if (!activeChats.has(chatId)) {
      console.log(`Error: Chat ${chatId} not found`);
      return;
    }
    
    // Extract patient ID from chat ID
    const patientId = chatId.split('-')[0];
    
    // Create message object
    const newMessage = {
      id: Date.now().toString(),
      text,
      senderId: userId,
      senderType: userType,
      timestamp: timestamp || new Date(),
      isRead: false
    };
    
    // Store message
    activeChats.get(chatId).messages.push(newMessage);
    
    // Update patient's last message
    if (patientsList.has(patientId)) {
      const patientInfo = patientsList.get(patientId);
      patientInfo.lastMessage = text;
      
      // If message is from patient and doctor is not in this chat, increment unread
      if (userType === 'patient') {
        // Check if doctor is looking at this chat
        const doctorSocket = activeUsers.get(MAIN_DOCTOR_ID);
        if (doctorSocket && doctorSocket.data.currentChatId !== chatId) {
          patientInfo.unreadCount++;
        }
      }
      
      // Update patients list
      patientsList.set(patientId, patientInfo);
      
      // Notify doctor about updated patient info
      const doctorSocket = activeUsers.get(MAIN_DOCTOR_ID);
      if (doctorSocket) {
        doctorSocket.emit('patientUpdated', patientInfo);
      }
    }
    
    // Broadcast to all users in this chat
    io.to(chatId).emit('message', {
      chatId,
      message: newMessage
    });
    
    console.log(`New message in chat ${chatId} from ${userId}: ${text}`);
  });
  
  // Track which chat the doctor is currently viewing
  socket.on('viewingChat', ({ chatId }) => {
    if (userType === 'doctor') {
      socket.data.currentChatId = chatId;
      
      // Reset unread count for this patient
      const patientId = chatId.split('-')[0];
      if (patientsList.has(patientId)) {
        const patientInfo = patientsList.get(patientId);
        patientInfo.unreadCount = 0;
        patientsList.set(patientId, patientInfo);
        
        // Notify doctor of updated patient info
        socket.emit('patientUpdated', patientInfo);
      }
    }
  });
  
  // Handle typing indicators
  socket.on('typing', ({ chatId, isTyping }) => {
    // Broadcast typing status to the chat room
    socket.to(chatId).emit('typing', {
      chatId,
      userId,
      isTyping
    });
  });
  
  // Handle read receipts
  socket.on('markAsRead', ({ chatId, messageIds }) => {
    if (activeChats.has(chatId)) {
      const chat = activeChats.get(chatId);
      
      // Mark messages as read
      chat.messages.forEach(msg => {
        if (messageIds.includes(msg.id) && msg.senderId !== userId) {
          msg.isRead = true;
        }
      });
      
      // Notify the other user
      socket.to(chatId).emit('messagesRead', {
        chatId,
        messageIds,
        readBy: userId
      });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', userId);
    activeUsers.delete(userId);
    
    // If patient disconnected, update status but keep in list
    if (userType === 'patient') {
      if (patientsList.has(userId)) {
        const patientInfo = patientsList.get(userId);
        patientInfo.isOnline = false;
        patientsList.set(userId, patientInfo);
        
        // Notify doctor
        const doctorSocket = activeUsers.get(MAIN_DOCTOR_ID);
        if (doctorSocket) {
          doctorSocket.emit('patientUpdated', patientInfo);
        }   
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});