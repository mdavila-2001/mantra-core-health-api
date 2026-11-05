import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common/constants/concepts';
import { CLIN } from '../clinical.concepts';
import type { Immunizations, Procedures } from '../entities';
import type { ProcedureCases } from '../../procedures_perioperative/entities/procedure_cases.entity';
import { ReceivedServicesRepository } from '../repositories/received-services.repository';

/**
 * Proyecta a `clinical.received_services` lo que el paciente recibió.
 *
 * ## Por qué dentro de la misma transacción
 *
 * La historia del paciente lee esta tabla. Si la proyección fuera un efecto
 * posterior, un fallo entre el registro y la proyección dejaría un procedimiento
 * que existe en la ficha del médico y no en «Servicios recibidos», sin que nadie
 * lo note. Con el `EntityManager` de la transacción del llamador, o están los dos
 * o no está ninguno.
 *
 * ## Un servicio, no dos
 *
 * Un caso M53 y su procedimiento principal son el mismo servicio. Cualquiera de
 * los dos orígenes que llegue primero crea la fila y el otro la completa
 * (ver `ReceivedServicesRepository.upsert`).
 *
 * Clase sin estado: la inyectan los servicios que registran el hecho de origen.
 */
@Injectable()
export class ReceivedServicesProjector {
  constructor(private readonly repository: ReceivedServicesRepository) {}

  /** Un procedimiento completado es una intervención médica realizada. */
  async projectProcedure(
    em: EntityManager,
    procedure: Procedures,
    actorUserId?: string,
  ): Promise<void> {
    if (procedure.statusConceptId !== CLIN.PROCEDURE_COMPLETED) return;
    const foundCase = await this.repository.findCaseByPrimaryProcedure(
      em,
      procedure.id,
    );
    // El caso lo creó un cliente con `primaryProcedureId` sin cruzarlo con el
    // paciente: un caso de otra persona no se mezcla con este servicio.
    const procedureCase =
      foundCase &&
      foundCase.patientProfileId === procedure.patientProfileId &&
      foundCase.custodianTenantId === procedure.custodianTenantId
        ? foundCase
        : null;
    await this.repository.upsert(em, {
      custodianTenantId: procedure.custodianTenantId,
      patientProfileId: procedure.patientProfileId,
      encounterId: procedure.encounterId,
      serviceTypeConceptId: CLIN.RECEIVED_SERVICE_INTERVENTION,
      serviceConceptId: procedure.codeConceptId,
      statusConceptId: procedure.statusConceptId,
      sourceProcedureId: procedure.id,
      procedureCaseId: procedureCase?.id,
      performerProfileId: procedure.performerProfileId,
      practiceSiteId: procedure.practiceSiteId,
      performedAt:
        procedure.occurrenceEndAt ??
        procedure.performedAt ??
        procedure.occurrenceStartAt ??
        procedure.recordedAt ??
        procedure.createdAt,
      outcomeConceptId: procedure.outcomeConceptId,
      resultText: procedure.noteText,
      actorUserId,
    });
  }

  /** Una vacuna aplicada es un servicio de tipo vacunación. */
  async projectImmunization(
    em: EntityManager,
    immunization: Immunizations,
    actorUserId?: string,
  ): Promise<void> {
    if (immunization.statusConceptId !== CLIN.IMMUNIZATION_COMPLETED) return;
    await this.repository.upsert(em, {
      custodianTenantId: immunization.custodianTenantId,
      patientProfileId: immunization.patientProfileId,
      serviceTypeConceptId: CLIN.RECEIVED_SERVICE_VACCINATION,
      serviceConceptId: immunization.vaccineConceptId,
      statusConceptId: immunization.statusConceptId,
      sourceImmunizationId: immunization.id,
      performerProfileId: immunization.administeredByProfileId,
      performedAt: immunization.administeredAt ?? immunization.createdAt,
      actorUserId,
    });
  }

  /**
   * Un caso M53 que se completa. Si su procedimiento principal ya está proyectado,
   * la fila se completa con el caso (cirujano, sede); si no, el caso es el servicio.
   *
   * @param reportedProcedureId - El procedimiento al que apunta el informe operatorio
   *   firmado. Un caso sin `primaryProcedureId` queda ligado a su procedimiento solo
   *   por el informe; sin este id el caso y su procedimiento serían dos servicios.
   */
  async projectCompletedCase(
    em: EntityManager,
    procedureCase: ProcedureCases,
    actorUserId?: string,
    reportedProcedureId?: string,
  ): Promise<void> {
    if (procedureCase.statusConceptId !== CONCEPTS.CASE_COMPLETED) return;
    // Los dos ids de procedimiento los carga un cliente (al crear el caso y al
    // redactar el informe) y nadie los cruzó con el paciente del caso. Solo se
    // enlaza el que existe y es de este paciente y de este tenant; con uno ajeno el
    // caso queda como su propio servicio y la fila de otro paciente no se toca.
    let sourceProcedureId: string | undefined;
    for (const candidate of [
      procedureCase.primaryProcedureId,
      reportedProcedureId,
    ]) {
      if (
        candidate &&
        (await this.repository.isProcedureOf(
          em,
          candidate,
          procedureCase.patientProfileId,
          procedureCase.custodianTenantId,
        ))
      ) {
        sourceProcedureId = candidate;
        break;
      }
    }
    await this.repository.upsert(em, {
      custodianTenantId: procedureCase.custodianTenantId,
      patientProfileId: procedureCase.patientProfileId,
      encounterId: procedureCase.encounterId,
      serviceTypeConceptId: CLIN.RECEIVED_SERVICE_INTERVENTION,
      serviceConceptId: procedureCase.caseTypeConceptId,
      statusConceptId: procedureCase.statusConceptId,
      sourceProcedureId,
      procedureCaseId: procedureCase.id,
      performerProfileId: procedureCase.primarySurgeonProfileId,
      practiceSiteId: procedureCase.practiceSiteId,
      performedAt:
        procedureCase.actualEndAt ??
        procedureCase.actualStartAt ??
        procedureCase.scheduledEndAt ??
        procedureCase.scheduledStartAt ??
        procedureCase.createdAt,
      actorUserId,
    });
  }
}
