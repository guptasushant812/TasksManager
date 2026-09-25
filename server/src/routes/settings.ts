import { Router } from 'express';
import { getSettings, updateSettings, regenerateToken } from '../controllers/settingsController';

const router = Router();

router.get('/', getSettings);
router.patch('/', updateSettings);
router.post('/regenerate-token', regenerateToken);

export default router;
