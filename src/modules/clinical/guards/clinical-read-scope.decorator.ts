import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from '../../../common/auth/authenticated-user.interface';
import {
  IPS_ONLY_READ_SCOPE,
  type ClinicalReadScope,
} from '../domain/clinical-read-scope';

/** The request once `ClinicalRecordAccessGuard` has left the read scope on it. */
export type ClinicalScopedRequest = AuthenticatedRequest & {
  clinicalReadScope?: ClinicalReadScope;
};

/**
 * Hands the controller the scope `ClinicalRecordAccessGuard` resolved for the
 * patient of the route. When none reached the request (the guard did not run)
 * it yields the most restrictive scope, never the full one: the decorator
 * cannot widen access by being forgotten.
 */
export const ClinicalReadScopeParam = createParamDecorator(
  (_data: unknown, context: ExecutionContext): ClinicalReadScope =>
    context.switchToHttp().getRequest<ClinicalScopedRequest>()
      .clinicalReadScope ?? IPS_ONLY_READ_SCOPE,
);
