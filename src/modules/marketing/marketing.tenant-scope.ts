import { PreconditionFailedException, requireTenantId } from '../../common';
import { assertResourceInTenant } from '../../common/tenant/resource-scope';
import { MarketingErrorReason } from './marketing.error-reasons';

/** Mínimo que necesita la política para decidir el alcance de un recurso. */
interface TenantOwned {
  /** Tenant propietario; `null`/`undefined` cuenta como ajeno. */
  readonly tenantId?: string | null;
}

/**
 * Tenant activo del actor. El `tenantId` del cuerpo nunca es la fuente de
 * verdad: si llega, debe coincidir con el del contexto o se rechaza.
 *
 * @param bodyTenantId - `tenantId` declarado en el cuerpo, si lo hay.
 * @returns El tenant verificado del contexto.
 * @throws PreconditionFailedException `TENANT_REQUIRED` si no hay tenant activo,
 *   o `MARKETING_TENANT_MISMATCH` si el cuerpo declara otro.
 */
export function activeMarketingTenant(bodyTenantId?: string): string {
  const tenantId = requireTenantId();
  if (bodyTenantId !== undefined && bodyTenantId !== tenantId) {
    throw new PreconditionFailedException(
      'El tenantId del cuerpo no coincide con el tenant activo',
      undefined,
      MarketingErrorReason.TENANT_MISMATCH,
    );
  }
  return tenantId;
}

/**
 * Exige que un segmento pertenezca al tenant activo (404 uniforme).
 *
 * @param segment - Segmento cargado, o `null` si no se encontró.
 * @param activeTenantId - Tenant verificado del contexto.
 * @returns El mismo segmento, ya acotado al tenant.
 */
export function assertSegmentInTenant<T extends TenantOwned>(
  segment: T | null | undefined,
  activeTenantId: string,
): T {
  return assertResourceInTenant(segment, segment?.tenantId, activeTenantId, {
    message: 'Segmento no encontrado',
    reason: MarketingErrorReason.SEGMENT_NOT_AVAILABLE,
  });
}

/**
 * Exige que una campaña pertenezca al tenant activo (404 uniforme).
 *
 * @param campaign - Campaña cargada, o `null` si no se encontró.
 * @param activeTenantId - Tenant verificado del contexto.
 * @returns La misma campaña, ya acotada al tenant.
 */
export function assertCampaignInTenant<T extends TenantOwned>(
  campaign: T | null | undefined,
  activeTenantId: string,
): T {
  return assertResourceInTenant(campaign, campaign?.tenantId, activeTenantId, {
    message: 'Campaña no encontrada',
    reason: MarketingErrorReason.CAMPAIGN_NOT_AVAILABLE,
  });
}

/**
 * Exige que un journey pertenezca al tenant activo (404 uniforme).
 *
 * @param journey - Journey cargado, o `null` si no se encontró.
 * @param activeTenantId - Tenant verificado del contexto.
 * @returns El mismo journey, ya acotado al tenant.
 */
export function assertJourneyInTenant<T extends TenantOwned>(
  journey: T | null | undefined,
  activeTenantId: string,
): T {
  return assertResourceInTenant(journey, journey?.tenantId, activeTenantId, {
    message: 'Journey no encontrado',
    reason: MarketingErrorReason.JOURNEY_NOT_AVAILABLE,
  });
}

/**
 * Exige que una plantilla pertenezca al tenant activo (404 uniforme).
 *
 * @param template - Plantilla cargada, o `null` si no se encontró.
 * @param activeTenantId - Tenant verificado del contexto.
 * @returns La misma plantilla, ya acotada al tenant.
 */
export function assertTemplateInTenant<T extends TenantOwned>(
  template: T | null | undefined,
  activeTenantId: string,
): T {
  return assertResourceInTenant(template, template?.tenantId, activeTenantId, {
    message: 'Plantilla no encontrada',
    reason: MarketingErrorReason.TEMPLATE_NOT_AVAILABLE,
  });
}

/**
 * Exige que una inscripción cuelgue de un journey del tenant activo. La
 * inscripción no tiene `tenant_id`: el tenant es el de su journey.
 *
 * @param enrollment - Inscripción cargada, o `null` si no se encontró.
 * @param journey - Journey de la inscripción, ya cargado dentro del tenant, o `null`.
 * @param activeTenantId - Tenant verificado del contexto.
 * @returns La misma inscripción, ya acotada al tenant.
 */
export function assertEnrollmentInTenant<T>(
  enrollment: T | null | undefined,
  journey: TenantOwned | null | undefined,
  activeTenantId: string,
): T {
  return assertResourceInTenant(enrollment, journey?.tenantId, activeTenantId, {
    message: 'Inscripción no encontrada',
    reason: MarketingErrorReason.ENROLLMENT_NOT_AVAILABLE,
  });
}
