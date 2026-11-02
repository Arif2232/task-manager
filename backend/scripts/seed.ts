import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { Todo } from '../../shared/types';

const DATA_FILE = path.resolve(__dirname, '../data/todos.json');

const actions = [
  'Refactor', 'Fix', 'Implement', 'Test', 'Review', 'Optimize',
  'Deploy', 'Design', 'Document', 'Audit', 'Migrate', 'Configure',
  'Debug', 'Update', 'Clean up', 'Benchmark'
];

const subjects = [
  'authentication middleware', 'user onboarding flow', 'database indexes',
  'Redis cache layer', 'payment gateway integration', 'GraphQL query resolver',
  'Docker container healthcheck', 'CI/CD GitHub Actions workflow',
  'dark mode color palette', 'accessibility ARIA attributes',
  'WebSocket reconnection logic', 'session cookie expiry',
  'rate limiting policies', 'OpenAPI documentation specs',
  'frontend state machine', 'memory leak in worker threads'
];

const contexts = [
  'for v2 release', 'before Friday cut-off', 'following code review',
  'to reduce latency', 'to satisfy security audit', 'for staging verification',
  'as requested by QA', 'for mobile responsive layout'
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  const count = 10000;
  console.log(`Generating ${count} todos...`);

  const todos: Todo[] = [];
  const now = Date.now();

  for (let i = 1; i <= count; i++) {
    const action = getRandomElement(actions);
    const subject = getRandomElement(subjects);
    const context = getRandomElement(contexts);

    // Spread timestamps across the last 30 days
    const createdTime = new Date(now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
    const isCompleted = Math.random() < 0.35; // ~35% completed

    todos.push({
      id: crypto.randomUUID(),
      title: `${action} ${subject} (${context}) #${i}`,
      completed: isCompleted,
      createdAt: createdTime.toISOString(),
      updatedAt: createdTime.toISOString(),
    });
  }

  // Sort by createdAt descending (newest first)
  todos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(todos, null, 2), {
    encoding: 'utf-8',
    flag: process.argv.includes('--force') ? 'w' : 'wx',
  });

  const stats = await fs.stat(DATA_FILE);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(`✅ Successfully dumped ${todos.length} todos into ${DATA_FILE}`);
  console.log(`📁 File size: ${sizeMB} MB`);
}

seed().catch((err) => {
  console.error('Failed to seed todos:', err);
  process.exit(1);
});
