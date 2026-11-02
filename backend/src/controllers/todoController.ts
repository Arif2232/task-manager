import { Request, Response, NextFunction } from 'express';
import { todoService } from '../services/TodoService';
import { CreateTodoDTO, TodoFilter, UpdateTodoDTO } from '../../../shared/types';

export class TodoController {
  public async getTodos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter = req.query.filter as TodoFilter | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const cursor = req.query.cursor as string | undefined;

      const result = await todoService.getTodos({ filter, page, limit, cursor });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  public async getTodoById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const todo = await todoService.getTodoById(id);
      if (!todo) {
        res.status(404).json({ error: 'Todo not found' });
        return;
      }
      res.json(todo);
    } catch (error) {
      next(error);
    }
  }

  public async createTodo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title } = req.body;
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        res.status(400).json({ error: 'Title is required and must not be empty' });
        return;
      }

      const dto: CreateTodoDTO = { title: title.trim() };
      const created = await todoService.createTodo(dto);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }

  public async updateTodo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { title, completed } = req.body;

      if (title !== undefined) {
        if (typeof title !== 'string' || title.trim().length === 0) {
          res.status(400).json({ error: 'Title cannot be empty' });
          return;
        }
      }

      if (completed !== undefined && typeof completed !== 'boolean') {
        res.status(400).json({ error: 'Completed must be a boolean' });
        return;
      }

      const dto: UpdateTodoDTO = {};
      if (title !== undefined) dto.title = title.trim();
      if (completed !== undefined) dto.completed = completed;

      const updated = await todoService.updateTodo(id, dto);
      if (!updated) {
        res.status(404).json({ error: 'Todo not found' });
        return;
      }

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  public async toggleTodo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await todoService.toggleTodo(id);
      if (!updated) {
        res.status(404).json({ error: 'Todo not found' });
        return;
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  public async deleteTodo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await todoService.deleteTodo(id);
      if (!deleted) {
        res.status(404).json({ error: 'Todo not found' });
        return;
      }
      res.json({ message: 'Todo deleted successfully', id });
    } catch (error) {
      next(error);
    }
  }

  public async clearCompleted(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await todoService.clearCompleted();
      res.json({ message: 'Completed todos cleared', count });
    } catch (error) {
      next(error);
    }
  }
}

export const todoController = new TodoController();
