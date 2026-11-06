import type { UnitOfWork } from './unit-of-work';

/** Una farmacia leyó la receta compartida de un paciente. */
export interface PrescriptionShareAccessRecord {
  /** Usuario de la farmacia que la abrió. */
  readonly userId: string;
  /** Tenant de la farmacia: dice **qué farmacia** la abrió. */
  readonly tenantId: string;
  /** Paciente dueño de la receta. */
  readonly patientProfileId: string;
  /** Enlace por el que se abrió. */
  readonly shareId: string;
}

/**
 * Registro de acceso a PHI (`audit.data_access_log`, contexto audit) con el
 * paciente y el enlace, que `@AccessLogged` no conoce: salen del enlace ya
 * resuelto, no de la ruta. Se confirma antes de servir la receta: sin
 * evidencia del acceso no hay lectura.
 */
export interface PrescriptionShareAccessLogPort {
  recordPharmacyRead(
    uow: UnitOfWork,
    record: PrescriptionShareAccessRecord,
  ): Promise<void>;
}

/** Token de inyección del registro de acceso de recetas compartidas. */
export const PRESCRIPTION_SHARE_ACCESS_LOG_PORT = Symbol(
  'PRESCRIPTION_SHARE_ACCESS_LOG_PORT',
);
