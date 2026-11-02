import { v4 as uuidv4 } from 'uuid';
import {
  CreateTodoDTO,
  GetTodosQuery,
  PaginatedTodosResponse,
  Todo,
  TodoFilter,
  UpdateTodoDTO,
} from '../../../shared/types';
import { StorageService, storageService } from './StorageService';

export class TodoService {
  constructor(private storage: StorageService = storageService) {}

  public async getTodos(query?: GetTodosQuery): Promise<PaginatedTodosResponse> {
    const todos = await this.storage.readTodos();
    const filter = query?.filter;

    // Calculate global counts
    const allCount = todos.length;
    const completedCount = todos.filter((t) => t.completed).length;
    const activeCount = allCount - completedCount;

    let filtered = todos;
    if (filter === 'active') {
      filtered = todos.filter((t) => !t.completed);
    } else if (filter === 'completed') {
      filtered = todos.filter((t) => t.completed);
    }

    const total = filtered.length;
    const requestedLimit = query?.limit ? Number(query.limit) : 50;
    const limit = Math.max(1, Math.min(isNaN(requestedLimit) ? 50 : requestedLimit, 500));

    let startIndex = 0;

    if (query?.cursor) {
      const cursorIndex = filtered.findIndex((t) => t.id === query.cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    } else if (query?.page) {
      const pageNum = Number(query.page);
      if (!isNaN(pageNum) && pageNum > 1) {
        startIndex = (pageNum - 1) * limit;
      }
    }

    const items = filtered.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + items.length < total;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;
    const page = Math.floor(startIndex / limit) + 1;

    return {
      todos: items,
      nextCursor,
      hasMore,
      total,
      page,
      limit,
      counts: {
        all: allCount,
        active: activeCount,
        completed: completedCount,
      },
    };
  }

  public async getTodoById(id: string): Promise<Todo | null> {
    const todos = await this.storage.readTodos();
    return todos.find((t) => t.id === id) || null;
  }

  public async createTodo(dto: CreateTodoDTO): Promise<Todo> {
    const trimmedTitle = dto.title.trim();
    const now = new Date().toISOString();

    const newTodo: Todo = {
      id: uuidv4(),
      title: trimmedTitle,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    return this.storage.updateTodosTransaction((todos) => {
      // Prepend so newest is at the top
      const newTodos = [newTodo, ...todos];
      return { newTodos, result: newTodo };
    });
  }

  public async updateTodo(id: string, dto: UpdateTodoDTO): Promise<Todo | null> {
    return this.storage.updateTodosTransaction((todos) => {
      const index = todos.findIndex((t) => t.id === id);
      if (index === -1) {
        return { newTodos: todos, result: null };
      }

      const existing = todos[index];
      const updated: Todo = {
        ...existing,
        title: dto.title !== undefined ? dto.title.trim() : existing.title,
        completed: dto.completed !== undefined ? Boolean(dto.completed) : existing.completed,
        updatedAt: new Date().toISOString(),
      };

      const newTodos = [...todos];
      newTodos[index] = updated;

      return { newTodos, result: updated };
    });
  }

  public async toggleTodo(id: string): Promise<Todo | null> {
    return this.storage.updateTodosTransaction((todos) => {
      const index = todos.findIndex((t) => t.id === id);
      if (index === -1) {
        return { newTodos: todos, result: null };
      }

      const existing = todos[index];
      const updated: Todo = {
        ...existing,
        completed: !existing.completed,
        updatedAt: new Date().toISOString(),
      };

      const newTodos = [...todos];
      newTodos[index] = updated;

      return { newTodos, result: updated };
    });
  }

  public async deleteTodo(id: string): Promise<boolean> {
    return this.storage.updateTodosTransaction((todos) => {
      const index = todos.findIndex((t) => t.id === id);
      if (index === -1) {
        return { newTodos: todos, result: false };
      }

      const newTodos = todos.filter((t) => t.id !== id);
      return { newTodos, result: true };
    });
  }

  public async clearCompleted(): Promise<number> {
    return this.storage.updateTodosTransaction((todos) => {
      const remainingTodos = todos.filter((t) => !t.completed);
      const clearedCount = todos.length - remainingTodos.length;
      return { newTodos: remainingTodos, result: clearedCount };
    });
  }
}

export const todoService = new TodoService();
