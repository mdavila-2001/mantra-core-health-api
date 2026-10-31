import type {
  AdminDenyRule,
  ReviewEngagementInput,
  ReviewableGrant,
  SodFinding,
} from '../domain';

/** Una concesión con lo que el gobierno necesita saber de ella. */
export interface WorldGrant extends ReviewableGrant {
  /** La condición guardada no se puede leer (versión desconocida o JSON roto). */
  readonly unreadable?: boolean;
  /** Apunta a un doctor cuya asignación de rol ya no rige. */
  readonly doctorGone?: boolean;
}

/** Un vínculo de apoyo con sus concesiones y hechos de gobierno. */
export interface WorldEngagement extends ReviewEngagementInput {
  readonly tenantId: string;
  readonly grants: readonly WorldGrant[];
  readonly createdAt: Date;
  readonly lastCertifiedAt: Date | null;
  readonly nextRecertificationAt: Date | null;
  readonly recertifyEveryMonths: number | null;
  readonly validTo: Date | null;
  /** Perfiles de los doctores que aceptaron a esta persona (delegación vigente). */
  readonly acceptedPractitionerProfileIds: readonly string[];
  /** Conflictos de segregación de funciones hoy (con o sin excepción). */
  readonly sodFindings: readonly SodFinding[];
  /**
   * ¿La membresía que ancla el vínculo está viva (activa y sin fin vencido)?
   * Ausente en los datos de prueba: solo `false` la da por no viva.
   */
  readonly membershipLive?: boolean;
}

/** Hechos de una organización para campañas, informes y barridos. */
export interface GovernanceWorld {
  readonly tenantId: string;
  readonly now: Date;
  readonly engagements: readonly WorldEngagement[];
  /** Reglas L1 `DENY_PERMISSION` vivas: recortan los átomos de administración (A-A5). */
  readonly denyRules?: readonly AdminDenyRule[];
}

/** Clave `vínculo:concesión` con la que el dominio reconoce un ítem abierto. */
export function itemKey(engagementId: string, grantId: string | null): string {
  return `${engagementId}:${grantId ?? ''}`;
}

/** Todas las concesiones de un mundo, con el vínculo al que pertenecen. */
export function allGrants(
  world: GovernanceWorld,
): Array<{ engagement: WorldEngagement; grant: WorldGrant }> {
  return world.engagements.flatMap((engagement) =>
    engagement.grants.map((grant) => ({ engagement, grant })),
  );
}
