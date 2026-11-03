import {
  SIMPLE_ACCOUNT_CLASSES,
  SIMPLE_RECORD_KINDS,
  type SimpleAccountClass,
  type SimpleRecordKind,
  type SimpleSummaryPeriod,
} from '../dto/practitioner-simple-accounting.dto';

/**
 * Reglas puras de la contabilidad simple del doctor (P49): las cuentas
 * generales, la validación de contenido con su motivo en castellano y el
 * período de los tres números. Sin acceso a datos: se prueban sin base.
 */

/** El primer dígito del código de cada clase. */
export const CODE_PREFIX: Readonly<Record<SimpleAccountClass, string>> = {
  ASSET: '1',
  LIABILITY: '2',
  EQUITY: '3',
  INCOME: '4',
  EXPENSE: '5',
};

/** De qué clase tiene que ser la cuenta (el tipo) de cada registro. */
export const CLASS_OF_KIND: Readonly<
  Record<SimpleRecordKind, SimpleAccountClass>
> = {
  EXPENSE: 'EXPENSE',
  ASSET: 'ASSET',
  DEBT: 'LIABILITY',
};

/**
 * Las cuentas generales: las que tiene cualquier consultorio, y nada más. Se
 * siembran por práctica al primer acceso. El doctor suma las suyas; éstas se
 * pueden renombrar, no borrar ni cambiar de clase.
 */
export const GENERAL_ACCOUNTS: readonly (readonly [
  code: string,
  name: string,
  accountClass: SimpleAccountClass,
])[] = [
  ['1.1', 'Caja', 'ASSET'],
  ['1.2', 'Banco', 'ASSET'],
  ['1.3', 'Por cobrar a aseguradoras', 'ASSET'],
  ['1.4', 'Equipo médico', 'ASSET'],
  ['1.5', 'Mobiliario del consultorio', 'ASSET'],
  ['1.6', 'Equipo de computación', 'ASSET'],
  ['1.7', 'Vehículo', 'ASSET'],
  ['2.1', 'Préstamo bancario', 'LIABILITY'],
  ['2.2', 'Proveedores por pagar', 'LIABILITY'],
  ['2.3', 'Tarjeta de crédito', 'LIABILITY'],
  ['2.4', 'Impuestos por pagar', 'LIABILITY'],
  ['2.5', 'Sueldos por pagar', 'LIABILITY'],
  ['3.1', 'Capital del profesional', 'EQUITY'],
  ['4.1', 'Honorarios por consultas', 'INCOME'],
  ['4.2', 'Pagos de aseguradoras', 'INCOME'],
  ['4.3', 'Procedimientos', 'INCOME'],
  ['4.4', 'Otros ingresos', 'INCOME'],
  ['5.1', 'Alquiler del consultorio', 'EXPENSE'],
  ['5.2', 'Sueldos del personal', 'EXPENSE'],
  ['5.3', 'Insumos médicos', 'EXPENSE'],
  ['5.4', 'Servicios básicos (luz, agua, internet)', 'EXPENSE'],
  ['5.5', 'Mantenimiento de equipos', 'EXPENSE'],
  ['5.6', 'Impuestos y patentes', 'EXPENSE'],
  ['5.7', 'Seguros y colegiatura', 'EXPENSE'],
  ['5.8', 'Publicidad', 'EXPENSE'],
  ['5.9', 'Otros gastos', 'EXPENSE'],
];

const AMOUNT_PATTERN = /^\d{1,12}(?:\.\d{1,2})?$/u;
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

export const NAME_MAX = 80;
export const DESCRIPTION_MAX = 160;

/** Es un uuid con la forma que Postgres acepta; evita un 500 por cast inválido. */
export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

export function isAccountClass(value: unknown): value is SimpleAccountClass {
  return (SIMPLE_ACCOUNT_CLASSES as readonly unknown[]).includes(value);
}

