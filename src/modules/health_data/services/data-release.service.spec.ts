import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { DataReleaseService } from './data-release.service';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'user-1', roles: ['PRIVACY_OFFICER'] };
const PROFILE = '11111111-1111-1111-1111-111111111111';
const PATIENT = '22222222-2222-2222-2222-222222222222';
const OTHER_PATIENT = '33333333-3333-3333-3333-333333333333';
const RESOURCE = '44444444-4444-4444-4444-444444444444';
const VERSION = '55555555-5555-5555-5555-555555555555';
const TENANT = '66666666-6666-6666-6666-666666666666';
const TYPE = '77777777-7777-7777-7777-777777777777';
const CLUSTER = '88888888-8888-8888-8888-888888888888';
const MANIFEST_FILE = '99999999-9999-9999-9999-999999999999';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const releaseRepo = {
    createDeidProfile: mockFn(),
    findDeidProfileById: mockFn(),
    createDeidRun: mockFn(() => ({ id: 'deid-run-1' })),
    findDeidRunById: mockFn(),
    createExportJob: mockFn(() => ({ id: 'export-job-1' })),
    findExportJobForUpdate: mockFn(),
    createExportManifest: mockFn(() => ({ id: 'manifest-1' })),
    findManifest: mockFn(() => Promise.resolve(null)),
    // Las dos últimas las usa la portabilidad de seguros (subtarea 3.3), no
    // este servicio; van igual porque el doble se tipa contra el repositorio
    // entero.
    findManifestByContentHash: mockFn(() => Promise.resolve(null)),
    findExportJobById: mockFn(() => Promise.resolve(null)),
  };
  const resourcesRepo = {
    findResourcesByPatient: mockFn(() => Promise.resolve([])),
    findVersionsByIds: mockFn(() => Promise.resolve([])),
  };
  const identityRepo = {
    findLiveMembershipByProfile: mockFn(() => Promise.resolve(null)),
    findLiveMembers: mockFn(() => Promise.resolve([])),
  };
  const provenanceRepo = {
    createProvenanceRecord: mockFn(() => ({ id: 'provenance-1' })),
    createProvenanceTarget: mockFn(() => ({ id: 'target-1' })),
    createLineageEdge: mockFn(() => ({ id: 'edge-1' })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new DataReleaseService(
    em as any,
    releaseRepo,
    resourcesRepo as any,
    identityRepo as any,
    provenanceRepo,
    logger as any,
  );
  return {
    service,
    tx,
    releaseRepo,
    resourcesRepo,
    identityRepo,
    provenanceRepo,
    logger,
  };
}

/**
 * Ejecuta la operación active profile.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de active profile conforme al contrato `any`.
 */
function activeProfile(overrides: Record<string, unknown> = {}): any {
  return {
    id: PROFILE,
    tenantId: TENANT,
    stateConceptId: CONCEPTS.STATE_ACTIVE,
    ...overrides,
  };
}

describe('DataReleaseService', () => {
  describe('recordDeidRun (UC-52-11)', () => {
    const dto: any = {
      healthDeidentificationProfileId: PROFILE,
      purposeConceptId: TYPE,
      startedAt: '2026-07-20T10:00:00.000Z',
      outcome: 'COMPLETED',
      recordsProcessed: '5000',
      outputManifestFileId: MANIFEST_FILE,
    };

    it('records the run with its provenance', async () => {
      const d = build();
      d.releaseRepo.findDeidProfileById.mockResolvedValue(activeProfile());

      const res = await d.service.recordDeidRun(dto, actor);

      expect(res).toMatchObject({
        id: 'deid-run-1',
        statusConceptId: CONCEPTS.DEID_COMPLETED,
        provenanceRecordId: 'provenance-1',
        lineageEdgeCount: 0,
      });
      expect(d.provenanceRepo.createProvenanceRecord).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          activityConceptId: CONCEPTS.PROV_DEIDENTIFY,
        }),
      );
    });

    it('draws one lineage edge per source version', async () => {
      const d = build();
      d.releaseRepo.findDeidProfileById.mockResolvedValue(activeProfile());

      const res = await d.service.recordDeidRun(
        { ...dto, sourceVersionIds: [VERSION, 'version-2'] },
        actor,
      );

      expect(res.lineageEdgeCount).toBe(2);
      expect(d.provenanceRepo.createLineageEdge).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          transformationTypeConceptId: CONCEPTS.LINEAGE_DEIDENTIFY,
          targetId: MANIFEST_FILE,
        }),
      );
    });

    it('records a failed run without lineage', async () => {
      const d = build();
      d.releaseRepo.findDeidProfileById.mockResolvedValue(activeProfile());

      const res = await d.service.recordDeidRun(
        {
          ...dto,
          outcome: 'FAILED',
          outputManifestFileId: undefined,
          sourceVersionIds: [VERSION],
        },
        actor,
      );

      expect(res.statusConceptId).toBe(CONCEPTS.DEID_FAILED);
      expect(res.lineageEdgeCount).toBe(0);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('demands an output manifest on a completed run', async () => {
      const d = build();
      d.releaseRepo.findDeidProfileById.mockResolvedValue(activeProfile());

      await expect(
        d.service.recordDeidRun(
          { ...dto, outputManifestFileId: undefined },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a profile that is not active', async () => {
      const d = build();
      d.releaseRepo.findDeidProfileById.mockResolvedValue(
        activeProfile({ stateConceptId: CONCEPTS.STATE_REVOKED }),
      );

      await expect(
        d.service.recordDeidRun(dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the profile does not exist', async () => {
      const d = build();
      d.releaseRepo.findDeidProfileById.mockResolvedValue(null);

      await expect(
        d.service.recordDeidRun(dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('exportBundle (UC-52-12)', () => {
    const dto: any = {
      exportTypeConceptId: TYPE,
      purposeOfUseConceptId: TYPE,
      contentHash: 'a'.repeat(64),
      recordCount: '412',
      patientProfileId: PATIENT,
    };

    it('records the job, its manifest and its provenance', async () => {
      const d = build();

      const res = await d.service.exportBundle(dto, actor);

      expect(res).toEqual({
        id: 'export-job-1',
        statusConceptId: CONCEPTS.EXPORT_COMPLETED,
        manifestId: 'manifest-1',
        manifestVersion: 1,
        provenanceRecordId: 'provenance-1',
      });
      expect(d.provenanceRepo.createProvenanceRecord).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ activityConceptId: CONCEPTS.PROV_EXPORT }),
      );
      // El acceso a datos clínicos siempre queda con nivel de aviso.
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('accepts a cohort instead of a patient', async () => {
      const d = build();

      const res = await d.service.exportBundle(
        {
          ...dto,
          patientProfileId: undefined,
          cohortDefinitionId: OTHER_PATIENT,
        },
        actor,
      );

      expect(res.id).toBe('export-job-1');
    });

    it('refuses an export with neither patient nor cohort', async () => {
      const d = build();

      await expect(
        d.service.exportBundle(
          { ...dto, patientProfileId: undefined },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('accepts a completed de-identification run', async () => {
      const d = build();
      d.releaseRepo.findDeidRunById.mockResolvedValue({
        id: 'deid-run-1',
        statusConceptId: CONCEPTS.DEID_COMPLETED,
      });

      const res = await d.service.exportBundle(
        { ...dto, deidentificationRunId: 'deid-run-1' },
        actor,
      );

      expect(res.id).toBe('export-job-1');
    });

    it('refuses exporting on a de-identification run that failed', async () => {
      const d = build();
      d.releaseRepo.findDeidRunById.mockResolvedValue({
        id: 'deid-run-1',
        statusConceptId: CONCEPTS.DEID_FAILED,
      });

      await expect(
        d.service.exportBundle(
          { ...dto, deidentificationRunId: 'deid-run-1' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the de-identification run does not exist', async () => {
      const d = build();
      d.releaseRepo.findDeidRunById.mockResolvedValue(null);

      await expect(
        d.service.exportBundle(
          { ...dto, deidentificationRunId: 'deid-run-1' },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('serveEverything (UC-52-13)', () => {
    /**
     * Ejecuta la operación live resource.
     *
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de live resource conforme al contrato `any`.
     */
    function liveResource(overrides: Record<string, unknown> = {}): any {
      return {
        id: RESOURCE,
        resourceTypeConceptId: TYPE,
        currentVersionId: VERSION,
        ...overrides,
      };
    }

    it('serves the live versions of the patient resources', async () => {
      const d = build();
      d.resourcesRepo.findResourcesByPatient.mockResolvedValue([
        liveResource(),
      ]);
      d.resourcesRepo.findVersionsByIds.mockResolvedValue([
        {
          id: VERSION,
          versionNumber: 3,
          normalizedPayloadJson: { resourceType: 'Observation' },
        },
      ]);

      const res = await d.service.serveEverything(PATIENT, TENANT, actor);

      expect(res).toMatchObject({
        patientProfileId: PATIENT,
        includedPatientProfileIds: [PATIENT],
        total: 1,
      });
      expect(res.entries[0]).toMatchObject({
        resourceId: RESOURCE,
        versionNumber: 3,
      });
      expect(res.contentHash).toHaveLength(64);
      // Servir datos clínicos deja siempre rastro de aviso.
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('expands the identity cluster to every profile of the same person', async () => {
      const d = build();
      d.identityRepo.findLiveMembershipByProfile.mockResolvedValue({
        patientIdentityClusterId: CLUSTER,
      });
      d.identityRepo.findLiveMembers.mockResolvedValue([
        { patientProfileId: PATIENT },
        { patientProfileId: OTHER_PATIENT },
      ]);

      const res = await d.service.serveEverything(PATIENT, TENANT, actor);

      expect(res.includedPatientProfileIds).toEqual([PATIENT, OTHER_PATIENT]);
      expect(res.identityClusterId).toBe(CLUSTER);
      expect(d.resourcesRepo.findResourcesByPatient).toHaveBeenCalledWith(
        d.tx,
        TENANT,
        [PATIENT, OTHER_PATIENT],
        CONCEPTS.RESOURCE_ACTIVE,
      );
    });

    it('leaves out a resource with no live version', async () => {
      const d = build();
      d.resourcesRepo.findResourcesByPatient.mockResolvedValue([
        liveResource({ currentVersionId: undefined }),
      ]);

      const res = await d.service.serveEverything(PATIENT, TENANT, actor);

      expect(res.total).toBe(0);
      expect(d.resourcesRepo.findVersionsByIds).not.toHaveBeenCalled();
    });

    it('gives the same hash regardless of the order the query returned', async () => {
      const d = build();
      const versions = [
        { id: VERSION, versionNumber: 1, normalizedPayloadJson: {} },
        { id: 'version-2', versionNumber: 2, normalizedPayloadJson: {} },
      ];
      d.resourcesRepo.findResourcesByPatient.mockResolvedValue([
        liveResource(),
        liveResource({ id: 'resource-2', currentVersionId: 'version-2' }),
      ]);
      d.resourcesRepo.findVersionsByIds.mockResolvedValue(versions);
      const first = await d.service.serveEverything(PATIENT, TENANT, actor);

      const e = build();
      e.resourcesRepo.findResourcesByPatient.mockResolvedValue([
        liveResource({ id: 'resource-2', currentVersionId: 'version-2' }),
        liveResource(),
      ]);
      e.resourcesRepo.findVersionsByIds.mockResolvedValue(
        [...versions].reverse(),
      );
      const second = await e.service.serveEverything(PATIENT, TENANT, actor);

      expect(first.contentHash).toBe(second.contentHash);
    });

    it('returns an empty bundle when the patient has no resources', async () => {
      const d = build();

      const res = await d.service.serveEverything(PATIENT, TENANT, actor);

      expect(res.total).toBe(0);
      expect(res.entries).toEqual([]);
    });
  });
});
