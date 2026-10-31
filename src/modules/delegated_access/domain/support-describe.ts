import {
  SupportAccessReason,
  type UnmetCondition,
} from './support-access.types';
import type { SupportCondition } from './support-conditions';
import {
  PERMISSION_ATOM_BY_CODE,
  atomsOfAction,
} from './support-permission-catalog';

/**
 * Textos en lenguaje simple (CONTRATO-GOBIERNO Anexo C): plantillas
 * DETERMINÍSTICAS (sin IA) con huecos que llena el servidor. Español de
 * Bolivia, trato de usted, sin datos de pacientes.
 */

/** Valores para los huecos de una plantilla; lo que falte usa una palabra neutra. */
export type DescribeVars = Readonly<
  Record<string, string | number | undefined>
>;

const v = (vars: DescribeVars, key: string, fallback: string): string =>
  vars[key] === undefined || vars[key] === '' ? fallback : String(vars[key]);

/** «de el» → «del» (de la aprobación del doctor). */
const de = (who: string): string =>
  /^el /i.test(who) ? `del ${who.slice(3)}` : `de ${who}`;

const REASON_TEXT: Readonly<
  Record<SupportAccessReason, (x: DescribeVars) => string>
> = {
  [SupportAccessReason.ALLOWED]: (x) =>
    `Está permitido por el permiso «${v(x, 'permiso', 'de la persona')}».`,
  [SupportAccessReason.NO_ENGAGEMENT]: (x) =>
    `${v(x, 'persona', 'La persona')} no tiene un vínculo de apoyo con esta organización.`,
  [SupportAccessReason.ENGAGEMENT_INACTIVE]: (x) =>
    `El vínculo de ${v(x, 'persona', 'la persona')} no está activo: está suspendido, vencido o terminado.`,
  [SupportAccessReason.DOCTOR_NOT_ACCEPTED]: (x) =>
    `${v(x, 'doctor', 'El doctor')} todavía no aceptó a ${v(x, 'persona', 'la persona')}.`,
  [SupportAccessReason.REPLY_NOT_ALLOWED_BY_DOCTOR]: (x) =>
    `${v(x, 'doctor', 'El doctor')} no permitió que ${v(x, 'persona', 'la persona')} responda mensajes en su nombre.`,
  [SupportAccessReason.NO_COVERING_GRANT]: (x) =>
    `Ningún permiso de ${v(x, 'persona', 'la persona')} cubre ${v(x, 'objetivo', 'esta agenda')}.`,
  [SupportAccessReason.ACTION_NOT_GRANTED]: (x) =>
    `${v(x, 'persona', 'La persona')} tiene permisos sobre ${v(x, 'objetivo', 'esta agenda')}, pero ninguno incluye «${v(x, 'acción', 'esta acción')}».`,
  [SupportAccessReason.TARGET_OUTSIDE_TENANT]: () =>
    'Ese doctor, servicio o espacio no pertenece a esta organización.',
  [SupportAccessReason.NOT_DELEGABLE]: () =>
    'Esto solo lo puede hacer el administrador de seguridad; no se puede delegar.',
  [SupportAccessReason.ORG_RULE_DENY]: (x) =>
    `Una regla de su organización lo prohíbe: «${v(x, 'mensaje', 'no permitido')}».`,
  [SupportAccessReason.EXPLICIT_DENY]: (x) =>
    `Hay una prohibición expresa para este caso: «${v(x, 'permiso', 'este permiso')}».`,
  [SupportAccessReason.ONBOARDING_INCOMPLETE]: (x) =>
    `Falta completar el ingreso de ${v(x, 'persona', 'la persona')}: ${v(x, 'pendientes', 'hay pasos pendientes')}.`,
  [SupportAccessReason.CONDITION_UNREADABLE]: () =>
    'Este permiso tiene una condición que el sistema no puede leer. Avise al administrador.',
  [SupportAccessReason.TIME_WINDOW]: (x) =>
    `Está fuera del horario permitido (${v(x, 'ventanas', 'el horario del permiso')}).`,
  [SupportAccessReason.LIMIT_EXCEEDED]: (x) =>
    `Llegó al límite de ${v(x, 'max', 'acciones')} ${v(x, 'métrica', 'acciones')} por ${v(x, 'periodo', 'día')}; se renueva ${v(x, 'cuándo', 'más adelante')}.`,
  [SupportAccessReason.PATIENT_SCOPE]: (x) =>
    `Este paciente no está entre los que ${v(x, 'persona', 'la persona')} puede atender (${v(x, 'alcance', 'según el permiso')}).`,
  [SupportAccessReason.PATIENT_AGE]: (x) =>
    `La edad del paciente está fuera de lo permitido (${v(x, 'rango', 'según el permiso')}).`,
  [SupportAccessReason.PATIENT_AGE_UNKNOWN]: () =>
    'No se conoce la edad del paciente y este permiso la exige.',
  [SupportAccessReason.PATIENT_COVERAGE]: (x) =>
    `El permiso solo alcanza a pacientes ${v(x, 'seguro', 'con o sin seguro')}.`,
  [SupportAccessReason.PATIENT_EXCLUDED]: (x) =>
    `Este paciente está reservado (${v(x, 'marcas', 'marca de acceso')}) o excluido de este permiso.`,
  [SupportAccessReason.APPOINTMENT_WINDOW]: (x) =>
    `La cita está fuera de las fechas permitidas (${v(x, 'ventana', 'según el permiso')}).`,
  [SupportAccessReason.LEAD_TIME]: (x) => {
    const left = Number(vars(x, 'horasRestantes'));
    const lead =
      left === 1 ? 'Falta 1 hora' : `Faltan ${vars(x, 'horasRestantes')} horas`;
    const approver = x.aprobador
      ? ` y, si no, la aprobación ${de(String(x.aprobador))}`
      : '';
    return `${lead} para la cita; el permiso pide al menos ${vars(x, 'minHoras')} horas de anticipación${approver}.`;
  },
  [SupportAccessReason.HORIZON]: (x) =>
    `La fecha pedida pasa de los ${v(x, 'dias', 'días')} días que este permiso permite.`,
  [SupportAccessReason.CHANNEL_NOT_ALLOWED]: (x) =>
    `Este permiso solo permite responder por ${v(x, 'canales', 'los canales autorizados')}.`,
  [SupportAccessReason.CHANNEL_UNKNOWN]: () =>
    'No se pudo saber por qué canal se envía el mensaje.',
  [SupportAccessReason.NETWORK_NOT_ALLOWED]: () =>
    'Debe conectarse desde la red de la organización.',
  [SupportAccessReason.NETWORK_RULES_NOT_CONFIGURED]: () =>
    'El permiso pide la red de la organización, pero la organización no definió redes permitidas. Avise al administrador.',
  [SupportAccessReason.DEVICE_NOT_TRUSTED]: () =>
    'Debe usar un equipo de confianza. Confírmelo en Seguridad de la cuenta.',
  [SupportAccessReason.SESSION_TOO_LONG]: (x) =>
    `Su sesión pasó de ${v(x, 'max', 'el máximo de')} minutos. Vuelva a iniciar sesión.`,
  [SupportAccessReason.DOCTOR_OFFLINE]: (x) =>
    `${v(x, 'doctor', 'El doctor')} debe estar conectado para esto.`,
  [SupportAccessReason.AMOUNT_LIMIT]: (x) =>
    `El monto supera el límite de ${v(x, 'límite', 'este permiso')} Bs ${v(x, 'por', 'por operación')}.`,
  [SupportAccessReason.AMOUNT_UNKNOWN]: () =>
    'No se informó el monto y este permiso lo limita.',
  [SupportAccessReason.REASON_REQUIRED]: (x) =>
    `Escriba el motivo (al menos ${v(x, 'n', '5')} caracteres).`,
  [SupportAccessReason.STEP_UP_REQUIRED]: () =>
    'Confirme su identidad con el código de su aplicación de verificación.',
  [SupportAccessReason.STEP_UP_UNAVAILABLE]: () =>
    'No se pudo comprobar la verificación en dos pasos. Intente de nuevo en un momento.',
  [SupportAccessReason.APPROVAL_REQUIRED]: (x) =>
    `Necesita la aprobación ${de(v(x, 'aprobador', 'otra persona'))}. Pídala y vuelva a intentar.`,
  [SupportAccessReason.DECISION_LOG_UNAVAILABLE]: () =>
    'No se pudo dejar el registro obligatorio de esta acción. Intente de nuevo en un momento.',
};

