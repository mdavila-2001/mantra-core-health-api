import { HttpStatus } from '@nestjs/common';
import {
  assertStorageEnvConfigured,
  loadStorageEnv,
  storageEnvSchema,
} from './storage.env';
import { S3FileStorageAdapter } from './s3-file-storage.adapter';

const validate = (env: Record<string, string>) =>
  storageEnvSchema.validate(env, { abortEarly: false });

describe('storageEnvSchema (CIF-01)', () => {
  it('acepta adapter s3 con bucket sintético y credenciales completas', () => {
    const { error } = validate({
      FILE_STORAGE_ADAPTER: 's3',
      FILE_STORAGE_S3_BUCKET: 'bucket-sintetico',
      FILE_STORAGE_S3_ACCESS_KEY_ID: 'id-sintetico',
      FILE_STORAGE_S3_SECRET_ACCESS_KEY: 'secreto-sintetico',
    });
    expect(error).toBeUndefined();
  });

  it('acepta el modo IAM explícito: bucket sin credenciales estáticas', () => {
    const { error } = validate({
      FILE_STORAGE_ADAPTER: 's3',
      FILE_STORAGE_S3_BUCKET: 'bucket-sintetico',
      FILE_STORAGE_S3_ACCESS_KEY_ID: '',
      FILE_STORAGE_S3_SECRET_ACCESS_KEY: '',
    });
    expect(error).toBeUndefined();
  });

  it('rechaza adapter s3 con bucket vacío o ausente', () => {
    expect(
      validate({ FILE_STORAGE_ADAPTER: 's3', FILE_STORAGE_S3_BUCKET: '' }).error
        ?.message,
    ).toContain('FILE_STORAGE_S3_BUCKET');
    expect(validate({ FILE_STORAGE_ADAPTER: 's3' }).error?.message).toContain(
      'FILE_STORAGE_S3_BUCKET',
    );
  });

  it('rechaza credenciales a medias y no las echa en el mensaje', () => {
    const { error } = validate({
      FILE_STORAGE_ADAPTER: 's3',
      FILE_STORAGE_S3_BUCKET: 'bucket-sintetico',
      FILE_STORAGE_S3_ACCESS_KEY_ID: 'id-sintetico',
    });
    expect(error?.message).toContain('juntas o ninguna');
    expect(error?.message).not.toContain('id-sintetico');
  });

  it('no exige bucket con el adapter local (desarrollo y tests)', () => {
    expect(validate({}).error).toBeUndefined();
    expect(validate({ FILE_STORAGE_ADAPTER: 'local' }).error).toBeUndefined();
  });
});

describe('assertStorageEnvConfigured (CIF-01)', () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it('aborta antes de servir rutas con s3 y bucket vacío', () => {
    process.env.FILE_STORAGE_ADAPTER = 's3';
    process.env.FILE_STORAGE_S3_BUCKET = '';
    expect(() => assertStorageEnvConfigured(loadStorageEnv())).toThrow(
      'FILE_STORAGE_S3_BUCKET es obligatorio',
    );
  });

  it('no valida nada con el adapter local', () => {
    process.env.FILE_STORAGE_ADAPTER = 'local';
    process.env.FILE_STORAGE_S3_BUCKET = '';
    expect(() => assertStorageEnvConfigured(loadStorageEnv())).not.toThrow();
  });

  it('acepta s3 con bucket válido', () => {
    process.env.FILE_STORAGE_ADAPTER = 's3';
    process.env.FILE_STORAGE_S3_BUCKET = 'bucket-sintetico';
    expect(() => assertStorageEnvConfigured(loadStorageEnv())).not.toThrow();
  });

  it('si algo esquiva el arranque, la primera operación es un 503 catalogado', async () => {
    process.env.FILE_STORAGE_ADAPTER = 's3';
    process.env.FILE_STORAGE_S3_BUCKET = '';
    const logger = { setContext: () => undefined };
    const adapter = new S3FileStorageAdapter(logger as never);
    await expect(
      adapter.store({
        buffer: Buffer.from('x'),
        originalName: 'a.txt',
        mimeType: 'text/plain',
      }),
    ).rejects.toMatchObject({
      status: HttpStatus.SERVICE_UNAVAILABLE,
      response: {
        code: 'DEPENDENCY_UNAVAILABLE',
        reason: 'STORAGE_NOT_CONFIGURED',
      },
    });
  });
});
