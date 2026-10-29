/**
 * Ruta histórica de `QaRunsService`, que el módulo `qa_execution` importa
 * directamente. Se conserva como re-export mientras `qa_execution` no migre al
 * molde DDD; el código vive en `application/services/qa-runs.service.ts`.
 */
export * from '../application/services/qa-runs.service';
