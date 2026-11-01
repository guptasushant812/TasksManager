import { Router } from 'express';
import { 
  getSettings, 
  updateSettings, 
  regenerateToken,
  verifyMasterPassword,
  updateMasterPassword,
  getMasterPasswordHash,
} from '../controllers/settingsController';

const router = Router();

router.get('/', getSettings);
router.patch('/', updateSettings);
router.get('/password-hash', getMasterPasswordHash);
router.post('/regenerate-token', regenerateToken);
router.post('/verify-password', verifyMasterPassword);
router.post('/update-password', updateMasterPassword);

export default router;
