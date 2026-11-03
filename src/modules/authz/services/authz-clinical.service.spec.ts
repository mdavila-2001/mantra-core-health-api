import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AuthzClinicalService } from './authz-clinical.service';
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

const actor = { id: 'clin-1', roles: ['CLINICAL'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const grantsRepo = {
    findActiveInTenant: mockFn(),
    findById: mockFn(),
    create: mockFn(),
  };
  const btgRepo = { create: mockFn() };
  const dataAccessLogRepo = { record: mockFn() };
  const auditTrail = { record: mockFn().mockResolvedValue(undefined) };
  const outbox = {
    publishDomainEvent: mockFn().mockResolvedValue({ duplicate: false }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const { scope, scopeRepo } = buildClinicalScope();
  const service = new AuthzClinicalService(
    em as any,
    grantsRepo as any,
    btgRepo,
    dataAccessLogRepo as any,
    auditTrail as any,
    outbox as any,
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
    grantsRepo,
    btgRepo,
    dataAccessLogRepo,
    auditTrail,
    outbox,
  };
}

const future = new Date(Date.now() + 3_600_000);

describe('AuthzClinicalService', () => {
  describe('grantClinicalAccess (UC-06-06)', () => {
    it('grants clinical access for direct treatment without consent', async () => {
      const d = build();
      d.grantsRepo.findActiveInTenant.mockResolvedValue(null);
      d.grantsRepo.create.mockReturnValue({
        id: 'cag-1',
        createdAt: new Date(),
      });
      const res = await d.service.grantClinicalAccess(
        'pat-1',
        {
          grantedUserId: 'u2',
          tenantId: ACTIVE_TENANT,
          purposeOfUse: 'TREATMENT',
          accessLevel: 'READ',
          validTo: future,
        } as any,
        actor,
      );
      expect(res.id).toBe('cag-1');
    });

    it('requires consent for non-treatment purposes', async () => {
      const d = build();
      await expect(
        d.service.grantClinicalAccess(
          'pat-1',
          {
            grantedUserId: 'u2',
            tenantId: ACTIVE_TENANT,
            purposeOfUse: 'PAYMENT',
            accessLevel: 'READ',
            validTo: future,
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects an already active grant for the same user', async () => {
      const d = build();
      d.grantsRepo.findActiveInTenant.mockResolvedValue({ id: 'existing' });
      await expect(
        d.service.grantClinicalAccess(
          'pat-1',
          {
            grantedUserId: 'u2',
            tenantId: ACTIVE_TENANT,
            purposeOfUse: 'TREATMENT',
            accessLevel: 'READ',
            validTo: future,
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a non-positive validity window', async () => {
      const d = build();
      await expect(
        d.service.grantClinicalAccess(
          'pat-1',
          {
            grantedUserId: 'u2',
            tenantId: ACTIVE_TENANT,
            purposeOfUse: 'TREATMENT',
            accessLevel: 'READ',
            validTo: new Date(Date.now() - 1000),
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('breakTheGlass (UC-06-07)', () => {
    it('creates an emergency grant and a break-glass session', async () => {
      const d = build();
      d.grantsRepo.create.mockReturnValue({
        id: 'cag-e',
        createdAt: new Date(),
      });
      const res = await d.service.breakTheGlass(
        'pat-1',
        { tenantId: ACTIVE_TENANT, justification: 'unconscious patient in ER' },
        actor,
      );
      expect(res.id).toBe('cag-e');
      expect(d.btgRepo.create).toHaveBeenCalled();
      // Registra el evento de acceso de emergencia (datos consultados) en audit.
      expect(d.dataAccessLogRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          userId: actor.id,
          patientProfileId: 'pat-1',
          purpose: 'EMERGENCY',
          resourceId: 'pat-1',
        }),
      );
      expect(d.tx.flush).toHaveBeenCalledTimes(2);
      // CAN-EMERG-001: notificación posterior al paciente vía outbox transaccional.
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventType: 'authz.break_glass.activated' }),
      );
      // CAN-AUDIT-001: sellado en la cadena WORM.
      expect(d.auditTrail.record).toHaveBeenCalledWith(
        d.tx,
        actor,
        expect.objectContaining({ action: 'BREAK_GLASS_ACTIVATED' }),
      );
    });
  });

  describe('revokeClinicalAccess (UC-06-10)', () => {
    it('revokes an active grant', async () => {
      const d = build();
      const grant = {
        id: 'cag-1',
        tenantId: ACTIVE_TENANT,
        patientProfileId: 'pat-1',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        validTo: future,
        updatedAt: new Date(),
      };
      d.grantsRepo.findById.mockResolvedValue(grant);
      const res = await d.service.revokeClinicalAccess('cag-1', actor);
      expect(res).toEqual({ ok: true, affected: 1 });
      expect(grant.stateConceptId).toBe(CONCEPTS.STATE_REVOKED);
    });

    it('marks it expired when validTo already passed', async () => {
      const d = build();
      const grant = {
        id: 'cag-2',
        tenantId: ACTIVE_TENANT,
        patientProfileId: 'pat-1',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        validTo: new Date(Date.now() - 1000),
        updatedAt: new Date(),
      };
      d.grantsRepo.findById.mockResolvedValue(grant);
      await d.service.revokeClinicalAccess('cag-2', actor);
      expect(grant.stateConceptId).toBe(CONCEPTS.STATE_EXPIRED);
    });

    it('throws when the grant does not exist', async () => {
      const d = build();
      d.grantsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.revokeClinicalAccess('missing', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects revoking a non-active grant', async () => {
      const d = build();
      d.grantsRepo.findById.mockResolvedValue({
        id: 'cag-3',
        tenantId: ACTIVE_TENANT,
        patientProfileId: 'pat-1',
        stateConceptId: CONCEPTS.STATE_REVOKED,
      });
      await expect(
        d.service.revokeClinicalAccess('cag-3', actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('alcance de tenant (AUTHZ-M01)', () => {
    const grantDto = (overrides: Record<string, unknown> = {}) =>
      ({
        grantedUserId: 'u2',
        tenantId: ACTIVE_TENANT,
        purposeOfUse: 'TREATMENT',
        accessLevel: 'READ',
        validTo: future,
        ...overrides,
      }) as any;

    it('correcto: concede READ sobre un paciente, encuentro y consentimiento del tenant con auditoría del tenant', async () => {
      const d = build();
      d.grantsRepo.findActiveInTenant.mockResolvedValue(null);
      d.grantsRepo.create.mockReturnValue({
        id: 'cag-1',
        createdAt: new Date(),
      });
      await d.service.grantClinicalAccess(
        'pat-1',
        grantDto({
          purposeOfUse: 'PAYMENT',
          encounterId: 'enc-1',
          consentId: 'con-1',
        }),
        actor,
      );
      expect(d.grantsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          tenantId: ACTIVE_TENANT,
          patientProfileId: 'pat-1',
          encounterId: 'enc-1',
          consentId: 'con-1',
        }),
      );
      expect(d.grantsRepo.findActiveInTenant).toHaveBeenCalledWith(
        d.tx,
        'pat-1',
        'u2',
        ACTIVE_TENANT,
      );
      expect(d.auditTrail.record).toHaveBeenCalledWith(
        d.tx,
        actor,
        expect.objectContaining({ tenantId: ACTIVE_TENANT }),
      );
    });

    it('límite: tratamiento directo sin encuentro ni consentimiento no consulta ninguno', async () => {
      const d = build();
      d.grantsRepo.findActiveInTenant.mockResolvedValue(null);
      d.grantsRepo.create.mockReturnValue({
        id: 'cag-1',
        createdAt: new Date(),
      });
      await d.service.grantClinicalAccess('pat-1', grantDto(), actor);
      expect(d.scopeRepo.encounterScope).not.toHaveBeenCalled();
      expect(d.scopeRepo.consentScope).not.toHaveBeenCalled();
    });

    it('error: un paciente de otro tenant responde 404 AUTHZ_PATIENT_OUT_OF_SCOPE sin crear, sin duplicados ni auditoría', async () => {
      const d = build();
      const error = await thrown(
        d.service.grantClinicalAccess('pat-B', grantDto(), actor),
      );
      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.getStatus()).toBe(404);
      expect(error.reason).toBe(AuthzErrorReason.AUTHZ_PATIENT_OUT_OF_SCOPE);
      expect(error.details).toBeUndefined();
      expect(d.grantsRepo.findActiveInTenant).not.toHaveBeenCalled();
      expect(d.grantsRepo.create).not.toHaveBeenCalled();
      expect(d.auditTrail.record).not.toHaveBeenCalled();
    });

    it('error: un encuentro de otro paciente responde 404 AUTHZ_ENCOUNTER_PATIENT_MISMATCH', async () => {
      const d = build();
      d.scopeRepo.encounterScope.mockResolvedValue({
        tenantId: ACTIVE_TENANT,
        patientProfileId: 'pat-otro',
      });
      const error = await thrown(
        d.service.grantClinicalAccess(
          'pat-1',
          grantDto({ encounterId: 'enc-X' }),
          actor,
        ),
      );
      expect(error.getStatus()).toBe(404);
      expect(error.reason).toBe(
        AuthzErrorReason.AUTHZ_ENCOUNTER_PATIENT_MISMATCH,
      );
      expect(d.grantsRepo.create).not.toHaveBeenCalled();
    });

    it('error: un encuentro del mismo paciente pero de otro tenant, y uno inexistente, responden igual', async () => {
      const d = build();
      d.scopeRepo.encounterScope.mockResolvedValueOnce({
        tenantId: 't-otro',
        patientProfileId: 'pat-1',
      });
      const ajeno = await thrown(
        d.service.grantClinicalAccess(
          'pat-1',
          grantDto({ encounterId: 'enc-X' }),
          actor,
        ),
      );
      const inexistente = await thrown(
        d.service.grantClinicalAccess(
          'pat-1',
          grantDto({ encounterId: 'enc-nadie' }),
          actor,
        ),
      );
      expect(ajeno.message).toBe(inexistente.message);
      expect(ajeno.reason).toBe(inexistente.reason);
      expect(ajeno.details).toEqual(inexistente.details);
    });

    it('error: un consentimiento de otro paciente responde 404 AUTHZ_CONSENT_PATIENT_MISMATCH', async () => {
      const d = build();
      d.scopeRepo.consentScope.mockResolvedValue({
        tenantId: ACTIVE_TENANT,
        patientProfileId: 'pat-otro',
      });
      const error = await thrown(
        d.service.grantClinicalAccess(
          'pat-1',
          grantDto({ purposeOfUse: 'PAYMENT', consentId: 'con-X' }),
          actor,
        ),
      );
      expect(error.getStatus()).toBe(404);
      expect(error.reason).toBe(
        AuthzErrorReason.AUTHZ_CONSENT_PATIENT_MISMATCH,
      );
      expect(d.grantsRepo.create).not.toHaveBeenCalled();
    });

    it('error: un consentimiento sin tenant (legado) no respalda un acceso', async () => {
      const d = build();
      d.scopeRepo.consentScope.mockResolvedValue({
        tenantId: undefined,
        patientProfileId: 'pat-1',
      });
      const error = await thrown(
        d.service.grantClinicalAccess(
          'pat-1',
          grantDto({ purposeOfUse: 'PAYMENT', consentId: 'con-X' }),
          actor,
        ),
      );
      expect(error.reason).toBe(
        AuthzErrorReason.AUTHZ_CONSENT_PATIENT_MISMATCH,
      );
    });

    it('error: el tenant del cuerpo no es fuente de verdad: otro distinto al del contexto responde 403', async () => {
      const d = build();
      const error = await thrown(
        d.service.grantClinicalAccess(
          'pat-1',
          grantDto({ tenantId: 't-otro' }),
          actor,
        ),
      );
      expect(error.getStatus()).toBe(403);
      expect(error.reason).toBe(AuthzErrorReason.AUTHZ_TENANT_SCOPE_REQUIRED);
      expect(d.grantsRepo.create).not.toHaveBeenCalled();
    });

    it('sin tenant en el contexto no concede (no cae a un tenant por defecto)', async () => {
      const d = build();
      await expect(
        d.rawService.grantClinicalAccess('pat-1', grantDto(), actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.grantsRepo.create).not.toHaveBeenCalled();
    });

    it('break-the-glass sobre un paciente de otro tenant responde 404 y no deja grant, sesión, evento ni auditoría', async () => {
      const d = build();
      const error = await thrown(
        d.service.breakTheGlass(
          'pat-B',
          { tenantId: ACTIVE_TENANT, justification: 'paciente inconsciente' },
          actor,
        ),
      );
      expect(error.getStatus()).toBe(404);
      expect(error.reason).toBe(AuthzErrorReason.AUTHZ_PATIENT_OUT_OF_SCOPE);
      expect(d.grantsRepo.create).not.toHaveBeenCalled();
      expect(d.btgRepo.create).not.toHaveBeenCalled();
      expect(d.dataAccessLogRepo.record).not.toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
      expect(d.auditTrail.record).not.toHaveBeenCalled();
    });

    it('break-the-glass con un encuentro de otro paciente responde 404 y no crea nada', async () => {
      const d = build();
      d.scopeRepo.encounterScope.mockResolvedValue({
        tenantId: ACTIVE_TENANT,
        patientProfileId: 'pat-otro',
      });
      const error = await thrown(
        d.service.breakTheGlass(
          'pat-1',
          {
            tenantId: ACTIVE_TENANT,
            justification: 'paciente inconsciente',
            encounterId: 'enc-X',
          },
          actor,
        ),
      );
      expect(error.reason).toBe(
        AuthzErrorReason.AUTHZ_ENCOUNTER_PATIENT_MISMATCH,
      );
      expect(d.grantsRepo.create).not.toHaveBeenCalled();
      expect(d.btgRepo.create).not.toHaveBeenCalled();
    });

    it('break-the-glass registra todo con el tenant del contexto', async () => {
      const d = build();
      d.grantsRepo.create.mockReturnValue({
        id: 'cag-e',
        createdAt: new Date(),
      });
      await d.service.breakTheGlass(
        'pat-1',
        {
          tenantId: ACTIVE_TENANT,
          justification: 'paciente inconsciente',
          encounterId: 'enc-1',
        },
        actor,
      );
      for (const written of [
        d.grantsRepo.create.mock.calls[0][1],
        d.btgRepo.create.mock.calls[0][1],
        d.dataAccessLogRepo.record.mock.calls[0][1],
        d.outbox.publishDomainEvent.mock.calls[0][1],
        d.auditTrail.record.mock.calls[0][2],
      ]) {
        expect(written.tenantId).toBe(ACTIVE_TENANT);
      }
    });

    describe('revocación por id', () => {
      it('un acceso de otro tenant responde igual que uno inexistente y no se modifica', async () => {
        const d = build();
        const grant = {
          id: 'cag-B',
          tenantId: 't-otro',
          patientProfileId: 'pat-B',
          stateConceptId: CONCEPTS.STATE_ACTIVE,
          validTo: future,
          updatedAt: new Date(),
        };
        d.grantsRepo.findById.mockResolvedValueOnce(grant);
        const ajeno = await thrown(
          d.service.revokeClinicalAccess('cag-B', actor),
        );
        d.grantsRepo.findById.mockResolvedValueOnce(null);
        const inexistente = await thrown(
          d.service.revokeClinicalAccess('cag-X', actor),
        );
        expect(ajeno.getStatus()).toBe(404);
        expect(ajeno.reason).toBe(AuthzErrorReason.CLINICAL_ACCESS_NOT_FOUND);
        expect(ajeno.message).toBe(inexistente.message);
        expect(ajeno.reason).toBe(inexistente.reason);
        expect(ajeno.details).toBeUndefined();
        expect(inexistente.details).toBeUndefined();
        expect(grant.stateConceptId).toBe(CONCEPTS.STATE_ACTIVE);
        expect(d.auditTrail.record).not.toHaveBeenCalled();
      });

      it('el paciente titular revoca el acceso a su historia aunque sea de otra organización', async () => {
        const d = build();
        const grant = {
          id: 'cag-B',
          tenantId: 't-otro',
          patientProfileId: 'pat-B',
          stateConceptId: CONCEPTS.STATE_ACTIVE,
          validTo: future,
          updatedAt: new Date(),
        };
        d.grantsRepo.findById.mockResolvedValue(grant);
        const res = await d.service.revokeClinicalAccess('cag-B', {
          id: 'u-pat-B',
          roles: ['PATIENT'],
          patientProfileId: 'pat-B',
        } as any);
        expect(res).toEqual({ ok: true, affected: 1 });
        expect(grant.stateConceptId).toBe(CONCEPTS.STATE_REVOKED);
        expect(d.auditTrail.record).toHaveBeenCalledWith(
          d.tx,
          expect.anything(),
          expect.objectContaining({ tenantId: 't-otro' }),
        );
      });

      it('un actor de plataforma sin tenant en el contexto revoca por id', async () => {
        const d = build();
        const grant = {
          id: 'cag-B',
          tenantId: 't-otro',
          patientProfileId: 'pat-B',
          stateConceptId: CONCEPTS.STATE_ACTIVE,
          validTo: future,
          updatedAt: new Date(),
        };
        d.grantsRepo.findById.mockResolvedValue(grant);
        await d.rawService.revokeClinicalAccess('cag-B', {
          id: 'root',
          roles: ['SUPERADMIN'],
        } as any);
        expect(grant.stateConceptId).toBe(CONCEPTS.STATE_REVOKED);
      });

      it('un actor ordinario sin tenant en el contexto recibe TENANT_REQUIRED', async () => {
        const d = build();
        d.grantsRepo.findById.mockResolvedValue({
          id: 'cag-B',
          tenantId: 't-otro',
          patientProfileId: 'pat-B',
          stateConceptId: CONCEPTS.STATE_ACTIVE,
        });
        await expect(
          d.rawService.revokeClinicalAccess('cag-B', actor),
        ).rejects.toBeInstanceOf(PreconditionFailedException);
      });
    });
  });
});