export function isRecordKind(value: unknown): value is SimpleRecordKind {
  return (SIMPLE_RECORD_KINDS as readonly unknown[]).includes(value);
}

/** Minúsculas, sin tildes ni espacios sobrantes: así se compara un nombre. */
export function withoutAccents(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '');
}

/** Motivo de rechazo de un nombre de cuenta, o `null` si sirve. */
export function accountNameProblem(name: string | undefined): string | null {
  const clean = name?.trim() ?? '';
  return clean === '' || clean.length > NAME_MAX
    ? `Escriba un nombre de hasta ${NAME_MAX} caracteres.`
    : null;
}

/** Motivo de rechazo de una descripción, o `null` si sirve. */
export function descriptionProblem(text: string | undefined): string | null {
  const clean = text?.trim() ?? '';
  return clean === '' || clean.length > DESCRIPTION_MAX
    ? `Escriba una descripción de hasta ${DESCRIPTION_MAX} caracteres.`
    : null;
}

/** Motivo de rechazo de un importe, o `null` si sirve. */
export function amountProblem(amount: string | undefined): string | null {
  if (amount === undefined || !AMOUNT_PATTERN.test(amount)) {
    return 'Escriba un monto, con hasta dos decimales.';
  }
  return Number(amount) <= 0 ? 'El monto tiene que ser mayor a cero.' : null;
}

/** Motivo de rechazo de una fecha `YYYY-MM-DD` que además exista en el calendario. */
export function dateProblem(date: string | undefined): string | null {
  if (date === undefined || !DAY_PATTERN.test(date)) return 'Elija la fecha.';
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
    ? 'Elija la fecha.'
    : null;
}

/** Importe normalizado a dos decimales (ya validado con {@link amountProblem}). */
export function normalizeAmount(amount: string): string {
  return Number(amount).toFixed(2);
}

/** `YYYY-MM-DD` de un valor de columna `date`, que el driver entrega como `Date` o como texto. */
export function toIsoDay(value: Date | string): string {
  return typeof value === 'string'
    ? value.slice(0, 10)
    : value.toISOString().slice(0, 10);
}

/** Medianoche UTC de un día `YYYY-MM-DD`, como se guardan las columnas `date`. */
export function fromIsoDay(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

/** Bolivia no tiene horario de verano: `America/La_Paz` es un desfase fijo de −04:00. */
const LA_PAZ_OFFSET_MS = -4 * 60 * 60 * 1000;

/** El período de los tres números, con sus bordes como día y como instante. */
export interface SummaryRange {
  readonly period: SimpleSummaryPeriod;
  /** Primer día, `YYYY-MM-DD`. */
  readonly from: string;
  /** Último día, `YYYY-MM-DD`. */
  readonly to: string;
  /** Primer instante del período, hora de La Paz. */
  readonly fromInstant: Date;
  /** Último instante del período, hora de La Paz. */
  readonly toInstant: Date;
}

/**
 * El mes o el año calendario que contiene a `now`, en hora de La Paz.
 *
 * @param period - `month` (por omisión) o `year`.
 * @param now - Instante de referencia.
 */
export function summaryRange(
  period: SimpleSummaryPeriod | undefined,
  now: Date,
): SummaryRange {
  const local = new Date(now.getTime() + LA_PAZ_OFFSET_MS);
  const year = local.getUTCFullYear();
  const two = (n: number): string => String(n).padStart(2, '0');
  let from: string;
  let to: string;
  if (period === 'year') {
    from = `${year}-01-01`;
    to = `${year}-12-31`;
  } else {
    const month = local.getUTCMonth() + 1;
    const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
    from = `${year}-${two(month)}-01`;
    to = `${year}-${two(month)}-${two(last)}`;
  }
  return {
    period: period === 'year' ? 'year' : 'month',
    from,
    to,
    fromInstant: new Date(`${from}T00:00:00.000-04:00`),
    toInstant: new Date(`${to}T23:59:59.999-04:00`),
  };
}
