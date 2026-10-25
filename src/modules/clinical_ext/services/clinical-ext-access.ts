import { ForbiddenException, HttpStatus } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  DomainException,
  ErrorCode,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import type { ClinicalReadService } from '../../clinical/services/clinical-read.service';
import { ClinicalExtErrorReason } from '../clinical_ext.error-reasons';

/** Cómo se presenta al cliente un recurso que no se puede mostrar. */
export interface NotFoundShape {
  /** Mensaje de «no existe». */
  readonly message: string;
  /** Sub-código del catálogo del módulo. */
  readonly reason: ClinicalExtErrorReason;
}

/**
 * Exige base de escritura sobre la historia del paciente de un recurso ya
 * cargado por UUID y, si falta, responde **404** idéntico al de «no existe»
 * (mismo mensaje, mismo `reason`, sin `details`): el 403 de la historia
 * confirmaría que ese UUID existe en la historia de otro paciente.
 *
 * @param clinicalRead - Política clínica del expediente.
 * @param patientProfileId - Paciente al que pertenece el recurso.
 * @param actor - Quién actúa.
 * @param notFound - Cómo se informa «no existe».
 * @throws ResourceNotFoundException si el actor no puede escribir en esa historia.
 */
export async function assertWriteOrNotFound(
  clinicalRead: ClinicalReadService,
  patientProfileId: string,
  actor: AuthenticatedUser,
  notFound: NotFoundShape,
): Promise<void> {
  try {
    await clinicalRead.assertCanWriteHistory(patientProfileId, actor);
  } catch (error) {
    if (error instanceof ForbiddenException) {
      throw new ResourceNotFoundException(
        notFound.message,
        undefined,
        notFound.reason,
      );
    }
    throw error;
  }
}

/**
 * El tenant del cuerpo no es fuente de verdad: si viene, tiene que ser el del
 * contexto verificado.
 *
 * @param bodyTenantId - Tenant enviado por el cliente (opcional).
 * @param activeTenantId - Tenant activo del actor (`requireTenantId()`).
 * @throws DomainException (403/FORBIDDEN) si el cuerpo contradice al contexto.
 */
export function assertBodyTenantMatches(
  bodyTenantId: string | undefined,
  activeTenantId: string,
): void {
  if (bodyTenantId !== undefined && bodyTenantId !== activeTenantId) {
    throw new DomainException(
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN,
      'El tenant indicado no es el tenant activo.',
      undefined,
      ClinicalExtErrorReason.CLINICAL_EXT_TENANT_SCOPE_REQUIRED,
    );
  }
}

/**
 * Serializa dentro de la transacción a quienes crean el mismo agregado lógico.
 *
 * El DDL no garantiza unicidad de brechas, referencias ni sesiones virtuales:
 * dos transacciones leen «no existe» y confirman ambas. El cerrojo consultivo
 * se libera solo al terminar la transacción y obliga a la segunda a leer lo que
 * la primera confirmó. No reemplaza un índice único; cubre las rutas de la API.
 *
 * @param tx - Transacción activa.
 * @param key - Clave lógica del agregado.
 */
export async function lockLogicalKey(
  tx: EntityManager,
  key: string,
): Promise<void> {
  await tx.execute('select pg_advisory_xact_lock(hashtextextended(?, 0))', [
    key,
  ]);
}
