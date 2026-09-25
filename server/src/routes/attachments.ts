import { Router } from 'express';
import { upload } from '../middleware/upload';
import {
  uploadAttachments,
  listAttachments,
  downloadAttachment,
  deleteAttachment,
} from '../controllers/attachmentController';

const router = Router({ mergeParams: true });

// These routes will be mounted at: /api/tasks/:taskId/follow-ups/:followUpId/attachments
router.get('/', listAttachments);
router.post('/', upload.array('files', 5), uploadAttachments);
router.delete('/:id', deleteAttachment);

// Note: downloadAttachment will be mounted separately at /api/attachments/:id/download for easier linking

export default router;
