import { Router } from 'express';
import { createAiDraft, regenerateSingleAiDraft } from '../controllers/aiDraftController';

const router = Router();
router.post('/', createAiDraft);
router.post('/regenerate', regenerateSingleAiDraft);

export default router;
