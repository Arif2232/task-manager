export interface Todo {
  id: string; // UUID v4
  title: string;
  completed: boolean;
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
}

export type CreateTodoDTO = Pick<Todo, 'title'>;
export type UpdateTodoDTO = Partial<Pick<Todo, 'title' | 'completed'>>;

export type TodoFilter = 'all' | 'active' | 'completed';

export interface GetTodosQuery {
  filter?: TodoFilter;
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedTodosResponse {
  todos: Todo[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
  page: number;
  limit: number;
  counts?: {
    all: number;
    active: number;
    completed: number;
  };
}
