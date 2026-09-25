import { Router } from 'express';
import { exportPdf, exportExcel } from '../controllers/exportController';

const router = Router();
router.get('/pdf', exportPdf);
router.get('/excel', exportExcel);

export default router;
