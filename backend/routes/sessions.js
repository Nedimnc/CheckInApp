// routes/sessions.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// CREATE SESSION ROUTE
router.post('/create', async (req, res) => {
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

module.exports = router;