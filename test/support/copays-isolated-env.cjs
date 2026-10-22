/* Entorno exclusivo del recorrido 2.4. Nunca toma credenciales del .env remoto. */
const connection =
  'postgresql://copays_test:copays_local_test_only@127.0.0.1:55434/mantra_copays_test?sslmode=disable';
Object.assign(process.env, {
  COPAYS_ISOLATED_TEST: 'true',
  NODE_ENV: 'test',
  PORT: '3125',
  DB_HOST: '127.0.0.1',
  DB_PORT: '55434',
  DB_NAME: 'mantra_copays_test',
  DB_USER: 'copays_test',
  DB_PASSWORD: 'copays_local_test_only',
  DB_SSL: 'false',
  DB_APP_USER: 'copays_test',
  DB_APP_PASSWORD: 'copays_local_test_only',
  DB_READ_HOST: '127.0.0.1',
  DB_READ_PORT: '55434',
  DB_READ_NAME: 'mantra_copays_test',
  DB_READ_USER: 'copays_test',
  DB_READ_PASSWORD: 'copays_local_test_only',
  POSTGRES_READ_URL: connection,
  POSTGRES_WRITE_URL: connection,
  POSTGRES_ADMIN_URL: connection,
  DATA_SOURCE_PROVIDER: 'local',
  DATA_READ_FALLBACK: 'fail-fast',
  DB_POOL_MIN: '0',
  DB_POOL_MAX: '6',
  ORM_SCHEMA_SYNC: 'off',
  RLS_ENFORCE: 'false',
  ORM_VERIFY_FIDELITY: 'false',
  MONGODB_URI: 'mongodb://127.0.0.1:55435/mantra_copays_test',
  MONGO_DB: 'mantra_copays_test',
  REDIS_HOST: '127.0.0.1',
  REDIS_PORT: '55436',
  REDIS_PASSWORD: '',
  OPENSEARCH_NODE: 'http://127.0.0.1:55437',
  MINIO_ENDPOINT: '127.0.0.1',
  MINIO_PORT: '55438',
  MINIO_ACCESS_KEY: 'copays_test',
  MINIO_SECRET_KEY: 'copays_local_test_only',
  MINIO_BUCKET: 'copays-test',
  FILE_STORAGE_ADAPTER: 'local',
  FILE_STORAGE_LOCAL_DIR: './node_modules/.cache/copays-uploads',
  MOCK_PROVIDER_BASE_URL: 'http://127.0.0.1:55439',
  MOCK_PROVIDER_API_KEY: '',
  AUDIO_TTS_ENABLED: 'false',
  AUDIO_TTS_PROVIDER: 'disabled',
  AUDIO_TTS_ALLOW_RUNTIME_GENERATION: 'false',
  ELEVENLABS_API_KEY: '',
  SEED_ON_BOOT: 'false',
  SEED_CONTENT_ON_BOOT: 'false',
  RATE_LIMIT_DISABLED: 'true',
  DEV_VERIFICATION_BYPASS: 'false',
  JWT_SECRET: 'copays-isolated-test-secret-do-not-deploy',
  JWT_ACCESS_TTL: '4h',
  TELEMETRY_WEB_ANALYTICS_PROVIDER: 'none',
  OTEL_ENABLED: 'false',
  LOG_LEVEL: 'warn',
});

for (const key of [
  'POSTGRES_READ_URL',
  'POSTGRES_WRITE_URL',
  'POSTGRES_ADMIN_URL',
]) {
  const url = new URL(process.env[key]);
  if (
    url.hostname !== '127.0.0.1' ||
    url.port !== '55434' ||
    url.pathname !== '/mantra_copays_test'
  ) {
    throw new Error(`La conexión ${key} no está aislada`);
  }
}
