import {
  targetCells,
  targetWithin,
  type GrantTargetFacts,
} from './support-grant-targets';

/**
 * Resolución de revisores de una campaña (parte pura de `ReviewerResolver`,
 * CONTRATO-GOBIERNO §6.2): determinista, y nunca devuelve a la persona
 * revisada ni a quien otorgó o aprobó la concesión (`SOD-GOV-02`).
 */

/** Quién revisa (`delegated_access:REVIEWER_KIND_*` sin el prefijo). */
export type ReviewerKind =
  'DOCTOR_OWNER' | 'SERVICE_HEAD' | 'SUPERVISOR' | 'ADMIN';

/** Tipo de campaña (`delegated_access:REVIEW_KIND_*` sin el prefijo). */
export type ReviewKind =
  'PERIODIC' | 'RECERTIFICATION' | 'MOVER' | 'TARGETED' | 'REMEDIATION';

/** La concesión que se revisa, con quién la otorgó y quién la aprobó. */
export interface ReviewerGrantFacts extends GrantTargetFacts {
  readonly grantId?: string;
  readonly grantedByUserId?: string | null;
  readonly approvedByUserIds?: ReadonlyArray<string | null | undefined>;
}

/** Alcance de administración de un delegado vivo: su concesión `team.grants.assign`. */
export interface AdminScope {
  readonly adminUserId: string;
  readonly target: GrantTargetFacts;
}

/** El vínculo al que pertenece la concesión. */
export interface ReviewerEngagementFacts {
  /** La persona revisada. */
  readonly subjectUserId: string;
  /** Dueño de la cuenta (`supervisor_user_id`). */
  readonly supervisorUserId?: string | null;
}

/** Datos de la organización y de la campaña que necesita la resolución. */
export interface ReviewerContext {
  /** Tipo de campaña; por defecto `PERIODIC`. */
  readonly campaignKind?: ReviewKind;
  /** Responsable de la campaña (`owner_user_id`); `null` = sistema. */
  readonly campaignOwnerUserId?: string | null;
  /** Administradores de seguridad con membresía viva. */
  readonly securityAdminUserIds: readonly string[];
  /**
   * Cuenta de cada doctor por su perfil o por su asignación de rol (por el
   * vínculo `PROF.ACCOUNT_LINK_ACTIVE`).
   */
  readonly doctorUserIdsByPractitioner?: Readonly<Record<string, string>>;
}

/** Resultado: quién revisa y por qué regla. */
export interface ReviewerResolution {
  readonly kind: ReviewerKind;
  /** Quienes pueden decidir, ordenados y sin repetir (el primero que decide cierra el ítem). */
  readonly userIds: readonly string[];
  /** Quienes se descartaron por ser el sujeto, quien otorgó o quien aprobó. */
  readonly excludedUserIds: readonly string[];
  /** `true` si no quedó nadie elegible (el llamador abre un hallazgo; nunca se devuelve a un excluido). */
  readonly unresolved: boolean;
}

type GrantReach = 'DOCTOR' | 'HEAD' | 'ADMIN';

const HEAD_KINDS: ReadonlySet<string> = new Set([
  'SERVICE',
  'LOCATION',
  'SERVICE_LOCATION',
]);

/** Quién alcanza una concesión según la regla 1 y 2 del contrato. */
function reachOf(grant: GrantTargetFacts): {
  reach: GrantReach;
  doctorIds: string[];
} {
  const cells = targetCells(grant);
  if (grant.expansionMode === 'FIXED') {
    if (cells.length === 0) return { reach: 'ADMIN', doctorIds: [] };
    if (cells.every((c) => c.practitioner)) {
      const first = cells[0].practitioner?.ids ?? [];
      const single = cells.every((c) =>
        c.practitioner?.ids.some((id) => first.includes(id)),
      );
      return single
        ? { reach: 'DOCTOR', doctorIds: [...first] }
        : { reach: 'ADMIN', doctorIds: [] };
    }
    const noDoctor = cells.every(
      (c) => !c.practitioner && (c.service || c.location),
    );
    return { reach: noDoctor ? 'HEAD' : 'ADMIN', doctorIds: [] };
  }
  const practitioner = cells[0]?.practitioner;
  if (practitioner)
    return { reach: 'DOCTOR', doctorIds: [...practitioner.ids] };
  return {
    reach: HEAD_KINDS.has(grant.targetKind) ? 'HEAD' : 'ADMIN',
    doctorIds: [],
  };
}

