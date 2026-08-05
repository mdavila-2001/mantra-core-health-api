import { Module } from '@nestjs/common';
import { SlaScanJob } from './sla-scan.job';

export { SlaScanJob } from './sla-scan.job';

/**
 * Fase 5 del plan de corrección de workers: cierra el barrido de SLA de
 * `tracking` (UC-37-11). `POST /tracking/shipments/{id}/dispatch` (UC-37-03)
 * se evaluó y se dejó fuera a propósito: exige `assignedCourierUserId` o
 * transportista, una decisión humana real, no un candidato de worker (ver
 * informe de Fase 5).
 */
@Module({
  providers: [SlaScanJob],
})
export class TrackingWorkerModule {}
