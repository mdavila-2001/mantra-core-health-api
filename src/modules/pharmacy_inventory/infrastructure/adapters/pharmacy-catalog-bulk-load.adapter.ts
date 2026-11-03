import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../common';
import type {
  BulkRequestDto,
  BulkResponseDto,
} from '../../../../common/dto/bulk-load.dto';
import {
  rejectRow,
  textField,
  type BulkHandler,
} from '../../../pharmacy/services/bulk/bulk-handler';
import { PharmacyBulkService } from '../../../pharmacy/services/pharmacy-bulk.service';
import {
  BulkRowRejected,
  type BulkLoadRows,
  type CatalogBulkLoadPort,
} from '../../application/ports/catalog-bulk-load.port';

/** Traduce el rechazo de una fila de este módulo al del bucle de pharmacy. */
async function translated<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof BulkRowRejected) {
      throw rejectRow(error.field, error.reason, error.detail);
    }
    throw error;
  }
}

/** Adaptador al bucle de la carga masiva que publica el contexto pharmacy. */
@Injectable()
export class PharmacyCatalogBulkLoadAdapter implements CatalogBulkLoadPort {
  constructor(private readonly bulk: PharmacyBulkService) {}

  run<Existing, Row extends object>(
    entity: string,
    pharmacyId: string,
    body: BulkRequestDto,
    rows: BulkLoadRows<Existing, Row>,
    actor: AuthenticatedUser,
  ): Promise<BulkResponseDto> {
    const handler: BulkHandler<Existing, Row, Row> = {
      keyField: rows.keyField,
      createRow: rows.rowType,
      updateRow: rows.rowType,
      keyOf: (raw) => textField(raw, rows.keyField),
      findExisting: (tx, _ctx, key) =>
        translated(() => rows.findExisting(tx, key)),
      create: (tx, ctx, row) =>
        translated(() => rows.create(tx, row, ctx.actor)),
      update: (tx, ctx, existing, row) =>
        translated(() => rows.update(tx, existing, row, ctx.actor)),
    };
    return this.bulk.run(entity, pharmacyId, body, handler, actor);
  }
}
