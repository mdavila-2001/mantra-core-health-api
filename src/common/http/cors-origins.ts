/**
 * Allowlist de orígenes para CORS (HTTP y websockets).
 *
 * El despliegue original sirve front y API bajo el MISMO origen (nginx del
 * frontend delante) y ahí CORS no hace falta: queda denegado. Cuando el front
 * vive en otro dominio (p. ej. un hosting estático como Hostinger), el
 * navegador bloquea cada llamada salvo que la API declare ese origen.
 *
 * `CORS_ALLOWED_ORIGINS` es una lista separada por comas de orígenes exactos:
 * `https://app.alovida.com,https://www.alovida.com`. Vacía = CORS denegado,
 * que sigue siendo el comportamiento por defecto.
 *
 * Nunca `*`: con `credentials: true` el navegador lo rechaza, y sin
 * credenciales abriría la API a cualquier página que un usuario visite con la
 * sesión abierta. Un valor que no sea un origen limpio aborta el arranque en
 * vez de ignorarse en silencio — un error tipográfico en la allowlist se
 * vería como «CORS roto» sin ninguna pista.
 */
export function loadCorsAllowedOrigins(
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const raw = env.CORS_ALLOWED_ORIGINS ?? '';
  const entries = raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return entries.map((entry) => {
    if (entry === '*') {
      throw new Error(
        'CORS_ALLOWED_ORIGINS no admite "*": declarar los orígenes exactos del frontend',
      );
    }
    let url: URL;
    try {
      url = new URL(entry);
    } catch {
      throw new Error(`CORS_ALLOWED_ORIGINS: "${entry}" no es una URL válida`);
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error(
        `CORS_ALLOWED_ORIGINS: "${entry}" debe empezar por https:// o http://`,
      );
    }
    // Un origen es esquema + host + puerto, sin ruta: el navegador manda
    // `Origin: https://app.alovida.com`, nunca con `/` final ni ruta. Si se
    // compara contra `https://app.alovida.com/` no coincide jamás.
    if (url.origin !== entry.replace(/\/$/, '') || url.pathname.length > 1) {
      throw new Error(
        `CORS_ALLOWED_ORIGINS: "${entry}" debe ser solo el origen (p. ej. ${url.origin}), sin ruta`,
      );
    }
    return url.origin;
  });
}

/**
 * Opciones de CORS listas para `app.enableCors` y para socket.io.
 * `credentials: true` para que la cookie de refresco
 * (`AUTH_REFRESH_COOKIE_ENABLED`) pueda viajar entre orígenes si se activa.
 */
export function buildCorsOptions(
  origins: string[],
): { origin: false } | { origin: string[]; credentials: true } {
  return origins.length > 0
    ? { origin: origins, credentials: true }
    : { origin: false };
}
