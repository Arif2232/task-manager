import assert from 'node:assert/strict';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { Todo } from '../../shared/types';
import { todoApi } from '../src/api/todoApi';
import { useTodos } from '../src/hooks/useTodos';

const date = '2026-01-01T00:00:00.000Z';
let stored: Todo[] = [
  { id: '1', title: 'Active task', completed: false, createdAt: date, updatedAt: date },
];

todoApi.getTodos = async (query) => {
  const todos = stored.filter((todo) => query?.filter === 'completed' ? todo.completed : query?.filter === 'active' ? !todo.completed : true);
  const completed = stored.filter((todo) => todo.completed).length;
  return {
    todos, total: todos.length, nextCursor: null, hasMore: false, page: 1, limit: 10,
    counts: { all: stored.length, completed, active: stored.length - completed },
  };
};
todoApi.toggleTodo = async (id) => {
  const todo = stored.find((item) => item.id === id)!;
  todo.completed = !todo.completed;
  return { ...todo };
};
todoApi.createTodo = async ({ title }) => {
  const todo = { id: '2', title, completed: false, createdAt: date, updatedAt: date };
  stored = [todo, ...stored];
  return todo;
};

let view: ReturnType<typeof useTodos>;
function Harness() {
  view = useTodos();
  return null;
}

async function testFilters() {
  let renderer: ReturnType<typeof create>;
  await act(async () => { renderer = create(<Harness />); });
  await act(async () => { view.setFilter('active'); });
  const toggle = todoApi.toggleTodo;
  todoApi.toggleTodo = async () => { throw new Error('Network error'); };
  await act(async () => { await view.toggleTodo('1'); });
  assert.equal(view.todos.length, 1, 'failed toggle restores the active task');
  assert.equal(view.totalCount, 1);
  assert.equal(view.activeCount, 1);
  todoApi.toggleTodo = toggle;
  await act(async () => { await view.toggleTodo('1'); });
  assert.equal(view.todos.length, 0, 'completed task leaves the active filter');
  assert.equal(view.totalCount, 0);
  await act(async () => { view.setFilter('completed'); });
  await act(async () => { await view.addTodo('New active task'); });
  assert.deepEqual(view.todos.map((todo) => todo.title), ['Active task'], 'new active task stays out of completed filter');
  assert.equal(view.totalCount, 1);
  assert.deepEqual([view.allTodosCount, view.activeCount, view.completedCount], [2, 1, 1]);
  await act(async () => { renderer!.unmount(); });
  console.log('Filtered task updates stay consistent.');
}

testFilters().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
