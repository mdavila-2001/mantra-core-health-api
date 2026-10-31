import { SUPPORT_TEMPLATE_CODES } from './support-actions';
import { isUnevaluatedConditionAtom } from './support-admin-atoms';
import {
  SUPPORT_CONDITION_SCHEMA_VERSION,
  conditionKeyAppliesToAtom,
  type ConditionKey,
} from './support-conditions';
import {
  atomsMatchingPatterns,
  isDelegatedAdminForbidden,
} from './support-guardrails';
import {
  PERMISSION_ATOM_BY_CODE,
  atomMatchesPattern,
  atomsOfAction,
  expandLegacy,
  isSupportAtom,
} from './support-permission-catalog';
import { DEFAULT_STEP_UP_MAX_AGE_MINUTES } from './support-conditions';
import { isValidTimeZone } from './support-time';

/**
 * Validador de `condition_json` v1 (CONTRATO-GOBIERNO §3.10). Puro: corre al
 * guardar concesiones, plantillas, reglas de gobierno y en `simulate`. Devuelve
 * TODOS los errores, ordenados por ruta; el servicio los traduce a 422 con
 * `reason` estable y `details { path, atom }`.
 */

/** Tamaño máximo de una condición (8 KiB). */
export const CONDITION_MAX_BYTES = 8192;

/**
 * Los 12 códigos del contrato más `CONDITION_VALUE_INVALID`, que el contrato no
 * trae: cubre un valor mal formado, fuera de rango o nulo (el contrato solo
 * nombra el de `limits`). Es el 13.º código de error de §8.4.
 */
export const CONDITION_ERROR_CODES = [
  'CONDITION_SCHEMA_VERSION_UNSUPPORTED',
  'CONDITION_UNKNOWN_KEY',
  'CONDITION_TOO_LARGE',
  'CONDITION_TIME_EMPTY_WINDOW',
  'CONDITION_TIME_ZONE_INVALID',
  'CONDITION_LIMIT_INVALID',
  'CONDITION_NOT_APPLICABLE_TO_ATOM',
  'CONDITION_NOT_ALLOWED_ON_DENY',
  'CONDITION_FIELD_NOT_GRANTED',
  'CONDITION_NETWORK_NO_RULES',
  'CONDITION_OBLIGATION_LOOSENS_CATALOG',
  'CONDITION_CEILING_FORBIDDEN_ATOM',
  'CONDITION_VALUE_INVALID',
] as const;

/** Código de error de validación de una condición. */
export type ConditionErrorCode = (typeof CONDITION_ERROR_CODES)[number];

/** Un error de validación. */
export interface ConditionError {
  readonly code: ConditionErrorCode;
  /** Ruta dentro de la condición (`appointment.leadTime`, `limits[0].max`…). */
  readonly path: string;
  /** Átomo al que se validó (a nivel de átomo). */
  readonly atom?: string;
  /** Mensaje en lenguaje simple. */
  readonly message: string;
}

/** Contexto de la validación. */
export interface ValidateConditionOptions {
  /** Átomo de la condición (a nivel de átomo); sin él es la del permiso entero. */
  readonly atom?: string;
  /** Efecto de la concesión (por defecto `ALLOW`). */
  readonly effect?: 'ALLOW' | 'DENY';
  /** Átomos o alias del permiso (para `fields` y la aplicabilidad del permiso). */
  readonly grantAtoms?: readonly string[];
  /** ¿La organización tiene alguna regla de red `ALLOW`? `undefined` = no se sabe. */
  readonly orgHasAllowRules?: boolean;
  /**
   * ¿Está encendida la cookie de dispositivo (`AUTH_DEVICE_COOKIE_ENABLED`)?
   * Sin ella `device.knownOnly` no protege (SEG A-M5) y se rechaza al guardar.
   * `undefined` = no se sabe, no se comprueba.
   */
  readonly deviceCookieEnabled?: boolean;
}

/**
 * ¿Está encendida la cookie de dispositivo? Solo el valor `true` la enciende,
 * igual que `device-cookie.ts` de `iam`.
 *
 * @param env - Variables de entorno.
 */
export function deviceCookieEnabledFromEnv(
  env: Readonly<Record<string, string | undefined>>,
): boolean {
  return env.AUTH_DEVICE_COOKIE_ENABLED === 'true';
}

