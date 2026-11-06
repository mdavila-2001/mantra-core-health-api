import { HttpStatus } from '@nestjs/common';
import { DomainException, ErrorCode } from '../../../common';
import type { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';

/** 403 con `reason` del módulo. */
export function forbidden(message: string, reason: Reason): DomainException {
  return new DomainException(
    HttpStatus.FORBIDDEN,
    ErrorCode.FORBIDDEN,
    message,
    undefined,
    reason,
  );
}

/** Un objetivo ya validado contra el hospital. */
export interface ResolvedTarget {
  readonly kind: 'LOCATION' | 'PRACTITIONER';
  readonly practiceId?: string;
  readonly practiceSiteId?: string;
  readonly clinicalUnitId?: string;
  readonly careSpaceId?: string;
  readonly practitionerRoleAssignmentId?: string;
  readonly accessScopeConceptId: string;
}
