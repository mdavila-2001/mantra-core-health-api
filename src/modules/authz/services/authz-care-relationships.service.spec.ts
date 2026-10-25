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
import { AuthzErrorReason } from '../authz.error-reasons';
import {
  ACTIVE_TENANT,
  buildClinicalScope,
  inTenant,
  thrown,
} from './authz-clinical-scope.testing';

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
  const { scope, scopeRepo } = buildClinicalScope();
  const service = new AuthzCareRelationshipsService(
    em as any,
    careRepo as any,
    legalRepo as any,
    accountLinksRepo as any,
    auditTrail as any,
    outbox as any,
    notifications as any,
    scope,
    logger as any,
  );
  return {
    // Cada método corre con el tenant activo en el contexto, como en una petición.
    service: inTenant(service),
    // Sin tenant en el contexto: lo que ve un actor de plataforma que no declara ninguno.
    rawService: service,
    scopeRepo,
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
        tenantId: ACTIVE_TENANT,
        patientProfileId: 'pat-1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        validTo: future,
        updatedAt: new Date(),
      };
      d.careRepo.findById.mockResolvedValue(rel);
      const res = await d.service.revokeCareRelationship('cr-1', actor);
      expect(res).toEqual({ ok: true, affected: 1 });
      expect(rel.statusConceptId).toBe(CONCEPTS.STATE_REVOKED);
    });

    it('una relación abierta (valid_to = null en la base) queda REVOKED con la vigencia cerrada, no EXPIRED', async () => {
      // `null <= now` es verdadero: antes una relación sin fin se marcaba EXPIRED y
      // su vigencia seguía abierta. Se encontró contra la base real (BR-20).
      const d = build();
      const rel: any = {
        id: 'cr-abierta',
        tenantId: ACTIVE_TENANT,
        patientProfileId: 'pat-1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        validTo: null,
        updatedAt: new Date(),
      };
      d.careRepo.findById.mockResolvedValue(rel);
      await d.service.revokeCareRelationship('cr-abierta', actor);
      expect(rel.statusConceptId).toBe(CONCEPTS.STATE_REVOKED);
      expect(rel.validTo).toBeInstanceOf(Date);
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
        tenantId: ACTIVE_TENANT,
        patientProfileId: 'pat-1',
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

  describe('listMyPendingCareRelationshipRequests (FT-07-R06)', () => {
    it('lista sólo lo PENDING del paciente de la sesión', async () => {
      const d = build();
      d.careRepo.findPendingByPatient.mockResolvedValue([
        {
          id: 'cr-9',
          patientProfileId: 'pat-1',
          practitionerProfileId: 'pro-2',
          relationshipTypeConceptId: 'type-1',
          statusConceptId: CONCEPTS.STATE_PENDING,
          validFrom: future,
        },
      ]);
      const patient = {
        id: 'u-pat-1',
        roles: ['PATIENT'],
        patientProfileId: 'pat-1',
      } as any;

      const res =
        await d.service.listMyPendingCareRelationshipRequests(patient);

      expect(d.careRepo.findPendingByPatient).toHaveBeenCalledWith(
        expect.anything(),
        'pat-1',
      );
      expect(res).toEqual([
        expect.objectContaining({
          id: 'cr-9',
          practitionerProfileId: 'pro-2',
          statusConceptId: CONCEPTS.STATE_PENDING,
        }),
      ]);
    });

    it('sin perfil de paciente devuelve vacío sin consultar la base', async () => {
      const d = build();
      const accountWithoutProfile = { id: 'u-x', roles: ['PATIENT'] } as any;

      const res = await d.service.listMyPendingCareRelationshipRequests(
        accountWithoutProfile,
      );

      expect(res).toEqual([]);
      expect(d.careRepo.findPendingByPatient).not.toHaveBeenCalled();
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
        tenantId: ACTIVE_TENANT,
        patientProfileId: 'pat-1',
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

  describe('alcance de tenant de las bases de acceso (AUTHZ-M01)', () => {
    const missingPatient = (id: string) => ({
      tenantId: ACTIVE_TENANT,
      patientProfileId: id,
      practitionerProfileId: 'prac-1',
      relationshipType: 'TREATING',
    });

    it('persiste el tenant del contexto y no consulta si el paciente es de otro', async () => {
      const d = build();
      d.careRepo.findActive.mockResolvedValue(null);
      d.careRepo.create.mockReturnValue({ id: 'cr-1', createdAt: new Date() });
      await d.service.establishCareRelationship(
        missingPatient('pat-1') as any,
        actor,
      );
      expect(d.scopeRepo.patientHasFootprintInTenant).toHaveBeenCalledWith(
        d.tx,
        'pat-1',
        ACTIVE_TENANT,
      );
      expect(d.careRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          tenantId: ACTIVE_TENANT,
          patientProfileId: 'pat-1',
        }),
      );
    });

    it('un paciente de otro tenant responde 404 AUTHZ_PATIENT_OUT_OF_SCOPE y no crea ni consulta duplicados', async () => {
      const d = build();
      const error = await thrown(
        d.service.establishCareRelationship(
          missingPatient('pat-B') as any,
          actor,
        ),
      );
      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.reason).toBe(AuthzErrorReason.AUTHZ_PATIENT_OUT_OF_SCOPE);
      expect(error.details).toBeUndefined();
      expect(d.careRepo.findActive).not.toHaveBeenCalled();
      expect(d.careRepo.create).not.toHaveBeenCalled();
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('un paciente de otro tenant y uno inexistente son indistinguibles', async () => {
      const d = build();
      d.scopeRepo.patientExists.mockImplementation((_tx: unknown, id: string) =>
        Promise.resolve(id === 'pat-B' ? true : id === 'pat-1'),
      );
      const ajeno = await thrown(
        d.service.establishCareRelationship(
          missingPatient('pat-B') as any,
          actor,
        ),
      );
      const inexistente = await thrown(
        d.service.establishCareRelationship(
          missingPatient('pat-ninguno') as any,
          actor,
        ),
      );
      expect(ajeno.getStatus()).toBe(inexistente.getStatus());
      expect(ajeno.message).toBe(inexistente.message);
      expect(ajeno.reason).toBe(inexistente.reason);
      expect(ajeno.details).toEqual(inexistente.details);
    });

    it('un tenant en el cuerpo distinto al del contexto responde 403 y no persiste', async () => {
      const d = build();
      const error = await thrown(
        d.service.establishCareRelationship(
          { ...missingPatient('pat-1'), tenantId: 't-otro' } as any,
          actor,
        ),
      );
      expect(error.getStatus()).toBe(403);
      expect(error.reason).toBe(AuthzErrorReason.AUTHZ_TENANT_SCOPE_REQUIRED);
      expect(d.careRepo.create).not.toHaveBeenCalled();
    });

    it('la representación legal sobre un paciente de otro tenant responde 404 y no crea', async () => {
      const d = build();
      const error = await thrown(
        d.service.establishLegalRepresentation(
          {
            tenantId: ACTIVE_TENANT,
            patientProfileId: 'pat-B',
            representativeUserId: 'u9',
            representationType: 'PARENT',
          } as any,
          actor,
        ),
      );
      expect(error.reason).toBe(AuthzErrorReason.AUTHZ_PATIENT_OUT_OF_SCOPE);
      expect(d.legalRepo.findActive).not.toHaveBeenCalled();
      expect(d.legalRepo.create).not.toHaveBeenCalled();
    });

    it('la solicitud al paciente sólo exige que exista: aún no tiene vínculo con el tenant', async () => {
      const d = build();
      d.scopeRepo.patientExists.mockResolvedValue(true);
      d.scopeRepo.patientHasFootprintInTenant.mockResolvedValue(false);
      d.careRepo.findActive.mockResolvedValue(null);
      d.careRepo.findPending.mockResolvedValue(null);
      d.careRepo.create.mockReturnValue({ id: 'cr-1', createdAt: new Date() });
      const res = await d.service.requestCareRelationship(
        { tenantId: ACTIVE_TENANT, patientProfileId: 'pat-nuevo' } as any,
        {
          id: 'u-doc',
          roles: ['PRACTITIONER'],
          practitionerProfileId: 'p1',
        } as any,
      );
      expect(res.status).toBe(CONCEPTS.STATE_PENDING);
      expect(d.scopeRepo.patientHasFootprintInTenant).not.toHaveBeenCalled();
      expect(d.careRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          tenantId: ACTIVE_TENANT,
          statusConceptId: CONCEPTS.STATE_PENDING,
        }),
      );
    });

    it('la solicitud a un paciente inexistente responde 404 y no crea ni notifica', async () => {
      const d = build();
      const error = await thrown(
        d.service.requestCareRelationship(
          { tenantId: ACTIVE_TENANT, patientProfileId: 'pat-ninguno' } as any,
          {
            id: 'u-doc',
            roles: ['PRACTITIONER'],
            practitionerProfileId: 'p1',
          } as any,
        ),
      );
      expect(error.reason).toBe(AuthzErrorReason.AUTHZ_PATIENT_OUT_OF_SCOPE);
      expect(d.careRepo.create).not.toHaveBeenCalled();
      expect(d.notifications.emitInApp).not.toHaveBeenCalled();
    });

    describe('revocación por id', () => {
      const foreignRel = {
        id: 'cr-B',
        tenantId: 't-otro',
        patientProfileId: 'pat-B',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        updatedAt: new Date(),
      };

      it('una relación de otro tenant responde igual que una inexistente y no se modifica', async () => {
        const d = build();
        d.careRepo.findById.mockResolvedValueOnce({ ...foreignRel });
        const ajena = await thrown(
          d.service.revokeCareRelationship('cr-B', actor),
        );
        d.careRepo.findById.mockResolvedValueOnce(null);
        const inexistente = await thrown(
          d.service.revokeCareRelationship('cr-X', actor),
        );
        expect(ajena.getStatus()).toBe(404);
        expect(ajena.message).toBe(inexistente.message);
        expect(ajena.reason).toBe(AuthzErrorReason.CARE_RELATIONSHIP_NOT_FOUND);
        expect(ajena.reason).toBe(inexistente.reason);
        expect(ajena.details).toBeUndefined();
        expect(inexistente.details).toBeUndefined();
        expect(d.tx.flush).not.toHaveBeenCalled();
      });

      it('una representación de otro tenant responde 404 y no se modifica', async () => {
        const d = build();
        const rep = { ...foreignRel, id: 'lr-B' };
        d.legalRepo.findById.mockResolvedValue(rep);
        const error = await thrown(
          d.service.revokeLegalRepresentation('lr-B', actor),
        );
        expect(error.getStatus()).toBe(404);
        expect(error.reason).toBe(
          AuthzErrorReason.LEGAL_REPRESENTATION_NOT_FOUND,
        );
        expect(rep.statusConceptId).toBe(CONCEPTS.STATE_ACTIVE);
      });

      it('el paciente titular revoca su relación aunque sea de otra organización', async () => {
        const d = build();
        const rel = { ...foreignRel, id: 'cr-propia' };
        d.careRepo.findById.mockResolvedValue(rel);
        const res = await d.service.revokeCareRelationship('cr-propia', {
          id: 'u-pat-B',
          roles: ['PATIENT'],
          patientProfileId: 'pat-B',
        } as any);
        expect(res).toEqual({ ok: true, affected: 1 });
        expect(rel.statusConceptId).toBe(CONCEPTS.STATE_REVOKED);
      });

      it('otro paciente no revoca la relación ajena', async () => {
        const d = build();
        d.careRepo.findById.mockResolvedValue({ ...foreignRel });
        const error = await thrown(
          d.service.revokeCareRelationship('cr-B', {
            id: 'u-pat-1',
            roles: ['PATIENT'],
            patientProfileId: 'pat-1',
          } as any),
        );
        expect(error.getStatus()).toBe(404);
      });

      it('un actor de plataforma sin tenant en el contexto revoca por id', async () => {
        const d = build();
        const rel = { ...foreignRel, id: 'cr-plataforma' };
        d.careRepo.findById.mockResolvedValue(rel);
        const res = await d.rawService.revokeCareRelationship('cr-plataforma', {
          id: 'root',
          roles: ['SUPERADMIN'],
        } as any);
        expect(res).toEqual({ ok: true, affected: 1 });
        expect(rel.statusConceptId).toBe(CONCEPTS.STATE_REVOKED);
      });

      it('un actor ordinario sin tenant en el contexto recibe TENANT_REQUIRED y no se modifica nada', async () => {
        const d = build();
        d.careRepo.findById.mockResolvedValue({ ...foreignRel });
        await expect(
          d.rawService.revokeCareRelationship('cr-B', actor),
        ).rejects.toBeInstanceOf(PreconditionFailedException);
        expect(d.tx.flush).not.toHaveBeenCalled();
      });
    });
  });
});
