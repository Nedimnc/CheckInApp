import { pool } from '../config/database.js';

// Get attendance history for a student
export const getAttendanceByStudent = async (req, res) => {
  const { student_id } = req.params;
  try {
    // authorization and ownership are enforced by middleware
    const query = `
      SELECT a.attendance_id, a.session_id, a.student_id, a.check_in_time, a.check_in_status,
             s.title as session_title, s.subject, s.start_time, s.end_time,
             u.name as tutor_name, u.user_id as tutor_id
      FROM attendance a
      JOIN sessions s ON s.session_id = a.session_id
      JOIN users u ON u.user_id = s.tutor_id
      WHERE a.student_id = $1
      ORDER BY a.check_in_time DESC
    `;
    const result = await pool.query(query, [student_id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get attendance roster for a session (tutor view)
export const getAttendanceBySession = async (req, res) => {
  const { session_id } = req.params;
  try {
    // authorization and ownership are enforced by middleware

    const query = `
      SELECT a.attendance_id, a.session_id, a.student_id, a.check_in_time, a.check_in_status,
             u.name as student_name, u.email as student_email, u.panther_id
      FROM attendance a
      JOIN users u ON u.user_id = a.student_id
      WHERE a.session_id = $1
      ORDER BY a.check_in_time ASC
    `;
    const result = await pool.query(query, [session_id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Create an attendance record (manual or system-driven)
export const createAttendance = async (req, res) => {
  const { session_id, student_id, check_in_status } = req.body;
  try {
    // authorization and ownership are enforced by middleware
    const insertSql = `
      INSERT INTO attendance (session_id, student_id, check_in_status)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query(insertSql, [session_id, student_id, check_in_status || 'present']);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

export default { getAttendanceByStudent, getAttendanceBySession, createAttendance };
