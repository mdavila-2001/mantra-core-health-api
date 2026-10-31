import { HttpStatus } from '@nestjs/common';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import { governanceError } from './governance-errors';

describe('governanceError', () => {
  it.each([
    [Reason.GUARDRAIL_NOT_DELEGABLE, HttpStatus.UNPROCESSABLE_ENTITY],
    [Reason.GUARDRAIL_SELF_ADMIN, HttpStatus.FORBIDDEN],
    [Reason.SOD_EXCEPTION_REQUIRED, HttpStatus.CONFLICT],
    [Reason.SOD_EXCEPTION_NOT_FOUND, HttpStatus.NOT_FOUND],
  ])('%s sale con el estado del contrato %i', (reason, status) => {
    const err = governanceError(reason, 'mensaje', { a: 1 });
    expect(err.getStatus()).toBe(status);
    expect(err.reason).toBe(reason);
    expect(err.details).toEqual({ a: 1 });
  });

  it('una razón sin estado fijado cae a 422', () => {
    expect(
      governanceError(Reason.SUPPORT_TARGET_INVALID, 'm').getStatus(),
    ).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
  });
});
