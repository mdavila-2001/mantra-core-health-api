import { ResourceNotFoundException } from '../errors/domain.exception';
import { assertResourceInTenant } from './resource-scope';

const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';
const failure = {
  message: 'Workflow no encontrado',
  reason: 'WORKFLOW_NOT_FOUND',
};

function capture(fn: () => unknown): ResourceNotFoundException {
  try {
    fn();
  } catch (error) {
    return error as ResourceNotFoundException;
  }
  throw new Error('no lanzó');
}

describe('assertResourceInTenant', () => {
  it('devuelve el recurso cuando pertenece al tenant activo', () => {
    const resource = { id: 'r1' };
    expect(assertResourceInTenant(resource, TENANT_A, TENANT_A, failure)).toBe(
      resource,
    );
  });

  it('responde 404 cuando el recurso es de otro tenant', () => {
    const error = capture(() =>
      assertResourceInTenant({ id: 'r1' }, TENANT_B, TENANT_A, failure),
    );
    expect(error).toBeInstanceOf(ResourceNotFoundException);
    expect(error.getStatus()).toBe(404);
  });

  it('responde igual para ajeno, inexistente y sin tenant', () => {
    const foreign = capture(() =>
      assertResourceInTenant({ id: 'r1' }, TENANT_B, TENANT_A, failure),
    );
    const missing = capture(() =>
      assertResourceInTenant(null, undefined, TENANT_A, failure),
    );
    const untenanted = capture(() =>
      assertResourceInTenant({ id: 'r1' }, null, TENANT_A, failure),
    );
    expect(missing.getResponse()).toEqual(foreign.getResponse());
    expect(untenanted.getResponse()).toEqual(foreign.getResponse());
    expect(foreign.details).toBeUndefined();
    expect(foreign.reason).toBe('WORKFLOW_NOT_FOUND');
  });
});
