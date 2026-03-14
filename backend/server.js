import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import indexRoutes from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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
app.listen(PORT, () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log('JWT Secret loaded: ', process.env.JWT_SECRET ? 'Yes' : 'No');
});
