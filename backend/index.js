require('dotenv').config();

const express = require('express');

const http = require('http');

const socketIo = require('socket.io');

const mongoose = require('mongoose');

const User = require('./models/User');

const cors = require('cors');

const compression = require('compression');

const helmet = require('helmet');

const path = require('path');

const app = express();

const server = http.createServer(app);

const io = socketIo(server, { cors: { origin: process.env.FRONTEND_URL } });

// Scaling: Use Redis adapter if REDIS_URL is provided
if (process.env.REDIS_URL) {
  const redisAdapter = require('socket.io-redis');
  io.adapter(redisAdapter(process.env.REDIS_URL));
}

const PORT = process.env.PORT || 3000;

// Socket authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.query.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Connect to MongoDB

mongoose.connect(process.env.MONGO_URI)

.then(() => console.log('MongoDB connected'))

.catch(err => console.error('MongoDB connection error:', err));

// Middleware

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
}));

app.use(compression());

app.use(cors({ origin: process.env.FRONTEND_URL }));

app.use(express.json());

// Static files for uploads

app.use('/uploads', express.static('uploads', { maxAge: '1d' }));

// Routes

app.use('/api/auth', require('./routes/auth'));

app.use('/api/messages', require('./routes/messages'));

app.use('/api/users', require('./routes/users'));

app.use('/api/files', require('./routes/files'));

app.use('/api/friends', require('./routes/friends'));

app.use('/api/status', require('./routes/status'));

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Catch all handler: send back React's index.html file for any non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Socket.io for real-time

const connectedUsers = {}; // userId -> Set of socket.ids

io.on('connection', (socket) => {

  console.log('User connected:', socket.id);

  socket.on('join', async () => {
    if (!connectedUsers[socket.userId]) {
      connectedUsers[socket.userId] = new Set();
    }
    connectedUsers[socket.userId].add(socket.id);

    if (connectedUsers[socket.userId].size === 1) {
      // First connection, set online
      await User.findOneAndUpdate({ userId: socket.userId }, { isOnline: true });
      io.emit('userStatusUpdate', { userId: socket.userId, isOnline: true });
    }

    console.log(`User ${socket.userId} joined, connections: ${connectedUsers[socket.userId].size}`);
  });

  // Handle messaging

  socket.on('sendMessage', async (data) => {

    // Will implement later

    io.emit('message', data);

  });

  socket.on('startCall', (data) => {
    const { to, from } = data;
    const receiverSocket = connectedUsers[to];
    if (receiverSocket) {
      io.to(receiverSocket).emit('incomingCall', { from });
    }
  });

  socket.on('acceptCall', (data) => {
    const { to, from } = data;
    const callerSocket = connectedUsers[to];
    if (callerSocket) {
      io.to(callerSocket).emit('callAccepted', { from });
    }
  });

  socket.on('rejectCall', (data) => {
    const { to } = data;
    const callerSocket = connectedUsers[to];
    if (callerSocket) {
      io.to(callerSocket).emit('callRejected', {});
    }
  });

  socket.on('disconnect', async () => {
    if (socket.userId && connectedUsers[socket.userId]) {
      connectedUsers[socket.userId].delete(socket.id);
      if (connectedUsers[socket.userId].size === 0) {
        // Last connection, set offline
        await User.findOneAndUpdate({ userId: socket.userId }, { isOnline: false, lastSeen: new Date() });
        io.emit('userStatusUpdate', { userId: socket.userId, isOnline: false });
        delete connectedUsers[socket.userId];
      }
    }
    console.log('User disconnected:', socket.id);
  });

});

server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));