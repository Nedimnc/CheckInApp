// routes/auth.js
import { Router } from 'express';
import authController from '../controllers/authController.js';

const router = Router();

// api/auth/register -> Register Route
router.post('/register', authController.register);

// api/auth/login -> Login Route
router.post('/login', authController.login);

export default router;