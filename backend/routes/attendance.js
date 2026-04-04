import { Router } from 'express';
import attendanceController from '../controllers/attendanceController.js';
import authenticateToken from '../middleware/authMiddleware.js';
import requireRole from '../middleware/requireRole.js';
import requireOwner from '../middleware/requireOwner.js';

const router = Router();

router.use(authenticateToken);

// GET /api/attendance/student/:student_id
router.get('/student/:student_id', requireRole('student'), requireOwner({ resource: 'student' }), attendanceController.getAttendanceByStudent);

// GET /api/attendance/session/:session_id
router.get('/session/:session_id', requireRole('tutor'), requireOwner({ resource: 'session', param: 'session_id', inBody: false }), attendanceController.getAttendanceBySession);

// POST /api/attendance
router.post('/', requireRole('tutor'), requireOwner({ resource: 'session', param: 'session_id', inBody: true }), attendanceController.createAttendance);

// POST /api/attendance/sync
router.post('/sync', attendanceController.syncAttendance);

export default router;
