import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
// @ts-ignore
import bibleHandler from './api/bible.js';

function syncVersionPlugin(): Plugin {
  return {
    name: 'sync-version-plugin',
    buildStart() {
      try {
        const verPath = path.resolve(__dirname, 'src/version.ts');
        if (fs.existsSync(verPath)) {
          const verContent = fs.readFileSync(verPath, 'utf-8');
          const verMatch = verContent.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
          const buildDateMatch = verContent.match(/APP_BUILD_DATE\s*=\s*['"]([^'"]+)['"]/);
          const version = verMatch ? verMatch[1] : 'Ver 2.1';
          const buildDate = buildDateMatch ? buildDateMatch[1] : '2026.11.16';
          const versionJson = {
            name: 'SuperBible',
            version,
            buildDate,
            timestamp: Date.now(),
          };
          const pubJsonPath = path.resolve(__dirname, 'public/version.json');
          fs.writeFileSync(pubJsonPath, JSON.stringify(versionJson, null, 2), 'utf-8');
        }
      } catch (e) {
        console.error('Failed to sync version.json:', e);
      }
    },
  };
}

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
    plugins: [react(), tailwindcss(), bibleApiPlugin(), syncVersionPlugin()],
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
