import { Module } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import {
  OperationTimeoutError,
  isTransientError,
  retry,
  withTimeout,
} from '../../common';
import {
  InMemoryBatchRepository,
  InProcessJobScheduler,
  NotConnectedClinicalWriter,
  NotConnectedConceptResolver,
  NotConnectedImportAudit,
  NotConnectedPatientResolver,
  NotConnectedPractitionerResolver,
} from './clinical-import.adapters';
import { ClinicalImportController } from './clinical-import.controller';
import type { OperationGuard } from './clinical-import.runner';
import { ClinicalImportService } from './clinical-import.service';
import {
  CLINICAL_IMPORT_AUDIT,
  CLINICAL_IMPORT_BATCHES,
  CLINICAL_IMPORT_CODES,
  CLINICAL_IMPORT_PATIENTS,
  CLINICAL_IMPORT_PRACTITIONERS,
  CLINICAL_IMPORT_WRITER,
} from './clinical-import.tokens';
import {
  TransientPortError,
  type BatchRepositoryPort,
  type ClinicalRecordWriterPort,
  type ConceptResolverPort,
  type ImportAuditPort,
  type PatientResolverPort,
  type PractitionerResolverPort,
} from './clinical-import.types';

/** Plazo de UNA operación (resolver o escribir una fila). */
const OPERATION_TIMEOUT_MS = 15_000;

/**
 * Plazo y reintento por operación, con el kernel de `common/resilience`:
 * `retry` por fuera y `withTimeout` por dentro, que es el orden que ese kernel
 * documenta. Se reintenta sólo lo transitorio. Reintentar la ESCRITURA es seguro
 * porque `appendIfAbsent` es idempotente (índice UNIQUE por clave de origen).
 *
 * Límite conocido: los puertos todavía no reciben el `AbortSignal`, así que el
 * plazo libera la fila pero no cancela la operación en curso; la idempotencia
 * de la escritura es lo que hace inocuo ese resto.
 */
export const resilienceGuard: OperationGuard = {
  isTimeout: (error) => error instanceof OperationTimeoutError,
  run: (operation, work) =>
    retry(
      operation,
      () => withTimeout(operation, OPERATION_TIMEOUT_MS, () => work()),
      {
        attempts: 3,
        baseDelayMs: 200,
        maxDelayMs: 2_000,
        totalBudgetMs: 30_000,
        isRetryable: (error) =>
          error instanceof TransientPortError ||
          error instanceof OperationTimeoutError ||
          isTransientError(error),
      },
    ),
};

/**
 * Carga masiva especial de historias clínicas (H7).
 *
 * NO está registrado en `AppModule`: sumarlo es una línea en el módulo raíz que
 * esta entrega no toca. Tampoco crea tablas ni entidades: la persistencia del
 * lote es en memoria y los colaboradores clínicos van `NotConnected…` hasta que
 * se conecten los adaptadores reales (ver fichas de `clinical-import.tokens.ts`).
 * El catálogo (`GET /admin/clinical-imports/catalog`) lo dice, no lo esconde.
 */
@Module({
  controllers: [ClinicalImportController],
  providers: [
    InProcessJobScheduler,
    { provide: CLINICAL_IMPORT_BATCHES, useClass: InMemoryBatchRepository },
    {
      provide: CLINICAL_IMPORT_PATIENTS,
      useClass: NotConnectedPatientResolver,
    },
    { provide: CLINICAL_IMPORT_CODES, useClass: NotConnectedConceptResolver },
    {
      provide: CLINICAL_IMPORT_PRACTITIONERS,
      useClass: NotConnectedPractitionerResolver,
    },
    { provide: CLINICAL_IMPORT_WRITER, useClass: NotConnectedClinicalWriter },
    { provide: CLINICAL_IMPORT_AUDIT, useClass: NotConnectedImportAudit },
    {
      provide: ClinicalImportService,
      inject: [
        CLINICAL_IMPORT_BATCHES,
        CLINICAL_IMPORT_PATIENTS,
        CLINICAL_IMPORT_CODES,
        CLINICAL_IMPORT_PRACTITIONERS,
        CLINICAL_IMPORT_WRITER,
        CLINICAL_IMPORT_AUDIT,
        InProcessJobScheduler,
        PinoLogger,
      ],
      useFactory: (
        repo: BatchRepositoryPort,
        patients: PatientResolverPort,
        codes: ConceptResolverPort,
        practitioners: PractitionerResolverPort,
        writer: ClinicalRecordWriterPort,
        audit: ImportAuditPort,
        scheduler: InProcessJobScheduler,
        logger: PinoLogger,
      ) => {
        logger.setContext('ClinicalImport');
        const service = new ClinicalImportService({
          repo,
          ports: { patients, codes, practitioners },
          writer,
          audit,
          scheduler,
          guard: resilienceGuard,
          // Sólo nombre del evento e identificadores/contadores: ninguna fila, ningún dato de paciente.
          log: (event, data) => logger.info(data, event),
        });
        scheduler.bind((job) => service.process(job));
        return service;
      },
    },
  ],
  exports: [ClinicalImportService],
})
export class ClinicalImportModule {}
