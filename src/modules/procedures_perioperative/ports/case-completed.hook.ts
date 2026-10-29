/** Token del gancho que se avisa cuando un caso quirúrgico pasa a completado. */
export const CASE_COMPLETED_HOOK = 'PERIOP_CASE_COMPLETED_HOOK';

/**
 * Quien necesita enterarse de que un caso se completó (hoy, el devengo del tiempo de
 * quirófano de Facturación).
 *
 * Se llama **después** de que el cierre clínico confirmó, fuera de su transacción, y un
 * fallo del gancho nunca deshace ni aborta el cierre: quien llama lo registra y sigue.
 * El gancho debe ser idempotente (el cierre puede repetirse y el job periódico de
 * Facturación recoge lo que se haya perdido).
 */
export interface CaseCompletedHook {
  /**
   * @param caseId - Caso que acaba de completarse.
   */
  onCaseCompleted(caseId: string): Promise<void>;
}
