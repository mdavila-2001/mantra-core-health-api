import { createHmac } from 'node:crypto';

/** Lo que se reconoce de un cliente a partir de su `User-Agent`. */
export interface ClientDescription {
  /** Familia del navegador o de la aplicación (`Chrome`, `Safari`…). */
  readonly browser: string;
  /** Sistema operativo (`Windows`, `Android`…). */
  readonly os: string;
  /** Clase de equipo: `mobile`, `tablet` o `desktop`. */
  readonly deviceClass: 'mobile' | 'tablet' | 'desktop';
  /** Nombre para la persona: «Chrome en Windows». */
  readonly label: string;
}

/** Prefijo de las huellas que calcula el servidor; las de un cliente nunca lo llevan. */
export const FINGERPRINT_PREFIX = 'srv1:';

/** Navegadores en orden de comprobación: Edge, Opera y otros declaran también `Chrome`. */
const BROWSERS: readonly (readonly [RegExp, string])[] = [
  [/\bEdg(?:e|A|iOS)?\//, 'Edge'],
  [/\b(?:OPR|Opera)\//, 'Opera'],
  [/\bSamsungBrowser\//, 'Samsung Internet'],
  [/\bFirefox\/|\bFxiOS\//, 'Firefox'],
  [/\bChrome\/|\bCriOS\//, 'Chrome'],
  [/\bSafari\//, 'Safari'],
];

/** Sistemas operativos en orden de comprobación: Android declara también `Linux`. */
const SYSTEMS: readonly (readonly [RegExp, string])[] = [
  [/\bWindows\b/, 'Windows'],
  [/\bAndroid\b/, 'Android'],
  [/\b(?:iPhone|iPad|iPod)\b/, 'iOS'],
  [/\bMac OS X\b|\bMacintosh\b/, 'macOS'],
  [/\bCrOS\b/, 'ChromeOS'],
  [/\bLinux\b/, 'Linux'],
];

/**
 * Lee un `User-Agent` a lo grueso: familia, sistema y clase de equipo, sin
 * versiones, para que una actualización del navegador no parezca un equipo nuevo.
 *
 * @param userAgent - Cabecera `User-Agent` de la petición.
 * @returns La descripción, con `Navegador`/`Sistema desconocido` si no se reconoce.
 */
export function describeClient(userAgent: string): ClientDescription {
  const browser =
    BROWSERS.find(([re]) => re.test(userAgent))?.[1] ?? 'Navegador';
  const os =
    SYSTEMS.find(([re]) => re.test(userAgent))?.[1] ?? 'sistema desconocido';
  const deviceClass = /\b(?:iPad|Tablet)\b/.test(userAgent)
    ? 'tablet'
    : /\bMobile\b|\biPhone\b|\bAndroid\b/.test(userAgent)
      ? 'mobile'
      : 'desktop';
  return { browser, os, deviceClass, label: `${browser} en ${os}` };
}

/**
 * Huella estable de un cliente para una persona: HMAC-SHA256 con una clave del
 * servidor sobre persona + familia + sistema + clase de equipo. Lleva a la
 * persona dentro porque `iam.devices.device_fingerprint` es único en toda la
 * tabla, y así dos cuentas con el mismo navegador no chocan ni se pueden
 * relacionar entre sí. No incluye la red: un cambio de red (casa, oficina,
 * datos móviles) no hace nuevo al equipo.
 *
 * @param secret - Secreto del servidor del que se deriva la clave de huellas.
 * @param userId - Persona.
 * @param description - Cliente ya descrito.
 * @returns La huella, con prefijo `srv1:`.
 */
export function deviceFingerprintOf(
  secret: string,
  userId: string,
  description: ClientDescription,
): string {
  const key = createHmac('sha256', secret)
    .update('iam:device-fingerprint:v1')
    .digest();
  const digest = createHmac('sha256', key)
    .update(
      [
        userId,
        description.browser,
        description.os,
        description.deviceClass,
      ].join('|'),
    )
    .digest('hex');
  return `${FINGERPRINT_PREFIX}${digest}`;
}
