// routes/users.js
import { Router } from 'express';
import usersController from '../controllers/usersController.js';

// Import authentication middleware
import authenticateToken from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken); // Apply authentication middleware to all user routes below this line

// api/users/fetch -> Fetch All Users Route
router.get('/fetch', usersController.fetchAllUsers);

export default router;