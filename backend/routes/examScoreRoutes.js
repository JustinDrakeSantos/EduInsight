import express from 'express';
import ExamScore from '../models/ExamScore.js';
import { createCrudControllers } from '../controllers/crudControllers.js';

const router = express.Router();
const controller = createCrudControllers(ExamScore);

router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;
