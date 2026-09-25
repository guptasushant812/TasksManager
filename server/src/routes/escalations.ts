import { Router } from 'express';
import {
  getEscalationSettings,
  updateEscalationSettings,
} from '../controllers/escalationController';

const router = Router();

router.get('/', getEscalationSettings);
router.put('/', updateEscalationSettings);

export default router;
