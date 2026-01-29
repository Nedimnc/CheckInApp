// routes/users.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET ALL USERS ROUTE
router.get('/fetch', async (req, res) => {
    console.log("Fetching all users");
    try {
        const users = await pool.query('SELECT user_id, name, role, panther_id FROM users');
        res.json(users.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;