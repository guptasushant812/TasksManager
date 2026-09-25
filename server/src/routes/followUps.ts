import { Router } from 'express';
import {
  listFollowUps,
  createFollowUp,
  getFollowUp,
  updateFollowUp,
  deleteFollowUp,
} from '../controllers/followUpController';

const router = Router({ mergeParams: true });

router.get('/', listFollowUps);
router.post('/', createFollowUp);
router.get('/:id', getFollowUp);
router.put('/:id', updateFollowUp);
router.delete('/:id', deleteFollowUp);

export default router;
