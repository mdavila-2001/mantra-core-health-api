/**
 * Deriva la base de un código de sitio a partir de un nombre en texto libre.
 *
 * Extraído de `OwnSiteProvisioningService.uniqueSiteCode` (P20) para que el
 * aprovisionamiento de la unidad diagnóstica (subtarea 1.5) resuelva el
 * mismo problema —una sede que nace junto con quien la administra, sin que
 * el cliente aporte un código— con la misma regla, no una copia que se
 * desvíe con el tiempo.
 *
 * @param name - El nombre tal como lo declaró el cliente.
 * @param fallback - Qué usar si el nombre no deja ningún carácter válido.
 * @returns La base en mayúsculas, sólo `[A-Z0-9-]`, sin guiones en los bordes.
 */
export function siteCodeBase(name: string, fallback: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
  return base || fallback;
}

/**
 * Resuelve un código único probando sufijos numéricos hasta que `exists`
 * diga que no hay choque.
 *
 * No conoce el repositorio: recibe `exists` para no atar este ayudante a una
 * entidad concreta (sedes de práctica hoy, cualquier otra cosa con código
 * único mañana).
 *
 * @param base - El candidato inicial (normalmente {@link siteCodeBase}).
 * @param exists - Si ese candidato ya está en uso.
 * @returns El primer candidato libre: `base`, `base-2`, `base-3`, …
 */
export async function uniqueCode(
  base: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> {
  let candidate = base;
  let suffix = 1;
  while (await exists(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}
