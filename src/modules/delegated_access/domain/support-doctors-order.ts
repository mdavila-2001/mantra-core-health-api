/** Un doctor que la persona de apoyo cubre, con lo mínimo para ordenarlo. */
export interface OrderableSupportDoctor {
  /** Perfil profesional del doctor. */
  readonly practitionerProfileId: string;
  /** Nombre para mostrar. */
  readonly displayName: string;
}

/**
 * Orden estable de los doctores que cubre una persona de apoyo: por nombre sin
 * acentos ni mayúsculas y, a igualdad, por perfil. La agenda combinada y la
 * bandeja de chat deben devolver su lista `doctors[]` en este orden: el color de
 * cada doctor sale de su posición, así que dos pantallas con orden distinto lo
 * pintarían de colores distintos.
 *
 * @param doctors - Doctores en cualquier orden.
 * @returns Una copia ordenada; no modifica la entrada.
 */
export function orderSupportDoctors<T extends OrderableSupportDoctor>(
  doctors: readonly T[],
): T[] {
  const key = (value: string): string =>
    value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  return [...doctors].sort((a, b) => {
    const byName = key(a.displayName).localeCompare(key(b.displayName), 'es');
    return byName !== 0
      ? byName
      : a.practitionerProfileId.localeCompare(b.practitionerProfileId);
  });
}
