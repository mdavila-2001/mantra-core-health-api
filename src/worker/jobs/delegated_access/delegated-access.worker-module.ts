import { Module } from '@nestjs/common';
import { ExpirySweepJob } from './expiry-sweep.job';
import { SupportEffectiveAccessJob } from './support-effective-access.job';
import { SupportRecertificationJob } from './support-recertification.job';
import { SupportRequestsExpiryJob } from './support-requests-expiry.job';

/**
 * Fase 3 del plan de corrección de workers: barrido por expiración de
 * `delegated_access` (UC-29-08) y mantenimiento del personal de apoyo: vencimiento
 * de solicitudes (15 días), suspensión por recertificación sin confirmar y
 * recálculo del acceso efectivo.
 */
@Module({
  providers: [
    ExpirySweepJob,
    SupportRequestsExpiryJob,
    SupportRecertificationJob,
    SupportEffectiveAccessJob,
  ],
})
export class DelegatedAccessWorkerModule {}
