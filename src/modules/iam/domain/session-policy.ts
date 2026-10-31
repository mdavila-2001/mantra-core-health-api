/** Alcance de una política de sesión. */
export type SessionPolicyScope = 'ALL_ACCOUNTS' | 'ORG_STAFF' | 'ROLE';

/** Franja horaria en la que se permite abrir y mantener una sesión. */
export interface AllowedHours {
  /** Días permitidos (0 = domingo … 6 = sábado); ausente = todos. */
  readonly days?: readonly number[];
  /** Hora de inicio `HH:mm`. */
  readonly from: string;
  /** Hora de fin `HH:mm` (si es menor que la de inicio, la franja cruza la medianoche). */
  readonly to: string;
  /** Zona horaria IANA; por defecto la de La Paz. */
  readonly timeZone?: string;
}

/** Una política de sesión de una organización. */
export interface SessionPolicyFacts {
  /** A quién alcanza. */
  readonly scope: SessionPolicyScope;
  /** Rol, si el alcance es `ROLE`. */
  readonly roleCode?: string;
  /** Minutos de inactividad tras los cuales la sesión caduca. */
  readonly idleTimeoutMinutes: number;
  /** Avisar al titular de un dispositivo nuevo. */
  readonly newDeviceAlert: boolean;
  /** Horario permitido. */
  readonly allowedHours?: AllowedHours;
  /** Hacer cumplir las reglas de IP. */
  readonly enforceIpRules: boolean;
  /** Exigir segundo factor. */
  readonly requireMfa: boolean;
}

/**
 * Reglas efectivas de UNA organización para una persona: lo que su política
 * exige cuando la persona actúa en ella. Una política rige solo en su
 * organización.
 */
export interface TenantSessionRules {
  /** Inactividad máxima en minutos, si alguna política de la organización la fija. */
  readonly idleTimeoutMinutes?: number;
  /** ¿La organización exige segundo factor? */
  readonly requireMfa: boolean;
  /** Franjas que se deben cumplir TODAS. */
  readonly allowedHours: readonly AllowedHours[];
  /** ¿Avisar de un dispositivo nuevo? */
  readonly newDeviceAlert: boolean;
  /** ¿La organización exige sus reglas de red? */
  readonly enforceIpRules: boolean;
}

/**
 * Reglas efectivas para una persona: el conjunto más estricto de las que le
 * aplican (agregado, para lo que es de la sesión entera como el reloj del
 * cliente) y el desglose por organización (`byTenant`), que es lo que decide el
 * acceso: una organización no puede cerrarle la sesión a la persona en las demás.
 */
export interface EffectiveSessionRules {
  /** Inactividad máxima en minutos, si alguna política la fija. */
  readonly idleTimeoutMinutes?: number;
  /** ¿Alguna política exige segundo factor? */
  readonly requireMfa: boolean;
  /** Franjas que se deben cumplir TODAS. */
  readonly allowedHours: readonly AllowedHours[];
  /** ¿Alguna política pide avisar de un dispositivo nuevo? */
  readonly newDeviceAlert: boolean;
  /** ¿Alguna política exige las reglas de IP? */
  readonly enforceIpRules: boolean;
  /**
   * Organizaciones cuya política aplicable exige las reglas de red: el origen
   * se contrasta con las de CADA una. Ausente = ninguna.
   */
  readonly ipRuleTenantIds?: readonly string[];
  /** Organizaciones activas de la persona, con o sin política. */
  readonly tenantIds?: readonly string[];
  /** Reglas de cada organización con alguna política aplicable: `tenantId → reglas`. */
  readonly byTenant?: Readonly<Record<string, TenantSessionRules>>;
}

const DEFAULT_TIME_ZONE = 'America/La_Paz';
const ROLES_OF_NON_STAFF = ['USER', 'PATIENT'];

/**
 * Las políticas que alcanzan a quien tiene estos roles: `ALL_ACCOUNTS` a toda
 * cuenta de la organización, `ORG_STAFF` a quien tiene algún rol más allá de
 * paciente, `ROLE` a quien tiene ese rol.
 *
 * @param policies - Políticas de la organización.
 * @param roles - Roles de la persona.
 * @returns Las que le aplican.
 */
