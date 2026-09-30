import { deterministicId } from '../constants/concepts';

/**
 * Datos personales inventados, deterministas, para el padrón de personas y las
 * redes de médicos de aseguradoras (H2/H3).
 *
 * Decisión del propietario (registrada en el encargo de este carril, no
 * inferida): del markdown se toma **sólo** nombre, matrícula/registro,
 * especialidad y ocupación — el resto (cédula, nacimiento, celular, correo,
 * domicilio) se inventa siempre, aunque el markdown lo traiga, porque los
 * repos de front y API son **públicos** y esas columnas sí traen datos reales
 * de personas. Determinista por `key` (no por el dato real): dos corridas dan
 * el mismo valor, y dos personas nunca comparten `key`.
 */

function hexDigits(seed: string): bigint {
  return BigInt(`0x${deterministicId(seed).replace(/-/g, '').slice(0, 13)}`);
}

/** `len` dígitos deterministas, sin cero a la izquierda. */
function digits(seed: string, len: number): string {
  const n = hexDigits(seed) % BigInt(10 ** len);
  const s = n.toString().padStart(len, '0');
  return s[0] === '0' ? `1${s.slice(1)}` : s;
}

/** Cédula de identidad sintética: 7 dígitos, sin relación con la real. */
export function syntheticNationalId(key: string): string {
  return digits(`seed:synthetic:ci:${key}`, 7);
}

/** Celular boliviano sintético: 8 dígitos, empieza con 6 o 7 (líneas móviles). */
export function syntheticMobilePhone(key: string): string {
  const prefijo =
    hexDigits(`seed:synthetic:phone-prefix:${key}`) % 2n === 0n ? '6' : '7';
  return prefijo + digits(`seed:synthetic:phone:${key}`, 7);
}

/** Fecha de nacimiento sintética de un adulto (entre 1955 y 2004). */
export function syntheticBirthDate(key: string): string {
  const inicio = Date.UTC(1955, 0, 1);
  const fin = Date.UTC(2004, 11, 31);
  const rango = BigInt(Math.floor((fin - inicio) / 86_400_000));
  const dia = Number(hexDigits(`seed:synthetic:birth:${key}`) % rango);
  const fecha = new Date(inicio + dia * 86_400_000);
  return fecha.toISOString().slice(0, 10);
}

/** Normaliza un nombre para el correo `<nombre>.<apellido>@alovida.test`. */
function slugNombre(texto: string): string {
  return texto
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

/**
 * Correo con el patrón congelado del plan (`<nombre>.<apellido>@alovida.test`).
 * Determinista por el nombre y no por un contador: si dos personas comparten
 * nombre y apellido, `desambiguador` (p. ej. el número de fila) evita que se
 * pisen sin volver el correo irreconocible.
 */
export function syntheticEmail(
  nombre: string,
  apellido: string,
  desambiguador?: string,
): string {
  const n = slugNombre(nombre) || 'persona';
  const a = slugNombre(apellido) || 'alovida';
  const sufijo = desambiguador ? `.${desambiguador}` : '';
  return `${n}.${a}${sufijo}@alovida.test`;
}
