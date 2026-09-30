import { Router } from 'express';
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  deleteManyTasks,
  escalateTask,
  restoreTask,
} from '../controllers/taskController';

const router = Router();

router.get('/', listTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/bulk', deleteManyTasks);
router.delete('/:id', deleteTask);
router.post('/:id/restore', restoreTask);
router.post('/:id/escalate', escalateTask);

export default router;
