import { pool } from '../config/database.js';

// Controller to fetch all users
export const fetchAllUsers = async (req, res) => {
    console.log("Fetching all users");
    try {
        const users = await pool.query('SELECT user_id, name, role, panther_id FROM users');
        res.json(users.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

export default {
    fetchAllUsers
}
