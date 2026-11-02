import { Router } from 'express';
import { todoController } from '../controllers/todoController';

const router = Router();

// Retrieve all todos (with optional ?filter=all|completed|active)
router.get('/', (req, res, next) => todoController.getTodos(req, res, next));

// Create a new todo
router.post('/', (req, res, next) => todoController.createTodo(req, res, next));

// Clear all completed todos (MUST be defined before /:id)
router.delete('/completed', (req, res, next) => todoController.clearCompleted(req, res, next));

// Single todo operations
router.get('/:id', (req, res, next) => todoController.getTodoById(req, res, next));
router.put('/:id', (req, res, next) => todoController.updateTodo(req, res, next));
router.patch('/:id/toggle', (req, res, next) => todoController.toggleTodo(req, res, next));
router.delete('/:id', (req, res, next) => todoController.deleteTodo(req, res, next));

export default router;
