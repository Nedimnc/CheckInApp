import { pool } from '../config/database.js';
import bcrypt from 'bcryptjs';

// Register controller
const register = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: 'Request body is required' });
  }
  const { name, email, password, role, panther_id } = req.body;
  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(401).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, panther_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, hashedPassword, role, panther_id]
    );
    res.json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Login controller
const login = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: 'Request body is required' });
  }
  const { email, password } = req.body;
  console.log('Login attempt:', req.body);
  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log(user.rows);

    if (user.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid Credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid Credentials' });
    }
    res.json(user.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

export default { 
  register, 
  login 
};