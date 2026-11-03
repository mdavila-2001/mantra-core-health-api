/**
 * Lo único del paciente que ve una farmacia que abre su receta (S-4): el
 * nombre en iniciales y los últimos 3 dígitos del documento. Alcanza para que
 * el mostrador confirme que la receta es de quien la trae, sin que el enlace
 * entregue la identidad del paciente.
 *
 * Funciones puras: no saben de dónde sale el nombre ni el documento.
 */

/** Las partes del nombre de una persona, tal como las guarda `profiles`. */
export interface PersonNameParts {
  readonly name?: string | null;
  readonly middleName?: string | null;
  readonly lastName?: string | null;
  readonly motherLastName?: string | null;
  /**
   * Nombre visible: solo se usa si las cuatro partes vienen vacías (un
   * registro importado que guardó el nombre en una sola columna).
   */
  readonly displayName?: string | null;
}

/**
 * Partículas de los apellidos compuestos («de la Cruz», «del Valle»). En
 * minúscula no son una parte del nombre: no aportan inicial.
 */
const NAME_PARTICLES: ReadonlySet<string> = new Set([
  'de',
  'del',
  'la',
  'las',
  'los',
  'y',
  'e',
  'da',
  'das',
  'do',
  'dos',
  'di',
  'van',
  'von',
]);

/** Primera letra (de cualquier alfabeto) de una palabra. */
const FIRST_LETTER = /\p{L}/u;

/** Cuántos dígitos del documento se muestran. */
const DOCUMENT_VISIBLE_DIGITS = 3;

/**
 * Las iniciales de una parte del nombre: una por palabra. Separa por espacios
 * y guiones («María José», «Pérez-Quispe»); salta las partículas en minúscula.
 */
function initialsOf(part: string | null | undefined): string[] {
  if (!part) return [];
  return part
    .split(/[\s\-\u2010-\u2015]+/u)
    .filter((word) => word !== '' && !NAME_PARTICLES.has(word))
    .map((word) => FIRST_LETTER.exec(word)?.[0])
    .filter((letter): letter is string => letter !== undefined)
    .map((letter) => `${letter.toLocaleUpperCase('es')}.`);
}

/**
 * El nombre del paciente en iniciales: `L. F. P. Q.` para «Lucía Fernanda
 * Prueba Quispe». Mantiene los acentos («Ángela» → `Á.`).
 *
 * @param parts - Nombre, segundo nombre, apellido paterno y materno.
 * @returns Las iniciales separadas por espacio, o `null` si no hay ninguna.
 */
export function maskedName(parts: PersonNameParts): string | null {
  const fromParts = [
    parts.name,
    parts.middleName,
    parts.lastName,
    parts.motherLastName,
  ].flatMap(initialsOf);
  const initials =
    fromParts.length > 0 ? fromParts : initialsOf(parts.displayName);
  return initials.length > 0 ? initials.join(' ') : null;
}

/**
 * El número del documento: la primera tira de dígitos, con sus separadores
 * de miles. Un punto, un espacio o un guion seguidos de **exactamente** 3
 * dígitos son agrupación (`1.234.567`, `12 345 678`); seguidos de otra cosa
 * cierran el número (`1234-1A`: el `-1A` es el complemento).
 */
const DOCUMENT_NUMBER = /\d+(?:[.\s-]\d{3}(?!\d))*/;

/**
 * Los últimos 3 dígitos del número del documento nacional.
 *
 * `4567890 LP` → `890` (el sufijo del departamento no cuenta), `1234-1A` →
 * `234` (el complemento tampoco) y `1.234.567` → `567` (los separadores de
 * miles se ignoran). Un número de 3 dígitos o menos devuelve `null`: mostrar
 * sus «últimos 3» sería mostrarlo entero.
 *
 * @param value - Valor del documento nacional vigente, o `null` si no tiene.
 * @returns Los 3 últimos dígitos del número, o `null`.
 */
export function documentLast3(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = DOCUMENT_NUMBER.exec(value)?.[0].replace(/\D/g, '');
  if (!digits || digits.length <= DOCUMENT_VISIBLE_DIGITS) return null;
  return digits.slice(-DOCUMENT_VISIBLE_DIGITS);
}
