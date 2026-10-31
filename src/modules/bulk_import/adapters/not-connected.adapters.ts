import { Injectable } from '@nestjs/common';
import { BulkImportReason } from '../bulk-import.error-reasons';
import type {
  AppendClinicalResult,
  ClinicalRecordWriterPort,
  CodeResolution,
  CodeResolverPort,
  PatientResolution,
  PatientResolverPort,
  ProvisionUserResult,
  UserProvisionerPort,
} from '../ports/bulk-import.ports';

/**
 * Adaptadores «no conectado»: lo que el módulo cablea mientras el colaborador
 * real no existe en esta instalación (ver `README.md`).
 *
 * Fallan **hacia adentro y a la vista**: ninguno finge un éxito. Un ejecutor
 * devuelve la fila `RECHAZADA` con `EXECUTOR_NOT_CONNECTED`; un resolvedor
 * lanza, y la fila queda rechazada con `RESOLUTION_UNAVAILABLE`. El informe
 * nunca dice «creados» sobre algo que no se creó.
 */
@Injectable()
export class NotConnectedUserProvisioner implements UserProvisionerPort {
  provision(): Promise<ProvisionUserResult> {
    return Promise.resolve({
      status: 'REJECTED',
      reason: BulkImportReason.EXECUTOR_NOT_CONNECTED,
    });
  }
}

/** Ver {@link NotConnectedUserProvisioner}. */
@Injectable()
export class NotConnectedClinicalWriter implements ClinicalRecordWriterPort {
  append(): Promise<AppendClinicalResult> {
    return Promise.resolve({
      status: 'REJECTED',
      reason: BulkImportReason.EXECUTOR_NOT_CONNECTED,
    });
  }
}

/** Ver {@link NotConnectedUserProvisioner}. */
@Injectable()
export class NotConnectedPatientResolver implements PatientResolverPort {
  resolve(): Promise<PatientResolution> {
    return Promise.reject(new Error('Resolutor de pacientes no conectado'));
  }
}

/** Ver {@link NotConnectedUserProvisioner}. */
@Injectable()
export class NotConnectedCodeResolver implements CodeResolverPort {
  resolve(): Promise<CodeResolution> {
    return Promise.reject(new Error('Resolutor de terminología no conectado'));
  }
}