const TOP_KEYS = [
  'schemaVersion',
  'time',
  'limits',
  'patients',
  'appointment',
  'channels',
  'fields',
  'amount',
  'session',
  'network',
  'device',
  'presence',
  'obligations',
  'delegationCeiling',
];
const FLAGS = ['VIP', 'CONFIDENTIAL', 'STAFF_RELATIVE', 'PROTECTED'];
const HH_MM = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
const GROUP = /^[a-z0-9-]{1,40}$/;
const PATTERN = /^[a-z_*]+(\.[a-z_*]+)*$/;
/** Lo único que acepta una fila `DENY` (§3.6): el resto da `CONDITION_NOT_ALLOWED_ON_DENY`. */
const DENY_ALLOWED: ReadonlySet<string> = new Set([
  'time',
  'channels',
  'presence',
  'appointment.window',
  'appointment.leadTime',
  'patients',
  'patients.age',
  'patients.isMinor',
  'patients.coverage',
  'patients.flags',
]);

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
const isNum = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const oneOf = (v: unknown, values: readonly string[]): boolean =>
  typeof v === 'string' && values.includes(v);

/**
 * Revisa las CLAVES de `actionConditions` (átomo → condición) antes de mirar
 * cada condición: no puede traer más claves que permisos hay en el catálogo y
 * cada clave debe ser un permiso del catálogo. Corta en el PRIMER error: así un
 * cuerpo con miles de claves inventadas no produce miles de errores ni una
 * respuesta mayor que la petición.
 *
 * @param keys - Claves recibidas.
 * @returns El primer error, o `undefined` si todas son válidas.
 */
export function checkActionConditionKeys(
  keys: readonly string[],
): ConditionError | undefined {
  if (keys.length > PERMISSION_ATOM_BY_CODE.size) {
    return {
      code: 'CONDITION_TOO_LARGE',
      path: 'actionConditions',
      message: `actionConditions trae ${keys.length} claves y el catálogo solo tiene ${PERMISSION_ATOM_BY_CODE.size} permisos.`,
    };
  }
  const unknown = keys.find((k) => !PERMISSION_ATOM_BY_CODE.has(k as never));
  return unknown === undefined
    ? undefined
    : {
        code: 'CONDITION_NOT_APPLICABLE_TO_ATOM',
        path: `actionConditions.${unknown.slice(0, 80)}`,
        message: `«${unknown.slice(0, 80)}» no es un permiso del catálogo.`,
      };
}

/**
 * Valida una condición v1.
 *
 * @param condition - El JSON tal como llegó (sin confiar en su forma).
 * @param options - Átomo, efecto, átomos del permiso y datos de la organización.
 * @returns Los errores, ordenados por ruta; vacío si es válida.
 */
