import { randomInt } from 'node:crypto';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
/**
 * Alfabeto del código de retiro: **sin ambiguos** (`0`/`O`, `1`/`I`/`L`
 * excluidos a propósito). El código se dicta en voz alta en un mostrador y se
 * copia a mano de la pantalla de un teléfono; `IL01` es una discusión
 * garantizada. 30⁶ ≈ 7,3 × 10⁸ combinaciones. Contrato v4.2.1
 * (`DISENO-CODIGO-RETIRO.md`).
 */
export const PICKUP_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Largo del código de retiro. */
export const PICKUP_CODE_LENGTH = 6;

/**
 * El único parcial que respalda la unicidad del código de retiro, POR SEDE
 * desde v4.2.2. El detector de colisiones compara contra ESTE nombre y nada
 * más; un spec lo contrasta contra el catálogo ORM (`pharmacy_inventory.idx`)
 * para que el próximo rename rompa un test en vez de matar el reintento en
 * silencio — que es exactamente lo que el rename de v4.2.2 le hizo a v4.2.1.
 */
export const PICKUP_CODE_UNIQUE_INDEX =
  'ux_inventory_reservations_pharmacy_site_pickup_code';

/**
 * Un código de retiro nuevo: 6 símbolos del alfabeto sin ambiguos, con
 * aleatoriedad criptográfica. Ya sale normalizado (mayúsculas): lo que se
 * guarda y lo que se compara comparten forma.
 */
export function generatePickupCode(): string {
  let code = '';
  for (let i = 0; i < PICKUP_CODE_LENGTH; i += 1) {
    code += PICKUP_CODE_ALPHABET[randomInt(PICKUP_CODE_ALPHABET.length)];
  }
  return code;
}

/**
 * ¿El flush murió por el único parcial del código de retiro? Solo esa
 * violación se reintenta con un código nuevo; cualquier otra unicidad
 * (idempotencia, por ejemplo) es un error real y sube tal cual. El nombre de
 * la constraint se busca en la cadena de causas, como hace el filtro global,
 * y se compara contra {@link PICKUP_CODE_UNIQUE_INDEX} y NADA más — el spec
 * que lo ata al catálogo ORM es lo que impide que un rename futuro deje el
 * reintento muerto en silencio.
 */
export function isPickupCodeCollision(error: unknown): boolean {
  if (!(error instanceof UniqueConstraintViolationException)) return false;
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    const candidate = current as {
      /** Nombre de la constraint, si el driver lo trae. */
      constraint?: unknown;
      /** Mensaje del eslabón. */
      message?: unknown;
      /** Causa envuelta (Error.cause). */
      cause?: unknown;
      /** Causa envuelta (convención del driver). */
      previous?: unknown;
    };
    if (candidate.constraint === PICKUP_CODE_UNIQUE_INDEX) {
      return true;
    }
    if (
      typeof candidate.message === 'string' &&
      candidate.message.includes(PICKUP_CODE_UNIQUE_INDEX)
    ) {
      return true;
    }
    current = candidate.cause ?? candidate.previous;
  }
  return false;
}
