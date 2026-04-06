import { pool } from '../config/database.js';

// middleware: requireRole('student') or requireRole('tutor')
const requireRole = (role) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) return res.status(401).json({ message: 'Not authenticated' });
      const userId = req.user.id;
      const result = await pool.query('SELECT role FROM users WHERE user_id = $1', [userId]);
      if (result.rows.length === 0) return res.status(401).json({ message: 'User not found' });
      const userRole = result.rows[0].role;
      if (userRole !== role) return res.status(403).json({ message: `Forbidden: requires ${role} role` });
      // attach role to req for convenience
      req.user.role = userRole;
      next();
    } catch (err) {
      console.error('requireRole error', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

export default requireRole;
