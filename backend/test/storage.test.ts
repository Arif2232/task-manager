import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { StorageService } from '../src/services/StorageService';

async function testStorage() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'taskflow-test-'));
  const file = path.join(dir, 'todos.json');
  const storage = new StorageService(file);

  try {
    await Promise.all([storage.init(), storage.init()]);
    assert.deepEqual(await storage.readTodos(), []);

    for (const invalid of ['{"incomplete":', '{"not":"an array"}', '']) {
      await fs.writeFile(file, invalid);
      await assert.rejects(storage.readTodos());
      await assert.rejects(storage.updateTodosTransaction(() => ({ newTodos: [], result: null })));
      assert.equal(await fs.readFile(file, 'utf-8'), invalid);
    }

    await fs.writeFile(file, '[]');
    assert.deepEqual(await storage.readTodos(), []);
    console.log('Storage preserves invalid data and recovers after repair.');
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

testStorage().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
