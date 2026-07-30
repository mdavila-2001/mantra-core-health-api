import { Module } from '@nestjs/common';
import { DeletionPipelineJob } from './deletion-pipeline.job';
import { MockProviderWiringService } from './mock-provider-wiring.service';

export {
  DeletionPipelineJob,
  defaultExecutionProviderAdapter,
  defaultVerificationProviderAdapter,
  type DeletionExecutionProviderAdapter,
  type DeletionVerificationProviderAdapter,
  type DeletionExecutionOutcome,
  type DeletionVerificationOutcome,
  type DeletionTargetSummary,
} from './deletion-pipeline.job';

/**
 * Fase 4 del plan de corrección de workers, acotada al módulo 62
 * (`cross_store_consistency`).
 *
 * De los seis endpoints candidatos evaluados, sólo el pipeline de borrado
 * (`executions` + `verifications`, UC-62-10/11) tenía una consulta de
 * descubrimiento que faltaba y ninguna decisión de negocio pendiente de una
 * persona — así que es el único que se cablea aquí con `@Interval`
 * (`DeletionPipelineJob`).
 *
 * Los otros cinco quedan sin cablear, y no por omisión:
 * - `workers/projections/deliveries/process` y `workers/projections/dead-letters`
 *   exigen datos de un evento de proyección concreto (qué se escribió en el
 *   destino, si la escritura fue durable) que sólo conoce el worker de cada
 *   backend secundario (search/graph/vector/read-models) al hacer su propia
 *   escritura real — no hay cola ni `jobType` en este repo que enlace un
 *   evento del outbox con una entrega de proyección de este módulo.
 * - `admin/reconciliation/runs` exige `items` con el resultado YA calculado de
 *   comparar el canónico contra el store secundario — no son parámetros
 *   mecánicos de lote; calcularlos requiere leer el store secundario, que no
 *   es responsabilidad de este módulo.
 * - `workers/deletion-requests/:id/expand` exige la lista concreta de
 *   `targets` (dataset/backend/localizador) donde vive el dato del sujeto; no
 *   existe en el repo un catálogo sujeto→dataset del que derivarla.
 * - `workers/cache/invalidations` se usa ya internamente desde `moveData`/
 *   `archiveData`; como llamada independiente, su disparador natural es el
 *   mismo worker de backend que resuelve la entrega de proyección (arriba).
 *
 * Detalle completo de la clasificación en el reporte de la Fase 4.
 */
@Module({
  providers: [DeletionPipelineJob, MockProviderWiringService],
})
export class CrossStoreConsistencyWorkerModule {}