export function applicablePolicies(
  policies: readonly SessionPolicyFacts[],
  roles: readonly string[],
): SessionPolicyFacts[] {
  const isStaff = roles.some((r) => !ROLES_OF_NON_STAFF.includes(r));
  return policies.filter((p) => {
    if (p.scope === 'ALL_ACCOUNTS') return true;
    if (p.scope === 'ORG_STAFF') return isStaff;
    return !!p.roleCode && roles.includes(p.roleCode);
  });
}

/**
 * Combina varias políticas en las reglas más estrictas: el menor tiempo de
 * inactividad, segundo factor si alguna lo exige y todas las franjas horarias.
 *
 * @param applicable - Políticas que aplican.
 * @returns Las reglas efectivas.
 */
export function strictestRules(
  applicable: readonly SessionPolicyFacts[],
): EffectiveSessionRules {
  const idles = applicable.map((p) => p.idleTimeoutMinutes);
  return {
    idleTimeoutMinutes: idles.length > 0 ? Math.min(...idles) : undefined,
    requireMfa: applicable.some((p) => p.requireMfa),
    allowedHours: applicable.flatMap((p) =>
      p.allowedHours ? [p.allowedHours] : [],
    ),
    newDeviceAlert: applicable.some((p) => p.newDeviceAlert),
    enforceIpRules: applicable.some((p) => p.enforceIpRules),
  };
}

/** Minutos desde la medianoche de un `HH:mm`. */
function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * ¿Es una zona horaria IANA que el entorno conoce? Una zona inválida hace que
 * `Intl.DateTimeFormat` lance `RangeError`: se comprueba antes de guardarla y
 * antes de usarla.
 *
 * @param timeZone - Nombre de la zona.
 * @returns `true` si es válida.
 */
export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Roles que la persona tiene en una organización: los globales (los que no
 * figuran en ningún ámbito) y los que rigen en ESA organización. Una política de
 * una organización se evalúa con estos y no con los roles que solo tiene en otra.
 *
 * @param roles - Todos los roles del token.
 * @param scopedRoles - Roles con ámbito: `tenantId → roles`.
 * @param tenantId - Organización de la política.
 * @returns Los roles que rigen en esa organización.
 */
export function rolesInTenant(
  roles: readonly string[],
  scopedRoles: Readonly<Record<string, readonly string[]>> | undefined,
  tenantId: string,
): string[] {
  const scopedEverywhere = new Set(
    Object.values(scopedRoles ?? {}).flatMap((codes) => [...codes]),
  );
  return roles.filter(
    (role) =>
      !scopedEverywhere.has(role) ||
      (scopedRoles?.[tenantId] ?? []).includes(role),
  );
}

/**
 * ¿Está `now` dentro de la franja? Una zona inválida (dato guardado antes de
 * validarla) no bloquea a nadie: la franja se ignora y se permite.
 * Se evalúa en la zona de la política y una
 * franja cuyo fin es menor que su inicio cruza la medianoche.
 *
 * @param hours - Franja permitida.
 * @param now - Instante a evaluar.
 * @returns `true` si está dentro.
 */
export function isWithinAllowedHours(hours: AllowedHours, now: Date): boolean {
  if (hours.timeZone && !isValidTimeZone(hours.timeZone)) return true;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: hours.timeZone ?? DEFAULT_TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string): string =>
    parts.find((p) => p.type === type)?.value ?? '';
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(
    get('weekday'),
  );
  const minutes = Number(get('hour')) * 60 + Number(get('minute'));
  const from = minutesOf(hours.from);
  const to = minutesOf(hours.to);
  const crossesMidnight = to < from;
  const inRange = crossesMidnight
    ? minutes >= from || minutes < to
    : minutes >= from && minutes < to;
  if (!inRange) return false;
  if (!hours.days || hours.days.length === 0) return true;
  // Pasada la medianoche la franja pertenece al día en que empezó.
  const startDay = crossesMidnight && minutes < to ? (day + 6) % 7 : day;
  return hours.days.includes(startDay);
}

/** Por qué una política de sesión rechaza el acceso. */
export type SessionPolicyViolation =
  | 'OUTSIDE_ALLOWED_HOURS'
  | 'OUTSIDE_ALLOWED_NETWORK'
  | 'IDLE_TIMEOUT'
  | 'MFA_REQUIRED_BY_POLICY';

