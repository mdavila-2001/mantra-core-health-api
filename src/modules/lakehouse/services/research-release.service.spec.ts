import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CONCEPTS } from '../../../common';
import { ResearchReleaseService } from './research-release.service';

const actor = { id: 'user-1', roles: ['PRINCIPAL_INVESTIGATOR'] } as any;
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const PROJECT_ID = '22222222-2222-2222-2222-222222222222';
const COHORT_ID = '33333333-3333-3333-3333-333333333333';
const VERSION_ID = '44444444-4444-4444-4444-444444444444';
const REQUEST_ID = '55555555-5555-5555-5555-555555555555';
const PROFILE_ID = '66666666-6666-6666-6666-666666666666';
const PURPOSE_ID = '77777777-7777-7777-7777-777777777777';
const PI_ID = '88888888-8888-8888-8888-888888888888';

const FUTURE = new Date(Date.now() + 365 * 86_400_000);
const PAST = new Date(Date.now() - 86_400_000);

/**
 * Ejecuta la operación project.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de project.
 */
function project(overrides: any = {}) {
  return {
    id: PROJECT_ID,
    tenantId: TENANT_ID,
    code: 'estudio-1',
    state: 'approved',
    principalInvestigatorId: PI_ID,
    approvedFrom: PAST,
    approvedTo: FUTURE,
    ...overrides,
  };
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const researchRepo = {
    findProjectForUpdate: mockFn(async () => null),
    findProjectById: mockFn(async () => project()),
    findProjectByCode: mockFn(async () => null),
    createProject: mockFn((_tx: any, data: any) => ({
      id: data.id ?? PROJECT_ID,
      ...data,
    })),
    findCohortByVersion: mockFn(async () => null),
    findCohortById: mockFn(async () => ({
      id: COHORT_ID,
      researchProjectId: PROJECT_ID,
      state: 'active',
      deidentificationProfileId: PROFILE_ID,
    })),
    createCohort: mockFn((_tx: any, data: any) => ({ id: COHORT_ID, ...data })),
    createReleaseRequest: mockFn((_tx: any, data: any) => ({
      id: REQUEST_ID,
      requestedAt: new Date(),
      ...data,
    })),
    findReleaseRequestForUpdate: mockFn(async () => null),
    findManifestByRequestForUpdate: mockFn(async () => null),
    createManifest: mockFn((_tx: any, data: any) => ({
      id: 'manifest-1',
      ...data,
    })),
  };
  const catalogRepo = {
    findProductVersionById: mockFn(async () => ({
      id: VERSION_ID,
      dataProductId: 'prod-1',
    })),
    findProductForUpdate: mockFn(async () => ({
      id: 'prod-1',
      containsPhi: true,
    })),
  };
  const dataReleaseRepo = {
    createDeidRun: mockFn((_tx: any, data: any) => ({ id: 'deid-1', ...data })),
  };
  const outbox = {
    publishDomainEvent: mockFn(async () => ({ duplicate: false })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new ResearchReleaseService(
    em as any,
    researchRepo,
    catalogRepo as any,
    dataReleaseRepo as any,
    outbox as any,
    logger as any,
  );
  return {
    service,
    em,
    tx,
    researchRepo,
    catalogRepo,
    dataReleaseRepo,
    outbox,
    logger,
  };
}

const COHORT_DTO = {
  tenantId: TENANT_ID,
  projectCode: 'estudio-1',
  title: 'Estudio 1',
  principalInvestigatorId: PI_ID,
  ethicsApprovalReference: 'CEIC-2026-001',
  approvedFrom: PAST.toISOString(),
  approvedTo: FUTURE.toISOString(),
  cohortCode: 'c1',
  cohortVersion: '1',
  deidentificationProfileId: PROFILE_ID,
} as any;

describe('ResearchReleaseService', () => {
  describe('defineCohort (UC-63-09)', () => {
    it('crea el proyecto con el id de la ruta y su cohorte', async () => {
      const d = build();

      const result = await d.service.defineCohort(
        PROJECT_ID,
        COHORT_DTO,
        actor,
      );

      expect(d.researchRepo.createProject.mock.calls[0][1].id).toBe(PROJECT_ID);
      expect(result.state).toBe('active');
    });

    it('actualiza el proyecto existente', async () => {
      const d = build();
      const p = project({ title: 'viejo' });
      d.researchRepo.findProjectForUpdate.mockResolvedValue(p);

      await d.service.defineCohort(PROJECT_ID, COHORT_DTO, actor);

      expect(p.title).toBe('Estudio 1');
      expect(d.researchRepo.createProject).not.toHaveBeenCalled();
    });

    it('rechaza una ventana ética invertida', async () => {
      const d = build();

      await expect(
        d.service.defineCohort(
          PROJECT_ID,
          {
            ...COHORT_DTO,
            approvedFrom: FUTURE.toISOString(),
            approvedTo: PAST.toISOString(),
          },
          actor,
        ),
      ).rejects.toThrow(/antes de terminar/);
    });

    it('rechaza una aprobación ética ya caducada', async () => {
      const d = build();

      await expect(
        d.service.defineCohort(
          PROJECT_ID,
          {
            ...COHORT_DTO,
            approvedFrom: new Date(Date.now() - 2 * 86_400_000).toISOString(),
            approvedTo: PAST.toISOString(),
          },
          actor,
        ),
      ).rejects.toThrow(/caducada/);
    });

    it('rechaza duplicar la versión de la cohorte', async () => {
      const d = build();
      d.researchRepo.findCohortByVersion.mockResolvedValue({ id: 'ya-existe' });

      await expect(
        d.service.defineCohort(PROJECT_ID, COHORT_DTO, actor),
      ).rejects.toThrow(/ya está definida/);
    });

    it('rechaza crear si el código ya lo tiene otro proyecto', async () => {
      const d = build();
      d.researchRepo.findProjectByCode.mockResolvedValue({ id: 'otro' });

      await expect(
        d.service.defineCohort(PROJECT_ID, COHORT_DTO, actor),
      ).rejects.toThrow(/con otro identificador/);
    });
  });

  describe('requestRelease (UC-63-10)', () => {
    const DTO = {
      tenantId: TENANT_ID,
      researchProjectId: PROJECT_ID,
      dataProductVersionId: VERSION_ID,
      cohortDefinitionId: COHORT_ID,
      purposeOfUseCode: 'RESEARCH',
    } as any;

    it('crea la solicitud en estado submitted', async () => {
      const d = build();

      const result = await d.service.requestRelease(DTO, actor);

      expect(result.status).toBe('submitted');
    });

    it('rechaza un proyecto no aprobado', async () => {
      const d = build();
      d.researchRepo.findProjectById.mockResolvedValue(
        project({ state: 'draft' }),
      );

      await expect(d.service.requestRelease(DTO, actor)).rejects.toThrow(
        /no está aprobado/,
      );
    });

    it('rechaza una ventana ética no vigente', async () => {
      const d = build();
      d.researchRepo.findProjectById.mockResolvedValue(
        project({ approvedTo: PAST }),
      );

      await expect(d.service.requestRelease(DTO, actor)).rejects.toThrow(
        /no está vigente/,
      );
    });

    it('rechaza una cohorte de otro proyecto', async () => {
      const d = build();
      d.researchRepo.findCohortById.mockResolvedValue({
        id: COHORT_ID,
        researchProjectId: 'otro-proyecto',
      });

      await expect(d.service.requestRelease(DTO, actor)).rejects.toThrow(
        /no pertenece/,
      );
    });

    it('rechaza PHI sin perfil de de-identificación en la cohorte', async () => {
      const d = build();
      d.researchRepo.findCohortById.mockResolvedValue({
        id: COHORT_ID,
        researchProjectId: PROJECT_ID,
        state: 'active',
      });

      await expect(d.service.requestRelease(DTO, actor)).rejects.toThrow(
        /perfil de de-identificación/,
      );
    });
  });

  describe('approveRelease (UC-63-11)', () => {
    const DTO = {
      purposeConceptId: PURPOSE_ID,
      recordCount: '5000',
      contentHash: 'ch-1',
    } as any;

    /**
     * Ejecuta la operación with request.
     *
     * @param d - Valor de d requerido por la operación.
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de with request.
     */
    function withRequest(d: ReturnType<typeof build>, overrides: any = {}) {
      const request = {
        id: REQUEST_ID,
        tenantId: TENANT_ID,
        researchProjectId: PROJECT_ID,
        cohortDefinitionId: COHORT_ID,
        status: 'submitted',
        ...overrides,
      };
      d.researchRepo.findReleaseRequestForUpdate.mockResolvedValue(request);
      return request;
    }

    it('registra la de-identificación, el manifiesto y libera', async () => {
      const d = build();
      const request = withRequest(d);

      const result = await d.service.approveRelease(REQUEST_ID, DTO, actor);

      expect(request.status).toBe('released');
      expect(result.deidentificationRunId).toBe('deid-1');
      expect(
        d.dataReleaseRepo.createDeidRun.mock.calls[0][1].statusConceptId,
      ).toBe(CONCEPTS.DEID_COMPLETED);
    });

    it('el acceso nunca sobrevive a la aprobación ética', async () => {
      const d = build();
      withRequest(d);
      const nearExpiry = new Date(Date.now() + 5 * 86_400_000);
      d.researchRepo.findProjectById.mockResolvedValue(
        project({ approvedTo: nearExpiry }),
      );

      const result = await d.service.approveRelease(
        REQUEST_ID,
        { ...DTO, ttlDays: 365 },
        actor,
      );

      expect(new Date(result.expiresAt).getTime()).toBe(nearExpiry.getTime());
    });

    it('usa el plazo pedido si cabe dentro de la aprobación', async () => {
      const d = build();
      withRequest(d);

      const result = await d.service.approveRelease(
        REQUEST_ID,
        { ...DTO, ttlDays: 30 },
        actor,
      );

      const expected = Date.now() + 30 * 86_400_000;
      expect(
        Math.abs(new Date(result.expiresAt).getTime() - expected),
      ).toBeLessThan(5000);
    });

    it('es idempotente si el manifiesto ya existía', async () => {
      const d = build();
      withRequest(d, { status: 'released' });
      d.researchRepo.findManifestByRequestForUpdate.mockResolvedValue({
        id: 'manifest-previo',
        deidentificationRunId: 'deid-previo',
        expiresAt: FUTURE,
      });

      const result = await d.service.approveRelease(REQUEST_ID, DTO, actor);

      expect(result.alreadyReleased).toBe(true);
      expect(d.researchRepo.createManifest).not.toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('rechaza aprobar una solicitud que no está enviada', async () => {
      const d = build();
      withRequest(d, { status: 'revoked' });

      await expect(
        d.service.approveRelease(REQUEST_ID, DTO, actor),
      ).rejects.toThrow(/no está en un estado/);
    });

    it('rechaza materializar con la aprobación ética caducada', async () => {
      const d = build();
      withRequest(d);
      d.researchRepo.findProjectById.mockResolvedValue(
        project({ approvedTo: PAST }),
      );

      await expect(
        d.service.approveRelease(REQUEST_ID, DTO, actor),
      ).rejects.toThrow(/caducó/);
    });

    it('rechaza si la cohorte no declara perfil', async () => {
      const d = build();
      withRequest(d);
      d.researchRepo.findCohortById.mockResolvedValue({ id: COHORT_ID });

      await expect(
        d.service.approveRelease(REQUEST_ID, DTO, actor),
      ).rejects.toThrow(/perfil de de-identificación/);
    });

    it('el evento lleva a quién conceder el acceso temporal', async () => {
      const d = build();
      withRequest(d);

      await d.service.approveRelease(REQUEST_ID, DTO, actor);

      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventType: 'DatasetReleaseMaterialized',
          payloadJson: expect.objectContaining({ grantToUserId: PI_ID }),
        }),
      );
    });
  });

  describe('revokeRelease (UC-63-12)', () => {
    /**
     * Ejecuta la operación with released.
     *
     * @param d - Valor de d requerido por la operación.
     * @param status - Valor de status requerido por la operación.
     * @returns Resultado de with released.
     */
    function withReleased(d: ReturnType<typeof build>, status = 'released') {
      const request = { id: REQUEST_ID, tenantId: TENANT_ID, status };
      d.researchRepo.findReleaseRequestForUpdate.mockResolvedValue(request);
      return request;
    }

    it('revocar cierra como revoked y adelanta la caducidad', async () => {
      const d = build();
      const request = withReleased(d);
      const manifest = { id: 'manifest-1', expiresAt: FUTURE };
      d.researchRepo.findManifestByRequestForUpdate.mockResolvedValue(manifest);

      const result = await d.service.revokeRelease(REQUEST_ID, {}, actor);

      expect(request.status).toBe('revoked');
      expect(manifest.expiresAt.getTime()).toBeLessThanOrEqual(Date.now());
      expect(result.alreadyClosed).toBe(false);
    });

    it('expirar se distingue de revocar', async () => {
      const d = build();
      const request = withReleased(d);

      const result = await d.service.revokeRelease(
        REQUEST_ID,
        { expired: true },
        actor,
      );

      expect(request.status).toBe('expired');
      expect(result.status).toBe('expired');
    });

    it('es idempotente sobre un release ya cerrado', async () => {
      const d = build();
      withReleased(d, 'revoked');

      const result = await d.service.revokeRelease(REQUEST_ID, {}, actor);

      expect(result.alreadyClosed).toBe(true);
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('avisa en el log', async () => {
      const d = build();
      withReleased(d);

      await d.service.revokeRelease(REQUEST_ID, {}, actor);

      expect(d.logger.warn).toHaveBeenCalled();
    });
  });
});
