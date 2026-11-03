import { GoneException } from '@nestjs/common';
import { ErrorCode, ResourceNotFoundException } from '../../../common';
import { DelegatedAccessErrorReason } from '../delegated_access.error-reasons';
import type {
  PrescriptionShareEndedReason,
  PrescriptionShareStatus,
} from './prescription-share-expiry';

/**
 * Los errores del enlace compartido de receta. Un enlace que ya no vale es un
 * 410 con `reason`; uno que no existe, o que no es de quien lo pide, el mismo
 * 404 sin detalle.
 */

/**
 * El 410 de un enlace revocado o vencido. `endedReason` separa el plazo
 * vencido de una receta que dejó de valer antes (anulada, reemplazada o
 * completada): a la farmacia no se le dice «venció» de una receta anulada.
 *
 * @param status - `REVOKED` o `EXPIRED`.
 * @param endedReason - Por qué terminó un enlace `EXPIRED`.
 * @returns La excepción lista para lanzar.
 */
export function shareGone(
  status: PrescriptionShareStatus,
  endedReason: PrescriptionShareEndedReason | null,
): GoneException {
  const revoked = status === 'REVOKED';
  const reason = revoked
    ? DelegatedAccessErrorReason.PRESCRIPTION_SHARE_REVOKED
    : DelegatedAccessErrorReason.PRESCRIPTION_SHARE_EXPIRED;
  return new GoneException({
    // Sin `code` propio para 410: PRECONDITION_FAILED es el más cercano, y
    // el cliente distingue el caso por `reason` (como la URL de descarga
    // vencida de `files.service.ts`).
    code: ErrorCode.PRECONDITION_FAILED,
    message: revoked
      ? 'El paciente dejó de compartir esta receta.'
      : endedReason === 'PRESCRIPTION_NOT_ACTIVE'
        ? 'Esta receta ya no está vigente: se anuló, se reemplazó o se completó.'
        : 'Esta receta venció.',
    reason,
    details: { reason, endedReason },
  });
}

export function prescriptionNotFound(): ResourceNotFoundException {
  return new ResourceNotFoundException('Receta no encontrada');
}

export function shareNotFound(): ResourceNotFoundException {
  return new ResourceNotFoundException('Enlace no encontrado');
}
