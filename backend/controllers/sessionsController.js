import { pool } from '../config/database.js';

// Create session controller
export const createSession = async (req, res) => {
    console.log("Incoming Session Data:", req.body)
    const { tutor_id, title, subject, start_time, end_time, location } = req.body;
    try {
        const newSession = await pool.query(
            'INSERT INTO sessions (tutor_id, student_id, title, subject, start_time, end_time, location, status) VALUES ($1, NULL, $2, $3, $4, $5, $6, \'open\') RETURNING *',
            [tutor_id, title, subject, start_time, end_time, location]
        );

        res.json(newSession.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Fetch all sessions controller
export const fetchAllSessions = async (req, res) => {
    console.log("Fetching all sessions");
    try {
        const sessions = await pool.query('SELECT * FROM sessions ORDER BY start_time DESC');
        
        res.json(sessions.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Book session controller
export const bookSession = async (req, res) => {
  const { session_id } = req.params;
  const { student_id } = req.body;
  try {
    const checkQuery = await pool.query('SELECT * FROM sessions WHERE session_id = $1', 
      [session_id]
    );

    // Check if session exists and is open
    if (checkQuery.rows.length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }
    if (checkQuery.rows[0].status === 'booked') {
      return res.status(400).json({ message: "Session already booked" });
    }

    const bookQuery = await pool.query('UPDATE sessions SET student_id = $1, status = \'booked\' WHERE session_id = $2 RETURNING *',
      [student_id, session_id]
    );

    res.json(bookQuery.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

export default {
    createSession,
    fetchAllSessions,
    bookSession
};