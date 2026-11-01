import { Injectable } from '@nestjs/common';
import type {
  PermissionDecisionPoint,
  PermissionQuery,
  PermissionVerdict,
} from '../../../common/auth/permission-decision.port';
import { AuthzPdpService } from './authz-pdp.service';

/**
 * Adaptador de `@RequirePermission` sobre el PDP existente.
 *
 * Sólo traduce: la decisión entera (permiso por `resource`+`action`, roles
 * efectivos con herencia, excepciones de usuario, grants por recurso, políticas
 * ABAC del tenant, deny-overrides) la toma {@link AuthzPdpService.evaluate}.
 * No se pasa `patientProfileId`: el acceso a PHI sigue siendo de
 * `ClinicalRecordAccessGuard`, y sin paciente el PDP no exige alcance clínico.
 *
 * Lo provee `AuthzModule` bajo el token `PERMISSION_DECISION_POINT`.
 */
@Injectable()
export class AuthzPermissionDecisionPoint implements PermissionDecisionPoint {
  constructor(private readonly pdp: AuthzPdpService) {}

  async decide(
    query: PermissionQuery,
    actor: { readonly id: string; readonly roles: string[] },
  ): Promise<PermissionVerdict> {
    const result = await this.pdp.evaluate(
      {
        userId: query.userId,
        tenantId: query.tenantId,
        resource: query.resource,
        action: query.action,
        ...(query.resourceId ? { resourceId: query.resourceId } : {}),
      },
      actor,
    );
    return { decision: result.decision, reason: result.reason };
  }
}
