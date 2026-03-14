import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import indexRoutes from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
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
