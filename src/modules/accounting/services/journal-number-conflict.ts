import type { EntityManager } from '@mikro-orm/postgresql';
import { ConflictException } from '../../../common';
import { AccountingErrorReason } from '../accounting.error-reasons';

/** Índice único que respalda `journal_transactions.transaction_number`. */
const TRANSACTION_NUMBER_UNIQUE_INDEX =
  'uq_journal_transactions_transaction_number';

/**
 * Si `error` es la violación de unicidad (`23505`) del número de asiento,
 * buscándola en la cadena de causas.
 */
function isTransactionNumberViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    const candidate = current as {
      code?: unknown;
      constraint?: unknown;
      cause?: unknown;
    };
    if (
      candidate.code === '23505' &&
      candidate.constraint === TRANSACTION_NUMBER_UNIQUE_INDEX
    ) {
      return true;
    }
    current = candidate.cause;
  }
  return false;
}

/**
 * Persiste la cabecera de un asiento traduciendo el choque del número a un
 * conflicto de dominio.
 *
 * El servicio anuncia la unicidad del número por práctica y la comprueba antes
 * de insertar, pero el índice único del DDL cubre sólo `transaction_number`.
 * Dos casos pasaban la lectura previa y fallaban después como error de base, sin
 * conflicto catalogado: el mismo número en **otra** práctica, y la carrera entre
 * dos altas simultáneas del mismo número. Ambos responden ahora exactamente igual
 * que la comprobación previa (`409 JOURNAL_TRANSACTION_NUMBER_ALREADY_EXISTS`),
 * sin SQL ni nombre del índice, así que el cliente no distingue de qué práctica
 * era el número que chocó.
 *
 * @param tx - Transacción activa de la escritura.
 * @param transactionNumber - Número que se acaba de intentar insertar.
 * @throws ConflictException si el número ya existe (en cualquier práctica).
 */
export async function flushJournalHeader(
  tx: EntityManager,
  transactionNumber: string,
): Promise<void> {
  try {
    await tx.flush();
  } catch (error) {
    if (isTransactionNumberViolation(error)) {
      throw new ConflictException(
        'El número de asiento ya existe en la práctica',
        { transactionNumber },
        AccountingErrorReason.JOURNAL_TRANSACTION_NUMBER_ALREADY_EXISTS,
      );
    }
    throw error;
  }
}
