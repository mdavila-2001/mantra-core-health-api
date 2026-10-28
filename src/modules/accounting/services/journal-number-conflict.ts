import type { EntityManager } from '@mikro-orm/postgresql';
import { ConflictException } from '../../../common';
import { AccountingErrorReason } from '../accounting.error-reasons';

/**
 * Índice único que respalda el número de asiento: `(practice_id,
 * transaction_number)`. El número es único por práctica, no global.
 */
const TRANSACTION_NUMBER_UNIQUE_INDEX =
  'uq_journal_transactions_practice_id_transaction_number';

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
 * El número de asiento es único por práctica: el servicio lo comprueba antes de
 * insertar (`findByTransactionNumber(practiceId, number)`) y el índice único
 * `(practice_id, transaction_number)` lo garantiza en la base. La lectura previa no
 * cubre la carrera entre dos altas simultáneas del mismo número en la misma
 * práctica: ambas pasan la lectura y la segunda falla en el `flush` con `23505`.
 * Ese choque responde exactamente igual que la comprobación previa
 * (`409 JOURNAL_TRANSACTION_NUMBER_ALREADY_EXISTS`), sin SQL ni nombre del índice.
 * El mismo número en **otra** práctica no choca y no pasa por aquí.
 *
 * @param tx - Transacción activa de la escritura.
 * @param transactionNumber - Número que se acaba de intentar insertar.
 * @throws ConflictException si el número ya existe en la práctica del asiento.
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