export function validateCondition(
  condition: unknown,
  options: ValidateConditionOptions = {},
): ConditionError[] {
  const errors: ConditionError[] = [];
  const err = (
    code: ConditionErrorCode,
    path: string,
    message: string,
  ): void => {
    errors.push({
      code,
      path,
      message,
      ...(options.atom ? { atom: options.atom } : {}),
    });
  };

  let bytes: number;
  try {
    bytes = Buffer.byteLength(JSON.stringify(condition) ?? '', 'utf8');
  } catch {
    err('CONDITION_VALUE_INVALID', '', 'La condición no es un JSON válido.');
    return errors;
  }
  if (bytes > CONDITION_MAX_BYTES) {
    err('CONDITION_TOO_LARGE', '', 'La condición pesa más de 8 KiB.');
    return errors;
  }
  if (!isObj(condition)) {
    err('CONDITION_VALUE_INVALID', '', 'La condición debe ser un objeto.');
    return errors;
  }
  if (
    !Number.isInteger(condition.schemaVersion) ||
    condition.schemaVersion !== SUPPORT_CONDITION_SCHEMA_VERSION
  ) {
    err(
      'CONDITION_SCHEMA_VERSION_UNSUPPORTED',
      'schemaVersion',
      `Solo se admite la versión ${SUPPORT_CONDITION_SCHEMA_VERSION} del esquema de condiciones.`,
    );
    return errors;
  }

  const effect = options.effect ?? 'ALLOW';
  // SEG A-A2: un permiso ALLOW escrito con códigos antiguos (alias) no admite
  // condiciones: el diseño de no regresión los trata sin condiciones propias y
  // la UI prometía «solo en horario y red del hospital» sin que se cumpliera.
  // Se obliga a escribir los permisos específicos (átomos). Una prohibición
  // (DENY) sí: el motor evalúa su condición para cualquier origen.
  if (effect === 'ALLOW') {
    const aliases = (options.grantAtoms ?? []).filter(
      (a) => !isSupportAtom(a) && expandLegacy(a).length > 0,
    );
    if (aliases.length > 0) {
      err(
        'CONDITION_NOT_APPLICABLE_TO_ATOM',
        '',
        `Las condiciones no aplican a permisos escritos con códigos antiguos (${aliases.join(', ')}). Use los permisos específicos del catálogo para poder condicionarlos.`,
      );
      return errors;
    }
  }
  const grantAtoms = [
    ...new Set(
      (options.grantAtoms ?? (options.atom ? [options.atom] : [])).flatMap(
        (a) => atomsOfAction(a).map((x) => x.atom),
      ),
    ),
  ];
  const atomsToCheck = options.atom ? [options.atom] : grantAtoms;
  // SEG A-A5 / N-8: ninguna ruta de administración, de actividad ni de reportes
  // evalúa condiciones. En un átomo de equipo, auditoría o reportes solo vale el
  // techo de delegación (y solo en `team.*`); un `time`, `network` o `limits`
  // guardado ahí daría una falsa sensación de control.
  if (atomsToCheck.some(isUnevaluatedConditionAtom)) {
    const offending = Object.keys(condition).filter(
      (k) => k !== 'schemaVersion' && k !== 'delegationCeiling',
    );
    if (offending.length > 0) {
      err(
        'CONDITION_NOT_APPLICABLE_TO_ATOM',
        offending[0],
        `Las condiciones (${offending.join(', ')}) no se evalúan en los permisos de administración, actividad y reportes: solo vale el techo de delegación en los de equipo.`,
      );
      return errors;
    }
  }

  const closed = (o: Obj, allowed: readonly string[], path: string): void => {
    for (const key of Object.keys(o)) {
      if (!allowed.includes(key)) {
        err(
          'CONDITION_UNKNOWN_KEY',
          path ? `${path}.${key}` : key,
          `La clave «${key}» no existe en las condiciones.`,
        );
      }
    }
  };
  const obj = (value: unknown, path: string): Obj | undefined => {
    if (!isObj(value)) {
      err('CONDITION_VALUE_INVALID', path, `«${path}» debe ser un objeto.`);
      return undefined;
    }
    return value;
  };
  const bad = (path: string, what: string): void =>
    err('CONDITION_VALUE_INVALID', path, `«${path}»: ${what}.`);

  /** ¿La clave aplica? Rechaza con NOT_APPLICABLE si el átomo (o ninguno del permiso) la acepta. */
  const applicable = (key: ConditionKey, path: string): boolean => {
    if (atomsToCheck.length === 0) return true;
    if (atomsToCheck.some((a) => conditionKeyAppliesToAtom(key, a)))
      return true;
    err(
      'CONDITION_NOT_APPLICABLE_TO_ATOM',
      path,
      `La condición «${path}» no aplica a ${atomsToCheck.length === 1 ? `«${atomsToCheck[0]}»` : 'ninguno de los permisos de esta concesión'}.`,
    );
    return false;
  };
  const notOnDeny = (path: string): boolean => {
    if (effect !== 'DENY' || DENY_ALLOWED.has(path)) return false;
    err(
      'CONDITION_NOT_ALLOWED_ON_DENY',
      path,
      `Una prohibición no admite la condición «${path}».`,
    );
    return true;
  };

  closed(condition, TOP_KEYS, '');
  for (const key of TOP_KEYS.slice(1)) {
    if (key in condition && condition[key] === null) {
      bad(key, 'no puede ser nulo (omita la clave)');
    }
  }
  const present = (key: string): unknown =>
    key in condition && condition[key] !== null ? condition[key] : undefined;

  // ── time ───────────────────────────────────────────────────────────
  const time = present('time');
  if (time !== undefined && !notOnDeny('time')) {
    const t = obj(time, 'time');
    if (t && applicable('time', 'time')) {
      closed(t, ['timeZone', 'windows'], 'time');
      if (
        t.timeZone !== undefined &&
        (typeof t.timeZone !== 'string' || !isValidTimeZone(t.timeZone))
      ) {
        err(
          'CONDITION_TIME_ZONE_INVALID',
          'time.timeZone',
          'La zona horaria no es válida.',
        );
      }
      const windows = t.windows;
      if (
        !Array.isArray(windows) ||
        windows.length < 1 ||
        windows.length > 14
      ) {
        bad('time.windows', 'debe tener de 1 a 14 ventanas');
      } else {
        windows.forEach((w, i) => {
          const path = `time.windows[${i}]`;
          const win = obj(w, path);
          if (!win) return;
          closed(win, ['days', 'from', 'to'], path);
          const days = win.days;
          if (
            !Array.isArray(days) ||
            days.length === 0 ||
            !days.every((d) => isInt(d, 0, 6)) ||
            new Set(days).size !== days.length
          ) {
            bad(
              `${path}.days`,
              'los días son números de 0 (domingo) a 6, sin repetir',
            );
          }
          const fromOk = typeof win.from === 'string' && HH_MM.test(win.from);
          const toOk = typeof win.to === 'string' && HH_MM.test(win.to);
          if (!fromOk) bad(`${path}.from`, 'la hora debe ser HH:mm');
          if (!toOk) bad(`${path}.to`, 'la hora debe ser HH:mm');
          if (fromOk && toOk && win.from === win.to) {
            err(
              'CONDITION_TIME_EMPTY_WINDOW',
              path,
              'La ventana horaria está vacía: el inicio y el fin son iguales.',
            );
          }
        });
      }
    }
  }

  // ── limits ─────────────────────────────────────────────────────────
  const limits = present('limits');
  if (limits !== undefined && !notOnDeny('limits')) {
    const limitErr = (path: string, what: string): void =>
      err(
        'CONDITION_LIMIT_INVALID',
        path,
        `Límite no válido en «${path}»: ${what}.`,
      );
    if (!Array.isArray(limits) || limits.length < 1 || limits.length > 6) {
      limitErr('limits', 'debe haber de 1 a 6 límites');
    } else {
      limits.forEach((raw, i) => {
        const path = `limits[${i}]`;
        if (!isObj(raw)) return limitErr(path, 'debe ser un objeto');
        closed(
          raw,
          ['metric', 'per', 'max', 'scope', 'group', 'onExceed'],
          path,
        );
        if (!oneOf(raw.metric, ['ACTIONS', 'DISTINCT_PATIENTS']))
          limitErr(`${path}.metric`, 'métrica desconocida');
        if (!oneOf(raw.per, ['HOUR', 'DAY', 'WEEK']))
          limitErr(`${path}.per`, 'periodo desconocido');
        if (!isInt(raw.max, 1, 10000))
          limitErr(`${path}.max`, 'el tope va de 1 a 10000');
        if (raw.scope !== undefined && !oneOf(raw.scope, ['GRANT', 'PERSON']))
          limitErr(`${path}.scope`, 'alcance desconocido');
        if (
          raw.group !== undefined &&
          !(typeof raw.group === 'string' && GROUP.test(raw.group))
        )
          limitErr(
            `${path}.group`,
            'el grupo usa minúsculas, números y guiones (hasta 40)',
          );
        if (!oneOf(raw.onExceed, ['DENY', 'REQUIRE_APPROVAL']))
          limitErr(`${path}.onExceed`, 'acción al pasarse desconocida');
        if (raw.metric === 'DISTINCT_PATIENTS')
          applicable('limits.DISTINCT_PATIENTS', path);
        else applicable('limits.ACTIONS', path);
      });
    }
  }

  // ── patients ───────────────────────────────────────────────────────
  const patients = present('patients');
  if (patients !== undefined) {
    const p = obj(patients, 'patients');
    if (p) {
      closed(
        p,
        [
          'scope',
          'appointmentWindow',
          'age',
          'isMinor',
          'coverage',
          'flags',
          'exclude',
        ],
        'patients',
      );
      if (effect === 'DENY') {
        for (const sub of ['scope', 'appointmentWindow', 'exclude']) {
          if (sub in p) notOnDeny(`patients.${sub}`);
        }
      }
      const denyOnly = effect === 'DENY';
      if (applicable('patients', 'patients')) {
        if (
          p.scope !== undefined &&
          !denyOnly &&
          !oneOf(p.scope, [
            'ANY',
            'WITH_APPOINTMENT_WINDOW',
            'CARE_TEAM_OF_COVERED_DOCTOR',
          ])
        )
          bad('patients.scope', 'alcance desconocido');
        if (p.appointmentWindow !== undefined && !denyOnly) {
          const w = obj(p.appointmentWindow, 'patients.appointmentWindow');
          if (w) {
            closed(
              w,
              ['daysBefore', 'daysAfter', 'withCoveredDoctor'],
              'patients.appointmentWindow',
            );
            if (!isInt(w.daysBefore, 0, 3650))
              bad(
                'patients.appointmentWindow.daysBefore',
                'debe ser un entero de 0 a 3650',
              );
            if (!isInt(w.daysAfter, 0, 3650))
              bad(
                'patients.appointmentWindow.daysAfter',
                'debe ser un entero de 0 a 3650',
              );
            if (
              w.withCoveredDoctor !== undefined &&
              typeof w.withCoveredDoctor !== 'boolean'
            )
              bad(
                'patients.appointmentWindow.withCoveredDoctor',
                'debe ser verdadero o falso',
              );
          }
        }
        if (p.age !== undefined) {
          const a = obj(p.age, 'patients.age');
          if (a) {
            closed(a, ['min', 'max'], 'patients.age');
            const hasMin = a.min !== undefined;
            const hasMax = a.max !== undefined;
            if (!hasMin && !hasMax)
              bad('patients.age', 'indique mínimo o máximo');
            if (hasMin && !isInt(a.min, 0, 150))
              bad('patients.age.min', 'debe ser un entero de 0 a 150');
            if (hasMax && !isInt(a.max, 0, 150))
              bad('patients.age.max', 'debe ser un entero de 0 a 150');
            if (
              hasMin &&
              hasMax &&
              isInt(a.min, 0, 150) &&
              isInt(a.max, 0, 150) &&
              a.min > a.max
            )
              bad('patients.age', 'el mínimo no puede pasar del máximo');
          }
        }
        if (p.isMinor !== undefined && typeof p.isMinor !== 'boolean')
          bad('patients.isMinor', 'debe ser verdadero o falso');
        if (p.coverage !== undefined) {
          const c = obj(p.coverage, 'patients.coverage');
          if (c) {
            closed(c, ['mode', 'carrierIds'], 'patients.coverage');
            if (!oneOf(c.mode, ['INSURED_ONLY', 'SELF_PAY_ONLY', 'ANY']))
              bad('patients.coverage.mode', 'modo desconocido');
            if (
              c.carrierIds !== undefined &&
              !(
                Array.isArray(c.carrierIds) &&
                c.carrierIds.length <= 50 &&
                c.carrierIds.every((x) => typeof x === 'string' && x.length > 0)
              )
            )
              bad(
                'patients.coverage.carrierIds',
                'debe ser una lista de hasta 50 aseguradoras',
              );
          }
        }
        if (p.flags !== undefined) {
          const f = obj(p.flags, 'patients.flags');
          if (f) {
            closed(f, ['anyOf'], 'patients.flags');
            if (
              !Array.isArray(f.anyOf) ||
              !f.anyOf.every((x) => oneOf(x, FLAGS))
            )
              bad('patients.flags.anyOf', 'banderas desconocidas');
          }
        }
        if (p.exclude !== undefined && !denyOnly) {
          const x = obj(p.exclude, 'patients.exclude');
          if (x) {
            closed(x, ['minors', 'flags'], 'patients.exclude');
            if (x.minors !== undefined && typeof x.minors !== 'boolean')
              bad('patients.exclude.minors', 'debe ser verdadero o falso');
            if (
              x.flags !== undefined &&
              !(Array.isArray(x.flags) && x.flags.every((f) => oneOf(f, FLAGS)))
            )
              bad('patients.exclude.flags', 'banderas desconocidas');
          }
        }
      }
    }
  }

  // ── appointment ────────────────────────────────────────────────────
  const appointment = present('appointment');
  if (appointment !== undefined) {
    const a = obj(appointment, 'appointment');
    if (a) {
      closed(a, ['window', 'leadTime', 'horizon'], 'appointment');
      if (
        a.window !== undefined &&
        applicable('appointment.window', 'appointment.window')
      ) {
        const w = obj(a.window, 'appointment.window');
        if (w) {
          closed(w, ['daysBefore', 'daysAfter'], 'appointment.window');
          if (!isInt(w.daysBefore, 0, 3650))
            bad(
              'appointment.window.daysBefore',
              'debe ser un entero de 0 a 3650',
            );
          if (!isInt(w.daysAfter, 0, 3650))
            bad(
              'appointment.window.daysAfter',
              'debe ser un entero de 0 a 3650',
            );
        }
      }
      if (
        a.leadTime !== undefined &&
        applicable('appointment.leadTime', 'appointment.leadTime')
      ) {
        const l = obj(a.leadTime, 'appointment.leadTime');
        if (l) {
          closed(l, ['minHours', 'onViolation'], 'appointment.leadTime');
          if (!isNum(l.minHours, 0, 8760))
            bad('appointment.leadTime.minHours', 'debe ser de 0 a 8760 horas');
          if (!oneOf(l.onViolation, ['DENY', 'REQUIRE_APPROVAL']))
            bad('appointment.leadTime.onViolation', 'acción desconocida');
        }
      }
      if (
        a.horizon !== undefined &&
        !notOnDeny('appointment.horizon') &&
        applicable('appointment.horizon', 'appointment.horizon')
      ) {
        const h = obj(a.horizon, 'appointment.horizon');
        if (h) {
          closed(h, ['maxDaysAhead'], 'appointment.horizon');
          if (!isInt(h.maxDaysAhead, 1, 3650))
            bad(
              'appointment.horizon.maxDaysAhead',
              'debe ser un entero de 1 a 3650',
            );
        }
      }
    }
  }

  // ── channels ───────────────────────────────────────────────────────
  const channels = present('channels');
  if (channels !== undefined) {
    const c = obj(channels, 'channels');
    if (c && applicable('channels', 'channels')) {
      closed(c, ['allow'], 'channels');
      if (
        !Array.isArray(c.allow) ||
        c.allow.length === 0 ||
        !c.allow.every((x) => oneOf(x, ['CHAT', 'EMAIL'])) ||
        new Set(c.allow).size !== c.allow.length
      ) {
        bad('channels.allow', 'debe listar CHAT y/o EMAIL, sin repetir');
      }
    }
  }

  // ── fields ─────────────────────────────────────────────────────────
  const fields = present('fields');
  if (fields !== undefined && !notOnDeny('fields')) {
    const f = obj(fields, 'fields');
    if (f) {
      for (const [fieldAtom, spec] of Object.entries(f)) {
        const path = `fields.${fieldAtom}`;
        const meta = PERMISSION_ATOM_BY_CODE.get(fieldAtom);
        if (
          !meta?.isFieldLevel ||
          !(grantAtoms as readonly string[]).includes(fieldAtom)
        ) {
          err(
            'CONDITION_FIELD_NOT_GRANTED',
            path,
            `El campo «${fieldAtom}» no está entre los permisos de esta concesión.`,
          );
          continue;
        }
        const s = obj(spec, path);
        if (!s) continue;
        closed(s, ['mask'], path);
        if (s.mask === 'HASH') {
          err(
            'CONDITION_NOT_APPLICABLE_TO_ATOM',
            `${path}.mask`,
            'HASH solo existe para exportaciones.',
          );
        } else if (!oneOf(s.mask, ['PARTIAL', 'REDACT', 'NULLIFY'])) {
          bad(`${path}.mask`, 'máscara desconocida');
        }
      }
    }
  }

  // ── amount ─────────────────────────────────────────────────────────
  const amount = present('amount');
  if (amount !== undefined && applicableAmount()) {
    const a = obj(amount, 'amount');
    if (a) {
      closed(
        a,
        [
          'currency',
          'perTransactionMax',
          'perDayMax',
          'maxDiscountPercent',
          'onExceed',
        ],
        'amount',
      );
      if (a.currency !== 'BOB')
        bad('amount.currency', 'en esta versión solo se admite BOB');
      const caps = [
        'perTransactionMax',
        'perDayMax',
        'maxDiscountPercent',
      ].filter((k) => a[k] !== undefined);
      if (caps.length === 0) bad('amount', 'indique al menos un tope');
      if (
        a.perTransactionMax !== undefined &&
        !isNum(a.perTransactionMax, 0.01, 1e9)
      )
        bad('amount.perTransactionMax', 'debe ser un monto positivo');
      if (a.perDayMax !== undefined && !isNum(a.perDayMax, 0.01, 1e9))
        bad('amount.perDayMax', 'debe ser un monto positivo');
      if (
        a.maxDiscountPercent !== undefined &&
        !isNum(a.maxDiscountPercent, 0, 100)
      )
        bad('amount.maxDiscountPercent', 'debe ser de 0 a 100');
      if (
        a.onExceed !== undefined &&
        !oneOf(a.onExceed, ['DENY', 'REQUIRE_APPROVAL'])
      )
        bad('amount.onExceed', 'acción desconocida');
    }
  }
  function applicableAmount(): boolean {
    return !notOnDeny('amount') && applicable('amount', 'amount');
  }

  // ── session / network / device / presence ──────────────────────────
  const session = present('session');
  if (session !== undefined && !notOnDeny('session')) {
    const s = obj(session, 'session');
    if (s && applicable('session', 'session')) {
      closed(s, ['maxSessionMinutes'], 'session');
      if (!isInt(s.maxSessionMinutes, 30, 720))
        bad('session.maxSessionMinutes', 'debe ser de 30 a 720 minutos');
    }
  }
  const network = present('network');
  if (network !== undefined && !notOnDeny('network')) {
    const n = obj(network, 'network');
    if (n && applicable('network', 'network')) {
      closed(n, ['require'], 'network');
      if (!oneOf(n.require, ['ORG_RULES', 'ANY']))
        bad('network.require', 'debe ser ORG_RULES o ANY');
      else if (
        n.require === 'ORG_RULES' &&
        options.orgHasAllowRules === false
      ) {
        err(
          'CONDITION_NETWORK_NO_RULES',
          'network.require',
          'La organización no definió redes permitidas: defínalas antes de exigirlas.',
        );
      }
    }
  }
  const device = present('device');
  if (device !== undefined && !notOnDeny('device')) {
    const d = obj(device, 'device');
    if (d && applicable('device', 'device')) {
      closed(d, ['knownOnly'], 'device');
      if (typeof d.knownOnly !== 'boolean')
        bad('device.knownOnly', 'debe ser verdadero o falso');
      else if (d.knownOnly && options.deviceCookieEnabled === false) {
        // SEG A-M5: sin cookie de dispositivo, la huella es User-Agent + SO y un
        // equipo nuevo nace de confianza; «solo equipo conocido» no protegería.
        bad(
          'device.knownOnly',
          'exige la cookie de dispositivo, que está apagada (AUTH_DEVICE_COOKIE_ENABLED): sin ella un equipo desconocido podría pasar por conocido. Enciéndala o quite la condición',
        );
      }
    }
  }
  const presence = present('presence');
  if (presence !== undefined) {
    const pr = obj(presence, 'presence');
    if (pr && applicable('presence', 'presence')) {
      closed(pr, ['doctor'], 'presence');
      if (pr.doctor !== 'ONLINE')
        bad('presence.doctor', 'solo se admite ONLINE');
    }
  }

  // ── obligations ────────────────────────────────────────────────────
  const obligations = present('obligations');
  if (obligations !== undefined && !notOnDeny('obligations')) {
    const o = obj(obligations, 'obligations');
    if (o && applicable('obligations', 'obligations')) {
      closed(o, ['requireReason', 'stepUp', 'approval'], 'obligations');
      if (o.requireReason !== undefined) {
        const r = obj(o.requireReason, 'obligations.requireReason');
        if (r) {
          closed(r, ['minLength'], 'obligations.requireReason');
          if (r.minLength !== undefined && !isInt(r.minLength, 5, 200))
            bad(
              'obligations.requireReason.minLength',
              'debe ser de 5 a 200 caracteres',
            );
        }
      }
      if (o.stepUp !== undefined) {
        const s = obj(o.stepUp, 'obligations.stepUp');
        if (s) {
          closed(s, ['maxAgeMinutes'], 'obligations.stepUp');
          if (s.maxAgeMinutes !== undefined && !isInt(s.maxAgeMinutes, 1, 60))
            bad(
              'obligations.stepUp.maxAgeMinutes',
              'debe ser de 1 a 60 minutos',
            );
          else if (
            typeof s.maxAgeMinutes === 'number' &&
            s.maxAgeMinutes > DEFAULT_STEP_UP_MAX_AGE_MINUTES &&
            atomsToCheck.some(
              (a) => PERMISSION_ATOM_BY_CODE.get(a)?.requiresStepUp,
            )
          ) {
            err(
              'CONDITION_OBLIGATION_LOOSENS_CATALOG',
              'obligations.stepUp',
              'El segundo paso no puede durar más que lo que el catálogo ya exige (10 minutos).',
            );
          }
        }
      }
      if (o.approval !== undefined) {
        const a = obj(o.approval, 'obligations.approval');
        if (a) {
          closed(a, ['by', 'ttlMinutes'], 'obligations.approval');
          if (!oneOf(a.by, ['DOCTOR', 'SECOND_APPROVER', 'SERVICE_HEAD']))
            bad('obligations.approval.by', 'aprobador desconocido');
          if (a.ttlMinutes !== undefined && !isInt(a.ttlMinutes, 5, 1440))
            bad(
              'obligations.approval.ttlMinutes',
              'debe ser de 5 a 1440 minutos',
            );
          if (
            typeof a.by === 'string' &&
            atomsToCheck.some((x) => {
              const mode = PERMISSION_ATOM_BY_CODE.get(x)?.approvalMode;
              return mode !== null && mode !== undefined && mode !== a.by;
            })
          ) {
            err(
              'CONDITION_OBLIGATION_LOOSENS_CATALOG',
              'obligations.approval',
              'La condición no puede cambiar quién aprueba lo que el catálogo ya exige.',
            );
          }
        }
      }
    }
  }

  // ── delegationCeiling ──────────────────────────────────────────────
  const ceiling = present('delegationCeiling');
  if (ceiling !== undefined && !notOnDeny('delegationCeiling')) {
    const c = obj(ceiling, 'delegationCeiling');
    if (c && applicable('delegationCeiling', 'delegationCeiling')) {
      closed(
        c,
        ['allowAtoms', 'forbidAtoms', 'templates', 'maxValidDays'],
        'delegationCeiling',
      );
      const patternList = (
        key: 'allowAtoms' | 'forbidAtoms',
      ): string[] | undefined => {
        const v = c[key];
        if (v === undefined) return [];
        if (
          !Array.isArray(v) ||
          v.length > 100 ||
          !v.every((x) => typeof x === 'string' && PATTERN.test(x))
        ) {
          bad(
            `delegationCeiling.${key}`,
            'debe ser una lista de átomos o patrones (por ejemplo «agenda.*»)',
          );
          return undefined;
        }
        return v as string[];
      };
      const allow = patternList('allowAtoms');
      const forbid = patternList('forbidAtoms');
      if (
        c.templates !== undefined &&
        !(
          Array.isArray(c.templates) &&
          c.templates.every((t) => oneOf(t, SUPPORT_TEMPLATE_CODES))
        )
      )
        bad('delegationCeiling.templates', 'plantillas desconocidas');
      if (c.maxValidDays !== undefined && !isInt(c.maxValidDays, 1, 3650))
        bad('delegationCeiling.maxValidDays', 'debe ser un entero de 1 a 3650');
      if (allow) {
        const forbidden = atomsMatchingPatterns(forbid ?? []);
        allow.forEach((pattern, i) => {
          const hits = [...atomsMatchingPatterns([pattern])].filter(
            (atom) =>
              isDelegatedAdminForbidden(atom) &&
              !forbidden.has(atom) &&
              !(forbid ?? []).some((f) => atomMatchesPattern(atom, f)),
          );
          if (hits.length > 0) {
            err(
              'CONDITION_CEILING_FORBIDDEN_ATOM',
              `delegationCeiling.allowAtoms[${i}]`,
              `El techo abre permisos que un administrador delegado nunca puede dar (${hits[0]}).`,
            );
          }
        });
      }
    }
  }

  return errors.sort(
    (a, b) => a.path.localeCompare(b.path) || a.code.localeCompare(b.code),
  );
}
