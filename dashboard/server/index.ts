import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildRouter } from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const PORT = Number(process.env.DASHBOARD_PORT ?? 4000);

const app = express();

app.use(express.json());

app.use('/api', buildRouter());

// Serve attachments (traces, screenshots, video) under /artifacts/* by mapping to the
// path stored in the SQLite row.
app.get('/artifacts/*splat', (req, res) => {
  const rel = (req.params as Record<string, string | string[]>).splat;
  const relPath = Array.isArray(rel) ? rel.join('/') : String(rel);
  const abs = path.resolve(PROJECT_ROOT, relPath);
  if (!abs.startsWith(PROJECT_ROOT)) {
    res.status(400).json({ error: 'Invalid path' });
    return;
  }
  if (!fs.existsSync(abs)) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.sendFile(abs);
});

const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');
app.use(express.static(PUBLIC_DIR));

app.listen(PORT, () => {
  console.log(`Dashboard listening at http://localhost:${PORT}`);
  console.log(`API base:        http://localhost:${PORT}/api`);
  console.log(`Project root:    ${PROJECT_ROOT}`);
});