function excludedOf(
  grant: ReviewerGrantFacts,
  engagement: ReviewerEngagementFacts,
): Set<string> {
  const out = new Set<string>([engagement.subjectUserId]);
  if (grant.grantedByUserId) out.add(grant.grantedByUserId);
  for (const id of grant.approvedByUserIds ?? []) if (id) out.add(id);
  return out;
}

function serviceHeads(
  grant: GrantTargetFacts,
  scopes: readonly AdminScope[],
  excluded: ReadonlySet<string>,
): string[] {
  return [
    ...new Set(
      scopes
        .filter(
          (s) => !excluded.has(s.adminUserId) && targetWithin(grant, s.target),
        )
        .map((s) => s.adminUserId),
    ),
  ].sort();
}

function eligibleAdmins(
  context: ReviewerContext,
  excluded: ReadonlySet<string>,
): { owner: string | undefined; others: string[] } {
  const all = [...new Set(context.securityAdminUserIds)]
    .filter((id) => !excluded.has(id))
    .sort();
  const owner = context.campaignOwnerUserId;
  return {
    owner: owner && !excluded.has(owner) ? owner : undefined,
    others: all,
  };
}

function finish(
  kind: ReviewerKind,
  userIds: readonly string[],
  excluded: ReadonlySet<string>,
  grant: ReviewerGrantFacts,
  engagement: ReviewerEngagementFacts,
  context: ReviewerContext,
): ReviewerResolution {
  // Solo se informan los excluidos que de verdad estaban en juego como candidatos.
  const candidates = new Set<string>([
    ...context.securityAdminUserIds,
    ...(context.campaignOwnerUserId ? [context.campaignOwnerUserId] : []),
    ...(engagement.supervisorUserId ? [engagement.supervisorUserId] : []),
    ...Object.values(context.doctorUserIdsByPractitioner ?? {}),
    ...(grant.grantedByUserId ? [grant.grantedByUserId] : []),
  ]);
  return {
    kind,
    userIds,
    excludedUserIds: [...excluded].filter((id) => candidates.has(id)).sort(),
    unresolved: userIds.length === 0,
  };
}

function adminResolution(
  context: ReviewerContext,
  excluded: ReadonlySet<string>,
  /** La persona revisada es otro administrador (delegado o de seguridad). */
  subjectIsAdmin = false,
): string[] {
  const { owner, others } = eligibleAdmins(context, excluded);
  if (!owner) return others;
  // El responsable es administrador de seguridad: revisa a su nombre, como siempre.
  if (context.securityAdminUserIds.includes(owner)) return [owner];
  // B-B8: el responsable es un delegado. GP-6 vale también aquí: un delegado no
  // certifica a otro administrador (certificación mutua entre pares).
  if (subjectIsAdmin) return others;
  // …y nunca es el revisor único: siempre hay un administrador de seguridad
  // independiente que puede decidir (decide quien llegue primero).
  return [owner, ...others];
}

/** ¿La persona revisada administra (delegada) o es administradora de seguridad? */
function isAdminSubject(
  adminScopes: readonly AdminScope[],
  engagement: ReviewerEngagementFacts,
  context: ReviewerContext,
): boolean {
  return (
    adminScopes.some((s) => s.adminUserId === engagement.subjectUserId) ||
    context.securityAdminUserIds.includes(engagement.subjectUserId)
  );
}

function doctorUser(
  doctorIds: readonly string[],
  context: ReviewerContext,
  excluded: ReadonlySet<string>,
): string | undefined {
  const map = context.doctorUserIdsByPractitioner ?? {};
  for (const id of doctorIds) {
    const user = map[id];
    if (user && !excluded.has(user)) return user;
  }
  return undefined;
}

