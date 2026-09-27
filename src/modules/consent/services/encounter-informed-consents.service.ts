import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { ClinicalReadService } from '../../clinical/services';
import { EncountersRepository } from '../../clinical/repositories';
import { TreatmentInformedConsents } from '../entities';
import { CONS } from '../consent.concepts';
import { TreatmentInformedConsentsService } from './treatment-informed-consents.service';
import type {
  MyTreatmentConsentDto,
  RegisterEncounterInformedConsentDto,
  TreatmentInformedConsentResponseDto,
} from '../dto';

/**
 * El consentimiento informado que el médico registra **en su consulta** (CL-77).
 *
 * `POST /consent/treatment-informed-consents` sigue siendo de `SECURITY_ADMIN`
 * (no se toca su `@Roles`); el médico entra por acá. La diferencia es de quién
 * es la verdad: el paciente y el tenant salen del **encuentro** de la ruta —no
 * del cuerpo—, y escribir exige poder escribir la historia de ese paciente
 * (`assertPuedeEscribirHistoria`: atiende hoy, tiene relación asistencial o un
 * grant con escritura). Un 403 idéntico al del resto del expediente si no.
 *
 * Después delega en `TreatmentInformedConsentsService.sign`: la fila queda en
 * `consent.treatment_informed_consents`, con su evento append-only, y el
 * paciente la ve en «Mi privacidad».
 */
@Injectable()
export class EncounterInformedConsentsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param encounters - Encuentros clínicos.
   * @param clinicalRead - Autorización sobre la historia del paciente.
   * @param treatment - Caso de uso de firma (UC-07-08).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly encounters: EncountersRepository,
    private readonly clinicalRead: ClinicalReadService,
    private readonly treatment: TreatmentInformedConsentsService,
  ) {}

  /**
   * Registra el consentimiento informado del encuentro.
   *
   * @param encounterId - Encuentro de la consulta.
   * @param dto - Decisión y datos opcionales.
   * @param actor - Médico autenticado.
   * @returns El registro creado.
   * @throws ResourceNotFoundException si el encuentro no existe.
   * @throws ForbiddenException si no puede escribir la historia del paciente.
   */
  async register(
    encounterId: string,
    dto: RegisterEncounterInformedConsentDto,
    actor: AuthenticatedUser,
  ): Promise<TreatmentInformedConsentResponseDto> {
    const encounter = await this.encounters.findById(
      this.em.fork(),
      encounterId,
    );
    if (!encounter) {
      throw new ResourceNotFoundException('Encuentro no encontrado', {
        encounterId,
      });
    }
    await this.clinicalRead.assertPuedeEscribirHistoria(
      encounter.patientProfileId,
      actor,
    );
    return this.treatment.sign(
      {
        ...dto,
        patientProfileId: encounter.patientProfileId,
        encounterId,
        tenantId: encounter.tenantId,
      },
      actor,
    );
  }

  /**
   * Los consentimientos informados registrados en un encuentro.
   *
   * @param encounterId - Encuentro.
   * @param actor - Médico autenticado.
   * @returns Los registros del encuentro, del más reciente al más antiguo.
   * @throws ResourceNotFoundException si el encuentro no existe.
   * @throws ForbiddenException si no puede leer la historia del paciente.
   */
  async listForEncounter(
    encounterId: string,
    actor: AuthenticatedUser,
  ): Promise<{ items: MyTreatmentConsentDto[] }> {
    const em = this.em.fork();
    const encounter = await this.encounters.findById(em, encounterId);
    if (!encounter) {
      throw new ResourceNotFoundException('Encuentro no encontrado', {
        encounterId,
      });
    }
    await this.clinicalRead.assertPuedeLeerHistoria(
      encounter.patientProfileId,
      actor,
    );
    const rows = await em.find(
      TreatmentInformedConsents,
      { encounterId, patientProfileId: encounter.patientProfileId },
      { orderBy: { createdAt: 'DESC' } },
    );
    return {
      items: rows.map((row) => ({
        id: row.id,
        encounterId: row.encounterId,
        decision:
          row.decisionConceptId === CONS.DECISION_ACCEPTED
            ? 'ACCEPTED'
            : row.decisionConceptId === CONS.DECISION_DECLINED
              ? 'DECLINED'
              : 'OTHER',
        informationVersion: row.informationVersion,
        signedAt: row.signedAt,
        withdrawnAt: row.withdrawnAt,
      })),
    };
  }
}
