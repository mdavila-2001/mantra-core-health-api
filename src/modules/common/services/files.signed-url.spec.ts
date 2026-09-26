import { jest } from '@jest/globals';
import { FilesService } from './files.service';
import { CONCEPTS } from '../../../common';
import type { AuthenticatedUser } from '../../../common';

const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
const actor: AuthenticatedUser = { id: 'user-1', roles: [] };

/** Servicio con sólo el archivo y la versión que hacen falta para firmar. */
function build(scan: string = CONCEPTS.SCAN_CLEAN) {
  const fork = {};
  const em = { fork: fn(() => fork) };
  const filesRepo = {
    findById: fn().mockResolvedValue({
      id: 'file-1',
      createdByUserId: actor.id,
      currentVersionId: 'ver-1',
      lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
    }),
  };
  const fileVersionsRepo = {
    findById: fn().mockResolvedValue({
      id: 'ver-1',
      storageUri: 's3://bucket/doc.pdf',
      malwareScanStatusConceptId: scan,
    }),
  };
  const logger = { setContext: fn(), info: fn(), warn: fn(), error: fn() };
  const service = new FilesService(
    em as never,
    filesRepo as never,
    fileVersionsRepo as never,
    {} as never,
    {} as never,
    logger as never,
  );
  return service;
}

/** Saca los tres parámetros de la URL emitida. */
function paramsOf(url: string) {
  const query = new URLSearchParams(url.split('?')[1]);
  return {
    versionId: query.get('versionId') ?? undefined,
    expires: query.get('expires') ?? undefined,
    signature: query.get('signature') ?? undefined,
  };
}

/** TX-09 y TX-33: la firma se valida y el 422 del escaneo dice por qué. */
describe('FilesService: URL firmada', () => {
  it('aceptado: la URL que se emite pasa la validación', async () => {
    const service = build();
    const { url } = await service.generateDownloadUrl('file-1', actor);
    expect(() =>
      service.assertDownloadSignature('file-1', paramsOf(url)),
    ).not.toThrow();
  });

  it('sin firma no hay nada que validar (lectura por autoría)', () => {
    expect(() => build().assertDownloadSignature('file-1', {})).not.toThrow();
  });

  it('límite: la URL vencida responde 410 URL_EXPIRED', async () => {
    const service = build();
    const { url } = await service.generateDownloadUrl('file-1', actor);
    const params = paramsOf(url);
    const realNow = Date.now;
    Date.now = () => realNow() + 16 * 60 * 1000;
    try {
      expect(() => service.assertDownloadSignature('file-1', params)).toThrow(
        expect.objectContaining({ status: 410 }),
      );
    } finally {
      Date.now = realNow;
    }
  });

  it('inválido: una firma alterada, ajena o incompleta es 403', async () => {
    const service = build();
    const { url } = await service.generateDownloadUrl('file-1', actor);
    const params = paramsOf(url);
    expect(() =>
      service.assertDownloadSignature('file-1', {
        ...params,
        signature: '00'.repeat(32),
      }),
    ).toThrow(expect.objectContaining({ status: 403 }));
    expect(() =>
      service.assertDownloadSignature('otro-archivo', params),
    ).toThrow(expect.objectContaining({ status: 403 }));
    expect(() =>
      service.assertDownloadSignature('file-1', {
        signature: params.signature,
      }),
    ).toThrow(expect.objectContaining({ status: 403 }));
  });

  it('archivo recién subido: 422 con details.reason SCAN_PENDING', async () => {
    const service = build(CONCEPTS.SCAN_PENDING);
    await expect(
      service.generateDownloadUrl('file-1', actor),
    ).rejects.toMatchObject({
      status: 422,
      details: { reason: 'SCAN_PENDING' },
    });
  });

  it('versión infectada: 422 con details.reason SCAN_INFECTED', async () => {
    const service = build(CONCEPTS.SCAN_INFECTED);
    await expect(
      service.generateDownloadUrl('file-1', actor),
    ).rejects.toMatchObject({ details: { reason: 'SCAN_INFECTED' } });
  });
});
