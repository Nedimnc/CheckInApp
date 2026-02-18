// routes/sessions.js
import { Router } from 'express';
import sessionsController from '../controllers/sessionsController.js';

const router = Router();

// api/sessions/create -> Create Session Route
router.post('/create', sessionsController.createSession);

// api/sessions/fetch -> Fetch All Sessions Route
router.get('/fetch', sessionsController.getSessions);

// api/sessions/:session_id/book -> Book Session Route
router.post('/:session_id/book', sessionsController.bookSession);

// api/sessions/:session_id -> Cancel Session Route
router.delete('/:session_id', sessionsController.cancelSession);

// api/sessions/:session_id -> Update Session Route
router.put('/:session_id', sessionsController.updateSession);

// api/sessions/:session_id/unbook -> Unbook Session Route
router.post('/:session_id/unbook', sessionsController.unbookSession);

export default router;
