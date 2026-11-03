import { Injectable } from '@nestjs/common';
import type { PatientChargeAcceptancePort } from '../../application/ports/patient-charge-acceptance.port';

/**
 * Adaptador de aceptación del paciente que **no encuentra nunca** una
 * aceptación (carril 16, REQ-16-030).
 *
 * Es deliberado y es provisional. No existe todavía la tabla donde el paciente
 * deja constancia de que aceptó por adelantado el costo total de un servicio no
 * cubierto: el cambio de modelo (`.puml` del repositorio `mantra-core-health-model`,
 * ADR-0021) es un PR aparte. Hasta que llegue, el cobro particular **falla
 * cerrado**: `PATIENT_CONSENT_REQUIRED`. Un adaptador que devolviera «sí
 * aceptó» sin prueba dejaría al médico pasarle el total al paciente sin
 * avisarle, que es justo lo que este requisito prohíbe.
 *
 * Para reemplazarlo: implementar `PatientChargeAcceptancePort` sobre la tabla
 * nueva y cambiar el `useExisting` de `PATIENT_CHARGE_ACCEPTANCE_PORT` en
 * `InsuranceModule`. Ningún servicio cambia.
 */
@Injectable()
export class NoPatientChargeAcceptanceAdapter implements PatientChargeAcceptancePort {
  async findLatestAcceptance(): Promise<null> {
    return null;
  }
}
