import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, validateSave } from '../src/engine.js';
import { STORAGE_KEY, loadGame, saveGame, exportGame, importGame, clearGame } from '../src/storage.js';

const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

afterEach(() => {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else delete globalThis.localStorage;
});

function mockStorage(initial = {}, { setError, getError, removeError } = {}) {
  const data = new Map(Object.entries(initial));
  const writes = [];
  const target = {
    getItem(key) {
      if (getError) throw getError;
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      const failure = typeof setError === 'function' ? setError(key) : setError;
      if (failure) throw failure;
      writes.push([key, String(value)]);
      data.set(key, String(value));
    },
    removeItem(key) {
      if (removeError) throw removeError;
      writes.push([key, null]);
      data.delete(key);
    },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: target, configurable: true });
  return { target, data, writes };
}

test('export/import round trips the canonical game and a bare game without storage writes', () => {
  const { writes } = mockStorage();
  const state = createGame();
  const serialized = exportGame(state);
  const wrapper = JSON.parse(serialized);
  assert.equal(wrapper.format, 'little-yard-after');
  assert.equal(wrapper.version, 1);
  assert.equal(Number.isNaN(Date.parse(wrapper.savedAt)), false);
  assert.deepEqual(importGame(serialized), validateSave(state));
  assert.deepEqual(importGame(JSON.stringify(state)), validateSave(state));
  assert.deepEqual(importGame(`\uFEFF${serialized}`), validateSave(state));
  assert.deepEqual(writes, []);
});

test('rejects broken, foreign, incompatible and oversized imports', () => {
  for (const text of ['{broken', 'null', '{}', '[]']) {
    assert.throws(() => importGame(text));
  }
  assert.throws(() => importGame(JSON.stringify({ format: 'other', version: 1, game: createGame() })), /不是/);
  assert.throws(() => importGame(JSON.stringify({ format: 'little-yard-after', version: 2, game: createGame() })), /版本/);
  assert.throws(() => importGame(' '.repeat(1024 * 1024 + 1)), /1 MB/);
  assert.throws(() => importGame('水'.repeat(400_000)), /1 MB/);
});

test('invalid saves are rejected before any local storage access', () => {
  let storageAccesses = 0;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      storageAccesses++;
      throw new Error('should not read storage');
    },
  });
  const result = saveGame(null);
  assert.equal(result.ok, false);
  assert.equal(typeof result.error, 'string');
  assert.equal(storageAccesses, 0);
});

test('saves and reloads while retaining the previous good value as backup', () => {
  const { data } = mockStorage();
  const state = createGame();
  assert.deepEqual(loadGame(), { state: null });
  assert.deepEqual(saveGame(state), { ok: true });
  const first = data.get(STORAGE_KEY);
  assert.deepEqual(loadGame(), { state: validateSave(state) });
  assert.deepEqual(saveGame(state), { ok: true });
  assert.equal(data.get(`${STORAGE_KEY}:backup`), first);
});

test('recovers a good backup without overwriting corrupt main data', () => {
  const state = createGame();
  const backup = exportGame(state);
  const { data, writes } = mockStorage({ [STORAGE_KEY]: '{broken', [`${STORAGE_KEY}:backup`]: backup });
  const result = loadGame();
  assert.deepEqual(result.state, validateSave(state));
  assert.match(result.warning, /备份/);
  assert.equal(data.get(STORAGE_KEY), '{broken');
  assert.deepEqual(writes, []);
});

test('unrecoverable corruption stays untouched and is preserved on a later save', () => {
  const state = createGame();
  const { data, writes } = mockStorage({ [STORAGE_KEY]: '{broken', [`${STORAGE_KEY}:backup`]: '{also broken' });
  const result = loadGame();
  assert.equal(result.state, null);
  assert.match(result.warning, /原文件已保留/);
  assert.deepEqual(writes, []);
  assert.deepEqual(saveGame(state), { ok: true });
  assert.equal(data.get(`${STORAGE_KEY}:corrupt`), '{broken');
  assert.deepEqual(loadGame().state, validateSave(state));
});

test('recovers backup if the main slot is absent', () => {
  const state = createGame();
  const { writes } = mockStorage({ [`${STORAGE_KEY}:backup`]: exportGame(state) });
  assert.deepEqual(loadGame().state, validateSave(state));
  assert.match(loadGame().warning, /备份/);
  assert.deepEqual(writes, []);
});

test('blocked storage is reported without crashing the game', () => {
  const blocked = new DOMException('blocked', 'SecurityError');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw blocked; } });
  assert.equal(loadGame().state, null);
  assert.match(loadGame().warning, /阻止/);
  assert.equal(saveGame(createGame()).ok, false);
  assert.match(saveGame(createGame()).error, /阻止/);
  assert.equal(clearGame().ok, false);
});

test('quota failure leaves the existing main save intact', () => {
  const previous = exportGame(createGame());
  const { data } = mockStorage({ [STORAGE_KEY]: previous }, { setError: new DOMException('full', 'QuotaExceededError') });
  const result = saveGame(createGame());
  assert.equal(result.ok, false);
  assert.match(result.error, /存储空间不足/);
  assert.equal(data.get(STORAGE_KEY), previous);
});

test('a failed primary write still retains the previous valid primary and backup', () => {
  const previous = exportGame(createGame());
  const { data } = mockStorage({ [STORAGE_KEY]: previous }, {
    setError: key => key === STORAGE_KEY ? new DOMException('full', 'QuotaExceededError') : null,
  });
  assert.equal(saveGame(createGame()).ok, false);
  assert.equal(data.get(STORAGE_KEY), previous);
  assert.equal(data.get(`${STORAGE_KEY}:backup`), previous);
});

test('missing local storage produces a useful export suggestion', () => {
  Object.defineProperty(globalThis, 'localStorage', { value: undefined, configurable: true });
  assert.equal(loadGame().state, null);
  assert.match(loadGame().warning, /导出/);
  assert.equal(saveGame(createGame()).ok, false);
  assert.match(saveGame(createGame()).error, /导出/);
});

test('read and deletion failures are returned, and clearing removes only this game', () => {
  mockStorage({}, { getError: new Error('read failure') });
  assert.equal(loadGame().state, null);
  assert.equal(saveGame(createGame()).ok, false);
  mockStorage({}, { removeError: new Error('remove failure') });
  assert.equal(clearGame().ok, false);
  const { data } = mockStorage({
    [STORAGE_KEY]: exportGame(createGame()),
    [`${STORAGE_KEY}:backup`]: 'backup',
    [`${STORAGE_KEY}:corrupt`]: 'damaged',
    unrelated: 'keep me',
  });
  assert.deepEqual(clearGame(), { ok: true });
  assert.deepEqual([...data.entries()], [['unrelated', 'keep me']]);
});
