import { Router } from 'express';
import { upload } from '../services/uploadService';
import {
  listFollowUps,
  createFollowUp,
  getFollowUp,
  updateFollowUp,
  deleteFollowUp,
  uploadAttachments,
  deleteAttachment,
} from '../controllers/followUpController';

const router = Router({ mergeParams: true });

router.get('/', listFollowUps);
router.post('/', createFollowUp);
router.get('/:id', getFollowUp);
router.put('/:id', updateFollowUp);
router.delete('/:id', deleteFollowUp);

router.post('/:id/attachments', upload.array('files', 5), uploadAttachments);
router.delete('/:id/attachments/:attachmentId', deleteAttachment);

export default router;
