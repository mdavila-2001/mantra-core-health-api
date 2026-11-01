import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { AuthzErrorReason } from '../authz.error-reasons';
import {
  ACTIVE_TENANT,
  buildClinicalScope,
  inTenant,
  thrown,
} from './authz-clinical-scope.testing';

const tx = {} as any;

describe('AuthzClinicalScopeService', () => {
  describe('resolveTenant', () => {
    it('devuelve el tenant del contexto y acepta el del cuerpo si coincide', () => {
      const { scope } = buildClinicalScope();
      runWithTenant(ACTIVE_TENANT, () => {
        expect(scope.resolveTenant()).toBe(ACTIVE_TENANT);
        expect(scope.resolveTenant(ACTIVE_TENANT)).toBe(ACTIVE_TENANT);
      });
    });

    it('rechaza con 403 un tenant del cuerpo distinto del contexto', () => {
      const { scope } = buildClinicalScope();
      runWithTenant(ACTIVE_TENANT, () => {
        expect(() => scope.resolveTenant('t-otro')).toThrow(
          expect.objectContaining({
            reason: AuthzErrorReason.AUTHZ_TENANT_SCOPE_REQUIRED,
          }),
        );
      });
    });

    it('sin tenant en el contexto no usa el del cuerpo', () => {
      const { scope } = buildClinicalScope();
      expect(() => scope.resolveTenant(ACTIVE_TENANT)).toThrow();
    });
  });

  describe('assertPatientInTenant', () => {
    it('acepta al paciente que existe y tiene vínculo con el tenant', async () => {
      const { scope } = buildClinicalScope();
      await expect(
        scope.assertPatientInTenant(tx, 'pat-1', ACTIVE_TENANT),
      ).resolves.toBeUndefined();
    });

    it('rechaza con 404 al paciente que existe pero sin vínculo con el tenant', async () => {
      const { scope, scopeRepo } = buildClinicalScope();
      scopeRepo.patientExists.mockResolvedValue(true);
      scopeRepo.patientHasFootprintInTenant.mockResolvedValue(false);
      const error = await thrown(
        scope.assertPatientInTenant(tx, 'pat-B', ACTIVE_TENANT),
      );
      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.reason).toBe(AuthzErrorReason.AUTHZ_PATIENT_OUT_OF_SCOPE);
      expect(error.details).toBeUndefined();
    });

    it('rechaza a una persona con vínculo al tenant que no es paciente', async () => {
      const { scope, scopeRepo } = buildClinicalScope();
      scopeRepo.patientExists.mockResolvedValue(false);
      scopeRepo.patientHasFootprintInTenant.mockResolvedValue(true);
      const error = await thrown(
        scope.assertPatientInTenant(tx, 'staff-1', ACTIVE_TENANT),
      );
      expect(error.reason).toBe(AuthzErrorReason.AUTHZ_PATIENT_OUT_OF_SCOPE);
    });

    it('inexistente y ajeno responden idéntico', async () => {
      const { scope, scopeRepo } = buildClinicalScope();
      const inexistente = await thrown(
        scope.assertPatientInTenant(tx, 'pat-nadie', ACTIVE_TENANT),
      );
      scopeRepo.patientExists.mockResolvedValue(true);
      scopeRepo.patientHasFootprintInTenant.mockResolvedValue(false);
      const ajeno = await thrown(
        scope.assertPatientInTenant(tx, 'pat-B', ACTIVE_TENANT),
      );
      expect(ajeno.getStatus()).toBe(inexistente.getStatus());
      expect(ajeno.message).toBe(inexistente.message);
      expect(ajeno.reason).toBe(inexistente.reason);
      expect(ajeno.details).toEqual(inexistente.details);
    });
  });

  describe('assertEncounterOfPatient / assertConsentOfPatient', () => {
    it('acepta los del mismo tenant y paciente', async () => {
      const { scope } = buildClinicalScope();
      await expect(
        scope.assertEncounterOfPatient(tx, 'enc-1', 'pat-1', ACTIVE_TENANT),
      ).resolves.toBeUndefined();
      await expect(
        scope.assertConsentOfPatient(tx, 'con-1', 'pat-1', ACTIVE_TENANT),
      ).resolves.toBeUndefined();
    });

    it('rechaza los de otro tenant aunque el paciente coincida', async () => {
      const { scope, scopeRepo } = buildClinicalScope();
      const ajeno = { tenantId: 't-otro', patientProfileId: 'pat-1' };
      scopeRepo.encounterScope.mockResolvedValue(ajeno);
      scopeRepo.consentScope.mockResolvedValue(ajeno);
      expect(
        (
          await thrown(
            scope.assertEncounterOfPatient(tx, 'e', 'pat-1', ACTIVE_TENANT),
          )
        ).reason,
      ).toBe(AuthzErrorReason.AUTHZ_ENCOUNTER_PATIENT_MISMATCH);
      expect(
        (
          await thrown(
            scope.assertConsentOfPatient(tx, 'c', 'pat-1', ACTIVE_TENANT),
          )
        ).reason,
      ).toBe(AuthzErrorReason.AUTHZ_CONSENT_PATIENT_MISMATCH);
    });

    it('rechaza los de otro paciente aunque el tenant coincida', async () => {
      const { scope, scopeRepo } = buildClinicalScope();
      const otro = { tenantId: ACTIVE_TENANT, patientProfileId: 'pat-otro' };
      scopeRepo.encounterScope.mockResolvedValue(otro);
      scopeRepo.consentScope.mockResolvedValue(otro);
      await expect(
        scope.assertEncounterOfPatient(tx, 'e', 'pat-1', ACTIVE_TENANT),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      await expect(
        scope.assertConsentOfPatient(tx, 'c', 'pat-1', ACTIVE_TENANT),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('scopeRevocation', () => {
    const failure = { message: 'No existe', reason: 'X_NOT_FOUND' };
    const row = { tenantId: ACTIVE_TENANT, patientProfileId: 'pat-1' };

    it('devuelve la fila del tenant activo', () => {
      const { scope } = buildClinicalScope();
      const result = inTenant(scope).scopeRevocation(
        row,
        { id: 'a', roles: ['SECURITY_ADMIN'] } as any,
        failure,
      );
      expect(result).toBe(row);
    });

    it('con tenant activo, una fila inexistente es 404', () => {
      const { scope } = buildClinicalScope();
      expect(() =>
        inTenant(scope).scopeRevocation(
          null,
          { id: 'a', roles: ['SECURITY_ADMIN'] } as any,
          failure,
        ),
      ).toThrow(ResourceNotFoundException);
    });

    it('un actor de plataforma sin tenant y sin fila recibe 404, no un error de tenant', () => {
      const { scope } = buildClinicalScope();
      expect(() =>
        scope.scopeRevocation(
          null,
          { id: 'a', roles: ['SUPERADMIN'] } as any,
          failure,
        ),
      ).toThrow(ResourceNotFoundException);
    });

    it('un actor SYSTEM global sin tenant revoca por id', () => {
      const { scope } = buildClinicalScope();
      expect(
        scope.scopeRevocation(
          row,
          { id: 'sys', roles: ['SYSTEM'] } as any,
          failure,
        ),
      ).toBe(row);
    });

    it('un SYSTEM acotado a un tenant no revoca sin tenant en el contexto', () => {
      const { scope } = buildClinicalScope();
      expect(() =>
        scope.scopeRevocation(
          row,
          {
            id: 'sys',
            roles: ['SYSTEM'],
            scopedRoles: { [ACTIVE_TENANT]: ['SYSTEM'] },
          } as any,
          failure,
        ),
      ).toThrow(PreconditionFailedException);
    });

    it('un SUPERADMIN acotado (al tenant de la fila o a otro) no revoca sin tenant en el contexto (#1241)', () => {
      const { scope } = buildClinicalScope();
      for (const tenantId of [ACTIVE_TENANT, 'tenant-otra']) {
        expect(() =>
          scope.scopeRevocation(
            row,
            {
              id: 'sa',
              roles: ['SUPERADMIN'],
              scopedRoles: { [tenantId]: ['SUPERADMIN'] },
            } as any,
            failure,
          ),
        ).toThrow(PreconditionFailedException);
      }
      expect(
        scope.scopeRevocation(
          row,
          { id: 'sa-g', roles: ['SUPERADMIN'] } as any,
          failure,
        ),
      ).toBe(row);
    });
  });
});
