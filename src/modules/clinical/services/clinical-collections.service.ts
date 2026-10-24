import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import {
  DiagnosticReports,
  Immunizations,
  MedicationRecords,
  Procedures,
  ServiceRequests,
} from '../entities';
import type {
  DiagnosticReportItemDto,
  ImmunizationItemDto,
  ListDiagnosticReportsQueryDto,
  ListImmunizationsQueryDto,
  ListMedicationRecordsQueryDto,
  ListProceduresQueryDto,
  ListServiceRequestsQueryDto,
  MedicationRecordItemDto,
  ProcedureItemDto,
  ServiceRequestItemDto,
} from '../dto';

/**
 * Lecturas de colección de `clinical`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class ClinicalCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar los informes diagnósticos de un paciente (V08-03).
   *
   * Se lee por paciente y con `ClinicalRecordAccessGuard`, igual que el historial
   * (`GET /clinical/patients/{id}/summary`). Además se acota al custodio del contexto:
   * el historial cruza custodios, esta página sólo trae lo que custodia el tenant activo.
   *
   * @param patientProfileId - Recurso padre de la ruta.
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listDiagnosticReports(
    patientProfileId: string,
    query: ListDiagnosticReportsQueryDto,
  ): Promise<PageResponseDto<DiagnosticReportItemDto>> {
    return listTenantCollection(this.em.fork(), DiagnosticReports, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ patientProfileId: patientProfileId }),
      tenantField: 'custodianTenantId',
      map: (row): DiagnosticReportItemDto => ({
        id: row.id,
        custodianTenantId: row.custodianTenantId,
        patientProfileId: row.patientProfileId,
        serviceRequestId: row.serviceRequestId ?? null,
        encounterId: row.encounterId ?? null,
        codeConceptId: row.codeConceptId,
        categoryConceptId: row.categoryConceptId ?? null,
        lifecycleStatusConceptId: row.lifecycleStatusConceptId,
        currentVersionId: row.currentVersionId ?? null,
        currentReleasedVersionId: row.currentReleasedVersionId ?? null,
        resultReleaseStatusConceptId: row.resultReleaseStatusConceptId ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar las inmunizaciones de un paciente (V08-09).
   *
   * Se lee por paciente y con `ClinicalRecordAccessGuard`, igual que el historial
   * (`GET /clinical/patients/{id}/summary`). Además se acota al custodio del contexto:
   * el historial cruza custodios, esta página sólo trae lo que custodia el tenant activo.
   *
   * @param patientProfileId - Recurso padre de la ruta.
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listImmunizations(
    patientProfileId: string,
    query: ListImmunizationsQueryDto,
  ): Promise<PageResponseDto<ImmunizationItemDto>> {
    return listTenantCollection(this.em.fork(), Immunizations, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ patientProfileId: patientProfileId }),
      tenantField: 'custodianTenantId',
      map: (row): ImmunizationItemDto => ({
        id: row.id,
        custodianTenantId: row.custodianTenantId,
        patientProfileId: row.patientProfileId,
        vaccineConceptId: row.vaccineConceptId,
        statusConceptId: row.statusConceptId,
        doseNumber: row.doseNumber ?? null,
        lotNumber: row.lotNumber ?? null,
        routeConceptId: row.routeConceptId ?? null,
        administeredAt: row.administeredAt ?? null,
        administeredByProfileId: row.administeredByProfileId ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar los registros de medicación de un paciente (V08-10).
   *
   * Se lee por paciente y con `ClinicalRecordAccessGuard`, igual que el historial
   * (`GET /clinical/patients/{id}/summary`). Además se acota al custodio del contexto:
   * el historial cruza custodios, esta página sólo trae lo que custodia el tenant activo.
   *
   * @param patientProfileId - Recurso padre de la ruta.
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listMedicationRecords(
    patientProfileId: string,
    query: ListMedicationRecordsQueryDto,
  ): Promise<PageResponseDto<MedicationRecordItemDto>> {
    return listTenantCollection(this.em.fork(), MedicationRecords, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ patientProfileId: patientProfileId }),
      tenantField: 'custodianTenantId',
      map: (row): MedicationRecordItemDto => ({
        id: row.id,
        custodianTenantId: row.custodianTenantId,
        patientProfileId: row.patientProfileId,
        requestId: row.requestId ?? null,
        medicationConceptId: row.medicationConceptId,
        statusConceptId: row.statusConceptId,
        recordTypeConceptId: row.recordTypeConceptId ?? null,
        doseDecimal: row.doseDecimal ?? null,
        unitConceptId: row.unitConceptId ?? null,
        administeredAt: row.administeredAt ?? null,
        recordedByUserId: row.recordedByUserId ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar los procedimientos de un paciente (V08-11).
   *
   * Se lee por paciente y con `ClinicalRecordAccessGuard`, igual que el historial
   * (`GET /clinical/patients/{id}/summary`). Además se acota al custodio del contexto:
   * el historial cruza custodios, esta página sólo trae lo que custodia el tenant activo.
   *
   * @param patientProfileId - Recurso padre de la ruta.
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listProcedures(
    patientProfileId: string,
    query: ListProceduresQueryDto,
  ): Promise<PageResponseDto<ProcedureItemDto>> {
    return listTenantCollection(this.em.fork(), Procedures, {
      query,
      sortable: ['createdAt', 'recordedAt', 'updatedAt'],
      where: definedFilters({ patientProfileId: patientProfileId }),
      tenantField: 'custodianTenantId',
      map: (row): ProcedureItemDto => ({
        id: row.id,
        custodianTenantId: row.custodianTenantId,
        patientProfileId: row.patientProfileId,
        encounterId: row.encounterId ?? null,
        codeConceptId: row.codeConceptId,
        statusConceptId: row.statusConceptId,
        performerProfileId: row.performerProfileId ?? null,
        performedAt: row.performedAt ?? null,
        noteText: row.noteText ?? null,
        serviceRequestId: row.serviceRequestId ?? null,
        parentProcedureId: row.parentProcedureId ?? null,
        categoryConceptId: row.categoryConceptId ?? null,
        statusReasonConceptId: row.statusReasonConceptId ?? null,
        practiceSiteId: row.practiceSiteId ?? null,
        careSpaceId: row.careSpaceId ?? null,
        recorderProfileId: row.recorderProfileId ?? null,
        outcomeConceptId: row.outcomeConceptId ?? null,
        reportedSourceConceptId: row.reportedSourceConceptId ?? null,
        occurrenceStartAt: row.occurrenceStartAt ?? null,
        occurrenceEndAt: row.occurrenceEndAt ?? null,
        recordedAt: row.recordedAt ?? null,
        followUpText: row.followUpText ?? null,
        operativeReportFileId: row.operativeReportFileId ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar las solicitudes de servicio de un paciente (V08-12).
   *
   * Se lee por paciente y con `ClinicalRecordAccessGuard`, igual que el historial
   * (`GET /clinical/patients/{id}/summary`). Además se acota al custodio del contexto:
   * el historial cruza custodios, esta página sólo trae lo que custodia el tenant activo.
   *
   * @param patientProfileId - Recurso padre de la ruta.
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listServiceRequests(
    patientProfileId: string,
    query: ListServiceRequestsQueryDto,
  ): Promise<PageResponseDto<ServiceRequestItemDto>> {
    return listTenantCollection(this.em.fork(), ServiceRequests, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ patientProfileId: patientProfileId }),
      tenantField: 'custodianTenantId',
      map: (row): ServiceRequestItemDto => ({
        id: row.id,
        custodianTenantId: row.custodianTenantId,
        patientProfileId: row.patientProfileId,
        encounterId: row.encounterId ?? null,
        codeConceptId: row.codeConceptId,
        categoryConceptId: row.categoryConceptId ?? null,
        intentConceptId: row.intentConceptId ?? null,
        priorityConceptId: row.priorityConceptId ?? null,
        statusConceptId: row.statusConceptId,
        requesterProfileId: row.requesterProfileId ?? null,
        performerTenantId: row.performerTenantId ?? null,
        previousDiagnosticReportId: row.previousDiagnosticReportId ?? null,
        duplicateOverrideReason: row.duplicateOverrideReason ?? null,
        formInstanceId: row.formInstanceId ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
