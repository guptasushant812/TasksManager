import { Router } from 'express';
import { 
  createAiDraft, 
  regenerateSingleAiDraft, 
  getAiProviders 
} from '../controllers/aiDraftController';

const router = Router();
router.get('/providers', getAiProviders);
router.post('/', createAiDraft);
router.post('/regenerate', regenerateSingleAiDraft);

export default router;