/**
 * Revisor de una concesión (determinista). Reglas, en orden:
 *
 * 1. concesión de UN solo doctor → ese doctor (`DOCTOR_OWNER`);
 * 2. `SERVICE`, `LOCATION` o `SERVICE_LOCATION` (y un `FIXED` sin doctor) → el
 *    jefe de servicio o de piso: administrador cuyo alcance contiene el objetivo
 *    (`SERVICE_HEAD`); si hay varios, todos pueden decidir;
 * 3. `ALL*`, varios doctores o sin jefe resoluble → administrador de seguridad
 *    (`ADMIN`), a nombre del responsable de la campaña;
 * 4. campañas `MOVER` y `TARGETED` → el dueño de la cuenta (`SUPERVISOR`); en
 *    `MOVER`, si la concesión es de un doctor, el doctor.
 *
 * Nunca devuelve a la persona revisada ni a quien otorgó o aprobó la concesión.
 * Lo que no se puede resolver cae a la regla siguiente y, al final, al
 * administrador; si ahí tampoco queda nadie, `unresolved = true`.
 *
 * @param grant - Concesión revisada, con quién la otorgó y aprobó.
 * @param adminScopes - Alcances de los administradores delegados vivos.
 * @param engagement - Persona revisada y dueño de la cuenta.
 * @param context - Campaña, administradores de seguridad y cuentas de doctores.
 */
export function resolveReviewer(
  grant: ReviewerGrantFacts,
  adminScopes: readonly AdminScope[],
  engagement: ReviewerEngagementFacts,
  context: ReviewerContext,
): ReviewerResolution {
  const excluded = excludedOf(grant, engagement);
  const done = (
    kind: ReviewerKind,
    ids: readonly string[],
  ): ReviewerResolution =>
    finish(kind, ids, excluded, grant, engagement, context);
  const { reach, doctorIds } = reachOf(grant);
  const subjectIsAdmin = isAdminSubject(adminScopes, engagement, context);
  const campaign = context.campaignKind ?? 'PERIODIC';
  const supervisor = engagement.supervisorUserId;
  const supervisorOk = !!supervisor && !excluded.has(supervisor);

  if (campaign === 'MOVER' || campaign === 'TARGETED') {
    if (campaign === 'MOVER' && reach === 'DOCTOR') {
      const doctor = doctorUser(doctorIds, context, excluded);
      if (doctor) return done('DOCTOR_OWNER', [doctor]);
    }
    if (supervisorOk) return done('SUPERVISOR', [supervisor]);
    return done('ADMIN', adminResolution(context, excluded, subjectIsAdmin));
  }

  if (reach === 'DOCTOR') {
    const doctor = doctorUser(doctorIds, context, excluded);
    if (doctor) return done('DOCTOR_OWNER', [doctor]);
  }
  if (reach === 'HEAD') {
    const heads = serviceHeads(grant, adminScopes, excluded);
    if (heads.length > 0) return done('SERVICE_HEAD', heads);
  }
  return done('ADMIN', adminResolution(context, excluded, subjectIsAdmin));
}

/**
 * A quién sube un ítem que nadie decidió (§6.2): doctor → jefe de servicio (o
 * administrador si no hay); jefe de servicio y dueño de la cuenta →
 * administrador; administrador → el responsable de la campaña y un segundo
 * administrador de seguridad. Ambos pueden decidir.
 *
 * @param current - Quién tenía el ítem.
 * @returns Los nuevos revisores (con las mismas exclusiones que `resolveReviewer`).
 */
export function escalationTargets(
  current: ReviewerKind,
  grant: ReviewerGrantFacts,
  adminScopes: readonly AdminScope[],
  engagement: ReviewerEngagementFacts,
  context: ReviewerContext,
): ReviewerResolution {
  const excluded = excludedOf(grant, engagement);
  const done = (
    kind: ReviewerKind,
    ids: readonly string[],
  ): ReviewerResolution =>
    finish(kind, ids, excluded, grant, engagement, context);
  if (current === 'DOCTOR_OWNER') {
    const heads = serviceHeads(grant, adminScopes, excluded);
    if (heads.length > 0) return done('SERVICE_HEAD', heads);
  }
  if (current === 'ADMIN') {
    const { owner, others } = eligibleAdmins(context, excluded);
    const second = others.find((id) => id !== owner);
    return done('ADMIN', [
      ...(owner ? [owner] : []),
      ...(second ? [second] : []),
    ]);
  }
  return done(
    'ADMIN',
    adminResolution(
      context,
      excluded,
      isAdminSubject(adminScopes, engagement, context),
    ),
  );
}
