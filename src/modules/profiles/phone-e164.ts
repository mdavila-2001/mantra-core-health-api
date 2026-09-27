/**
 * Normalización de teléfonos a E.164 (UIT-T E.164: `+`, código de país y
 * número nacional, 15 dígitos como máximo).
 *
 * ## Por qué hace falta
 *
 * El alta acepta el teléfono «en formato E.164 o nacional, con espacios,
 * paréntesis y guiones» (`scheduling-walk-in.dto.ts`). Eso sirve para
 * mostrarlo, no para enviarle un SMS: todo proveedor exige el número completo
 * con código de país. Se normaliza en el momento de enviar, sin reescribir el
 * dato que declaró el mostrador.
 *
 * ## Por qué Bolivia por defecto
 *
 * Es el único país de operación hoy. Un número sin prefijo internacional se
 * interpreta como boliviano: 8 dígitos, celulares 6/7 y fijos 2/3/4 (el código
 * de área ya forma parte de los 8). Cualquier otro largo sin `+` es ambiguo y
 * se rechaza en vez de adivinar.
 */

/** Código de país que se asume para un número sin prefijo internacional. */
export const DEFAULT_COUNTRY_CALLING_CODE = '591';

/** Largo del número nacional boliviano. */
const BO_NATIONAL_LENGTH = 8;

/** Primer dígito válido de un número nacional boliviano (fijo 2-4, celular 6-7). */
const BO_NATIONAL_FIRST_DIGIT = /^[234567]/;

/** Separadores que el formulario admite y que no forman parte del número. */
const SEPARATORS = /[\s().-]/g;

/** Mínimo y máximo de dígitos de un E.164 completo (código de país incluido). */
const E164_MIN_DIGITS = 8;
const E164_MAX_DIGITS = 15;

/**
 * Lleva un teléfono declarado a E.164.
 *
 * @param raw - El teléfono tal como se guardó.
 * @returns `+<dígitos>` o `null` si no se puede normalizar sin adivinar.
 */
export function toE164(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null;
  let value = raw.trim().replace(SEPARATORS, '');
  if (value.length === 0) return null;

  // `00` es el prefijo de salida internacional: equivale a `+`.
  if (value.startsWith('00')) value = `+${value.slice(2)}`;

  if (value.startsWith('+')) {
    const digits = value.slice(1);
    if (!/^[1-9][0-9]*$/.test(digits)) return null;
    if (digits.length < E164_MIN_DIGITS || digits.length > E164_MAX_DIGITS)
      return null;
    if (digits.startsWith(DEFAULT_COUNTRY_CALLING_CODE))
      return isBolivianNational(
        digits.slice(DEFAULT_COUNTRY_CALLING_CODE.length),
      )
        ? `+${digits}`
        : null;
    return `+${digits}`;
  }

  if (!/^[0-9]+$/.test(value)) return null;

  // Número boliviano escrito con el código de país pero sin `+`.
  if (
    value.length === DEFAULT_COUNTRY_CALLING_CODE.length + BO_NATIONAL_LENGTH &&
    value.startsWith(DEFAULT_COUNTRY_CALLING_CODE)
  ) {
    const national = value.slice(DEFAULT_COUNTRY_CALLING_CODE.length);
    return isBolivianNational(national) ? `+${value}` : null;
  }

  return isBolivianNational(value)
    ? `+${DEFAULT_COUNTRY_CALLING_CODE}${value}`
    : null;
}

function isBolivianNational(national: string): boolean {
  return (
    national.length === BO_NATIONAL_LENGTH &&
    /^[0-9]+$/.test(national) &&
    BO_NATIONAL_FIRST_DIGIT.test(national)
  );
}
