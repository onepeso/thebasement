type BatchCallback<T> = () => T;

const batchedUpdates: Map<string, NodeJS.Timeout> = new Map();
const BATCH_DELAY = 50;

export function batchUpdate<T>(key: string, callback: BatchCallback<T>, onUpdate: (value: T) => void) {
  const existing = batchedUpdates.get(key);
  if (existing) {
    clearTimeout(existing);
  }

  const timeout = setTimeout(() => {
    const result = callback();
    onUpdate(result);
    batchedUpdates.delete(key);
  }, BATCH_DELAY);

  batchedUpdates.set(key, timeout);
}

export function cancelBatch(key: string) {
  const existing = batchedUpdates.get(key);
  if (existing) {
    clearTimeout(existing);
    batchedUpdates.delete(key);
  }
}
