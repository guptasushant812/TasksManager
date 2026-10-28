import { Router } from 'express';
import { 
  createAiDraft, 
  regenerateSingleAiDraft, 
  getAiProviders,
  getAiDraftState,
  saveAiDraftState,
  deleteAiDraftState,
  validateAiKey,
} from '../controllers/aiDraftController';

const router = Router();
router.get('/providers', getAiProviders);
router.get('/state', getAiDraftState);
router.put('/state', saveAiDraftState);
router.delete('/state', deleteAiDraftState);
router.post('/validate-key', validateAiKey);
router.post('/', createAiDraft);
router.post('/regenerate', regenerateSingleAiDraft);

export default router;
