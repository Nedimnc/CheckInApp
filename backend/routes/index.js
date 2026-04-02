import { Router } from 'express';

// Import route modules
import usersRoutes from './users.js';
import authRoutes from './auth.js';
import sessionsRoutes from './sessions.js';
import statRoutes from './stats.js'
import attendanceRoutes from './attendance.js'

const router = Router();

// /api/auth -> authRoutes
router.use('/auth', authRoutes);

// /api/users -> usersRoutes
router.use('/users', usersRoutes);

// /api/sessions -> sessionsRoutes
router.use('/sessions', sessionsRoutes);

// /api/stats -> statsRoutes
router.use('/stats', statRoutes);

// /api/attendance -> attendanceRoutes
router.use('/attendance', attendanceRoutes);

export default router;
