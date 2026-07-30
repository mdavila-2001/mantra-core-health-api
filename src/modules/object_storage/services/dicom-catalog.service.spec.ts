import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { DicomCatalogService } from './dicom-catalog.service';
import { ResourceNotFoundException } from '../../../common';
import { DICOMWEB_OUTCOME, OBJECT_LIFECYCLE } from '../constants';

const actor = { id: 'user-1', roles: ['PACS_GATEWAY'] };
const STUDY = '11111111-1111-1111-1111-111111111111';
const SERIES = '22222222-2222-2222-2222-222222222222';
const MANIFEST = '33333333-3333-3333-3333-333333333333';
const VERSION = '44444444-4444-4444-4444-444444444444';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const dicomRepo = {
    createStudy: mockFn(() => ({ id: STUDY })),
    findStudyByUidForUpdate: mockFn(() => Promise.resolve(null)),
    findStudyByUid: mockFn(),
    createSeries: mockFn(() => ({ id: SERIES })),
    findSeriesByUidForUpdate: mockFn(() => Promise.resolve(null)),
    findSeriesByUid: mockFn(),
    findSeriesByStudy: mockFn(() => Promise.resolve([{ id: SERIES }])),
    createInstance: mockFn(() => ({ id: 'instance-1' })),
    findInstanceByUid: mockFn(() => Promise.resolve(null)),
    countInstancesBySeries: mockFn(() => Promise.resolve(1)),
    createAccessLog: mockFn(() => ({ id: 'access-1' })),
  };
  const storageRepo = {
    findManifestById: mockFn(() => Promise.resolve({ id: MANIFEST })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new DicomCatalogService(
    em as any,
    dicomRepo,
    storageRepo as any,
    logger as any,
  );
  return { service, tx, dicomRepo, storageRepo, logger };
}

const CATALOG: any = {
  studyInstanceUid: '1.2.840.1',
  series: [
    {
      seriesInstanceUid: '1.2.840.1.1',
      modality: 'CT',
      instances: [
        { sopInstanceUid: '1.2.840.1.1.1', objectManifestId: MANIFEST },
      ],
    },
  ],
};

describe('DicomCatalogService', () => {
  describe('catalogStudy (UC-60-04)', () => {
    it('catalogues the hierarchy and counts what it wrote', async () => {
      const d = build();

      const res = await d.service.catalogStudy(CATALOG, actor);

      expect(res).toMatchObject({
        studyId: STUDY,
        seriesCount: 1,
        instanceCount: 1,
        instancesAdded: 1,
        instancesSkipped: 0,
        studyCreated: true,
      });
    });

    it('collects the distinct modalities of the study', async () => {
      const d = build();

      await d.service.catalogStudy(
        {
          ...CATALOG,
          series: [
            { ...CATALOG.series[0], modality: 'CT' },
            {
              ...CATALOG.series[0],
              seriesInstanceUid: '1.2.840.1.2',
              modality: 'MR',
            },
          ],
        },
        actor,
      );

      expect(d.dicomRepo.createStudy).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ modalityCodes: ['CT', 'MR'] }),
      );
    });

    it('does not re-add an instance that is already catalogued', async () => {
      const d = build();
      d.dicomRepo.findInstanceByUid.mockResolvedValue({ id: 'instance-prev' });

      const res = await d.service.catalogStudy(CATALOG, actor);

      expect(res).toMatchObject({ instancesAdded: 0, instancesSkipped: 1 });
      expect(d.dicomRepo.createInstance).not.toHaveBeenCalled();
    });

    it('reuses an existing study instead of creating a second one', async () => {
      const d = build();
      d.dicomRepo.findStudyByUidForUpdate.mockResolvedValue({ id: STUDY });

      const res = await d.service.catalogStudy(CATALOG, actor);

      expect(res.studyCreated).toBe(false);
      expect(d.dicomRepo.createStudy).not.toHaveBeenCalled();
    });

    it('fails when the instance references an object that does not exist', async () => {
      const d = build();
      d.storageRepo.findManifestById.mockResolvedValue(null);

      await expect(
        d.service.catalogStudy(CATALOG, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('resolveInstance (UC-60-05)', () => {
    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param manifestOverrides - Valor de manifest overrides requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(
      d: ReturnType<typeof build>,
      manifestOverrides: Record<string, unknown> = {},
    ) {
      d.dicomRepo.findStudyByUid.mockResolvedValue({ id: STUDY });
      d.dicomRepo.findSeriesByUid.mockResolvedValue({ id: SERIES });
      d.dicomRepo.findInstanceByUid.mockResolvedValue({
        objectManifestId: MANIFEST,
      });
      d.storageRepo.findManifestById.mockResolvedValue({
        id: MANIFEST,
        currentVersionId: VERSION,
        lifecycleState: OBJECT_LIFECYCLE.ACTIVE,
        ...manifestOverrides,
      });
    }

    it('resolves the instance and records the access', async () => {
      const d = build();
      wire(d);

      const res = await d.service.resolveInstance(
        '1.2.3',
        '1.2.3.1',
        '1.2.3.1.1',
        'TREATMENT',
        actor,
      );

      expect(res).toMatchObject({
        outcome: DICOMWEB_OUTCOME.ALLOWED,
        objectManifestId: MANIFEST,
        currentVersionId: VERSION,
      });
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('denies and records when no purpose of use is declared', async () => {
      const d = build();
      wire(d);

      const res = await d.service.resolveInstance(
        '1.2.3',
        '1.2.3.1',
        '1.2.3.1.1',
        undefined,
        actor,
      );

      expect(res.outcome).toBe(DICOMWEB_OUTCOME.DENIED);
      expect(res.denialReason).toBeDefined();
      // El intento denegado se registra igual: es lo que hay que poder auditar.
      expect(d.dicomRepo.createAccessLog).toHaveBeenCalled();
      expect(res.objectManifestId).toBeUndefined();
    });

    it('denies when the study does not exist', async () => {
      const d = build();
      d.dicomRepo.findStudyByUid.mockResolvedValue(null);

      const res = await d.service.resolveInstance(
        '1.2.3',
        '1.2.3.1',
        '1.2.3.1.1',
        'TREATMENT',
        actor,
      );

      expect(res.outcome).toBe(DICOMWEB_OUTCOME.DENIED);
    });

    it('denies when the series is not part of the study', async () => {
      const d = build();
      wire(d);
      d.dicomRepo.findSeriesByUid.mockResolvedValue(null);

      const res = await d.service.resolveInstance(
        '1.2.3',
        '1.2.3.9',
        '1.2.3.1.1',
        'TREATMENT',
        actor,
      );

      expect(res.outcome).toBe(DICOMWEB_OUTCOME.DENIED);
    });

    it('denies when the object is pending deletion', async () => {
      const d = build();
      wire(d, { lifecycleState: OBJECT_LIFECYCLE.PENDING_DELETION });

      const res = await d.service.resolveInstance(
        '1.2.3',
        '1.2.3.1',
        '1.2.3.1.1',
        'TREATMENT',
        actor,
      );

      expect(res.outcome).toBe(DICOMWEB_OUTCOME.DENIED);
    });

    it('denies when the object is corrupt', async () => {
      const d = build();
      wire(d, { lifecycleState: OBJECT_LIFECYCLE.CORRUPT });

      const res = await d.service.resolveInstance(
        '1.2.3',
        '1.2.3.1',
        '1.2.3.1.1',
        'TREATMENT',
        actor,
      );

      expect(res.outcome).toBe(DICOMWEB_OUTCOME.DENIED);
    });
  });
});
