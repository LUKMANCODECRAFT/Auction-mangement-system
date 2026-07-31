const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');
const seedMasterAdmin = require('./utils/seedMasterAdmin');

// Initialize Express & Socket.IO
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Attach Socket.IO to App Request Object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect Database safely and run Master Admin Seeder
connectDB().then(async () => {
  console.log('✅ MongoDB connected successfully');
  await seedMasterAdmin();
}).catch(err => {
  console.error('Database Connection Failure:', err.message);
});

// API Routes
try {
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/auctions', require('./routes/auctionRoutes'));
  app.use('/api/admin', require('./routes/adminRoutes'));
} catch (err) {
  console.error('Error mounting API routes:', err.message);
}

// Serve Static Frontend Files from /views
app.use(express.static(path.join(__dirname, 'views')));

// Initialize Cron Jobs safely
try {
  const initCron = require('./utils/auctionCron');
  if (typeof initCron === 'function') {
    initCron(io);
  }
} catch (err) {
  console.warn('Cron initialization warning:', err.message);
}

// Socket.IO Events
io.on('connection', (socket) => {
  console.log('⚡ New client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('🔥 Client disconnected:', socket.id);
  });
});

// Catch-all route for SPA navigation
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API Endpoint Not Found' });
  }
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[SERVER] System running on port ${PORT}`);
});
