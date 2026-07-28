import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PractitionerDelegatesController } from './practitioner-delegates.controller';

const actor = { id: 'doc-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const delegatesService = {
    createDelegate: mockFn(),
    issueGrant: mockFn(),
    revoke: mockFn(),
  };
  const requestsService = { requestAccess: mockFn() };
  const controller = new PractitionerDelegatesController(
    delegatesService as any,
    requestsService as any,
  );
  return { controller, delegatesService, requestsService };
}

describe('PractitionerDelegatesController', () => {
  it('delegates create (UC-29-03)', async () => {
    const d = build();
    const dto = {
      practitionerRoleAssignmentId: 'a',
      delegateUserAssignmentId: 'b',
      delegatedPermissionSetId: 'c',
    };
    await d.controller.create(dto, actor);
    expect(d.delegatesService.createDelegate).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates requestAccess (UC-29-04)', async () => {
    const d = build();
    const dto = { requestedPermissionId: 'p1' };
    await d.controller.requestAccess('del1', dto, actor);
    expect(d.requestsService.requestAccess).toHaveBeenCalledWith(
      'del1',
      dto,
      actor,
    );
  });

  it('delegates issueGrant (UC-29-06)', async () => {
    const d = build();
    const dto = { purpose: 'TREATMENT', validTo: '2027-01-01T00:00:00Z' };
    await d.controller.issueGrant('del1', dto as any, actor);
    expect(d.delegatesService.issueGrant).toHaveBeenCalledWith(
      'del1',
      dto,
      actor,
    );
  });

  it('delegates revoke (UC-29-07)', async () => {
    const d = build();
    await d.controller.revoke('del1', { reason: 'x' }, actor);
    expect(d.delegatesService.revoke).toHaveBeenCalledWith(
      'del1',
      { reason: 'x' },
      actor,
    );
  });
});
