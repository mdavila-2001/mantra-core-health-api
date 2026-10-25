import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PractitionerDelegatesService } from './practitioner-delegates.service';
import {
  DomainException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason } from '../delegated_access.error-reasons';
import { STATUS } from './concept-maps';
import {
  ACTIVE_TENANT,
  buildScope,
  inTenant,
  thrown,
} from './delegation-scope.testing';

const actor = { id: 'doc-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const delegatesRepo = { findById: mockFn(), create: mockFn() };
  const orgAssignmentsRepo = { findById: mockFn() };
  const setsRepo = {
    findById: mockFn().mockResolvedValue({
      id: 'set1',
      tenantId: ACTIVE_TENANT,
      statusConceptId: STATUS.ACTIVE,
    }),
  };
  const grantsRepo = {
    create: mockFn(),
    revokeActiveByAssignment: mockFn().mockResolvedValue(0),
  };
  const requestsRepo = {
    cancelOpenByAssignment: mockFn().mockResolvedValue(0),
  };
  const eventsRepo = { record: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const scope = buildScope({ setsRepo, delegatesRepo, orgAssignmentsRepo });
  const raw = new PractitionerDelegatesService(
    em as any,
    delegatesRepo as any,
    orgAssignmentsRepo as any,
    grantsRepo as any,
    requestsRepo as any,
    eventsRepo,
    scope.scope,
    logger as any,
  );
  return {
    service: inTenant(raw),
    raw,
    scope,
    tx,
    delegatesRepo,
    orgAssignmentsRepo,
    setsRepo,
    grantsRepo,
    requestsRepo,
    eventsRepo,
  };
}

const createDto = {
  practitionerRoleAssignmentId: 'pra1',
  delegateUserAssignmentId: 'org1',
  delegatedPermissionSetId: 'set1',
};

describe('PractitionerDelegatesService', () => {
  describe('createDelegate (UC-29-03)', () => {
    it('creates the delegation and records DELEGATION_CREATED', async () => {
      const d = build();
      d.orgAssignmentsRepo.findById.mockResolvedValue({
        id: 'org1',
        tenantMembershipId: 'mem1',
        statusConceptId: STATUS.ACTIVE,
      });
      d.setsRepo.findById.mockResolvedValue({
        id: 'set1',
        tenantId: ACTIVE_TENANT,
        statusConceptId: STATUS.ACTIVE,
      });
      d.delegatesRepo.create.mockReturnValue({
        id: 'del1',
        statusConceptId: STATUS.ACTIVE,
        createdAt: new Date(),
      });
      const res = await d.service.createDelegate(createDto, actor);
      expect(res.id).toBe('del1');
      expect(d.tx.flush).toHaveBeenCalled();
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: DELEG.EVENT_DELEGATION_CREATED,
        }),
      );
    });

    it('throws when the org user assignment is missing', async () => {
      const d = build();
      d.orgAssignmentsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.createDelegate(createDto as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects when the permission set is not active (precondition)', async () => {
      const d = build();
      d.orgAssignmentsRepo.findById.mockResolvedValue({
        id: 'org1',
        tenantMembershipId: 'mem1',
        statusConceptId: STATUS.ACTIVE,
      });
      d.setsRepo.findById.mockResolvedValue({
        id: 'set1',
        tenantId: ACTIVE_TENANT,
        statusConceptId: STATUS.REVOKED,
      });
      await expect(
        d.service.createDelegate(createDto as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('never delegates signing clinical content', async () => {
      const d = build();
      d.orgAssignmentsRepo.findById.mockResolvedValue({
        id: 'org1',
        tenantMembershipId: 'mem1',
        statusConceptId: STATUS.ACTIVE,
      });
      d.setsRepo.findById.mockResolvedValue({
        id: 'set1',
        tenantId: ACTIVE_TENANT,
        statusConceptId: STATUS.ACTIVE,
      });
      d.delegatesRepo.create.mockReturnValue({
        id: 'del1',
        statusConceptId: STATUS.ACTIVE,
        createdAt: new Date(),
      });
      await d.service.createDelegate(createDto, actor);
      const arg = d.delegatesRepo.create.mock.calls[0][1];
      expect(arg.maySignClinicalContent).toBe(false);
    });
  });

  describe('issueGrant (UC-29-06)', () => {
    it('rejects when the delegation is not active', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue({
        id: 'del1',
        delegatedPermissionSetId: 'set1',
        statusConceptId: STATUS.REVOKED,
      });
      await expect(
        d.service.issueGrant(
          'del1',
          { purpose: 'TREATMENT', validTo: '2027-01-01T00:00:00Z' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('issues a grant and records GRANT_ISSUED', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue({
        id: 'del1',
        delegatedPermissionSetId: 'set1',
        statusConceptId: STATUS.ACTIVE,
      });
      d.grantsRepo.create.mockReturnValue({
        id: 'g1',
        statusConceptId: STATUS.ACTIVE,
        createdAt: new Date(),
      });
      const res = await d.service.issueGrant(
        'del1',
        { purpose: 'TREATMENT', validTo: '2027-01-01T00:00:00Z' } as any,
        actor,
      );
      expect(res.id).toBe('g1');
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: DELEG.EVENT_GRANT_ISSUED,
        }),
      );
    });
  });

  describe('revoke (UC-29-07)', () => {
    it('throws when the delegation does not exist', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.revoke('del1', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('is idempotent when already revoked', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue({
        id: 'del1',
        delegatedPermissionSetId: 'set1',
        statusConceptId: STATUS.REVOKED,
      });
      const res = await d.service.revoke('del1', {}, actor);
      expect(res).toEqual({ ok: true });
      expect(d.grantsRepo.revokeActiveByAssignment).not.toHaveBeenCalled();
    });

    it('revokes the delegation, cascades grants and cancels open requests', async () => {
      const d = build();
      const delegate = {
        id: 'del1',
        delegatedPermissionSetId: 'set1',
        statusConceptId: STATUS.ACTIVE,
        updatedAt: new Date(),
      };
      d.delegatesRepo.findById.mockResolvedValue(delegate);
      const res = await d.service.revoke('del1', { reason: 'abuse' }, actor);
      expect(res).toEqual({ ok: true });
      expect(delegate.statusConceptId).toBe(STATUS.REVOKED);
      expect(d.grantsRepo.revokeActiveByAssignment).toHaveBeenCalled();
      expect(d.requestsRepo.cancelOpenByAssignment).toHaveBeenCalled();
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: DELEG.EVENT_DELEGATION_REVOKED,
        }),
      );
    });
  });

  describe('cadena de alcance (DLG-01)', () => {
    const activeOrg = {
      id: 'org1',
      tenantMembershipId: 'mem1',
      statusConceptId: STATUS.ACTIVE,
    };
    const grantBody = {
      purpose: 'TREATMENT',
      validTo: '2027-01-01T00:00:00Z',
    } as any;
    const activeDelegate = (): any => ({
      id: 'del1',
      delegatedPermissionSetId: 'set1',
      statusConceptId: STATUS.ACTIVE,
      updatedAt: new Date(),
    });

    /** Verifica que la respuesta sea el 404 uniforme del recurso. */
    const expectUniform404 = (err: DomainException, reason: string) => {
      expect(err).toBeInstanceOf(ResourceNotFoundException);
      expect(err.getStatus()).toBe(404);
      expect(err.reason).toBe(reason);
      expect(err.details).toBeUndefined();
    };

    it('Error: la asignación de organización de otro tenant responde igual que una inexistente y no crea la delegación', async () => {
      const d = build();
      d.orgAssignmentsRepo.findById.mockResolvedValue(null);
      const missing = await thrown(d.service.createDelegate(createDto, actor));
      d.orgAssignmentsRepo.findById.mockResolvedValue(activeOrg);
      d.scope.scopeRepo.membershipOf.mockResolvedValue({
        tenantId: 't2',
        userId: 'delegate-user',
      });
      const foreign = await thrown(d.service.createDelegate(createDto, actor));
      expectUniform404(
        foreign,
        DelegatedAccessErrorReason.DELEGATED_ORG_ASSIGNMENT_NOT_FOUND,
      );
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(d.delegatesRepo.create).not.toHaveBeenCalled();
      expect(d.eventsRepo.record).not.toHaveBeenCalled();
    });

    it('Error: el set de otro tenant responde 404 uniforme y no crea la delegación', async () => {
      const d = build();
      d.orgAssignmentsRepo.findById.mockResolvedValue(activeOrg);
      d.setsRepo.findById.mockResolvedValue({
        id: 'set1',
        tenantId: 't2',
        statusConceptId: STATUS.ACTIVE,
      });
      const err = await thrown(d.service.createDelegate(createDto, actor));
      expectUniform404(
        err,
        DelegatedAccessErrorReason.DELEGATED_PERMISSION_SET_NOT_FOUND,
      );
      expect(d.delegatesRepo.create).not.toHaveBeenCalled();
    });

    it('Error: la asignación de rol del profesional de otro tenant responde 404 uniforme', async () => {
      const d = build();
      d.orgAssignmentsRepo.findById.mockResolvedValue(activeOrg);
      d.scope.scopeRepo.roleAssignmentTenant.mockResolvedValue('t2');
      const err = await thrown(d.service.createDelegate(createDto, actor));
      expectUniform404(
        err,
        DelegatedAccessErrorReason.DELEGATED_ROLE_ASSIGNMENT_NOT_FOUND,
      );
      expect(d.delegatesRepo.create).not.toHaveBeenCalled();
    });

    it('Error: la asignación de rol inexistente responde igual que la de otro tenant', async () => {
      const d = build();
      d.orgAssignmentsRepo.findById.mockResolvedValue(activeOrg);
      d.scope.scopeRepo.roleAssignmentTenant.mockResolvedValue(null);
      const err = await thrown(d.service.createDelegate(createDto, actor));
      expectUniform404(
        err,
        DelegatedAccessErrorReason.DELEGATED_ROLE_ASSIGNMENT_NOT_FOUND,
      );
    });

    it('Correcto: con toda la cadena en el tenant se crea la delegación', async () => {
      const d = build();
      d.orgAssignmentsRepo.findById.mockResolvedValue(activeOrg);
      d.delegatesRepo.create.mockReturnValue({
        id: 'del1',
        statusConceptId: STATUS.ACTIVE,
        createdAt: new Date(),
      });
      await expect(
        d.service.createDelegate(createDto, actor),
      ).resolves.toMatchObject({ id: 'del1' });
      expect(d.scope.scopeRepo.membershipOf).toHaveBeenCalledWith(d.tx, 'mem1');
    });

    it('sin tenant en el contexto no se crea ni se emite nada', async () => {
      const d = build();
      await expect(
        d.raw.createDelegate(createDto, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      await expect(
        d.raw.issueGrant('del1', grantBody, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.delegatesRepo.create).not.toHaveBeenCalled();
      expect(d.grantsRepo.create).not.toHaveBeenCalled();
    });

    it.each([
      [
        'issueGrant',
        (d: any) => d.service.issueGrant('del1', grantBody, actor),
      ],
      ['revoke', (d: any) => d.service.revoke('del1', {}, actor)],
    ])(
      'Error: %s sobre la delegación de otro tenant responde 404 idéntico a inexistente, sin grant ni cascada',
      async (_name, call) => {
        const d = build();
        d.delegatesRepo.findById.mockResolvedValue(null);
        const missing = await thrown(call(d));
        const foreign = activeDelegate();
        d.delegatesRepo.findById.mockResolvedValue(foreign);
        d.setsRepo.findById.mockResolvedValue({
          id: 'set1',
          tenantId: 't2',
          statusConceptId: STATUS.ACTIVE,
        });
        const err = await thrown(call(d));
        expectUniform404(
          err,
          DelegatedAccessErrorReason.DELEGATED_DELEGATION_NOT_FOUND,
        );
        expect(err.getResponse()).toEqual(missing.getResponse());
        expect(foreign.statusConceptId).toBe(STATUS.ACTIVE);
        expect(d.grantsRepo.create).not.toHaveBeenCalled();
        expect(d.grantsRepo.revokeActiveByAssignment).not.toHaveBeenCalled();
        expect(d.eventsRepo.record).not.toHaveBeenCalled();
      },
    );

    it('Error: un grant con encuentro de otro tenant responde 404 uniforme y no se emite', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue(activeDelegate());
      d.scope.scopeRepo.encounterScope.mockResolvedValue({
        tenantId: 't2',
        patientProfileId: 'pat-1',
      });
      const err = await thrown(
        d.service.issueGrant(
          'del1',
          { ...grantBody, encounterId: 'enc-1' },
          actor,
        ),
      );
      expectUniform404(
        err,
        DelegatedAccessErrorReason.DELEGATED_ENCOUNTER_NOT_FOUND,
      );
      expect(d.grantsRepo.create).not.toHaveBeenCalled();
      expect(d.eventsRepo.record).not.toHaveBeenCalled();
    });

    it('Error: un grant con un encuentro de otro paciente responde 404 uniforme y no se emite', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue(activeDelegate());
      const err = await thrown(
        d.service.issueGrant(
          'del1',
          { ...grantBody, encounterId: 'enc-1', patientProfileId: 'pat-otro' },
          actor,
        ),
      );
      expectUniform404(
        err,
        DelegatedAccessErrorReason.DELEGATED_ENCOUNTER_NOT_FOUND,
      );
      expect(d.grantsRepo.create).not.toHaveBeenCalled();
    });

    it('Error: un grant con un paciente inexistente responde 404 uniforme', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue(activeDelegate());
      d.scope.scopeRepo.patientExists.mockResolvedValue(false);
      const err = await thrown(
        d.service.issueGrant(
          'del1',
          { ...grantBody, patientProfileId: 'pat-x' },
          actor,
        ),
      );
      expectUniform404(
        err,
        DelegatedAccessErrorReason.DELEGATED_PATIENT_NOT_FOUND,
      );
      expect(d.grantsRepo.create).not.toHaveBeenCalled();
    });

    it('Correcto: un grant con encuentro y paciente coherentes del tenant se emite', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue(activeDelegate());
      d.grantsRepo.create.mockReturnValue({
        id: 'g1',
        statusConceptId: STATUS.ACTIVE,
        createdAt: new Date(),
      });
      await expect(
        d.service.issueGrant(
          'del1',
          { ...grantBody, encounterId: 'enc-1', patientProfileId: 'pat-1' },
          actor,
        ),
      ).resolves.toMatchObject({ id: 'g1' });
      expect(d.grantsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          patientProfileId: 'pat-1',
          encounterId: 'enc-1',
        }),
      );
    });
  });
});
