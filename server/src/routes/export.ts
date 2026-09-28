import { Router } from 'express';
import { exportPdf, exportExcel, exportZip } from '../controllers/exportController';

const router = Router();
router.get('/pdf', exportPdf);
router.get('/excel', exportExcel);
router.get('/zip', exportZip);

export default router;
