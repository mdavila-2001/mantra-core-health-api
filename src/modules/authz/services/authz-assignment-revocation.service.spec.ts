import { jest } from '@jest/globals';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { AuthzErrorReason } from '../authz.error-reasons';
import { UserRoleAssignments } from '../entities';
import {
  AuthzAssignmentRevocationService,
  REVOCATION_NOTE,
} from './authz-assignment-revocation.service';

// Fábrica de mocks con tipos sueltos: el contrato que se prueba es el del servicio, no el de jest.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ACTOR = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function armar(asignacion: Record<string, unknown> | null) {
  const tx = {
    findOne: mockFn(async () => asignacion),
    flush: mockFn(async () => undefined),
  };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new AuthzAssignmentRevocationService(
    em as never,
    logger as never,
  );
  return { service, tx };
}

describe('AuthzAssignmentRevocationService', () => {
  it('revoca de forma lógica: cambia el estado, no borra, y deja quién lo hizo', async () => {
    const asignacion = {
      id: 'a-1',
      userId: 'u-1',
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      updatedAt: new Date(0),
    };
    const { service, tx } = armar(asignacion);
    const r = await service.revoke('u-1', 'a-1', ACTOR);
    expect(r).toEqual({ id: 'a-1', status: 'REVOKED', note: REVOCATION_NOTE });
    expect(asignacion.statusConceptId).toBe(CONCEPTS.STATE_REVOKED);
    expect((asignacion as any).updatedByUserId).toBe('admin-1');
    expect(asignacion.updatedAt.getTime()).toBeGreaterThan(0);
    expect(tx.flush).toHaveBeenCalledTimes(1);
    expect(tx).not.toHaveProperty('removeAndFlush');
  });

  it('busca la asignación por id Y por usuario: no se revoca la de otro', async () => {
    const { service, tx } = armar(null);
    await expect(service.revoke('u-1', 'a-9', ACTOR)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    expect(tx.findOne).toHaveBeenCalledWith(UserRoleAssignments, {
      id: 'a-9',
      userId: 'u-1',
    });
    expect(tx.flush).not.toHaveBeenCalled();
  });

  it('una asignación que no está activa no se revoca otra vez', async () => {
    const { service, tx } = armar({
      id: 'a-1',
      userId: 'u-1',
      statusConceptId: CONCEPTS.STATE_REVOKED,
    });
    await expect(service.revoke('u-1', 'a-1', ACTOR)).rejects.toMatchObject({
      reason: AuthzErrorReason.ROLE_ASSIGNMENT_NOT_ACTIVE,
    });
    await expect(service.revoke('u-1', 'a-1', ACTOR)).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
    expect(tx.flush).not.toHaveBeenCalled();
  });
});
