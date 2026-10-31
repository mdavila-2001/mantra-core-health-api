import { createHmac } from 'node:crypto';
import type { FieldMask } from './support-conditions';
import { maskDocument, maskPhone } from './support-patient-rules';

/**
 * Enmascaramiento por campo (CONTRATO-GOBIERNO §2.6 y §3.5). Una función pura
 * única que usa la capa de presentación de cada PEP con el `visibleFields` que
 * devuelve la decisión: los DTO de respuesta nunca llevan el valor original de
 * un campo enmascarado.
 */

/** Naturaleza del dato, que decide cómo se ve cada máscara. */
export const FIELD_MASK_KINDS = [
  'PATIENT_NAME',
  'PHONE',
  'DOCUMENT',
  'REASON',
  'INSURANCE',
  'PRICE',
] as const;
export type FieldMaskKind = (typeof FIELD_MASK_KINDS)[number];

/** `FULL` más las estrategias de `authz:MASK_*`. */
export type FieldMaskStrategy = 'FULL' | FieldMask;

/** Aseguradora de la cita: lo que `PARTIAL` reduce a la aseguradora. */
export interface InsuranceValue {
  readonly carrier: string;
  readonly memberNumber?: string;
  readonly policy?: string;
}

/** Opciones del enmascarado. */
export interface ApplyFieldMaskOptions {
  /** Secreto de la organización para `HASH` (HMAC-SHA256). Sin él `HASH` anula. */
  readonly secret?: string;
}

const RANK: Readonly<Record<FieldMaskStrategy, number>> = {
  FULL: 0,
  PARTIAL: 1,
  REDACT: 2,
  HASH: 3,
  NULLIFY: 4,
};

/** Orden de ocultamiento: completo < PARTIAL < REDACT < HASH < NULLIFY. */
export function maskRank(strategy: FieldMaskStrategy): number {
  return RANK[strategy];
}

/** El MENOS enmascarado de una lista; una lista vacía anula el campo. */
export function mostRevealing<T extends FieldMaskStrategy>(
  list: readonly T[],
): T | 'NULLIFY' {
  if (list.length === 0) return 'NULLIFY';
  return list.reduce((a, b) => (RANK[b] < RANK[a] ? b : a));
}

/** El MÁS enmascarado de una lista; una lista vacía no oculta nada. */
export function mostMasked<T extends FieldMaskStrategy>(
  list: readonly T[],
): T | 'FULL' {
  if (list.length === 0) return 'FULL';
  return list.reduce((a, b) => (RANK[b] > RANK[a] ? b : a));
}

const REASON_PARTIAL_CHARS = 40;

function asText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  return null;
}

function insuranceOf(value: unknown): InsuranceValue | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') return { carrier: value };
  if (
    typeof value === 'object' &&
    typeof (value as InsuranceValue).carrier === 'string'
  ) {
    return value as InsuranceValue;
  }
  return null;
}

/** Nombre → «Carmen O.» (primer nombre + inicial del primer apellido). */
function partialName(name: string): string {
  const [first, second] = name.trim().split(/\s+/);
  if (!first) return '';
  return second ? `${first} ${second[0].toUpperCase()}.` : first;
}

/**
 * Aplica una máscara a un valor.
 *
 * @param value - Valor original (texto; la aseguradora puede venir como objeto).
 * @param strategy - `FULL` deja el valor; las demás lo reducen.
 * @param kind - Naturaleza del dato.
 * @param options - Secreto para `HASH`.
 * @returns El valor visible, o `null` si el campo se anula o no hay valor.
 */
export function applyFieldMask(
  value: unknown,
  strategy: FieldMaskStrategy,
  kind: FieldMaskKind,
  options: ApplyFieldMaskOptions = {},
): string | null {
  if (kind === 'INSURANCE') {
    const insurance = insuranceOf(value);
    switch (strategy) {
      case 'FULL':
        return insurance
          ? [insurance.carrier, insurance.memberNumber, insurance.policy]
              .filter(Boolean)
              .join(' · ')
          : null;
      case 'PARTIAL':
        return insurance ? insurance.carrier : null;
      case 'REDACT':
        return insurance ? 'Con seguro' : 'Sin seguro';
      case 'HASH':
        return insurance
          ? hashOf(JSON.stringify(insurance), options.secret)
          : null;
      default:
        return null;
    }
  }
  const text = asText(value);
  if (text === null) return null;
  switch (strategy) {
    case 'FULL':
      return text;
    case 'NULLIFY':
      return null;
    case 'HASH':
      return hashOf(text, options.secret);
    case 'REDACT':
      return redacted(kind);
    case 'PARTIAL':
      switch (kind) {
        case 'PATIENT_NAME':
          return partialName(text);
        case 'PHONE':
          return maskPhone(text);
        case 'DOCUMENT':
          return maskDocument(text);
        case 'REASON':
          return text.length > REASON_PARTIAL_CHARS
            ? `${text.slice(0, REASON_PARTIAL_CHARS)}…`
            : text;
        default:
          // El precio no tiene vista parcial: se oculta.
          return redacted(kind);
      }
  }
}

function redacted(kind: FieldMaskKind): string {
  switch (kind) {
    case 'PATIENT_NAME':
      return 'Paciente';
    case 'REASON':
      return '[motivo reservado]';
    default:
      return '[oculto]';
  }
}

/** HMAC-SHA256 truncado a 8 hex; sin secreto no hay hash (falla cerrado). */
function hashOf(text: string, secret: string | undefined): string | null {
  if (!secret) return null;
  return createHmac('sha256', secret).update(text).digest('hex').slice(0, 8);
}
