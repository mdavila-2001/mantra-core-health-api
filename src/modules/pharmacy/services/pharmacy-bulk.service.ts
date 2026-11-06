import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import type {
  BulkMode,
  BulkRequestDto,
  BulkResponseDto,
  BulkRowResultDto,
} from '../dto';
import { PHARM } from '../pharmacy.concepts';
import { PharmacyErrorReason } from '../pharmacy.error-reasons';
import { PharmaciesRepository } from '../repositories';
import {
  BulkRowRejection,
  rejectRow,
  type BulkContext,
  type BulkHandler,
  type BulkRowError,
} from './bulk/bulk-handler';
import { requireManagedPharmacy } from './pharmacy-scope';

/** Resultado de una fila que la vista previa deshace después de calcularlo. */
class DryRunRollback extends Error {
  constructor(readonly result: Omit<BulkRowResultDto, 'row'>) {
    super('dry run');
  }
}

/**
 * El bucle común de la carga masiva del catálogo (FAR-05).
 *
 * Cada fila corre en su propia transacción: una que falla no deshace las
 * otras. Antes de buscar la clave, la transacción toma un candado por farmacia,
 * porque productos y sedes no tienen índice único por código y dos cargas
 * simultáneas crearían el mismo dos veces. Con `dryRun` la fila se ejecuta
 * entera (los servicios de siempre, en un punto de guardado de esa misma
 * transacción) y después se deshace: la vista previa responde lo mismo que la
 * corrida real sin dejar nada escrito. Una fila que no cambia nada también se
 * deshace, para no tocar sus marcas de modificación.
 */
