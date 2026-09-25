import { Router } from 'express';
import { createAiDraft } from '../controllers/aiDraftController';

const router = Router();
router.post('/', createAiDraft);

export default router;
