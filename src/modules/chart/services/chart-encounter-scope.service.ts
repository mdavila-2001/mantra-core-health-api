import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  getCurrentTenantId,
} from '../../../common';
import {
  ConditionsRepository,
  EncountersRepository,
} from '../../clinical/repositories';
import { ChartErrorReason } from '../chart.error-reasons';

/**
 * Alcance de las referencias clínicas de las altas de `chart`.
 *
 * Las altas de nota, documento y plan reciben `patientProfileId` y `encounterId`
 * por separado. `ClinicalRecordAccessGuard` autoriza al paciente del cuerpo pero
 * no resuelve el encuentro, y `EncounterSealGuardService` declara que tampoco
 * valida existencia ni pertenencia. Sin esta comprobación, un profesional con
 * escritura sobre el paciente A podía colgar su nota, documento o plan del
 * encuentro abierto del paciente B: la FK sólo demuestra existencia.
 *
 * Una referencia ajena responde exactamente igual que una inexistente (`404`,
 * mismo mensaje y mismo `reason`, sin `details`).
 */
@Injectable()
export class ChartEncounterScopeService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param encountersRepo - Lectura de encuentros.
   * @param conditionsRepo - Lectura de diagnósticos.
   */
  constructor(
    private readonly encountersRepo: EncountersRepository,
    private readonly conditionsRepo: ConditionsRepository,
  ) {}

  /**
   * Exige que el encuentro exista, sea del paciente indicado (y del tenant del
   * contexto, si lo hay) y siga abierto.
   *
   * @param tx - Transacción activa de la escritura.
   * @param encounterId - Encuentro que el cuerpo declara.
   * @param patientProfileId - Paciente del expediente al que se escribe.
   * @throws ResourceNotFoundException `CHART_ENCOUNTER_OUT_OF_SCOPE` si no existe
   *   o no es de este paciente o tenant.
   * @throws PreconditionFailedException `CHART_ENCOUNTER_SEALED` si ya está sellado.
   */
  async assertEncounterBelongsToPatientAndWritable(
    tx: EntityManager,
    encounterId: string,
    patientProfileId: string,
  ): Promise<void> {
    const encounter = await this.encountersRepo.findById(tx, encounterId);
    const tenantId = getCurrentTenantId();
    if (
      !encounter ||
      encounter.patientProfileId !== patientProfileId ||
      (tenantId !== undefined && encounter.tenantId !== tenantId)
    ) {
      throw new ResourceNotFoundException(
        'Encuentro no encontrado',
        undefined,
        ChartErrorReason.CHART_ENCOUNTER_OUT_OF_SCOPE,
      );
    }
    if (encounter.sealedAt) {
      throw new PreconditionFailedException(
        'El encuentro ya está cerrado y sellado: no admite más escrituras.',
        undefined,
        ChartErrorReason.CHART_ENCOUNTER_SEALED,
      );
    }
  }

  /**
   * Exige que el diagnóstico exista y sea del paciente indicado.
   *
   * @param tx - Transacción activa de la escritura.
   * @param conditionId - Diagnóstico que el cuerpo declara.
   * @param patientProfileId - Paciente del expediente al que se escribe.
   * @throws ResourceNotFoundException `CHART_CONDITION_OUT_OF_SCOPE` si no existe
   *   o es de otro paciente.
   */
  async assertConditionBelongsToPatient(
    tx: EntityManager,
    conditionId: string,
    patientProfileId: string,
  ): Promise<void> {
    const condition = await this.conditionsRepo.findById(tx, conditionId);
    if (!condition || condition.patientProfileId !== patientProfileId) {
      throw new ResourceNotFoundException(
        'Diagnóstico no encontrado',
        undefined,
        ChartErrorReason.CHART_CONDITION_OUT_OF_SCOPE,
      );
    }
  }
}
