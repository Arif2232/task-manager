import {
  CreateTodoDTO,
  GetTodosQuery,
  PaginatedTodosResponse,
  Todo,
  UpdateTodoDTO,
} from '../../../shared/types';

const BASE_URL = '/api/todos';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data && data.error) {
        errorMsg = data.error;
      }
    } catch {}
    throw new ApiError(res.status, errorMsg);
  }
  return res.json() as Promise<T>;
}

export const todoApi = {
  async getTodos(query?: GetTodosQuery): Promise<PaginatedTodosResponse> {
    const params = new URLSearchParams();
    if (query?.filter && query.filter !== 'all') params.set('filter', query.filter);
    if (query?.limit !== undefined) params.set('limit', String(query.limit));
    if (query?.page !== undefined) params.set('page', String(query.page));
    if (query?.cursor !== undefined) params.set('cursor', query.cursor);

    const qs = params.toString();
    const url = qs ? `${BASE_URL}?${qs}` : BASE_URL;
    const res = await fetch(url);
    return handleResponse<PaginatedTodosResponse>(res);
  },

  async createTodo(dto: CreateTodoDTO): Promise<Todo> {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    return handleResponse<Todo>(res);
  },

  async updateTodo(id: string, updates: UpdateTodoDTO): Promise<Todo> {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleResponse<Todo>(res);
  },

  async toggleTodo(id: string): Promise<Todo> {
    const res = await fetch(`${BASE_URL}/${id}/toggle`, {
      method: 'PATCH',
    });
    return handleResponse<Todo>(res);
  },

  async deleteTodo(id: string): Promise<{ message: string; id: string }> {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ message: string; id: string }>(res);
  },

  async clearCompleted(): Promise<{ message: string; count: number }> {
    const res = await fetch(`${BASE_URL}/completed`, {
      method: 'DELETE',
    });
    return handleResponse<{ message: string; count: number }>(res);
  },
};
