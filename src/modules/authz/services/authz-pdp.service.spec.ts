import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AuthzPdpService } from './authz-pdp.service';
import { AUTHZ } from '../authz.concepts';
import { CONCEPTS } from '../../../common';

const actor = { id: 'sys-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const forkEm = {};
  const em = { fork: mockFn(() => forkEm) };
  const rolesRepo = { findById: mockFn().mockResolvedValue(null) };
  const rolePermsRepo = { findActiveForRoles: mockFn().mockResolvedValue([]) };
  const permissionsRepo = {
    findByResourceAction: mockFn().mockResolvedValue(null),
  };
  const assignmentsRepo = { findActiveForUser: mockFn().mockResolvedValue([]) };
  const permGrantsRepo = { findActiveForUser: mockFn().mockResolvedValue([]) };
  const policiesRepo = { findActiveForTarget: mockFn().mockResolvedValue([]) };
  const clinicalRepo = {
    findActiveForUserPatient: mockFn().mockResolvedValue([]),
  };
  const careRelationshipsRepo = {
    findActiveForPractitionerPatient: mockFn().mockResolvedValue([]),
  };
  const legalRepresentationsRepo = {
    findActiveForRepresentativePatient: mockFn().mockResolvedValue([]),
  };
  const resourceGrantsRepo = {
    findForSubjectResource: mockFn().mockResolvedValue([]),
  };
  const fieldPermsRepo = { findForRoles: mockFn().mockResolvedValue([]) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new AuthzPdpService(
    em as any,
    rolesRepo as any,
    rolePermsRepo as any,
    permissionsRepo as any,
    assignmentsRepo as any,
    permGrantsRepo as any,
    policiesRepo as any,
    clinicalRepo as any,
    careRelationshipsRepo as any,
    legalRepresentationsRepo as any,
    resourceGrantsRepo as any,
    fieldPermsRepo as any,
    logger as any,
  );
  return {
    service,
    rolesRepo,
    rolePermsRepo,
    permissionsRepo,
    assignmentsRepo,
    permGrantsRepo,
    policiesRepo,
    clinicalRepo,
    careRelationshipsRepo,
    legalRepresentationsRepo,
    resourceGrantsRepo,
    fieldPermsRepo,
  };
}

const baseDto = {
  userId: 'u1',
  tenantId: 't1',
  resource: 'patient',
  action: 'READ',
} as any;

describe('AuthzPdpService', () => {
  describe('invalidateCache (UC-06-11)', () => {
    it('builds a logical cache key and counts dimensions', () => {
      const d = build();
      const res = d.service.invalidateCache(
        { tenantId: 't1', userId: 'u1' },
        actor,
      );
      expect(res.ok).toBe(true);
      expect(res.cacheKey).toBe('pdp:t1:u1');
      expect(res.invalidatedEntries).toBe(2);
    });

    it('falls back to a wildcard key with no fields', () => {
      const d = build();
      const res = d.service.invalidateCache({}, actor);
      expect(res.cacheKey).toBe('pdp:*:*');
      expect(res.invalidatedEntries).toBe(1);
    });
  });

  describe('evaluate (UC-06-12)', () => {
    it('DENY by default when there is no permission or signal', async () => {
      const d = build();
      const res = await d.service.evaluate(baseDto, actor);
      expect(res.decision).toBe('DENY');
      expect(res.cacheKey).toContain('pdp:t1:u1:patient:READ');
    });

    it('PERMIT via an allow role permission on an effective role', async () => {
      const d = build();
      d.permissionsRepo.findByResourceAction.mockResolvedValue({
        id: 'perm-1',
      });
      d.assignmentsRepo.findActiveForUser.mockResolvedValue([
        { roleId: 'role-1', validFrom: null, validTo: null },
      ]);
      d.rolePermsRepo.findActiveForRoles.mockResolvedValue([
        { permissionId: 'perm-1', effectConceptId: AUTHZ.EFFECT_ALLOW },
      ]);
      const res = await d.service.evaluate(baseDto, actor);
      expect(res.decision).toBe('PERMIT');
      expect(res.effectiveRoleIds).toContain('role-1');
    });

    it('deny-overrides: a deny policy beats an allow role', async () => {
      const d = build();
      d.permissionsRepo.findByResourceAction.mockResolvedValue({
        id: 'perm-1',
      });
      d.assignmentsRepo.findActiveForUser.mockResolvedValue([
        { roleId: 'role-1', validFrom: null, validTo: null },
      ]);
      d.rolePermsRepo.findActiveForRoles.mockResolvedValue([
        { permissionId: 'perm-1', effectConceptId: AUTHZ.EFFECT_ALLOW },
      ]);
      d.policiesRepo.findActiveForTarget.mockResolvedValue([
        { name: 'no-export', effectConceptId: AUTHZ.EFFECT_DENY },
      ]);
      const res = await d.service.evaluate(baseDto, actor);
      expect(res.decision).toBe('DENY');
    });

    it('DENY: a role ALLOW alone does not grant access to a patient without clinical scope (CAN-AUTH-001/UNSCOPED_ACCESS)', async () => {
      const d = build();
      d.permissionsRepo.findByResourceAction.mockResolvedValue({
        id: 'perm-1',
      });
      d.assignmentsRepo.findActiveForUser.mockResolvedValue([
        { roleId: 'role-1', validFrom: null, validTo: null },
      ]);
      d.rolePermsRepo.findActiveForRoles.mockResolvedValue([
        { permissionId: 'perm-1', effectConceptId: AUTHZ.EFFECT_ALLOW },
      ]);
      // Sin grant clínico, ni relación asistencial, ni representación legal.
      const res = await d.service.evaluate(
        { ...baseDto, patientProfileId: 'pat-1', purposeOfUse: 'TREATMENT' },
        actor,
      );
      expect(res.decision).toBe('DENY');
      expect(res.reason).toContain('sin alcance clínico');
    });

    it('resolves role inheritance through parent_role_id', async () => {
      const d = build();
      d.permissionsRepo.findByResourceAction.mockResolvedValue({
        id: 'perm-1',
      });
      d.assignmentsRepo.findActiveForUser.mockResolvedValue([
        { roleId: 'child', validFrom: null, validTo: null },
      ]);
      d.rolesRepo.findById.mockImplementation((_em: any, id: string) =>
        Promise.resolve(
          id === 'child'
            ? { id: 'child', parentRoleId: 'parent' }
            : { id: 'parent' },
        ),
      );
      d.rolePermsRepo.findActiveForRoles.mockResolvedValue([
        { permissionId: 'perm-1', effectConceptId: AUTHZ.EFFECT_ALLOW },
      ]);
      const res = await d.service.evaluate(baseDto, actor);
      expect(res.effectiveRoleIds).toEqual(
        expect.arrayContaining(['child', 'parent']),
      );
      expect(d.rolePermsRepo.findActiveForRoles).toHaveBeenCalledWith(
        {},
        expect.arrayContaining(['child', 'parent']),
      );
    });

    it('PERMIT via an active clinical access grant when level and purpose match', async () => {
      const d = build();
      d.permissionsRepo.findByResourceAction.mockResolvedValue({
        id: 'perm-1',
      });
      d.clinicalRepo.findActiveForUserPatient.mockResolvedValue([
        {
          validFrom: null,
          validTo: new Date(Date.now() + 3_600_000),
          reasonConceptId: AUTHZ.PURPOSE_TREATMENT,
          accessLevelConceptId: AUTHZ.ACCESS_LEVEL_READ,
        },
      ]);
      const res = await d.service.evaluate(
        { ...baseDto, patientProfileId: 'pat-1', purposeOfUse: 'TREATMENT' },
        actor,
      );
      expect(res.decision).toBe('PERMIT');
      expect(res.purposeOfUse).toBe('TREATMENT');
    });

    it('DENY: a READ clinical grant does not authorize DELETE (CAN-AUTH-001)', async () => {
      const d = build();
      d.permissionsRepo.findByResourceAction.mockResolvedValue({
        id: 'perm-1',
      });
      d.clinicalRepo.findActiveForUserPatient.mockResolvedValue([
        {
          validFrom: null,
          validTo: new Date(Date.now() + 3_600_000),
          reasonConceptId: AUTHZ.PURPOSE_TREATMENT,
          accessLevelConceptId: AUTHZ.ACCESS_LEVEL_READ,
        },
      ]);
      const res = await d.service.evaluate(
        {
          ...baseDto,
          action: 'DELETE',
          patientProfileId: 'pat-1',
          purposeOfUse: 'TREATMENT',
        },
        actor,
      );
      expect(res.decision).toBe('DENY');
    });

    it('DENY: a clinical grant with a different purpose of use does not authorize', async () => {
      const d = build();
      d.permissionsRepo.findByResourceAction.mockResolvedValue({
        id: 'perm-1',
      });
      d.clinicalRepo.findActiveForUserPatient.mockResolvedValue([
        {
          validFrom: null,
          validTo: new Date(Date.now() + 3_600_000),
          reasonConceptId: AUTHZ.PURPOSE_TREATMENT,
          accessLevelConceptId: AUTHZ.ACCESS_LEVEL_FULL,
        },
      ]);
      const res = await d.service.evaluate(
        { ...baseDto, patientProfileId: 'pat-1', purposeOfUse: 'PAYMENT' },
        actor,
      );
      expect(res.decision).toBe('DENY');
    });

    it('DENY: a clinical grant requires an explicit purpose of use to authorize', async () => {
      const d = build();
      d.permissionsRepo.findByResourceAction.mockResolvedValue({
        id: 'perm-1',
      });
      d.clinicalRepo.findActiveForUserPatient.mockResolvedValue([
        {
          validFrom: null,
          validTo: new Date(Date.now() + 3_600_000),
          reasonConceptId: AUTHZ.PURPOSE_TREATMENT,
          accessLevelConceptId: AUTHZ.ACCESS_LEVEL_READ,
        },
      ]);
      const res = await d.service.evaluate(
        { ...baseDto, patientProfileId: 'pat-1' },
        actor,
      );
      expect(res.decision).toBe('DENY');
    });

    it('PERMIT via an active care relationship (C-06/CAN-AUTH-001)', async () => {
      const d = build();
      d.permissionsRepo.findByResourceAction.mockResolvedValue({
        id: 'perm-1',
      });
      d.careRelationshipsRepo.findActiveForPractitionerPatient.mockResolvedValue(
        [
          {
            statusConceptId: CONCEPTS.STATE_ACTIVE,
            validFrom: null,
            validTo: new Date(Date.now() + 3_600_000),
            purposeConceptId: null,
          },
        ],
      );
      const res = await d.service.evaluate(
        {
          ...baseDto,
          patientProfileId: 'pat-1',
          practitionerProfileId: 'prac-1',
        },
        actor,
      );
      expect(res.decision).toBe('PERMIT');
      expect(res.reason).toContain('relación asistencial vigente');
      expect(
        d.careRelationshipsRepo.findActiveForPractitionerPatient,
      ).toHaveBeenCalledWith({}, 'prac-1', 'pat-1');
    });

    it('DENY: an expired care relationship does not authorize', async () => {
      const d = build();
      d.permissionsRepo.findByResourceAction.mockResolvedValue({
        id: 'perm-1',
      });
      d.careRelationshipsRepo.findActiveForPractitionerPatient.mockResolvedValue(
        [
          {
            statusConceptId: CONCEPTS.STATE_ACTIVE,
            validFrom: new Date(Date.now() - 7_200_000),
            validTo: new Date(Date.now() - 3_600_000),
            purposeConceptId: null,
          },
        ],
      );
      const res = await d.service.evaluate(
        {
          ...baseDto,
          patientProfileId: 'pat-1',
          practitionerProfileId: 'prac-1',
        },
        actor,
      );
      expect(res.decision).toBe('DENY');
    });

    it('PERMIT via an active legal representation (C-07/A-03)', async () => {
      const d = build();
      d.permissionsRepo.findByResourceAction.mockResolvedValue({
        id: 'perm-1',
      });
      d.legalRepresentationsRepo.findActiveForRepresentativePatient.mockResolvedValue(
        [
          {
            statusConceptId: CONCEPTS.STATE_ACTIVE,
            validFrom: null,
            validTo: null,
          },
        ],
      );
      const res = await d.service.evaluate(
        { ...baseDto, patientProfileId: 'pat-1' },
        actor,
      );
      expect(res.decision).toBe('PERMIT');
      expect(res.reason).toContain('representación legal vigente');
      expect(
        d.legalRepresentationsRepo.findActiveForRepresentativePatient,
      ).toHaveBeenCalledWith({}, 'u1', 'pat-1');
    });

    it('reports masked fields from field permissions', async () => {
      const d = build();
      d.permissionsRepo.findByResourceAction.mockResolvedValue({
        id: 'perm-1',
      });
      d.assignmentsRepo.findActiveForUser.mockResolvedValue([
        { roleId: 'role-1', validFrom: null, validTo: null },
      ]);
      d.rolePermsRepo.findActiveForRoles.mockResolvedValue([
        { permissionId: 'perm-1', effectConceptId: AUTHZ.EFFECT_ALLOW },
      ]);
      d.fieldPermsRepo.findForRoles.mockResolvedValue([
        {
          entity: 'patient',
          columnName: 'ssn',
          canRead: true,
          maskStrategyConceptId: AUTHZ.MASK_REDACT,
        },
        {
          entity: 'patient',
          columnName: 'notes',
          canRead: false,
          maskStrategyConceptId: null,
        },
      ]);
      const res = await d.service.evaluate(baseDto, actor);
      expect(res.maskedFields).toEqual(
        expect.arrayContaining([
          { entity: 'patient', columnName: 'ssn', strategy: 'REDACT' },
          { entity: 'patient', columnName: 'notes', strategy: 'NO_READ' },
        ]),
      );
    });
  });
});
