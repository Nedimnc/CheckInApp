import { pool } from '../config/database.js';
import jwt from 'jsonwebtoken';

// Create session controller
export const createSession = async (req, res) => {
  console.log("Incoming Session Data:", req.body)
  const { tutor_id, title, subject, start_time, end_time, location } = req.body;

  // Clean input start/end times
  const cleanStart = new Date(start_time);
  cleanStart.setSeconds(0, 0);
  const cleanEnd = new Date(end_time);
  cleanEnd.setSeconds(0, 0)

  // Check for overlap with current tutor's sessions
  try {
    const overlapQuery = `
            SELECT * FROM sessions 
            WHERE tutor_id = $1 
            AND NOT (end_time <= $2 OR start_time >= $3)`;
    const overlapResult = await pool.query(overlapQuery, [tutor_id, cleanStart, cleanEnd]);
    if (overlapResult.rows.length > 0) {
      return res.status(400).json({ message: "You have another session that overlaps with this time." });
    }

    // Insert the new session
    const newSession = await pool.query(
      'INSERT INTO sessions (tutor_id, student_id, title, subject, start_time, end_time, location, status) VALUES ($1, NULL, $2, $3, $4, $5, $6, \'open\') RETURNING *',
      [tutor_id, title, subject, cleanStart, cleanEnd, location]
    );

    const io = req.app.get('socketio');
    if (io) {
      io.emit('session_created', newSession.rows[0]);
      console.log('Socket emitted: session_created')
    }

    res.json(newSession.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Fetch all sessions controller
export const getSessions = async (req, res) => {
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
    // 1. Check if session exists
    const checkQuery = 'SELECT * FROM sessions WHERE session_id = $1';
    const checkResult = await pool.query(checkQuery, [session_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Clean input start/end times
    const cleanStart = new Date(checkResult.rows[0].start_time);
    cleanStart.setSeconds(0, 0);
    const cleanEnd = new Date(checkResult.rows[0].end_time);
    cleanEnd.setSeconds(0, 0);

    // 2. Check if this session overlaps with student's other booked sessions
    const overlapQuery = `
      SELECT * FROM sessions 
      WHERE student_id = $1 
      AND status IN ('booked', 'checked_in')
      AND NOT (end_time <= $2 OR start_time >= $3)`;

    const overlapResult = await pool.query(overlapQuery, [
      student_id, cleanStart, cleanEnd
    ]);

    if (overlapResult.rows.length > 0) {
      return res.status(400).json({ message: "You have another session that overlaps with this time." });
    }

    // 3. Prevent double booking
    if (checkResult.rows[0].status === 'booked') {
      return res.status(400).json({ message: "This session has already been booked." });
    }

    // 4. Update the session (assign student & change status)
    const updateQuery = `
      UPDATE sessions 
      SET student_id = $1, status = 'booked' 
      WHERE session_id = $2 
      RETURNING *`;

    const result = await pool.query(updateQuery, [student_id, session_id]);

    const io = req.app.get('socketio');
    if (io) {
      io.emit('session_booked', result.rows[0]);
      console.log('Socket emitted: session_booked')
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
// Cancel session controller
export const cancelSession = async (req, res) => {
  const { session_id } = req.params;
  const { user_id } = req.body; // We will send the user's ID to verify ownership

  try {
    // 1. Check if the session exists and belongs to this user
    const checkQuery = 'SELECT * FROM sessions WHERE session_id = $1';
    const checkResult = await pool.query(checkQuery, [session_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }

    // 2. Security Check: ensure the requester is the owner
    if (checkResult.rows[0].tutor_id !== user_id) {
      return res.status(403).json({ message: "You are not authorized to delete this session" });
    }

    // 3.1 Delete associated attendance records first (if any) to maintain referential integrity
    const deleteAttendanceQuery = 'DELETE FROM attendance WHERE session_id = $1';
    await pool.query(deleteAttendanceQuery, [session_id]);

    // 3.2 Delete it
    const deleteQuery = 'DELETE FROM sessions WHERE session_id = $1 RETURNING *';
    await pool.query(deleteQuery, [session_id]);

    const io = req.app.get('socketio');
    if (io) {
      io.emit('session_cancelled', { session_id });
      console.log('Socket emitted: session_cancelled')
    }

    res.json({ message: "Session cancelled successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Update session controller
export const updateSession = async (req, res) => {
  const { session_id } = req.params;
  const { tutor_id, title, subject, location, start_time, end_time } = req.body;

  // Clean input start/end times
  const cleanStart = new Date(start_time);
  cleanStart.setSeconds(0, 0);
  const cleanEnd = new Date(end_time);
  cleanEnd.setSeconds(0, 0);

  try {
    // 1. Verify ownership (Security Check)
    const checkQuery = 'SELECT * FROM sessions WHERE session_id = $1';
    const checkResult = await pool.query(checkQuery, [session_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }
    if (checkResult.rows[0].tutor_id !== tutor_id) {
      return res.status(403).json({ message: "Unauthorized to edit this session" });
    }

    // 2. Check for overlap with current tutor's other sessions
    const overlapQuery = `
      SELECT * FROM sessions 
      WHERE tutor_id = $1 
      AND session_id != $4
      AND NOT (end_time <= $2 OR start_time >= $3)`;
    const overlapResult = await pool.query(overlapQuery, [tutor_id, cleanStart, cleanEnd, session_id]);
    if (overlapResult.rows.length > 0) {
      return res.status(400).json({ message: "You have another session that overlaps with this time." });
    }

    // 3. Update the session
    const updateQuery = `
      UPDATE sessions 
      SET title = $1, subject = $2, location = $3, start_time = $4, end_time = $5
      WHERE session_id = $6
      RETURNING *`;

    const result = await pool.query(updateQuery, [
      title, subject, location, cleanStart, cleanEnd, session_id
    ]);

    const io = req.app.get('socketio');
    if (io) {
      io.emit('session_updated', result.rows[0]);
      console.log('Socket emitted: session_updated')
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Unbook session controller
export const unbookSession = async (req, res) => {
  const { session_id } = req.params;
  const { student_id } = req.body;

  try {
    // Check if session exists and belongs to this student
    const updateQuery = `
      UPDATE sessions 
      SET student_id = NULL, status = 'open' 
      WHERE session_id = $1 AND student_id = $2
      RETURNING *`;

    const result = await pool.query(updateQuery, [session_id, student_id]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Session not found or you are not the booker" });
    }

    const io = req.app.get('socketio');
    if (io) {
      io.emit('session_unbooked', result.rows[0]);
      console.log('Socket emitted: session_unbooked')
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Generate Secure QR Token (SCRUM-21)
export const generateQRToken = async (req, res) => {
  const { session_id } = req.params;
  try {
    // Create a secure token that expires in 15 minutes
    const token = jwt.sign(
      { session_id: session_id },
      process.env.JWT_SECRET || 'super_secret_key',
      { expiresIn: '15m' }
    );
    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Check-in session controller (QR Validation using JWT)
export const checkinSession = async (req, res) => {
  const { token, student_id: bodyStudentId } = req.body;
  const authStudentId = req.user && req.user.id;
  const student_id = authStudentId || bodyStudentId;

  try {
    // 1. Verify the "wax seal" on the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key');
    const session_id = decoded.session_id;

    // 2. Check if session exists
    const checkQuery = 'SELECT * FROM sessions WHERE session_id = $1';
    const checkResult = await pool.query(checkQuery, [session_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }

    const session = checkResult.rows[0];

    // 3. Security Check: Is this the student who actually booked it?
    if (session.student_id !== student_id) {
      return res.status(403).json({ message: "Authentication failed: You are not booked for this session." });
    }

    // 4. Mark as checked in
    const updateQuery = `
      UPDATE sessions 
      SET status = 'checked_in' 
      WHERE session_id = $1 
      RETURNING *`;

    const result = await pool.query(updateQuery, [session_id]);

    // Insert attendance record
    const insertAttendance = `
      INSERT INTO attendance (session_id, student_id, check_in_status)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const attendanceResult = await pool.query(insertAttendance, [session_id, student_id, 'present']);

    const io = req.app.get('socketio');
    if (io) {
      io.emit('student_checked_in', { session: result.rows[0], attendance: attendanceResult.rows[0] });
      console.log('Socket emitted: student_checked_in')
    }

    res.json({ message: "Check-in successful!", session: result.rows[0], attendance: attendanceResult.rows[0] });
  } catch (err) {
    // If the token is expired, tampered with, or fake, it drops down here
    console.error("JWT Error:", err.message);
    return res.status(400).json({ message: "Invalid or expired QR code. Please ask the tutor to refresh." });
  }
};

export default {
  createSession,
  getSessions,
  bookSession,
  cancelSession,
  updateSession,
  unbookSession,
  checkinSession,
  generateQRToken
};