function vars(x: DescribeVars, key: string): string {
  return v(x, key, '');
}

/**
 * Texto de un motivo de decisión cuando niega o desafía.
 *
 * @param reason - Motivo estable.
 * @param vars - Valores de los huecos (persona, doctor, objetivo…).
 * @returns Una frase completa en lenguaje simple.
 */
export function describeReason(
  reason: SupportAccessReason,
  vars: DescribeVars,
): string {
  return REASON_TEXT[reason](vars);
}

const PASS_TEXT: Readonly<Record<string, (x: DescribeVars) => string>> = {
  ENGAGEMENT_ACTIVE: (x) =>
    `El vínculo de ${v(x, 'persona', 'la persona')} está vigente y recertificado.`,
  DOCTOR_ACCEPTED: (x) =>
    `${v(x, 'doctor', 'El doctor')} aceptó a ${v(x, 'persona', 'la persona')}${x.fecha ? ` (${x.fecha})` : ''}.`,
  DELEGABLE: () => 'Esto se puede dar al personal de apoyo.',
  NO_ORG_RULE_DENY: () => 'Ninguna regla de la organización lo prohíbe.',
  NO_EXPLICIT_DENY: (x) =>
    `No hay una prohibición expresa para ${v(x, 'persona', 'la persona')} aquí.`,
  COVERED: (x) =>
    `El permiso «${v(x, 'permiso', 'de la persona')}» cubre ${v(x, 'objetivo', 'esta agenda')}.`,
  ALLOWED: (x) =>
    `Está permitido por el permiso «${v(x, 'permiso', 'de la persona')}».`,
  TIME_OK: () => 'Está dentro del horario permitido.',
  LIMIT_OK: (x) =>
    `${v(x, 'métrica', 'Acciones')} de hoy: ${v(x, 'usado', '0')} de ${v(x, 'max', '0')}.`,
  APPOINTMENT_WINDOW_OK: () => 'La cita está dentro de las fechas permitidas.',
  CHANNELS_OK: () => 'El canal del mensaje está permitido.',
  PATIENTS_OK: () => 'El paciente está dentro del alcance del permiso.',
  LEAD_TIME_OK: () => 'La cita tiene la anticipación que el permiso pide.',
  HORIZON_OK: () => 'La fecha pedida está dentro del horizonte permitido.',
  NETWORK_OK: () => 'Se conecta desde la red de la organización.',
  DEVICE_OK: () => 'Usa un equipo de confianza.',
  SESSION_OK: () => 'Su sesión está dentro del tiempo permitido.',
  PRESENCE_OK: () => 'El doctor está conectado.',
  AMOUNT_OK: () => 'El monto está dentro del límite.',
  REASON_OK: () => 'Motivo registrado.',
  STEP_UP_OK: (x) =>
    `Verificación en dos pasos vigente (${v(x, 'minutos', '0')} min).`,
  APPROVAL_OK: (x) => `Aprobada ${de(v(x, 'aprobador', 'otra persona'))}.`,
};

