// Local-only QA runner. Never loads the developer's .env or contacts a remote database.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = process.cwd();
const envPath = path.join(__dirname, 'directory-local.env');
const local = require('dotenv').parse(fs.readFileSync(envPath));
for (const key of Object.keys(process.env)) {
  if (/^(DB_|POSTGRES_|MONGO|REDIS_|OPENSEARCH_|OTEL_|AWS_)/.test(key)) delete process.env[key];
}
Object.assign(process.env, local, { DOTENV_CONFIG_PATH: envPath });
if (local.DB_HOST !== '127.0.0.1' || local.DB_NAME !== 'directory_synthetic') throw new Error('Local isolation required');
const cache = path.join(root, 'node_modules/.cache/directory-qa');
fs.mkdirSync(cache, { recursive: true });
const mode = process.argv[2];
let args;
if (mode === 'integration') {
  // Native core/content selection: directory fixtures create their own insurers.
  // Unrelated clinical forms/content must not consume the integration hook.
  process.env.SEED_CONTENT_ON_BOOT = 'false';
  process.env.DIRECTORY_BROWSER_FIXTURES_PATH = path.join(cache, 'browser.json');
  args = ['--experimental-vm-modules', 'node_modules/jest-cli/bin/jest.js', '--config', 'test/jest-integration.json', '--runInBand', 'insurer-patients'];
} else if (mode === 'serve') {
  process.env.PORT = '3105';
  args = ['dist/src/main.js'];
} else if (mode === 'openapi') {
  args = [path.join(__dirname, 'generate-directory-openapi.cjs')];
} else throw new Error('Choose integration, serve or openapi');
const result = spawnSync(process.execPath, args, { cwd: root, env: process.env, stdio: 'inherit' });
process.exitCode = result.status ?? 1;
