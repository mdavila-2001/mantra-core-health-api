import { loadWorkerEnv, workerEnvSchema } from './worker.env';

describe('workerEnvSchema', () => {
  it('rechaza cualquier proveedor mock en producción', () => {
    const { error } = workerEnvSchema.validate({
      NODE_ENV: 'production',
      MOCK_PROVIDER_BASE_URL: 'https://mock-provider.example.test',
    });
    expect(error).toBeDefined();
  });

  it('usa el mock local únicamente en desarrollo', () => {
    const { error, value } = workerEnvSchema.validate({
      NODE_ENV: 'development',
    });
    expect(error).toBeUndefined();
    expect(value.MOCK_PROVIDER_BASE_URL).toBe('http://127.0.0.1:4100');
  });

  it('acepta el mock vacío en producción para fallar de forma visible', () => {
    const { error, value } = workerEnvSchema.validate({
      NODE_ENV: 'production',
      MOCK_PROVIDER_BASE_URL: '',
    });
    expect(error).toBeUndefined();
    expect(value.MOCK_PROVIDER_BASE_URL).toBe('');
  });

  it('el loader tampoco reintroduce el mock cuando la variable falta en producción', () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousMockUrl = process.env.MOCK_PROVIDER_BASE_URL;
    try {
      process.env.NODE_ENV = 'production';
      delete process.env.MOCK_PROVIDER_BASE_URL;
      expect(loadWorkerEnv().mockProviderBaseUrl).toBe('');
    } finally {
      if (previousNodeEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = previousNodeEnv;
      }
      if (previousMockUrl === undefined) {
        delete process.env.MOCK_PROVIDER_BASE_URL;
      } else {
        process.env.MOCK_PROVIDER_BASE_URL = previousMockUrl;
      }
    }
  });
});
