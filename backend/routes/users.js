// routes/users.js
import { Router } from 'express';
import usersController from '../controllers/usersController.js';

const router = Router();

// api/users/fetch -> Fetch All Users Route
router.get('/fetch', usersController.fetchAllUsers);

export default router;