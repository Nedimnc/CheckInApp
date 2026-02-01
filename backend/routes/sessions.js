// routes/sessions.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// CREATE SESSION ROUTE
router.post('/create', async (req, res) => {
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
    res.json(newSession.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET ALL SESSIONS ROUTE
router.get('/fetch', async (req, res) => {
  console.log("Fetching all sessions");
  try {
    const sessions = await pool.query('SELECT * FROM sessions');
    res.json(sessions.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Student books a session
router.post('/:session_id/book', async (req, res) => {
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
      AND status = 'booked'
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

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// This route will allow tutors to cancel their own sessions
router.delete('/:session_id', async (req, res) => {
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

    // 3. Delete it
    const deleteQuery = 'DELETE FROM sessions WHERE session_id = $1 RETURNING *';
    await pool.query(deleteQuery, [session_id]);

    res.json({ message: "Session cancelled successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Edit session details route
router.put('/:session_id', async (req, res) => {
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

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Student unbooks (cancels) their own session
router.post('/:session_id/unbook', async (req, res) => {
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

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;