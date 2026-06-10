import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    tailwindcss(),
    {
      name: 'tfjs-tflite-web-api-client-shim',
      enforce: 'pre',
      resolveId(source, importer) {
        if (
          /\.{1,2}\/tflite_web_api_client(\.js)?$/.test(source) &&
          importer?.includes('@tensorflow/tfjs-tflite')
        ) {
          const parts = importer.split(/[\\/]node_modules[\\/]/);
          const basePath = parts[0];
          return `${basePath}/node_modules/@tensorflow/tfjs-tflite/wasm/tflite_web_api_client.js`;
        }
      }
    }
  ],
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        {
          name: 'tfjs-tflite-esbuild-shim',
          setup(build) {
            build.onResolve({ filter: /tflite_web_api_client/ }, args => {
              const importer = args.importer.replace(/\\/g, '/');
              if (importer.includes('@tensorflow/tfjs-tflite')) {
                const parts = args.importer.split(/[\\/]node_modules[\\/]/);
                const basePath = parts[0];
                const resolvedPath = path.resolve(
                  basePath,
                  'node_modules/@tensorflow/tfjs-tflite/wasm/tflite_web_api_client.js'
                );
                return { path: resolvedPath };
              }
            });
          }
        }
      ]
    }
  },
  server: {
    port: 3000,
    open: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  preview: {
    port: 3000,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  }
});
