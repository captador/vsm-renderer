import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
  if (mode === 'demo') {
    return {
      plugins: [react()],
      root: 'demo',
      build: {
        outDir: '../dist-demo',
      },
    };
  }

  return {
    plugins: [react()],
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'VsmRender',
        formats: ['es', 'cjs'],
        fileName: (format) => `vsm-renderer.${format === 'es' ? 'js' : 'cjs'}`,
      },
      rollupOptions: {
        external: ['konva', 'react', 'react-dom', 'react/jsx-runtime'],
        output: {
          globals: {
            konva: 'Konva',
            react: 'React',
            'react-dom': 'ReactDOM',
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['tests/setup.ts'],
      exclude: ['**/node_modules/**', '**/e2e/**', 'tests/e2e/**'],
      coverage: {
        provider: 'v8',
        include: ['src/**'],
        exclude: [],
        thresholds: {
          lines: 80,
          branches: 80,
        },
      },
    },
  };
});