@Injectable()
export class PharmacyBulkService {
  constructor(
    private readonly em: EntityManager,
    private readonly pharmaciesRepo: PharmaciesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PharmacyBulkService.name);
  }

  async run<Existing, CreateRow extends object, UpdateRow extends object>(
    entity: string,
    pharmacyId: string,
    body: BulkRequestDto,
    handler: BulkHandler<Existing, CreateRow, UpdateRow>,
    actor: AuthenticatedUser,
  ): Promise<BulkResponseDto> {
    // El DTO ya rechaza un `dryRun` que no sea booleano; si algo llega sin
    // pasar por el pipe, tampoco se escribe por error.
    if (body.dryRun !== undefined && typeof body.dryRun !== 'boolean') {
      throw new BadRequestException('dryRun debe ser true o false');
    }
    const dryRun = body.dryRun === true;
    this.logger.info(
      {
        operation: 'pharmacy.bulk.run',
        entity,
        pharmacyId,
        mode: body.mode,
        dryRun,
        rows: body.rows.length,
      },
      'Running pharmacy bulk load',
    );
    const pharmacy = await requireManagedPharmacy(
      this.pharmaciesRepo,
      this.em.fork(),
      pharmacyId,
      actor,
    );
    if (pharmacy.statusConceptId !== PHARM.PHARMACY_ACTIVE) {
      throw new PreconditionFailedException('La farmacia no está activa', {
        pharmacyId,
      });
    }
    const ctx: BulkContext = { pharmacy, actor };
    const keys = body.rows.map((raw) => handler.keyOf(raw));
    const repeated = repeatedRows(handler, body.rows, keys);
    const results: BulkRowResultDto[] = [];
    for (const [index, raw] of body.rows.entries()) {
      const row = index + 1;
      const key = keys[index];
      if (key === null) {
        results.push(rejected(row, await missingKeyErrors(handler, raw)));
        continue;
      }
      const duplicate = repeated.get(index);
      if (duplicate !== undefined) {
        results.push(rejected(row, duplicate));
        continue;
      }
      results.push({
        row,
        ...(await this.runRow(ctx, body.mode, dryRun, key, raw, handler)),
      });
    }
    return { dryRun, results };
  }

  private async runRow<
    Existing,
    CreateRow extends object,
    UpdateRow extends object,
  >(
    ctx: BulkContext,
    mode: BulkMode,
    dryRun: boolean,
    key: string,
    raw: Record<string, unknown>,
    handler: BulkHandler<Existing, CreateRow, UpdateRow>,
  ): Promise<Omit<BulkRowResultDto, 'row'>> {
    try {
      return await this.em.transactional(async (tx) => {
        await tx.execute('select pg_advisory_xact_lock(hashtext(?))', [
          `pharmacy.bulk:${ctx.pharmacy.id}`,
        ]);
        const existing = await handler.findExisting(tx, ctx, key);
        let outcome: Omit<BulkRowResultDto, 'row'>;
        if (existing === null) {
          if (mode === 'UPDATE') {
            throw rejectRow(
              handler.keyField,
              PharmacyErrorReason.NOT_FOUND,
              'No existe: el modo «actualizar» no crea',
            );
          }
          const input = await validateRow(handler.createRow, raw);
          outcome = {
            outcome: 'CREATED',
            id: await handler.create(tx, ctx, input),
          };
        } else {
          if (mode === 'CREATE') {
            throw rejectRow(
              handler.keyField,
              PharmacyErrorReason.ALREADY_EXISTS,
              'Ya existe: el modo «crear» no lo cambia',
            );
          }
          const input = await validateRow(handler.updateRow, raw);
          const { id, changed } = await handler.update(
            tx,
            ctx,
            existing,
            input,
          );
          if (!changed) {
            throw new DryRunRollback(
              await withWarnings(tx, ctx, handler, {
                outcome: 'UNCHANGED',
                id,
              }),
            );
          }
          outcome = { outcome: 'UPDATED', id };
        }
        await tx.flush();
        outcome = await withWarnings(tx, ctx, handler, outcome);
        if (dryRun) throw new DryRunRollback(outcome);
        return outcome;
      });
    } catch (error) {
      if (error instanceof DryRunRollback) {
        const { id, ...result } = error.result;
        return dryRun ? result : { ...result, id };
      }
      if (error instanceof BulkRowRejection) {
        return { outcome: 'REJECTED', errors: [...error.errors] };
      }
      if (error instanceof HttpException) {
        return { outcome: 'REJECTED', errors: [fromHttpException(error)] };
      }
      this.logger.error(
        {
          operation: 'pharmacy.bulk.row',
          pharmacyId: ctx.pharmacy.id,
          err: error,
        },
        'Bulk row failed unexpectedly',
      );
      return {
        outcome: 'REJECTED',
        errors: [
          {
            field: 'row',
            reason: 'ROW_FAILED',
            message: 'No se pudo guardar esta fila',
          },
        ],
      };
    }
  }
}

function rejected(
  row: number,
  errors: readonly BulkRowError[],
): BulkRowResultDto {
  return { row, outcome: 'REJECTED', errors: [...errors] };
}

/** El resultado con los avisos del manejador, si tiene alguno. */
async function withWarnings<
  Existing,
  CreateRow extends object,
  UpdateRow extends object,
>(
  tx: EntityManager,
  ctx: BulkContext,
  handler: BulkHandler<Existing, CreateRow, UpdateRow>,
  outcome: Omit<BulkRowResultDto, 'row'>,
): Promise<Omit<BulkRowResultDto, 'row'>> {
  if (outcome.id === undefined || handler.warningsFor === undefined) {
    return outcome;
  }
  const warnings = await handler.warningsFor(tx, ctx, outcome.id);
  return warnings.length === 0
    ? outcome
    : { ...outcome, warnings: [...warnings] };
}

/**
 * Las filas que comparten su clave (o una de sus otras claves) con otra fila
 * del pedido, con su motivo. Se rechazan **todas**, la primera también: elegir
 * una por el orden sería decidir en silencio cuál vale. Así la vista previa y
 * la carga real dicen lo mismo, porque ninguna de ellas se ejecuta.
 */
function repeatedRows<
  Existing,
  CreateRow extends object,
  UpdateRow extends object,
