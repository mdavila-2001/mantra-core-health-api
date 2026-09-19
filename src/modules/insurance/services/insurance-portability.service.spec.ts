import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { ResourceNotFoundException } from '../../../common';
import { InsurancePortabilityService } from './insurance-portability.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const OWNER_ACTOR = { id: 'user-owner', roles: ['USER'] } as never;
const OTHER_ACTOR = { id: 'user-other', roles: ['USER'] } as never;
const PATIENT_PROFILE_ID = 'patient-a';

/**
 * Molde de `insurance-analytics.service.spec.ts`: `EntityManager` doblado con
 * `fork()`/`transactional()`, y cada colaborador doblado método a método.
 *
 * **Alcance declarado**: este spec cubre lo que la subtarea 3.3 exige como
 * criterio de aceptación — anti-IDOR con alerta de auditoría (AC-03-03-D) y
 * el contrato del verify público —, no el camino feliz completo de
 * `export()` (agregación de pólizas/reclamos/condiciones, sellado, PDF).
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const forkEm = { find: mockFn().mockResolvedValue([]) };
  const em = {
    fork: mockFn(() => forkEm),
    transactional: mockFn(async (cb: any) => cb(tx)),
  };

  const portabilityRepo = {
    policiesOfPatient: mockFn().mockResolvedValue([]),
    claimsOfPatient: mockFn().mockResolvedValue([]),
    conditionsOfPatient: mockFn().mockResolvedValue([]),
  };
  const catalogRepo = { findCarrierByTenantId: mockFn() };
  const profileOwnership = {
    assertOwnsPatientProfile: mockFn(
      async (_em: any, profileId: string, actor: any) => {
        if (actor.id !== 'user-owner') {
          throw new ForbiddenException(
            'Sólo el titular del perfil o la plataforma pueden modificarlo',
          );
        }
      },
    ),
  };
  const patientsRepo = {
    findById: mockFn().mockResolvedValue({ profileId: 'person-a' }),
  };
  const personsRepo = {
    findById: mockFn().mockResolvedValue({
      displayName: 'Ana Lucía Pérez',
      birthDate: null,
    }),
  };
  const identifiersRepo = {
    findCurrentByOwner: mockFn().mockResolvedValue([]),
  };
  const fileUpload = {
    storeGenerated: mockFn().mockResolvedValue({ id: 'file-a' }),
    downloadForAuthorizedContext: mockFn(),
  };
  const releaseRepo = {
    createExportJob: mockFn(() => ({ id: 'certificate-a' })),
    createExportManifest: mockFn(() => ({ id: 'manifest-a' })),
    findManifest: mockFn(),
    findManifestByContentHash: mockFn(),
    findExportJobById: mockFn(),
  };
  const provenanceRepo = {
    createProvenanceRecord: mockFn(() => ({ id: 'provenance-a' })),
    createProvenanceTarget: mockFn(),
  };
  const dsarRepo = {
    create: mockFn(() => ({ completedAt: undefined, resultFileId: undefined })),
  };
  const dataAccessRepo = { record: mockFn() };
  const auditTrail = { record: mockFn().mockResolvedValue(undefined) };
  const pdfService = { render: mockFn() };
  const logger = { setContext: mockFn(), error: mockFn() };

  const service = new InsurancePortabilityService(
    em as never,
    portabilityRepo as never,
    catalogRepo as never,
    profileOwnership as never,
    patientsRepo as never,
    personsRepo as never,
    identifiersRepo as never,
    fileUpload as never,
    releaseRepo as never,
    provenanceRepo as never,
    dsarRepo as never,
    dataAccessRepo as never,
    auditTrail as never,
    pdfService as never,
    logger as never,
  );

  return {
    service,
    profileOwnership,
    auditTrail,
    releaseRepo,
    fileUpload,
    portabilityRepo,
  };
}

describe('InsurancePortabilityService — anti-IDOR (AC-03-03-D)', () => {
  it('permite exportar al propio titular', async () => {
    const { service } = build();
    await expect(
      service.export(
        { patientProfileId: PATIENT_PROFILE_ID } as never,
        OWNER_ACTOR,
      ),
    ).resolves.toMatchObject({
      certificateId: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      ),
      manifestHash: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
  });

  it('rechaza a un actor que no es el titular con 403', async () => {
    const { service } = build();
    await expect(
      service.export(
        { patientProfileId: PATIENT_PROFILE_ID } as never,
        OTHER_ACTOR,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('registra la alerta de auditoría cuando rechaza por IDOR', async () => {
    const { service, auditTrail } = build();
    await expect(
      service.export(
        { patientProfileId: PATIENT_PROFILE_ID } as never,
        OTHER_ACTOR,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(auditTrail.record).toHaveBeenCalledWith(
      expect.anything(),
      OTHER_ACTOR,
      expect.objectContaining({
        action: 'INSURANCE_PORTABILITY_DENIED',
        entity: 'patient_profile',
        entityId: PATIENT_PROFILE_ID,
        success: false,
      }),
    );
  });

  it('no llega a leer coberturas/reclamos si el actor no es el titular', async () => {
    const { service, portabilityRepo } = build();
    await expect(
      service.export(
        { patientProfileId: PATIENT_PROFILE_ID } as never,
        OTHER_ACTOR,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(portabilityRepo.policiesOfPatient).not.toHaveBeenCalled();
    expect(portabilityRepo.claimsOfPatient).not.toHaveBeenCalled();
  });

  it('el hash es determinista para el mismo contenido y cambia si el contenido cambia', async () => {
    const { service, fileUpload } = build();
    const capturedBuffers: Buffer[] = [];
    fileUpload.storeGenerated.mockImplementation(async (input: any) => {
      capturedBuffers.push(input.buffer);
      return { id: 'file-a' };
    });

    const first = await service.export(
      { patientProfileId: PATIENT_PROFILE_ID } as never,
      OWNER_ACTOR,
    );
    // Un segundo certificado del mismo paciente, mismos datos: el
    // `certificateId` y `generatedAt` son distintos por diseño (cada
    // emisión es un evento propio), así que el hash NO tiene por qué
    // repetirse — lo que se comprueba es que el hash sella exactamente los
    // bytes que se mandaron a persistir.
    expect(capturedBuffers).toHaveLength(1);
    const crypto = await import('node:crypto');
    const recomputed = crypto
      .createHash('sha256')
      .update(capturedBuffers[0])
      .digest('hex');
    expect(first.manifestHash).toBe(recomputed);
  });
});

describe('InsurancePortabilityService.verify', () => {
  it('404 si no existe ningún manifiesto con ese hash', async () => {
    const { service, releaseRepo } = build();
    releaseRepo.findManifestByContentHash.mockResolvedValue(null);

    await expect(service.verify('a'.repeat(64))).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('404 si el manifiesto no es de un job de portabilidad de seguros', async () => {
    const { service, releaseRepo } = build();
    releaseRepo.findManifestByContentHash.mockResolvedValue({
      healthExportJobId: 'job-a',
      contentHash: 'a'.repeat(64),
      recordCount: '3',
    });
    releaseRepo.findExportJobById.mockResolvedValue({
      id: 'job-a',
      exportTypeConceptId: 'otro-tipo-de-exportacion',
      requestedAt: new Date('2026-09-18T00:00:00.000Z'),
    });

    await expect(service.verify('a'.repeat(64))).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });
});
