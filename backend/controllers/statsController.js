import { pool } from '../config/database.js';

// Fetch the stats for the student (total_sessions, total_hours, and bargraph data)
export const fetchStudentStats = async (req, res) => {
    const { userID } = req.params;
    try {
        const totalStatsQuery = "SELECT COUNT(session_id) AS total_sessions, COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600), 0) AS total_hours FROM sessions WHERE student_id = $1;";
        const monthlyStatsQuery = "SELECT month_label, hours_count FROM (SELECT TO_CHAR(start_time, 'Mon') AS month_label, TO_CHAR(start_time, 'YYYY-MM') AS month_sort, COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600), 0) AS hours_count FROM sessions WHERE student_id = $1 GROUP BY month_label, month_sort ORDER BY month_sort DESC LIMIT 4) AS recent_months ORDER BY month_sort ASC;";
        const [totalResult, monthlyResult] = await Promise.all([
            pool.query(totalStatsQuery, [userID]),
            pool.query(monthlyStatsQuery, [userID])
        ]);
        if (totalResult.rows[0].total_sessions === '0') {
            return res.status(404).json({ message: "No stats found for this user" });
        }
        res.json({
            summary: totalResult.rows[0],
            monthlyBreakdown: monthlyResult.rows
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error fetching student stats');
    }
}

// Fetch the stats for the tutor
export const fetchTutorStats = async (req, res) => {
    const { userID } = req.params;
    try {
        const statsQuery = "SELECT COUNT(session_id) AS total_sessions, COUNT(DISTINCT student_id) AS total_unique_students, SUM(CASE WHEN end_time >= NOW() - INTERVAL '1 month' THEN (EXTRACT(EPOCH FROM (end_time - start_time)) / 3600.0) ELSE 0 END) AS hours_taught_last_month, COUNT(DISTINCT CASE WHEN start_time >= NOW() - INTERVAL '1 month' THEN student_id END) AS unique_students_last_month FROM sessions WHERE tutor_id = $1;"
        const result = await pool.query(statsQuery, [userID]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No stats found for this user" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error fetching tutor stats')
    }
}

export default {
    fetchStudentStats,
    fetchTutorStats
}