/**
 * Texto de un paso de la traza. Un paso que pasa usa la frase de «cuando pasa»;
 * uno que no pasa, la del motivo (el código del paso es el motivo).
 */
export function describeTraceStep(
  code: string,
  passed: boolean,
  vars: DescribeVars,
): string {
  if (passed) {
    const text = PASS_TEXT[code];
    return text ? text(vars) : 'Este paso se cumple.';
  }
  const reason = (Object.values(SupportAccessReason) as string[]).includes(code)
    ? (code as SupportAccessReason)
    : undefined;
  return reason ? describeReason(reason, vars) : 'Este paso no se cumple.';
}

/** Aviso cuando un piso de la organización reduce un dato (G-05). */
export function describeFieldFloorNotice(
  maxVisibility: 'PARTIAL' | 'REDACT' | 'NULLIFY',
): string {
  switch (maxVisibility) {
    case 'PARTIAL':
      return 'Su organización limita este dato a la vista parcial.';
    case 'REDACT':
      return 'Su organización limita este dato: se muestra oculto.';
    case 'NULLIFY':
      return 'Su organización limita este dato: no se muestra.';
  }
}

// ───────────────────────── condiciones y permisos ─────────────────────────

const DAYS = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
];

function joinList(items: readonly string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

const DAYS_PLURAL = [
  'domingos',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábados',
];

function daysText(days: readonly number[]): string {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  const consecutive = sorted.every(
    (d, i) => i === 0 || d === sorted[i - 1] + 1,
  );
  if (sorted.length >= 3 && consecutive) {
    return `de ${DAYS[sorted[0]]} a ${DAYS[sorted[sorted.length - 1]]}`;
  }
  return `los ${joinList(sorted.map((d) => DAYS_PLURAL[d]))}`;
}

const FIELD_NAMES: Readonly<Record<string, string>> = {
  'agenda.appointment.view.patient_name': 'el nombre del paciente',
  'agenda.appointment.view.patient_phone': 'el teléfono del paciente',
  'agenda.appointment.view.patient_document': 'el documento del paciente',
  'agenda.appointment.view.reason': 'el motivo de consulta',
  'agenda.appointment.view.insurance': 'la aseguradora',
  'agenda.appointment.view.price': 'el precio',
  'patients.profile.view.phone_full': 'el teléfono completo',
  'patients.profile.view.document_full': 'el documento completo',
};
const PER: Readonly<Record<string, string>> = {
  HOUR: 'hora',
  DAY: 'día',
  WEEK: 'semana',
};
const ATOM_NOUN: Readonly<Record<string, string>> = {
  'agenda.appointment.cancel': 'cancelaciones',
  'agenda.appointment.reschedule': 'reprogramaciones',
  'agenda.appointment.create': 'citas nuevas',
  'patients.search.exact': 'búsquedas',
};
const APPROVER: Readonly<Record<string, string>> = {
  DOCTOR: 'del doctor',
  SECOND_APPROVER: 'de un segundo aprobador',
  SERVICE_HEAD: 'de la jefatura del servicio',
};

function relativeDay(days: number, past: boolean): string {
  if (days === 0) return 'hoy';
  if (past) return days === 1 ? 'ayer' : `hace ${days} días`;
  return days === 1 ? 'mañana' : `los próximos ${days} días`;
}

function duration(minutes: number): string {
  return minutes % 60 === 0 ? `${minutes / 60} horas` : `${minutes} minutos`;
}

function phrases(c: SupportCondition, atom?: string): string[] {
  const out: string[] = [];
  if (c.time?.windows?.length) {
    const wins = c.time.windows.map(
      (w) => `${daysText(w.days)} de ${w.from} a ${w.to}`,
    );
    out.push(`solo ${joinList(wins)}`);
  }
  for (const l of c.limits ?? []) {
    const tail =
      l.onExceed === 'REQUIRE_APPROVAL'
        ? '; si se pasa, necesita aprobación'
        : '; si se pasa, no puede';
    out.push(
      l.metric === 'ACTIONS'
        ? `hasta ${l.max} ${(atom && ATOM_NOUN[atom]) ?? 'acciones'} por ${PER[l.per]}${tail}`
        : `con no más de ${l.max} pacientes distintos por ${PER[l.per]}${tail}`,
    );
  }
  const p = c.patients;
  if (p?.scope === 'WITH_APPOINTMENT_WINDOW') {
    const w = p.appointmentWindow ?? { daysBefore: 0, daysAfter: 0 };
    out.push(
      w.daysBefore === 0 && w.daysAfter === 0
        ? 'solo con pacientes de hoy'
        : `solo con pacientes con cita entre ${relativeDay(w.daysBefore, true)} y ${relativeDay(w.daysAfter, false)}`,
    );
  } else if (p?.scope === 'CARE_TEAM_OF_COVERED_DOCTOR') {
    out.push('solo con pacientes de su equipo asistencial');
  }
  if (p?.isMinor === true) out.push('solo menores');
  if (p?.isMinor === false) out.push('solo adultos');
  if (p?.age) {
    const { min, max } = p.age;
    out.push(
      min !== undefined && max !== undefined
        ? `solo de ${min} a ${max} años`
        : min !== undefined
          ? `solo de ${min} años o más`
          : `solo hasta ${max} años`,
    );
  }
  if (p?.coverage?.mode === 'INSURED_ONLY')
    out.push('solo pacientes asegurados');
  if (p?.coverage?.mode === 'SELF_PAY_ONLY')
    out.push('solo pacientes sin seguro');
  if (p?.exclude && (p.exclude.minors || p.exclude.flags?.length)) {
    const what = [
      ...(p.exclude.minors ? ['menores'] : []),
      ...(p.exclude.flags?.length
        ? [`pacientes reservados (${p.exclude.flags.join(', ')})`]
        : []),
    ];
    out.push(`no con ${what.join(' ni ')}`);
  }
  if (c.appointment?.window) {
    const w = c.appointment.window;
    out.push(
      `solo citas entre ${relativeDay(w.daysBefore, true)} y ${relativeDay(w.daysAfter, false)}`,
    );
  }
  if (c.appointment?.leadTime) {
    const l = c.appointment.leadTime;
    out.push(
      `con al menos ${l.minHours} horas de anticipación${l.onViolation === 'REQUIRE_APPROVAL' ? '; si no, necesita la aprobación del doctor' : ''}`,
    );
  }
  if (c.appointment?.horizon)
    out.push(`hasta ${c.appointment.horizon.maxDaysAhead} días hacia adelante`);
  if (c.channels) {
    out.push(
      `solo por ${joinList(c.channels.allow.map((x) => (x === 'CHAT' ? 'chat' : 'correo')))}`,
    );
  }
  for (const [field, spec] of Object.entries(c.fields ?? {})) {
    const name = FIELD_NAMES[field] ?? field;
    out.push(
      spec.mask === 'PARTIAL'
        ? `${name} solo parcial${field.endsWith('.reason') ? ' (primeros 40 caracteres)' : ''}`
        : spec.mask === 'REDACT'
          ? `${name} solo oculto`
          : `${name} no se muestra`,
    );
  }
  if (c.amount) {
    const a = c.amount;
    const caps = [
      ...(a.perTransactionMax !== undefined
        ? [`Bs ${a.perTransactionMax} por operación`]
        : []),
      ...(a.perDayMax !== undefined ? [`Bs ${a.perDayMax} por día`] : []),
    ];
    if (caps.length) out.push(`hasta ${joinList(caps)}`);
    if (a.maxDiscountPercent !== undefined)
      out.push(`con descuentos de hasta ${a.maxDiscountPercent} %`);
  }
  if (c.session)
    out.push(`con sesiones de hasta ${duration(c.session.maxSessionMinutes)}`);
  if (c.network?.require === 'ORG_RULES')
    out.push('solo desde la red de la organización');
  if (c.device?.knownOnly) out.push('solo desde un equipo de confianza');
  if (c.presence) out.push('mientras el doctor esté conectado');
  if (c.obligations) {
    const what = [
      ...(c.obligations.requireReason ? ['motivo'] : []),
      ...(c.obligations.stepUp ? ['verificación en dos pasos'] : []),
      ...(c.obligations.approval
        ? [`la aprobación ${APPROVER[c.obligations.approval.by]}`]
        : []),
    ];
    if (what.length) out.push(`pidiendo ${joinList(what)}`);
  }
  if (c.delegationCeiling) {
    const d = c.delegationCeiling;
    const modules = [
      ...new Set((d.allowAtoms ?? []).map((x) => x.split('.')[0])),
    ];
    out.push(
      `dar permisos${modules.length ? ` de ${joinList(modules)}` : ''}${d.templates?.length ? ` a ${joinList(d.templates)}` : ''}${d.maxValidDays ? ` por hasta ${d.maxValidDays} días` : ''}`,
    );
  }
  return out;
}

/**
 * Resumen de una condición en lenguaje simple: una frase por clave, en el
 * orden de §3.4, unidas con «, » y « y », antepuestas con «Puede …».
 *
 * @param condition - Condición v1.
 * @param atom - Átomo al que pertenece (para nombrar la métrica de un límite).
 * @returns La frase; vacía si la condición no restringe nada.
 */
export function describeCondition(
  condition: SupportCondition,
  atom?: string,
): string {
  const list = phrases(condition, atom);
  return list.length === 0 ? '' : `Puede ${joinList(list)}.`;
}

/**
 * Resumen de un permiso: qué incluye (nombres simples) y bajo qué condiciones.
 *
 * @param grant - Átomos o alias, efecto y condición del permiso.
 */
export function describeGrant(grant: {
  readonly atoms: readonly string[];
  readonly effect?: 'ALLOW' | 'DENY';
  readonly condition?: SupportCondition | null;
}): string {
  const names = [
    ...new Set(
      grant.atoms.flatMap((a) =>
        atomsOfAction(a).map(
          (x) => PERMISSION_ATOM_BY_CODE.get(x.atom)?.name ?? x.atom,
        ),
      ),
    ),
  ];
  const head = grant.effect === 'DENY' ? 'No puede' : 'Incluye';
  const condition = grant.condition ? describeCondition(grant.condition) : '';
  return `${head}: ${names.join(', ')}.${condition ? ` ${condition}` : ''}`;
}

const PERIOD_RESET: Readonly<Record<string, string>> = {
  HOUR: 'dentro de una hora',
  DAY: 'a la medianoche',
  WEEK: 'el lunes',
};

/** Texto de las ventanas horarias de una condición (`de lunes a viernes de 07:30 a 18:30`). */
export function describeWindows(
  windows: readonly {
    readonly days: readonly number[];
    readonly from: string;
    readonly to: string;
  }[],
): string {
  return joinList(
    windows.map((w) => `${daysText(w.days)} de ${w.from} a ${w.to}`),
  );
}

/**
 * Texto de una condición que no se cumplió o no se pudo determinar. Usa los
 * números reales de `details` (horas que faltan, tope, uso…). Sin datos de
 * pacientes: solo lo que dice el permiso.
 *
 * @param unmet - Incumplimiento de la evaluación.
 * @param extra - Valores adicionales de los huecos (persona, doctor, átomo…).
 */
export function describeUnmet(
  unmet: Pick<UnmetCondition, 'code' | 'status' | 'details'>,
  extra: DescribeVars = {},
): string {
  const d = (unmet.details ?? {}) as Record<string, unknown>;
  const num = (key: string): number | undefined =>
    typeof d[key] === 'number' ? d[key] : undefined;
  const x: Record<string, string | number | undefined> = { ...extra };
  switch (unmet.code) {
    case SupportAccessReason.TIME_WINDOW:
      if (unmet.status === 'I')
        return 'El horario de este permiso no se puede leer; por seguridad no se permite.';
      x.ventanas = Array.isArray(d.windows)
        ? describeWindows(d.windows as Parameters<typeof describeWindows>[0])
        : undefined;
      break;
    case SupportAccessReason.LIMIT_EXCEEDED:
      if (d.indeterminate === true) {
        return 'No se pudo comprobar el contador de este límite; por seguridad no se permite.';
      }
      x.max = num('max');
      x.métrica =
        d.metric === 'DISTINCT_PATIENTS'
          ? 'pacientes distintos'
          : (extra.métrica ?? 'acciones');
      x.periodo = PER[String(d.per)];
      x.cuándo = PERIOD_RESET[String(d.per)];
      break;
    case SupportAccessReason.LEAD_TIME:
      if (d.indeterminate === true)
        return 'No se conoce la hora de la cita; por seguridad no se permite.';
      x.horasRestantes = num('hoursLeft');
      x.minHoras = num('minHours');
      x.aprobador =
        d.onViolation === 'REQUIRE_APPROVAL' ? 'el doctor' : undefined;
      break;
    case SupportAccessReason.HORIZON:
      x.dias = num('maxDaysAhead');
      break;
    case SupportAccessReason.CHANNEL_NOT_ALLOWED:
      x.canales = Array.isArray(d.allow)
        ? joinList(
            (d.allow as string[]).map((c) =>
              c === 'CHAT' ? 'chat' : 'correo',
            ),
          )
        : undefined;
      break;
    case SupportAccessReason.SESSION_TOO_LONG:
      x.max = num('maxSessionMinutes');
      break;
    case SupportAccessReason.AMOUNT_LIMIT:
      x.límite = num('max');
      x.por =
        d.limit === 'perDayMax'
          ? 'por día'
          : d.limit === 'maxDiscountPercent'
            ? 'de descuento'
            : 'por operación';
      break;
    default:
      break;
  }
  const text = describeReason(unmet.code, x);
  if (
    unmet.status === 'I' &&
    d.indeterminate === true &&
    !text.includes('Avise')
  ) {
    return `${text} Falta un dato para comprobarlo y por seguridad no se permite.`;
  }
  return text;
}

/** Texto de un límite que se cumple («Cancelaciones de hoy: 3 de 20.»). */
export function describeLimitOk(
  atom: string | undefined,
  snapshot: {
    readonly metric: string;
    readonly per: string;
    readonly used: number;
    readonly max: number;
  },
): string {
  const noun =
    snapshot.metric === 'DISTINCT_PATIENTS'
      ? 'pacientes distintos'
      : snapshot.metric === 'AMOUNT'
        ? 'monto'
        : ((atom && ATOM_NOUN[atom]) ?? 'acciones');
  const cuando =
    snapshot.per === 'HOUR'
      ? 'de la última hora'
      : snapshot.per === 'WEEK'
        ? 'de la semana'
        : 'de hoy';
  return describeTraceStep('LIMIT_OK', true, {
    métrica: noun.charAt(0).toUpperCase() + noun.slice(1),
    cuando,
    usado: snapshot.used,
    max: snapshot.max,
  });
}
