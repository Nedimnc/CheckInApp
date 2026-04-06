import { pool } from '../config/database.js';

// requireOwner options:
// { resource: 'student' } -> compares req.params.student_id to req.user.id
// { resource: 'session', param: 'session_id', inBody: false } -> compares sessions.tutor_id to req.user.id using req.params.session_id
// { resource: 'session', param: 'session_id', inBody: true } -> reads session_id from req.body.session_id
const requireOwner = (options = {}) => {
  const { resource, param = 'id', inBody = false } = options;

  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) return res.status(401).json({ message: 'Not authenticated' });
      const requesterId = Number(req.user.id);

      if (resource === 'student') {
        const studentId = Number(req.params.student_id);
        if (Number.isNaN(studentId)) return res.status(400).json({ message: 'Missing student_id' });
        if (requesterId !== studentId) return res.status(403).json({ message: 'Forbidden: not the student owner' });
        return next();
      }

      if (resource === 'session') {
        const sessionId = inBody ? req.body[param] : req.params[param];
        if (!sessionId) return res.status(400).json({ message: 'Missing session identifier' });
        const sessionRes = await pool.query('SELECT tutor_id FROM sessions WHERE session_id = $1', [sessionId]);
        if (sessionRes.rows.length === 0) return res.status(404).json({ message: 'Session not found' });
        const tutorId = Number(sessionRes.rows[0].tutor_id);
        if (requesterId !== tutorId) return res.status(403).json({ message: 'Forbidden: not the session owner' });
        return next();
      }

      return res.status(400).json({ message: 'Invalid requireOwner configuration' });
    } catch (err) {
      console.error('requireOwner error', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  };
};

export default requireOwner;
