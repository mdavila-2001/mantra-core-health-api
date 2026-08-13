import { jest } from '@jest/globals';
import { runWithTenant } from '../../common';
import { AudioContentService } from './audio-content.service';

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const TENANT_B = '22222222-2222-2222-2222-222222222222';
const BYTES = Buffer.from('audio');

function build(asset: Record<string, unknown> | null) {
  const repository: any = {
    findAssetById: jest.fn(async () => asset),
    touchUsage: jest.fn(async () => undefined),
  };
  const storage: any = { retrieve: jest.fn(async () => BYTES) };
  return {
    service: new AudioContentService(repository, storage),
    repository,
    storage,
  };
}

function readyAsset(overrides: Record<string, unknown> = {}) {
  return {
    id: 'asset-1',
    generationStatus: 'READY',
    storageKey: 's3://bucket/asset-1.mp3',
    audioFormat: 'mp3_44100_128',
    checksumSha256: 'a'.repeat(64),
    ...overrides,
  };
}

/**
 * Entrega de los bytes del audio.
 *
 * Mientras la caché era global no había nada que comprobar aquí: cualquier asset
 * servía para cualquiera. Con `tenant_id` en el modelo, el identificador de un
 * asset ajeno bastaría para **oír el nombre de una persona de otro tenant**, así
 * que este borde es la otra mitad del aislamiento.
 */
describe('AudioContentService', () => {
  it('entrega los bytes del asset propio del tenant', async () => {
    const d = build(readyAsset({ tenantId: TENANT_A }));

    const result = await runWithTenant(TENANT_A, () =>
      d.service.get('asset-1'),
    );

    expect(result).toMatchObject({ buffer: BYTES, mimeType: 'audio/mpeg' });
    expect(d.repository.touchUsage).toHaveBeenCalledWith('asset-1');
  });

  it('entrega los audios compartidos a cualquier tenant', async () => {
    // Los STATIC, FALLBACK y ENUMERATED no llevan tenant: su texto no identifica
    // a nadie y se pre-generan una vez para toda la plataforma.
    const d = build(readyAsset({ tenantId: undefined }));

    await expect(
      runWithTenant(TENANT_B, () => d.service.get('asset-1')),
    ).resolves.toMatchObject({ buffer: BYTES });
  });

  it('oculta con 404 el asset de otro tenant, sin leer los bytes', async () => {
    const d = build(readyAsset({ tenantId: TENANT_A }));

    await expect(
      runWithTenant(TENANT_B, () => d.service.get('asset-1')),
    ).rejects.toThrow(/no encontrado/);
    // No se toca el almacenamiento: el audio ajeno no llega ni a leerse.
    expect(d.storage.retrieve).not.toHaveBeenCalled();
    expect(d.repository.touchUsage).not.toHaveBeenCalled();
  });

  it('sigue sirviendo en modo sistema, sin tenant en contexto', async () => {
    // Los flujos internos (`SYSTEM` sin cabecera de tenant) operan entre tenants
    // por diseño: acotarlos aquí rompería la verificación de integridad y el GC.
    const d = build(readyAsset({ tenantId: TENANT_A }));

    await expect(d.service.get('asset-1')).resolves.toMatchObject({
      buffer: BYTES,
    });
  });

  it('rechaza un asset que todavía no está listo', async () => {
    const d = build(readyAsset({ generationStatus: 'PENDING' }));
    await expect(d.service.get('asset-1')).rejects.toThrow(/no encontrado/);
  });

  it('rechaza un asset inexistente', async () => {
    const d = build(null);
    await expect(d.service.get('asset-x')).rejects.toThrow(/no encontrado/);
  });
});
