import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { createHash } from 'node:crypto';
import { S3FileStorageAdapter } from './s3-file-storage.adapter';
import { ResourceNotFoundException } from '../errors/domain.exception';

describe('S3FileStorageAdapter', () => {
  const BUCKET = 'mantra-redesa-health-files';

  /**
   * Construye el adaptador con un cliente S3 doblado.
   *
   * El cliente se reemplaza por propiedad porque se crea en el campo de instancia: doblarlo así
   * prueba la lógica del adaptador —claves, URIs, validación— sin red ni bucket.
   *
   * @returns Resultado de build.
   */
  function build(send: (...a: any[]) => any = fn()) {
    process.env.MINIO_BUCKET = BUCKET;
    const logger = { setContext: fn(), info: fn(), warn: fn() };
    const adapter = new S3FileStorageAdapter(logger as never);
    Object.defineProperty(adapter, 'client', {
      value: { send },
      writable: true,
    });
    return { adapter, send };
  }

  const input = {
    buffer: Buffer.from('contenido de prueba'),
    originalName: 'informe.pdf',
    mimeType: 'application/pdf',
  };
  const hash = createHash('sha256').update(input.buffer).digest('hex');

  it('direcciona por contenido: la clave es el hash, no el nombre del cliente', async () => {
    const { adapter, send } = build(fn().mockResolvedValue({}));

    const stored = await adapter.store(input);

    // Si la clave dependiera del nombre original, el cliente elegiría dónde se escribe.
    expect(stored.contentHash).toBe(hash);
    expect(stored.storageUri).toBe(
      `s3://${BUCKET}/${hash.slice(0, 2)}/${hash}`,
    );
    expect(stored.sizeBytes).toBe(input.buffer.byteLength);
    expect(stored.storageUri).not.toContain('informe');
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('devuelve el tamaño real escrito, no el declarado', async () => {
    const { adapter } = build(fn().mockResolvedValue({}));

    const stored = await adapter.store({ ...input, mimeType: 'text/plain' });

    expect(stored.sizeBytes).toBe(Buffer.byteLength('contenido de prueba'));
  });

  it('recupera el contenido de una URI que emitió', async () => {
    const body = {
      transformToByteArray: fn().mockResolvedValue(
        new Uint8Array(input.buffer),
      ),
    };
    const { adapter } = build(fn().mockResolvedValue({ Body: body }));

    const bytes = await adapter.retrieve(
      `s3://${BUCKET}/${hash.slice(0, 2)}/${hash}`,
    );

    expect(bytes.toString()).toBe('contenido de prueba');
  });

  it('rechaza una URI de otro bucket', async () => {
    const { adapter } = build();

    await expect(
      adapter.retrieve(`s3://otro-bucket/${hash.slice(0, 2)}/${hash}`),
    ).rejects.toThrow(ResourceNotFoundException);
  });

  it('rechaza una clave que no es un hash: la URI viene de la base, no se confía en ella', async () => {
    const { adapter, send } = build();

    // El caso que importa: una fila manipulada no puede hacer que el backend lea un objeto
    // arbitrario del bucket.
    for (const key of ['../../secretos', 'aa/no-es-un-hash', `zz/${hash}`]) {
      await expect(adapter.retrieve(`s3://${BUCKET}/${key}`)).rejects.toThrow(
        ResourceNotFoundException,
      );
    }
    expect(send).not.toHaveBeenCalled();
  });

  it('traduce el fallo del bucket a «no encontrado» y no filtra el error del SDK', async () => {
    const { adapter } = build(
      fn().mockRejectedValue(new Error('NoSuchKey: …')),
    );

    await expect(
      adapter.retrieve(`s3://${BUCKET}/${hash.slice(0, 2)}/${hash}`),
    ).rejects.toThrow(ResourceNotFoundException);
  });
});
