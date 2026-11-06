import type { AuthenticatedUser } from '../../../../common';
import type {
  BulkRequestDto,
  BulkResponseDto,
} from '../../../../common/dto/bulk-load.dto';
import type { UnitOfWork } from './unit-of-work';

/**
 * Rechazo de una fila de la carga: corta su transacción y vuelve con su motivo
 * en el resultado de esa fila, sin tumbar las demás.
 */
export class BulkRowRejected extends Error {
  constructor(
    readonly field: string,
    readonly reason: string,
    readonly detail?: string,
  ) {
    super(detail ?? `${field}: ${reason}`);
  }
}

/**
 * Lo que una carga de este módulo aporta por fila. El resto (el modo, la vista
 * previa, una transacción por fila, los duplicados del archivo y la
 * traducción de errores) lo pone el bucle común de la carga masiva.
 */
export interface BulkLoadRows<Existing, Row extends object> {
  /** Campo de la fila que lleva la clave; su texto recortado es la clave. */
  readonly keyField: string;
  /** DTO con el que se valida cada fila. */
  readonly rowType: new () => Row;
  /** Lo guardado con esa clave, o `null` si la fila crea. */
  findExisting(uow: UnitOfWork, key: string): Promise<Existing | null>;
  /** Crea y devuelve el id. */
  create(uow: UnitOfWork, row: Row, actor: AuthenticatedUser): Promise<string>;
  /** Cambia lo existente; `changed: false` si no hubo cambio real. */
  update(
    uow: UnitOfWork,
    existing: Existing,
    row: Row,
    actor: AuthenticatedUser,
  ): Promise<{ readonly id: string; readonly changed: boolean }>;
}

/** El bucle común de la carga masiva del catálogo de una farmacia. */
export interface CatalogBulkLoadPort {
  run<Existing, Row extends object>(
    entity: string,
    pharmacyId: string,
    body: BulkRequestDto,
    rows: BulkLoadRows<Existing, Row>,
    actor: AuthenticatedUser,
  ): Promise<BulkResponseDto>;
}

/** Token de inyección del bucle de la carga masiva. */
export const CATALOG_BULK_LOAD_PORT = Symbol('CATALOG_BULK_LOAD_PORT');
