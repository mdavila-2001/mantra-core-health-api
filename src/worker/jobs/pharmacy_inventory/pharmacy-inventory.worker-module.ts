import { Module } from '@nestjs/common';
import { ExpireReservationsJob } from './expire-reservations.job';

/**
 * Fase 3 del plan de corrección de workers: barrido por expiración de
 * `pharmacy_inventory` (UC-25-05). La reconciliación de sync ERP (UC-25-12)
 * no se cablea aquí: ver el comentario en `expire-reservations.job.ts` sobre
 * por qué no existe un productor honesto de `batchId` todavía.
 */
@Module({
  providers: [ExpireReservationsJob],
})
export class PharmacyInventoryWorkerModule {}
