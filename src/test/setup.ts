import { afterEach } from 'vitest';

const values = new Map<string, string>();

// Node 25 exposes a server-side localStorage accessor that requires a file
// flag. Override it with the browser-shaped storage used by these jsdom tests.
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, String(value)),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  },
});

afterEach(() => {
  localStorage.clear();
});
