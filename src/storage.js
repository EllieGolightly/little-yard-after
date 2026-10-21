import { validateSave } from './engine.js';

export const STORAGE_KEY = 'little-yard-after:v1';

const FORMAT = 'little-yard-after';
const VERSION = 5;
const MAX_BYTES = 1024 * 1024;
const BACKUP_KEY = `${STORAGE_KEY}:backup`;
const CORRUPT_KEY = `${STORAGE_KEY}:corrupt`;
const LEGACY_KEY = `${STORAGE_KEY}:legacy-v1`;

function storage() {
  const target = globalThis.localStorage;
  if (!target) throw new Error('浏览器无法使用本地存档，请导出存档文件保留进度。');
  return target;
}

function message(error, fallback) {
  if (error?.name === 'QuotaExceededError' || error?.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
    return '浏览器存储空间不足，进度尚未保存，请导出存档文件。';
  }
  if (error?.name === 'SecurityError') {
    return '浏览器阻止了本地存档，请导出存档文件保留进度。';
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

function checkSize(text) {
  if (typeof text !== 'string') throw new Error('请选择文本格式的 JSON 存档。');
  // First check avoids allocating another large buffer for oversized input.
  if (text.length > MAX_BYTES || new TextEncoder().encode(text).length > MAX_BYTES) {
    throw new Error('存档文件超过 1 MB，请选择本游戏导出的存档。');
  }
}

/** Parse without writing; the caller decides when an imported game is accepted. */
export function importGame(text) {
  checkSize(text);
  let raw;
  try {
    raw = JSON.parse(text.replace(/^\uFEFF/, ''));
  } catch {
    throw new Error('无法读取存档：文件不是有效的 JSON。');
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'format' in raw) {
    if (raw.format !== FORMAT) throw new Error('这个文件不是《小院之后》的存档。');
    if (![1, 2, 3, 4, VERSION].includes(raw.version)) throw new Error('暂不支持这个版本的存档，请使用当前版本导出的文件。');
    raw = raw.game;
  }
  return validateSave(raw);
}

/** An export is self-contained and always passes through the engine validator. */
export function exportGame(state) {
  const game = validateSave(state);
  const text = JSON.stringify({
    format: FORMAT,
    version: VERSION,
    savedAt: new Date().toISOString(),
    game,
  }, null, 2);
  checkSize(text);
  return text;
}

/** Loading is read-only, including when a damaged save or backup is found. */
export function loadGame() {
  let target;
  let original;
  try {
    target = storage();
    original = target.getItem(STORAGE_KEY);
  } catch (error) {
    return { state: null, warning: message(error, '无法读取本地存档，请导入之前导出的文件。') };
  }

  let originalError;
  if (original !== null) {
    try {
      return { state: importGame(original) };
    } catch (error) {
      originalError = error;
    }
  }

  try {
    const backup = target.getItem(BACKUP_KEY);
    if (backup !== null) {
      return {
        state: importGame(backup),
        warning: '已恢复上一次成功保存的备份，最近一次操作可能未保留。原存档未改动。',
      };
    }
  } catch {
    return { state: null, warning: '本地存档或备份无法读取，原文件已保留。可以导入之前导出的存档。' };
  }

  if (originalError) {
    return { state: null, warning: '本地存档无法读取，原文件已保留。可以导入之前导出的存档。' };
  }
  return { state: null };
}

/** Keep the previous valid save until the new main value is successfully stored. */
export function saveGame(state) {
  try {
    // Invalid game state must never touch storage, even if storage is unavailable.
    const serialized = exportGame(state);
    const target = storage();
    const previous = target.getItem(STORAGE_KEY);
    if (previous !== null) {
      let previousValid = false;
      try {
        importGame(previous);
        previousValid = true;
      } catch {
        // A later explicit save may replace the main slot, but preserve evidence.
      }
      if (previousValid) {
        if (target.getItem(LEGACY_KEY) === null) {
          const older = JSON.parse(previous);
          if ((older.game || older).version === 1) target.setItem(LEGACY_KEY, previous);
        }
        target.setItem(BACKUP_KEY, previous);
      } else if (target.getItem(CORRUPT_KEY) === null) {
        target.setItem(CORRUPT_KEY, previous);
      }
    }
    target.setItem(STORAGE_KEY, serialized);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: message(error, '保存未成功，请导出存档文件保留进度。') };
  }
}

export function clearGame() {
  try {
    const target = storage();
    // Remove main last, so a failed cleanup keeps a playable save if possible.
    target.removeItem(BACKUP_KEY);
    target.removeItem(CORRUPT_KEY);
    target.removeItem(STORAGE_KEY);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: message(error, '无法清除本地存档，请稍后重试。') };
  }
}
