import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/utils/__tests__/**/*.test.ts'],
  },
});