/**
 * Por qué una organización no deja actuar en ella a una persona que sí entró:
 * los motivos estables que ve el cliente en `deniedTenants` del token y en el
 * 403 de las peticiones con `X-Tenant-Id` de esa organización.
 */
export type TenantAccessDenial =
  | 'OUTSIDE_ALLOWED_HOURS'
  | 'OUTSIDE_ALLOWED_NETWORK'
  | 'IDLE_TIMEOUT'
  | 'MFA_REQUIRED'
  | 'MFA_ENROLLMENT_REQUIRED';

/** Cota del claim `idleTimeoutMinutes` del token (el cliente solo admite 5-480). */
export const IDLE_CLAIM_MIN_MINUTES = 5;
export const IDLE_CLAIM_MAX_MINUTES = 480;

/** Duración mínima de una franja horaria permitida: menos es un cierre de facto. */
export const MIN_ALLOWED_HOURS_MINUTES = 240;

/**
 * Minutos que dura una franja (la que cruza la medianoche suma los dos tramos).
 * `from == to` no es una franja de 24 horas sino una franja vacía: la
 * evaluación exige `minutes >= from && minutes < to`, que nunca se cumple.
 *
 * @param hours - Franja permitida.
 * @returns Duración en minutos; `0` si `from == to`.
 */
export function allowedHoursDuration(hours: AllowedHours): number {
  const from = minutesOf(hours.from);
  const to = minutesOf(hours.to);
  return to >= from ? to - from : 24 * 60 - from + to;
}

/**
 * Comprueba horario e inactividad contra las reglas efectivas.
 *
 * La inactividad se mide desde el último refresco, y el servidor no ve la
 * actividad que ocurre mientras el access token vive: quien trabaja hasta el
 * último minuto del token y refresca entonces tiene un refresco «tardío» de
 * `accessTtlMinutes` sin haber estado inactivo. Por eso el plazo que se hace
 * cumplir en el refresco es `idleTimeoutMinutes + idleGraceMinutes` (la vida del
 * access token): nunca corta a quien estuvo activo, y corta a quien dejó
 * vencer el token más de `idleTimeoutMinutes` sin pedir otro.
 *
 * Con `tenantId` solo rigen las reglas de ESA organización: es lo que decide si
 * la persona puede actuar en ella. Sin `tenantId` se evalúan las agregadas de la
 * sesión entera (lo que usan los llamadores que no distinguen organización).
 *
 * @param rules - Reglas efectivas de la persona.
 * @param now - Instante.
 * @param lastActivityAt - Última actividad de la sesión (en el refresco).
 * @param idleGraceMinutes - Holgura de la medición (vida del access token).
 * @param tenantId - Organización cuyas reglas se evalúan.
 * @returns El primer motivo de rechazo, o `null` si se permite.
 */
export function checkSessionRules(
  rules: EffectiveSessionRules,
  now: Date,
  lastActivityAt?: Date,
  idleGraceMinutes = 0,
  tenantId?: string,
): SessionPolicyViolation | null {
  const scope: Pick<TenantSessionRules, 'allowedHours' | 'idleTimeoutMinutes'> =
    tenantId === undefined
      ? rules
      : (rules.byTenant?.[tenantId] ?? { allowedHours: [] });
  if (scope.allowedHours.some((h) => !isWithinAllowedHours(h, now))) {
    return 'OUTSIDE_ALLOWED_HOURS';
  }
  if (
    lastActivityAt &&
    scope.idleTimeoutMinutes !== undefined &&
    now.getTime() - lastActivityAt.getTime() >
      (scope.idleTimeoutMinutes + idleGraceMinutes) * 60_000
  ) {
    return 'IDLE_TIMEOUT';
  }
  return null;
}

/**
 * Qué organizaciones niegan ahora por horario o inactividad: `tenantId → motivo`.
 * Es la evaluación por organización de {@link checkSessionRules}.
 *
 * @param rules - Reglas efectivas de la persona.
 * @param now - Instante.
 * @param lastActivityAt - Última actividad de la sesión (en el refresco).
 * @param idleGraceMinutes - Holgura de la medición de inactividad.
 * @returns Los motivos por organización; vacío si ninguna niega.
 */
