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

export const syncAttendance = async (req, res) => {
  const { checkins } = req.body; // Expecting an array of { user_id, session_id, offline_uuid, check_in_time }
  const authenticatedUserId = Number(req.user.id);

  if (!Array.isArray(checkins) || checkins.length === 0) {
    return res.status(400).json({ error: 'No check-ins provided' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Validate session ownership for the first check-in
    for (const checkin of checkins) {
      if (Number(checkin.user_id) !== authenticatedUserId) {
        return res.status(403).json({ error: 'Unauthorized: Check-in does not belong to the authenticated user' });
      }

      // Insert attendance record, ignoring duplicates based on offline_uuid
      const attendanceQuery = `
      INSERT INTO attendance (session_id, student_id, check_in_time, offline_uuid)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (offline_uuid) DO NOTHING`;
      await client.query(attendanceQuery, [checkin.session_id, checkin.user_id, checkin.check_in_time, checkin.offline_uuid]);

      // Update session status to 'checked_in' if it was 'booked'
      const sessionUpdateQuery = `
      UPDATE sessions
      SET status = 'checked_in'
      WHERE session_id = $1 AND status = 'booked'`;
      await client.query(sessionUpdateQuery, [checkin.session_id]);


    }

    // All operations were successful
    await client.query('COMMIT');
    res.status(201).json({
      success: true,
      message: 'Offline check-ins synced successfully',
      count: checkins.length
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Batch Sync Error:', err.message);
    res.status(500).json({ message: 'Server error during sync' });
  } finally {
    client.release();
  }
};

export default { getAttendanceByStudent, getAttendanceBySession, createAttendance, syncAttendance };
