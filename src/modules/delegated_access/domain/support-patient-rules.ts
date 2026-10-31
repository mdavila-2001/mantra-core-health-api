import type { EngagementFacts } from './support-access.evaluation';

/** Criterios con los que la persona de apoyo busca a un paciente. */
export interface SupportPatientSearchCriteria {
  /** Documento de identidad completo. */
  readonly nationalId?: string;
  /** Teléfono completo. */
  readonly phone?: string;
  /** Nombre completo (nombre y apellido). */
  readonly fullName?: string;
  /** Fecha de nacimiento (ISO `YYYY-MM-DD`). */
  readonly birthDate?: string;
}

/** Resultado de comprobar que una búsqueda es exacta. */
export interface ExactSearchVerdict {
  /** ¿Se admite la búsqueda? */
  readonly allowed: boolean;
  /** Criterio exacto con el que se resolverá. */
  readonly mode?: 'NATIONAL_ID' | 'PHONE' | 'FULL_NAME_BIRTH_DATE';
  /** Motivo del rechazo. */
  readonly reason?: 'INEXACT_SEARCH';
}

/**
 * ¿Es una fecha `YYYY-MM-DD` que existe en el calendario? `9999-99-99` o
 * `2020-02-31` no lo son: llegaban a la consulta y la hacían caer en 500.
 *
 * @param value - Texto a comprobar.
 * @returns `true` si es una fecha real, posterior a 1900 y no futura.
 */
export function isRealDate(value: string, now: Date = new Date()): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
  ];
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    year >= 1900 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getTime() <= now.getTime()
  );
}

/**
 * La búsqueda de pacientes del personal de apoyo es EXACTA: documento, teléfono
 * o nombre completo MÁS fecha de nacimiento. Un nombre suelto («Juan»), un
 * fragmento de documento o un nombre sin fecha no devuelven candidatos: la
 * lista de personas no se puede recorrer a golpes de prueba y error.
 *
 * @param criteria - Criterios recibidos.
 * @returns Si se admite y con qué criterio exacto.
 */
export function checkExactPatientSearch(
  criteria: SupportPatientSearchCriteria,
): ExactSearchVerdict {
  const nationalId = criteria.nationalId?.trim() ?? '';
  const phone = criteria.phone?.replace(/[\s()-]/g, '') ?? '';
  const nameParts = (criteria.fullName ?? '')
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);
  const birthDate = criteria.birthDate?.trim() ?? '';

  if (nationalId.length >= 5) return { allowed: true, mode: 'NATIONAL_ID' };
  if (/^\+?\d{7,15}$/.test(phone)) return { allowed: true, mode: 'PHONE' };
  if (nameParts.length >= 2 && isRealDate(birthDate)) {
    return { allowed: true, mode: 'FULL_NAME_BIRTH_DATE' };
  }
  return { allowed: false, reason: 'INEXACT_SEARCH' };
}

/** Qué ve del dato clínico una persona de apoyo. */
export interface SupportClinicalVisibility {
  /** Campos de la cita o consulta visibles sin acceso temporal. */
  readonly visible: readonly string[];
  /** Para ver más hace falta un acceso temporal por paciente. */
  readonly requiresTemporaryAccess: true;
  /** Quien decide ese acceso temporal. */
  readonly decidedBy: 'DOCTOR';
}

/**
 * Por defecto el personal de apoyo solo ve el motivo de consulta. Todo lo
 * demás (historia, notas, resultados) exige un acceso temporal por paciente
 * que decide el doctor mediante el flujo de solicitudes de acceso delegado.
 *
 * @returns La visibilidad clínica por defecto del personal de apoyo.
 */
export function supportClinicalVisibility(): SupportClinicalVisibility {
  return {
    visible: ['reasonForVisit'],
    requiresTemporaryAccess: true,
    decidedBy: 'DOCTOR',
  };
}

/** Cómo se busca, en una frase: es el mensaje del rechazo de una búsqueda parcial. */
export const EXACT_SEARCH_HELP =
  'La búsqueda debe ser exacta: escriba el documento completo, el teléfono ' +
  'completo, o el nombre completo junto con la fecha de nacimiento exacta.';

/** Mayoría de edad: por debajo de ella el paciente necesita representante. */
export const ADULT_AGE_YEARS = 18;

/**
 * Edad cumplida en años.
 *
 * @param birthDate - Fecha de nacimiento (`Date` o `YYYY-MM-DD`).
 * @param now - Instante de referencia.
 * @returns Los años cumplidos, o `undefined` si no hay fecha válida.
 */
export function ageInYears(
  birthDate: Date | string | null | undefined,
  now: Date = new Date(),
): number | undefined {
  if (!birthDate) return undefined;
  const born =
    typeof birthDate === 'string'
      ? new Date(`${birthDate.slice(0, 10)}T00:00:00Z`)
      : birthDate;
  if (Number.isNaN(born.getTime())) return undefined;
  let age = now.getUTCFullYear() - born.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < born.getUTCMonth() ||
    (now.getUTCMonth() === born.getUTCMonth() &&
      now.getUTCDate() < born.getUTCDate());
  if (beforeBirthday) age -= 1;
  return Math.max(age, 0);
}

