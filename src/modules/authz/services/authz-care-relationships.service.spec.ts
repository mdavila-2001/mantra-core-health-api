import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AuthzCareRelationshipsService } from './authz-care-relationships.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'sec-1', roles: ['SECURITY_ADMIN'] } as any;
const future = new Date(Date.now() + 3_600_000);

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const forkEm = {};
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => forkEm),
  };
  const careRepo = {
    findActive: mockFn(),
    findPending: mockFn().mockResolvedValue(null),
    findById: mockFn(),
    findByPatient: mockFn().mockResolvedValue([]),
    findPendingByPatient: mockFn().mockResolvedValue([]),
    create: mockFn(),
  };
  const legalRepo = {
    findActive: mockFn(),
    findById: mockFn(),
    findByPatient: mockFn().mockResolvedValue([]),
    create: mockFn(),
  };
  const accountLinksRepo = {
    findActiveByPerson: mockFn().mockResolvedValue(null),
  };
  const auditTrail = { record: mockFn().mockResolvedValue(undefined) };
  const outbox = { publishDomainEvent: mockFn().mockResolvedValue(undefined) };
  const notifications = {
    emitInApp: mockFn().mockResolvedValue({ suppressed: false }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new AuthzCareRelationshipsService(
    em as any,
    careRepo as any,
    legalRepo as any,
    accountLinksRepo as any,
    auditTrail as any,
    outbox as any,
    notifications as any,
    logger as any,
  );
  return {
    service,
    tx,
    careRepo,
    legalRepo,
    accountLinksRepo,
    auditTrail,
    outbox,
    notifications,
  };
}

describe('AuthzCareRelationshipsService', () => {
  describe('establishCareRelationship (C-06)', () => {
    it('establishes an active care relationship', async () => {
      const d = build();
      d.careRepo.findActive.mockResolvedValue(null);
      d.careRepo.create.mockReturnValue({ id: 'cr-1', createdAt: new Date() });
      const res = await d.service.establishCareRelationship(
        {
          tenantId: 't1',
          patientProfileId: 'pat-1',
          practitionerProfileId: 'prac-1',
          relationshipType: 'TREATING',
        } as any,
        actor,
      );
      expect(res.id).toBe('cr-1');
      expect(res.status).toBe(CONCEPTS.STATE_ACTIVE);
    });

    it('rejects a duplicate active care relationship', async () => {
      const d = build();
      d.careRepo.findActive.mockResolvedValue({ id: 'existing' });
      await expect(
        d.service.establishCareRelationship(
          {
            tenantId: 't1',
            patientProfileId: 'pat-1',
            practitionerProfileId: 'prac-1',
            relationshipType: 'TREATING',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a non-positive validity window', async () => {
      const d = build();
      await expect(
        d.service.establishCareRelationship(
          {
            tenantId: 't1',
            patientProfileId: 'pat-1',
            practitionerProfileId: 'prac-1',
            relationshipType: 'TREATING',
            validTo: new Date(Date.now() - 1000),
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('revokeCareRelationship (C-06)', () => {
    it('revokes an active relationship without deleting it', async () => {
      const d = build();
      const rel = {
        id: 'cr-1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        validTo: future,
        updatedAt: new Date(),
      };
      d.careRepo.findById.mockResolvedValue(rel);
      const res = await d.service.revokeCareRelationship('cr-1', actor);
      expect(res).toEqual({ ok: true, affected: 1 });
      expect(rel.statusConceptId).toBe(CONCEPTS.STATE_REVOKED);
    });

    it('throws when the relationship does not exist', async () => {
      const d = build();
      d.careRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.revokeCareRelationship('missing', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects revoking a non-active relationship', async () => {
      const d = build();
      d.careRepo.findById.mockResolvedValue({
        id: 'cr-2',
        statusConceptId: CONCEPTS.STATE_REVOKED,
      });
      await expect(
        d.service.revokeCareRelationship('cr-2', actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('requestCareRelationship (FT-07-R05)', () => {
    const practitioner = {
      id: 'u-doc-1',
      roles: ['PRACTITIONER'],
      practitionerProfileId: 'prac-1',
    } as any;

    it('crea la solicitud en PENDING y notifica al paciente', async () => {
      const d = build();
      d.careRepo.findActive.mockResolvedValue(null);
      d.careRepo.findPending.mockResolvedValue(null);
      d.careRepo.create.mockReturnValue({ id: 'cr-1', createdAt: new Date() });
      d.accountLinksRepo.findActiveByPerson.mockResolvedValue({
        userId: 'u-pat-1',
      });

      const res = await d.service.requestCareRelationship(
        { tenantId: 't1', patientProfileId: 'pat-1' } as any,
        practitioner,
      );

      expect(res.id).toBe('cr-1');
      expect(res.status).toBe(CONCEPTS.STATE_PENDING);
      expect(d.auditTrail.record).toHaveBeenCalledWith(
        d.tx,
        practitioner,
        expect.objectContaining({ action: 'CARE_RELATIONSHIP_REQUESTED' }),
      );
      expect(d.notifications.emitInApp).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientUserId: 'u-pat-1',
          category: 'CLINICAL',
          destination: { type: 'CARE_RELATIONSHIP_REQUEST', id: 'cr-1' },
        }),
      );
    });

    it('no falla si el paciente no tiene cuenta activa: sólo omite la notificación', async () => {
      const d = build();
      d.careRepo.findActive.mockResolvedValue(null);
      d.careRepo.findPending.mockResolvedValue(null);
      d.careRepo.create.mockReturnValue({ id: 'cr-1', createdAt: new Date() });
      d.accountLinksRepo.findActiveByPerson.mockResolvedValue(null);

      await expect(
        d.service.requestCareRelationship(
          { tenantId: 't1', patientProfileId: 'pat-1' } as any,
          practitioner,
        ),
      ).resolves.toMatchObject({ id: 'cr-1' });
      expect(d.notifications.emitInApp).not.toHaveBeenCalled();
    });

    it('rechaza sin perfil de practicante propio', async () => {
      const d = build();
      await expect(
        d.service.requestCareRelationship(
          { tenantId: 't1', patientProfileId: 'pat-1' } as any,
          { id: 'u1', roles: ['PRACTITIONER'] } as any,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rechaza si ya hay una relación activa con ese paciente', async () => {
      const d = build();
      d.careRepo.findActive.mockResolvedValue({ id: 'existing' });
      await expect(
        d.service.requestCareRelationship(
          { tenantId: 't1', patientProfileId: 'pat-1' } as any,
          practitioner,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rechaza una segunda solicitud mientras la primera sigue pendiente', async () => {
      const d = build();
      d.careRepo.findActive.mockResolvedValue(null);
      d.careRepo.findPending.mockResolvedValue({ id: 'cr-pending' });
      await expect(
        d.service.requestCareRelationship(
          { tenantId: 't1', patientProfileId: 'pat-1' } as any,
          practitioner,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('respondToCareRelationshipRequest (FT-07-R06/R07)', () => {
    const patientActor = {
      id: 'u-pat-1',
      roles: ['PATIENT'],
      patientProfileId: 'pat-1',
    } as any;

    it('ACCEPT activa la relación y registra las especialidades autorizadas', async () => {
      const d = build();
      const rel: any = {
        id: 'cr-1',
        patientProfileId: 'pat-1',
        practitionerProfileId: 'prac-1',
        tenantId: 't1',
        statusConceptId: CONCEPTS.STATE_PENDING,
      };
      d.careRepo.findById.mockResolvedValue(rel);

      const res = await d.service.respondToCareRelationshipRequest(
        'cr-1',
        {
          decision: 'ACCEPT',
          authorizedSpecialtyConceptIds: ['spec-1'],
        } as any,
        patientActor,
      );

      expect(res).toEqual({ ok: true, affected: 1 });
      expect(rel.statusConceptId).toBe(CONCEPTS.STATE_ACTIVE);
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventType: 'authz.care_relationship.responded',
          payloadJson: expect.objectContaining({
            decision: 'ACCEPT',
            authorizedSpecialtyConceptIds: ['spec-1'],
          }),
        }),
      );
    });

    it('REJECT cierra la solicitud sin activarla', async () => {
      const d = build();
      const rel: any = {
        id: 'cr-1',
        patientProfileId: 'pat-1',
        practitionerProfileId: 'prac-1',
        tenantId: 't1',
        statusConceptId: CONCEPTS.STATE_PENDING,
      };
      d.careRepo.findById.mockResolvedValue(rel);

      await d.service.respondToCareRelationshipRequest(
        'cr-1',
        { decision: 'REJECT' } as any,
        patientActor,
      );

      expect(rel.statusConceptId).toBe(CONCEPTS.STATE_REVOKED);
    });

    it('rechaza si quien responde no es el paciente titular', async () => {
      const d = build();
      d.careRepo.findById.mockResolvedValue({
        id: 'cr-1',
        patientProfileId: 'pat-OTRO',
        statusConceptId: CONCEPTS.STATE_PENDING,
      });
      await expect(
        d.service.respondToCareRelationshipRequest(
          'cr-1',
          { decision: 'ACCEPT' } as any,
          patientActor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rechaza responder una solicitud que ya no está pendiente', async () => {
      const d = build();
      d.careRepo.findById.mockResolvedValue({
        id: 'cr-1',
        patientProfileId: 'pat-1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      });
      await expect(
        d.service.respondToCareRelationshipRequest(
          'cr-1',
          { decision: 'ACCEPT' } as any,
          patientActor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rechaza si la solicitud no existe', async () => {
      const d = build();
      d.careRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.respondToCareRelationshipRequest(
          'missing',
          { decision: 'ACCEPT' } as any,
          patientActor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('legal representation (C-07/A-03)', () => {
    it('registers an active legal representation', async () => {
      const d = build();
      d.legalRepo.findActive.mockResolvedValue(null);
      d.legalRepo.create.mockReturnValue({ id: 'lr-1', createdAt: new Date() });
      const res = await d.service.establishLegalRepresentation(
        {
          tenantId: 't1',
          patientProfileId: 'pat-1',
          representativeUserId: 'u9',
          representationType: 'LEGAL_GUARDIAN',
        } as any,
        actor,
      );
      expect(res.id).toBe('lr-1');
      expect(res.status).toBe(CONCEPTS.STATE_ACTIVE);
    });

    it('rejects a duplicate active representation', async () => {
      const d = build();
      d.legalRepo.findActive.mockResolvedValue({ id: 'existing' });
      await expect(
        d.service.establishLegalRepresentation(
          {
            tenantId: 't1',
            patientProfileId: 'pat-1',
            representativeUserId: 'u9',
            representationType: 'PARENT',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('revokes an active representation without deleting it', async () => {
      const d = build();
      const rep = {
        id: 'lr-1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        validTo: undefined,
        updatedAt: new Date(),
      };
      d.legalRepo.findById.mockResolvedValue(rep);
      const res = await d.service.revokeLegalRepresentation('lr-1', actor);
      expect(res).toEqual({ ok: true, affected: 1 });
      expect(rep.statusConceptId).toBe(CONCEPTS.STATE_REVOKED);
    });
  });
});