export function violationsByTenant(
  rules: EffectiveSessionRules | undefined,
  now: Date,
  lastActivityAt?: Date,
  idleGraceMinutes = 0,
): Record<string, SessionPolicyViolation> {
  const denied: Record<string, SessionPolicyViolation> = {};
  for (const tenantId of Object.keys(rules?.byTenant ?? {})) {
    const violation = checkSessionRules(
      rules as EffectiveSessionRules,
      now,
      lastActivityAt,
      idleGraceMinutes,
      tenantId,
    );
    if (violation) denied[tenantId] = violation;
  }
  return denied;
}

/**
 * Minutos de la vida de un access token a partir de `JWT_ACCESS_TTL` (`15m`,
 * `1h`, `900s`, `1d`; un número sin unidad son segundos). Un valor que no se
 * entiende cuenta como el predeterminado de 15 minutos.
 *
 * @param ttl - Valor de `JWT_ACCESS_TTL`.
 * @returns Minutos, redondeados hacia arriba.
 */
export function ttlToMinutes(ttl: string): number {
  const match = /^\s*(\d+(?:\.\d+)?)\s*([smhd]?)\s*$/i.exec(ttl);
  if (!match) return 15;
  const value = Number(match[1]);
  const seconds =
    { s: 1, m: 60, h: 3600, d: 86_400, '': 1 }[match[2].toLowerCase()] ?? 60;
  return Math.max(0, Math.ceil((value * seconds) / 60));
}

/**
 * Valor del claim opcional `idleTimeoutMinutes` del access token: el menor plazo
 * de inactividad de las políticas aplicables, acotado a 5-480 minutos. Sin
 * política aplicable no hay claim y el cliente usa su plazo por omisión.
 *
 * @param rules - Reglas efectivas de la persona.
 * @returns Minutos enteros dentro de la cota, o `undefined`.
 */
export function idleTimeoutClaim(
  rules: EffectiveSessionRules | undefined,
  liveTenantIds?: readonly string[],
): number | undefined {
  // Con el desglose por organización, el reloj del cliente sigue solo a las
  // organizaciones que quedaron en el token: la inactividad de una que lo niega
  // no acorta la sesión en las demás.
  const perTenant =
    liveTenantIds && rules?.byTenant
      ? liveTenantIds
          .map((id) => rules.byTenant?.[id]?.idleTimeoutMinutes)
          .filter((m): m is number => m !== undefined)
      : undefined;
  const minutes = perTenant
    ? perTenant.length > 0
      ? Math.min(...perTenant)
      : undefined
    : rules?.idleTimeoutMinutes;
  if (minutes === undefined || !Number.isFinite(minutes)) return undefined;
  return Math.min(
    IDLE_CLAIM_MAX_MINUTES,
    Math.max(IDLE_CLAIM_MIN_MINUTES, Math.floor(minutes)),
  );
}

/** Tipo de cuenta que ve el cliente: persona u organización. */
export type AccountKind = 'PERSON' | 'ORGANIZATION';

/** Tipos de organización que pueden pasar a cuenta de organización. */
const ORGANIZATION_CAPABLE_TYPES = ['HOSPITAL', 'CLINIC', 'PROVIDER'];

/**
 * Tipo de cuenta de un tenant: `ORGANIZATION` solo si es un hospital, clínica
 * o prestador **y** su interruptor `org_account_mode` lo enciende. Sin
 * interruptor, todo sigue siendo `PERSON`.
 *
 * @param tenantTypeCode - Código del tipo de organización.
 * @param modeSettings - Valores de `org_account_mode` de sus prácticas.
 * @returns El tipo de cuenta.
 */
export function resolveAccountKind(
  tenantTypeCode: string | undefined,
  modeSettings: readonly unknown[],
): AccountKind {
  if (!tenantTypeCode || !ORGANIZATION_CAPABLE_TYPES.includes(tenantTypeCode)) {
    return 'PERSON';
  }
  return modeSettings.some((v) => v === 'ORGANIZATION')
    ? 'ORGANIZATION'
    : 'PERSON';
}
