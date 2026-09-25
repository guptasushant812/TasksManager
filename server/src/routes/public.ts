import { Router } from 'express';
import { getPublicStatus } from '../controllers/publicController';

const router = Router();

router.get('/status/:token', getPublicStatus);

export default router;