/**
 * Documento con lo central tapado (`***556`): suficiente para que quien lo
 * tiene delante lo reconozca, insuficiente para copiarlo.
 *
 * @param value - Documento completo.
 * @returns Los tres últimos caracteres precedidos de `***`; un documento más
 *   corto se tapa entero.
 */
export function maskDocument(value: string): string {
  const clean = value.trim();
  return clean.length <= 3 ? '***' : `***${clean.slice(-3)}`;
}

/**
 * Teléfono con lo central tapado (`7******7`): primer y último dígito del
 * número nacional (los últimos ocho dígitos, con o sin prefijo de país).
 *
 * @param value - Teléfono completo.
 * @returns El teléfono tapado; uno de menos de cuatro dígitos se tapa entero.
 */
export function maskPhone(value: string): string {
  const national = value.replace(/\D+/g, '').slice(-8);
  if (national.length < 4) return '***';
  return `${national[0]}${'*'.repeat(national.length - 2)}${national[national.length - 1]}`;
}

/**
 * Minúsculas, sin tildes ni signos y con los espacios colapsados: la forma en
 * que se comparan nombres y textos libres.
 *
 * @param text - Texto a normalizar.
 * @returns El texto comparable.
 */
export function normalizePersonText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Parentesco del representante, ya clasificado. */
export type GuardianKind =
  | 'MOTHER'
  | 'FATHER'
  | 'LEGAL_GUARDIAN'
  | 'GRANDPARENT'
  | 'SIBLING'
  | 'UNCLE_AUNT'
  | 'OTHER_RELATIVE';

/** Tipo de representación legal que corresponde a un parentesco, si lo hay. */
export type LegalRepresentationKind = 'PARENT' | 'LEGAL_GUARDIAN';

/** Un parentesco declarado, con la representación legal que lo respalda (si la hay). */
export interface GuardianClassification {
  /** Parentesco. */
  readonly kind: GuardianKind;
  /**
   * Tipo de representación legal que se registra si el representante tiene
   * cuenta. Los demás parentescos son «familiar autorizado»: persona
   * relacionada y nada más.
   */
  readonly legal: LegalRepresentationKind | null;
}

/**
 * Clasifica el parentesco que declara quien registra a un menor («Madre»,
 * «Tutor legal», «Abuela autorizada»…). Acepta también los códigos
 * (`MOTHER`, `LEGAL_GUARDIAN`…). Lo que no reconoce es «familiar autorizado».
 *
 * @param raw - Texto o código del parentesco.
 * @returns El parentesco y la representación legal que corresponde.
 */
export function classifyGuardianRelationship(
  raw: string,
): GuardianClassification {
  const text = normalizePersonText(raw);
  if (/\b(tutor|tutora|representante|guardian|legal)\b/.test(text)) {
    return { kind: 'LEGAL_GUARDIAN', legal: 'LEGAL_GUARDIAN' };
  }
  if (/\b(madre|mama|mother)\b/.test(text)) {
    return { kind: 'MOTHER', legal: 'PARENT' };
  }
  if (/\b(padre|papa|father)\b/.test(text)) {
    return { kind: 'FATHER', legal: 'PARENT' };
  }
  if (/\b(abuelo|abuela|grandparent)\b/.test(text)) {
    return { kind: 'GRANDPARENT', legal: null };
  }
  if (/\b(hermano|hermana|sibling)\b/.test(text)) {
    return { kind: 'SIBLING', legal: null };
  }
  if (/\b(tio|tia|uncle|aunt)\b/.test(text)) {
    return { kind: 'UNCLE_AUNT', legal: null };
  }
  return { kind: 'OTHER_RELATIVE', legal: null };
}

/** Con qué coincide un posible duplicado al registrar un paciente. */
export type DuplicateBasis =
  'DOCUMENT' | 'NAME_AND_BIRTH_DATE' | 'PHONE_AND_SURNAME';

/**
 * ¿Tiene la persona un vínculo vivo en la organización? Un vínculo activo y
 * vigente, con o sin permisos. Es lo que decide DÓNDE se sella un rechazo: el de
 * quien es personal de la organización va a su cadena de auditoría; el de quien
 * no lo es nunca se escribe en la cadena de una organización ajena.
 *
 * @param engagements - Vínculos de la persona en la organización indicada.
 * @param now - Instante de la decisión.
 * @returns `true` si algún vínculo rige ahora.
 */
export function hasLiveEngagement(
  engagements: readonly EngagementFacts[],
  now: Date,
): boolean {
  return engagements.some(
    (e) =>
      e.active &&
      (!e.validFrom || e.validFrom.getTime() <= now.getTime()) &&
      (!e.validTo || e.validTo.getTime() > now.getTime()),
  );
}
