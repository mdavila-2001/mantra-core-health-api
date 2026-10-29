import { DomainException } from '../../../../common/errors/domain.exception';
import { ErrorCode } from '../../../../common/errors/error-codes';

/** 422 `VALIDATION_FAILED` con la violación del campo, como las demás validaciones de dominio. */
export function ValidationFailedHttp(
  field: string,
  message: string,
): DomainException {
  return new DomainException(422, ErrorCode.VALIDATION_FAILED, message, {
    violations: [{ field, reason: 'INVALID', message }],
  });
}
