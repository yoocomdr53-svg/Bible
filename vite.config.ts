import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
// @ts-ignore
import bibleHandler from './api/bible.js';

function bibleApiPlugin(): Plugin {
  return {
    name: 'bible-api-dev-server',
    configureServer(server) {
      server.middlewares.use('/api/bible', async (req: any, res: any) => {
        try {
          const host = req.headers.host || 'localhost:3000';
          const url = new URL(req.url, `http://${host}`);
          const query: Record<string, string> = {};
          url.searchParams.forEach((v, k) => { query[k] = v; });
          req.query = query;
          if (!res.status) {
            res.status = function(code: number) { res.statusCode = code; return this; };
          }
          if (!res.json) {
            res.json = function(data: any) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify(data));
              return this;
            };
          }
          await bibleHandler(req, res);
        } catch (err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err?.message || 'Server error' }));
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), bibleApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
