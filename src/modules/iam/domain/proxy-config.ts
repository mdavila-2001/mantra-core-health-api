/** Un hallazgo de la comprobación de `TRUST_PROXY_HOPS` al arrancar. */
export interface ProxyConfigFinding {
  /** Código estable, para el log y las pruebas. */
  readonly code:
    | 'TRUST_PROXY_HOPS_INVALID'
    | 'TRUST_PROXY_HOPS_ZERO_WITH_NETWORK_RULES'
    | 'TRUST_PROXY_HOPS_HIGH';
  /** Qué pasa y qué revisar, en español. */
  readonly message: string;
}

/** Más de estos saltos es raro y deja que el cliente invente su origen. */
const USUAL_MAX_HOPS = 3;

/**
 * Revisa que `TRUST_PROXY_HOPS` sea coherente con las reglas de red activas.
 *
 * Las reglas de red se evalúan contra `req.ip`, y Express la toma de
 * `X-Forwarded-For` contando saltos desde la derecha:
 *
 * - con `0` detrás de un proxy, todos los clientes valen la IP del proxy: las
 *   reglas no distinguen a nadie y un `ALLOW` por una red ajena encierra a todos;
 * - con más saltos de los reales, el elemento elegido es una cabecera que el
 *   cliente escribió: puede suplantar cualquier origen.
 *
 * Es solo un aviso: la API no sabe cuántos proxies tiene delante.
 *
 * @param rawHops - Valor crudo de `TRUST_PROXY_HOPS` (puede faltar).
 * @param activeNetworkRules - Reglas de red activas en toda la plataforma.
 * @returns Los hallazgos; vacío si todo es coherente.
 */
export function assessProxyConfig(
  rawHops: string | undefined,
  activeNetworkRules: number,
): ProxyConfigFinding[] {
  const findings: ProxyConfigFinding[] = [];
  const text = (rawHops ?? '').trim();
  const hops = text === '' ? 0 : Number(text);
  if (!Number.isInteger(hops) || hops < 0) {
    findings.push({
      code: 'TRUST_PROXY_HOPS_INVALID',
      message:
        'TRUST_PROXY_HOPS no es un entero mayor o igual que 0: la API lo trata como 0 y las reglas de red verían la IP del último salto',
    });
    return findings;
  }
  if (hops === 0 && activeNetworkRules > 0) {
    findings.push({
      code: 'TRUST_PROXY_HOPS_ZERO_WITH_NETWORK_RULES',
      message: `Hay ${activeNetworkRules} regla(s) de red activa(s) y TRUST_PROXY_HOPS es 0: si la API está detrás de un proxy, todos los clientes valen la IP del proxy y las reglas no distinguen a nadie. Use GET /iam/me/network para ver qué IP ve el servidor`,
    });
  }
  if (hops > USUAL_MAX_HOPS) {
    findings.push({
      code: 'TRUST_PROXY_HOPS_HIGH',
      message: `TRUST_PROXY_HOPS es ${hops}: con más saltos que proxies reales, el origen evaluado es una cabecera que el cliente puede inventar. Debe ser exactamente el número de proxies de confianza delante de la API`,
    });
  }
  return findings;
}
