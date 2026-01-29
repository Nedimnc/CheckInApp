const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const sessionsRoutes = require('./routes/sessions');
const usersRoutes = require('./routes/users');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Allows us to parse JSON bodies
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/users', usersRoutes);

// Database Connection
const pool = require('./db');

// Test DB Connection
pool.connect()
  .then(() => console.log('Connected to PostgreSQL Database'))
  .catch(err => console.error('Database connection error', err));

// Basic Route
app.get('/', (req, res) => {
  res.send('CheckIn API is running');
});

// Start Server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});

// Export pool for use in other files later
module.exports = pool;