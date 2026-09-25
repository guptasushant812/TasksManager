import { Router } from 'express';
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  deleteManyTasks,
} from '../controllers/taskController';

const router = Router();

router.get('/', listTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/bulk', deleteManyTasks);
router.delete('/:id', deleteTask);

export default router;
