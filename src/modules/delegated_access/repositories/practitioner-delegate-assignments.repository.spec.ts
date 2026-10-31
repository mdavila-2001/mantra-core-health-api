import { jest } from '@jest/globals';
import { PractitionerDelegateAssignmentsRepository } from './practitioner-delegate-assignments.repository';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('PractitionerDelegateAssignmentsRepository.create', () => {
  it('una delegación nueva nace sin permiso de responder en nombre del doctor', () => {
    // `may_reply_on_behalf` es NOT NULL sin valor por defecto en la entidad: si el
    // alta no lo fija, el ORM rechaza el flush y la aprobación de un vínculo cae en 500.
    const em = { create: mockFn((_entity: unknown, data: unknown) => data) };
    const repo = new PractitionerDelegateAssignmentsRepository();
    const row: any = repo.create(em as any, {
      tenantId: 't-1',
      practitionerRoleAssignmentId: 'ra-1',
      delegateUserAssignmentId: 'a-1',
      delegatedPermissionSetId: 's-1',
      delegateRoleConceptId: 'role',
      statusConceptId: 'active',
    });
    expect(row.mayReplyOnBehalf).toBe(false);
    // v4.2.73 (A-M1): la delegación nace con la organización del contexto (el modelo la verifica).
    expect(row.tenantId).toBe('t-1');
  });

  it('respeta el permiso cuando el doctor ya lo concede', () => {
    const em = { create: mockFn((_entity: unknown, data: unknown) => data) };
    const repo = new PractitionerDelegateAssignmentsRepository();
    const row: any = repo.create(em as any, {
      tenantId: 't-1',
      practitionerRoleAssignmentId: 'ra-1',
      delegateUserAssignmentId: 'a-1',
      delegatedPermissionSetId: 's-1',
      delegateRoleConceptId: 'role',
      statusConceptId: 'active',
      mayReplyOnBehalf: true,
    });
    expect(row.mayReplyOnBehalf).toBe(true);
  });
});