>(
  handler: BulkHandler<Existing, CreateRow, UpdateRow>,
  rows: readonly Record<string, unknown>[],
  keys: readonly (string | null)[],
): Map<number, BulkRowError[]> {
  const byKey = new Map<string, { field: string; indexes: number[] }>();
  const note = (field: string, key: string, index: number): void => {
    const entry = byKey.get(`${field}\u0000${key}`) ?? { field, indexes: [] };
    entry.indexes.push(index);
    byKey.set(`${field}\u0000${key}`, entry);
  };
  rows.forEach((raw, index) => {
    const key = keys[index];
    if (key === null) return;
    note(handler.keyField, key, index);
    for (const other of handler.otherKeysOf?.(raw) ?? []) {
      note(other.field, other.key, index);
    }
  });
  const repeated = new Map<number, BulkRowError[]>();
  for (const { field, indexes } of byKey.values()) {
    if (indexes.length < 2) continue;
    const list = indexes.map((index) => index + 1).join(', ');
    for (const index of indexes) {
      const errors = repeated.get(index) ?? [];
      errors.push({
        field,
        reason: PharmacyErrorReason.DUPLICATE_IN_FILE,
        message: `El mismo dato viene en las filas ${list} del archivo: no se carga ninguna, deje una sola`,
      });
      repeated.set(index, errors);
    }
  }
  return repeated;
}

/**
 * Por qué una fila no tiene clave. Si el campo vino pero no sirve (un número,
 * un nombre demasiado largo), el motivo es el de su DTO y no «falta»: decir
 * `REQUIRED` de un dato que sí vino manda a buscar lo que no está mal.
 */
async function missingKeyErrors<
  Existing,
  CreateRow extends object,
  UpdateRow extends object,
>(
  handler: BulkHandler<Existing, CreateRow, UpdateRow>,
  raw: Record<string, unknown>,
): Promise<BulkRowError[]> {
  const value = raw[handler.keyField];
  const blank =
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '');
  if (!blank) {
    try {
      await validateRow(handler.createRow, raw);
    } catch (error) {
      if (!(error instanceof BulkRowRejection)) throw error;
      const own = error.errors.filter((e) => e.field === handler.keyField);
      if (own.length > 0) return [...own];
    }
  }
  return [
    {
      field: handler.keyField,
      reason: 'REQUIRED',
      message: 'Falta el dato que identifica la fila',
    },
  ];
}

/**
 * Valida una fila con el DTO de su tabla, como lo haría el pipe global con un
 * pedido suelto: sin campos de más y con cada regla del DTO.
 */
export async function validateRow<T extends object>(
  type: new () => T,
  raw: Record<string, unknown>,
): Promise<T> {
  const instance = plainToInstance(type, raw);
  const errors = await validate(instance, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  if (errors.length > 0) throw new BulkRowRejection(flatten(errors));
  return instance;
}

function flatten(errors: ValidationError[], prefix = ''): BulkRowError[] {
  return errors.flatMap((error) => {
    const field = prefix ? `${prefix}.${error.property}` : error.property;
    const own = Object.entries(error.constraints ?? {}).map(
      ([constraint, message]) => ({
        field,
        reason:
          constraint === 'whitelistValidation'
            ? 'UNKNOWN_FIELD'
            : `INVALID_${constraint.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()}`,
        message,
      }),
    );
    return [...own, ...flatten(error.children ?? [], field)];
  });
}

/** Un rechazo de los servicios de siempre, como motivo de la fila. */
function fromHttpException(error: HttpException): BulkRowError {
  const body = error.getResponse();
  const data = (typeof body === 'object' && body !== null ? body : {}) as {
    code?: string;
    reason?: string;
    message?: string | string[];
    details?: { field?: unknown; reason?: unknown };
  };
  const message = Array.isArray(data.message)
    ? data.message.join('; ')
    : (data.message ?? error.message);
  return {
    field: typeof data.details?.field === 'string' ? data.details.field : 'row',
    reason:
      (typeof data.details?.reason === 'string' ? data.details.reason : null) ??
      data.reason ??
      data.code ??
      'REJECTED',
    message,
  };
}
