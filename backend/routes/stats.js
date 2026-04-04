// routes/stats.js
import { Router } from 'express';
import statsController from '../controllers/statsController.js';
import authenticateToken from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

// Fetch Student Stats
router.get('/student/:userID', statsController.fetchStudentStats);

// Fetch Tutor Stats
router.get('/tutor/:userID', statsController.fetchTutorStats);

export default router;