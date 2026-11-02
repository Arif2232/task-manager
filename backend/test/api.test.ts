import { createApp } from '../src/app';
import { storageService } from '../src/services/StorageService';
import fs from 'fs/promises';
import path from 'path';
import { Server } from 'http';
import { PaginatedTodosResponse, Todo } from '../../shared/types';

const TEST_DB = path.resolve(__dirname, '../data/test-todos.json');

async function runTests() {
  console.log('🧪 Starting Backend API and Pagination Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Ensure clean test file
  try {
    await fs.unlink(TEST_DB);
  } catch {}

  // Override storage path for tests
  (storageService as unknown as { filePath: string }).filePath = TEST_DB;
  await storageService.init();

  // Test 1: Auto-initialization
  const initialContent = await fs.readFile(TEST_DB, 'utf-8');
  assert(JSON.parse(initialContent).length === 0, 'Auto-initializes todos.json with empty array');

  // Start express server on random port
  const app = createApp();
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const address = server.address() as { port: number };
  const baseUrl = `http://localhost:${address.port}`;

  try {
    // Test 2: Validation on POST /api/todos
    const emptyTitleRes = await fetch(`${baseUrl}/api/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '   ' }),
    });
    assert(emptyTitleRes.status === 400, 'POST /api/todos rejects whitespace/empty title with 400');

    // Test 3: Successful creation
    const createRes1 = await fetch(`${baseUrl}/api/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Task 1' }),
    });
    assert(createRes1.status === 201, 'POST /api/todos creates todo with 201');
    const todo1 = (await createRes1.json()) as Todo;
    assert(todo1.title === 'Task 1' && !todo1.completed && !!todo1.id, 'Created todo has valid UUID and fields');

    const createRes2 = await fetch(`${baseUrl}/api/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Task 2' }),
    });
    const todo2 = (await createRes2.json()) as Todo;

    // Test 4: GET /api/todos paginated contract
    const getAllRes = await fetch(`${baseUrl}/api/todos`);
    const allData = (await getAllRes.json()) as PaginatedTodosResponse;
    assert(allData.todos.length === 2, 'GET /api/todos returns paginated response with todos array');
    assert(allData.total === 2, 'Paginated response includes correct total');
    assert(allData.counts?.all === 2, 'Paginated response includes global counts summary');

    // Test 5: PATCH /api/todos/:id/toggle
    const toggleRes = await fetch(`${baseUrl}/api/todos/${todo1.id}/toggle`, {
      method: 'PATCH',
    });
    assert(toggleRes.status === 200, 'PATCH /api/todos/:id/toggle returns 200');
    const toggled = (await toggleRes.json()) as Todo;
    assert(toggled.completed === true, 'Todo status toggled to completed=true');

    // Test 6: Filters (?filter=active & ?filter=completed)
    const activeRes = await fetch(`${baseUrl}/api/todos?filter=active`);
    const activeData = (await activeRes.json()) as PaginatedTodosResponse;
    assert(activeData.todos.length === 1 && activeData.todos[0].id === todo2.id, 'GET /api/todos?filter=active filters correctly');

    const completedRes = await fetch(`${baseUrl}/api/todos?filter=completed`);
    const completedData = (await completedRes.json()) as PaginatedTodosResponse;
    assert(completedData.todos.length === 1 && completedData.todos[0].id === todo1.id, 'GET /api/todos?filter=completed filters correctly');

    // Test 7: PUT /api/todos/:id (inline edit)
    const putRes = await fetch(`${baseUrl}/api/todos/${todo2.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Task 2 Updated' }),
    });
    assert(putRes.status === 200, 'PUT /api/todos/:id updates todo details');
    const updated = (await putRes.json()) as Todo;
    assert(updated.title === 'Task 2 Updated', 'Updated todo has new title');

    // Test 8: Concurrency test - fire 15 simultaneous writes
    console.log('\n  ⚡ Testing concurrent atomic writes (15 parallel requests)...');
    const parallelRequests = Array.from({ length: 15 }, (_, i) =>
      fetch(`${baseUrl}/api/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Concurrent Task ${i + 1}` }),
      })
    );
    const parallelResponses = await Promise.all(parallelRequests);
    const allOk = parallelResponses.every((r) => r.status === 201);
    assert(allOk, 'All 15 parallel POST requests succeeded with 201');

    const fileContentAfterParallel = await fs.readFile(TEST_DB, 'utf-8');
    const parsedTodos = JSON.parse(fileContentAfterParallel) as Todo[];
    // Initial 2 + 15 = 17 todos
    assert(parsedTodos.length === 17, `Data persistence verified: exactly 17 todos in JSON without corruption`);

    // Test 9: Cursor-based pagination
    console.log('\n  ⚡ Testing Cursor-based and Page/Limit Pagination...');
    const page1Res = await fetch(`${baseUrl}/api/todos?limit=5`);
    const page1 = (await page1Res.json()) as PaginatedTodosResponse;
    assert(page1.todos.length === 5, 'Page 1 with limit=5 returns 5 todos');
    assert(page1.hasMore === true, 'Page 1 hasMore is true');
    assert(!!page1.nextCursor, 'Page 1 returns non-null nextCursor');

    // Fetch page 2 using cursor
    const page2Res = await fetch(`${baseUrl}/api/todos?limit=5&cursor=${page1.nextCursor}`);
    const page2 = (await page2Res.json()) as PaginatedTodosResponse;
    assert(page2.todos.length === 5, 'Page 2 with cursor returns next 5 todos');

    // Verify no overlap between page1 and page2
    const page1Ids = new Set(page1.todos.map((t) => t.id));
    const overlap = page2.todos.some((t) => page1Ids.has(t.id));
    assert(!overlap, 'No overlapping items between page 1 and cursor-fetched page 2');

    // Test 10: Page number pagination (?page=2&limit=5)
    const pageNumRes = await fetch(`${baseUrl}/api/todos?page=2&limit=5`);
    const pageNumData = (await pageNumRes.json()) as PaginatedTodosResponse;
    assert(pageNumData.todos.length === 5, 'GET /api/todos?page=2&limit=5 returns 5 items');
    assert(pageNumData.todos[0].id === page2.todos[0].id, 'Page 2 via ?page matches page 2 via ?cursor');

    // Test 11: DELETE /api/todos/completed (route order test!)
    const clearRes = await fetch(`${baseUrl}/api/todos/completed`, {
      method: 'DELETE',
    });
    assert(clearRes.status === 200, 'DELETE /api/todos/completed returns 200 and is not captured by /:id');
    const clearData = await clearRes.json();
    assert(clearData.count === 1, 'Cleared exactly 1 completed todo');

    // Test 12: DELETE /api/todos/:id
    const deleteRes = await fetch(`${baseUrl}/api/todos/${todo2.id}`, {
      method: 'DELETE',
    });
    assert(deleteRes.status === 200, 'DELETE /api/todos/:id deletes specific todo');

    const notFoundRes = await fetch(`${baseUrl}/api/todos/${todo2.id}`);
    assert(notFoundRes.status === 404, 'GET deleted todo returns 404');
  } finally {
    server.close();
    try {
      await fs.unlink(TEST_DB);
    } catch {}
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
