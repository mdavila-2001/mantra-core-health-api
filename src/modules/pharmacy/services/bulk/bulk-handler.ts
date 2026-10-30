import type { EntityManager } from '@mikro-orm/postgresql';
import type { ClassConstructor } from 'class-transformer';
import type { AuthenticatedUser } from '../../../../common';
import type { Pharmacies } from '../../entities';
import { PharmacyErrorReason } from '../../pharmacy.error-reasons';

/** Lo que cada fila sabe de la farmacia y de quien carga. */
export interface BulkContext {
  readonly pharmacy: Pharmacies;
  readonly actor: AuthenticatedUser;
}

/** Un motivo de rechazo de una fila. */
export interface BulkRowError {
  readonly field: string;
  readonly reason: string;
  readonly message?: string;
}

/** Rechazo de una fila: corta su transacción y vuelve en su resultado. */
export class BulkRowRejection extends Error {
  constructor(readonly errors: readonly BulkRowError[]) {
    super(errors.map((e) => `${e.field}: ${e.reason}`).join('; '));
  }
}

/** Atajo para rechazar con un solo motivo. */
export function rejectRow(
  field: string,
  reason: PharmacyErrorReason | string,
  message?: string,
): BulkRowRejection {
  return new BulkRowRejection([{ field, reason, message }]);
}

/**
 * Lo que una tabla aporta a la carga masiva. El servicio común
 * (`PharmacyBulkService`) pone el resto: el candado, el modo, la vista previa,
 * los duplicados del archivo y la traducción de errores.
 *
 * `Existing` es lo que hay guardado con esa clave (lo que decide si la fila crea
 * o cambia); `null` si no hay nada.
 */
export interface BulkHandler<
  Existing,
  CreateRow extends object,
  UpdateRow extends object,
> {
  /** Campo de la fila que lleva la clave (para el rechazo por clave faltante). */
  readonly keyField: string;
  /** DTO con el que se valida una fila que crea. */
  readonly createRow: ClassConstructor<CreateRow>;
  /** DTO con el que se valida una fila que cambia. */
  readonly updateRow: ClassConstructor<UpdateRow>;
  /**
   * La clave normalizada de la fila cruda, o `null` si no trae una válida. Dos
   * filas con la misma clave son la misma cosa (la segunda es un duplicado).
   */
  keyOf(raw: Record<string, unknown>): string | null;
  /** Lo guardado con esa clave en la farmacia, o `null`. */
  findExisting(
    tx: EntityManager,
    ctx: BulkContext,
    key: string,
  ): Promise<Existing | null>;
  /** Crea y devuelve el id. */
  create(tx: EntityManager, ctx: BulkContext, row: CreateRow): Promise<string>;
  /**
   * Cambia lo existente. Devuelve el id y si hubo algún cambio real; sin
   * cambios, el servicio deshace lo escrito y responde `UNCHANGED`.
   */
  update(
    tx: EntityManager,
    ctx: BulkContext,
    existing: Existing,
    row: UpdateRow,
  ): Promise<{ id: string; changed: boolean }>;
}

/** El texto recortado de un campo de la fila, o `null` si no es un texto con algo. */
export function textField(
  raw: Record<string, unknown>,
  field: string,
): string | null {
  const value = raw[field];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
