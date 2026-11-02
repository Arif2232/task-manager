import fs from 'fs/promises';
import path from 'path';
import { Todo } from '../../../shared/types';

export class StorageService {
  private filePath: string;
  private isInitialized = false;
  private lockQueue: Promise<unknown> = Promise.resolve();

  constructor(filePath?: string) {
    this.filePath = filePath || path.resolve(process.cwd(), 'data/todos.json');
  }

  /**
   * Acquire a sequential lock for thread/async-safe mutations.
   */
  private async acquireLock<T>(task: () => Promise<T>): Promise<T> {
    const nextTask = (async () => {
      await this.lockQueue;
      return await task();
    })();

    // Update queue pointer, catching errors so subsequent tasks aren't blocked
    this.lockQueue = nextTask.catch(() => {});
    return nextTask;
  }

  /**
   * Ensure directory and initial todos.json exist.
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;

    await this.acquireLock(async () => {
      if (this.isInitialized) return;
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });

      try {
        await fs.writeFile(this.filePath, '[]', { flag: 'wx' });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      }

      this.isInitialized = true;
    });
  }

  /**
   * Reads todos from the local JSON file.
   */
  public async readTodos(): Promise<Todo[]> {
    await this.init();
    return this.acquireLock(() => this.loadTodos());
  }

  private async loadTodos(): Promise<Todo[]> {
    const todos: unknown = JSON.parse(await fs.readFile(this.filePath, 'utf-8'));
    if (!Array.isArray(todos)) throw new Error('Todo storage must contain an array');
    return todos as Todo[];
  }

  /**
   * Atomically writes todos to the local JSON file via temporary file + rename.
   */
  private async atomicWrite(todos: Todo[]): Promise<void> {
    const dir = path.dirname(this.filePath);
    const tempFile = path.join(
      dir,
      `.todos.${Date.now()}_${Math.random().toString(36).slice(2)}.tmp`
    );

    const json = JSON.stringify(todos, null, 2);
    await fs.writeFile(tempFile, json, 'utf-8');
    await fs.rename(tempFile, this.filePath);
  }

  /**
   * Public thread-safe write.
   */
  public async writeTodos(todos: Todo[]): Promise<void> {
    await this.init();
    await this.acquireLock(async () => {
      await this.atomicWrite(todos);
    });
  }

  /**
   * Thread-safe read-modify-write transactional update.
   */
  public async updateTodosTransaction<T>(
    updater: (currentTodos: Todo[]) => { newTodos: Todo[]; result: T }
  ): Promise<T> {
    await this.init();
    return this.acquireLock(async () => {
      const currentTodos = await this.loadTodos();

      const { newTodos, result } = updater(currentTodos);
      await this.atomicWrite(newTodos);
      return result;
    });
  }
}

export const storageService = new StorageService();
