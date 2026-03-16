import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import indexRoutes from './routes/index.js';
import http from 'http';
import { Server } from 'socket.io';
import authenticateSocket from './middleware/socketMiddleware.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', // keep * for local development, change to https://checkinapp.cloud for production
    methods: ['GET', 'POST']
  }
});

app.set('socketio', io);

io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log('A user connected: ', socket.user.id);
  
  socket.on('disconnect', (reason) => {
    console.log('User disconnected. Reason: ' + reason);
  });
});

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minute period starting from the first request
  max: 100, // limit each IP to however many requests per windowMs
  message: {
    message: 'Too many requests from this IP, please try again after 5 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(limiter);
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
  res.send('CheckIn API is running');
});

// Routes
app.use('/api', indexRoutes);

// Start Server
server.listen(PORT, () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log('JWT Secret loaded: ', process.env.JWT_SECRET ? 'Yes' : 'No');
});