import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  LaboratoryWorkOrders,
  LaboratoryWorkOrderTests,
  AnalyzerRuns,
  AnalyzerResultMessages,
  ResultVerifications,
} from '../entities';
import { createdBy } from '../../../common';

/** Accesión → punto de toma (sugerido en la orden o de la toma registrada). */
const POINT_OF_ACCESSION = `WITH points AS (
  SELECT a.id AS accession_id, coalesce(sr.suggested_care_space_id, ev.collection_care_space_id) AS care_space_id
    FROM diagnostics.laboratory_accessions a
    LEFT JOIN clinical.service_requests sr ON sr.id = a.service_request_id
    LEFT JOIN diagnostics.specimens sp ON sp.service_request_id = a.service_request_id
    LEFT JOIN diagnostics.specimen_collection_events ev ON ev.specimen_id = sp.id
   WHERE a.custodian_tenant_id = ?)`;

/** Datos de alta de una orden de trabajo. */
export interface CreateWorkOrderData {
  /**
   * Identificador asociado a custodian tenant.
   */
  custodianTenantId: string;
  /**
   * Identificador asociado a laboratory accession.
   */
  laboratoryAccessionId: string;
  /**
   * Valor de work order number mantenido por la instancia.
   */
  workOrderNumber: string;
  /**
   * Identificador asociado a priority concept.
   */
  priorityConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a assigned laboratory unit.
   */
  assignedLaboratoryUnitId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Datos de alta de una prueba de la orden. */
export interface CreateWorkOrderTestData {
  /**
   * Identificador asociado a laboratory work order.
   */
  laboratoryWorkOrderId: string;
  /**
   * Identificador asociado a service request.
   */
  serviceRequestId: string;
  /**
   * Identificador asociado a test code concept.
   */
  testCodeConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a specimen.
   */
  specimenId?: string;
  /**
   * Identificador asociado a method concept.
   */
  methodConceptId?: string;
  /**
   * Identificador asociado a analyzer device.
   */
  analyzerDeviceId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Datos de alta de una corrida de analizador. */
export interface CreateAnalyzerRunData {
  /**
   * Identificador asociado a custodian tenant.
   */
  custodianTenantId: string;
  /**
   * Identificador asociado a analyzer device.
   */
  analyzerDeviceId: string;
  /**
   * Valor de run identifier mantenido por la instancia.
   */
  runIdentifier: string;
  /**
   * Valor de started at mantenido por la instancia.
   */
  startedAt: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a reagent lot.
   */
  reagentLotId?: string;
  /**
   * Valor de calibration reference mantenido por la instancia.
   */
  calibrationReference?: string;
}

/**
 * Acceso a datos del flujo de laboratorio: órdenes de trabajo y sus pruebas
 * (con auditoría y `row_version`), corridas de analizador y mensajes de resultado
 * (append-only), y el ledger inmutable de verificaciones de resultado.
 */
@Injectable()
export class LabWorkRepository {
  /**
   * Obtiene find work order.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find work order conforme al contrato `Promise<LaboratoryWorkOrders | null>`.
   */
  /**
   * Órdenes de trabajo del laboratorio, acotadas al tenant custodio.
   *
   * `diagnostics` no tenía ninguna lectura: las órdenes se creaban y nadie
   * podía consultarlas, así que el laboratorio no tenía forma de saber qué
   * tenía pendiente.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param custodianTenantId - Tenant custodio, obligatorio.
   * @param filters - Acotaciones opcionales y paginación.
   * @returns Las órdenes que cumplen el filtro, de la más reciente a la más antigua.
   */
  async findWorkOrders(
    em: EntityManager,
    custodianTenantId: string,
    filters: {
      /** Accesión de laboratorio a la que pertenece. */
      laboratoryAccessionId?: string;
      /** Estado de la orden. */
      statusConceptId?: string;
      /** Profesional asignado. */
      assignedProfileId?: string;
      /** F5b: punto de toma. */
      collectionCareSpaceId?: string;
      /** Tamaño de página. */
      limit: number;
      /** Desplazamiento. */
      offset: number;
    },
  ): Promise<LaboratoryWorkOrders[]> {
    const where: Record<string, unknown> = { custodianTenantId };
    if (filters.laboratoryAccessionId)
      where.laboratoryAccessionId = filters.laboratoryAccessionId;
    if (filters.statusConceptId)
      where.statusConceptId = filters.statusConceptId;
    if (filters.assignedProfileId)
      where.assignedProfileId = filters.assignedProfileId;
    if (filters.collectionCareSpaceId) {
      const rows = await em.execute<{ id: string }[]>(
        `${POINT_OF_ACCESSION} SELECT accession_id AS id FROM points WHERE care_space_id = ?`,
        [custodianTenantId, filters.collectionCareSpaceId],
        'all',
      );
      where.laboratoryAccessionId = filters.laboratoryAccessionId
        ? rows.some((r) => r.id === filters.laboratoryAccessionId)
          ? filters.laboratoryAccessionId
          : '00000000-0000-0000-0000-000000000000'
        : {
            $in: rows.length
              ? rows.map((r) => r.id)
              : ['00000000-0000-0000-0000-000000000000'],
          };
    }
    return em.find(LaboratoryWorkOrders, where, {
      orderBy: { createdAt: 'DESC', id: 'ASC' },
      limit: filters.limit,
      offset: filters.offset,
    });
  }

  /**
   * F5b: punto de toma de cada accesión (el sugerido en su orden o, si no, el
   * de la toma registrada de alguno de sus especímenes).
   *
   * @param em - Contexto.
   * @param accessionIds - Accesiones.
   */
  async collectionPointsOf(
    em: EntityManager,
    accessionIds: readonly string[],
  ): Promise<Map<string, { id: string; code: string; name: string }>> {
    if (accessionIds.length === 0) return new Map();
    const rows = await em.execute<
      { accession_id: string; id: string; code: string; name: string }[]
    >(
      `SELECT DISTINCT ON (a.id) a.id AS accession_id, cs.id, cs.code, cs.name
         FROM diagnostics.laboratory_accessions a
         LEFT JOIN clinical.service_requests sr ON sr.id = a.service_request_id
         LEFT JOIN diagnostics.specimens sp ON sp.service_request_id = a.service_request_id
         LEFT JOIN diagnostics.specimen_collection_events ev ON ev.specimen_id = sp.id
         JOIN practice.care_spaces cs ON cs.id = coalesce(sr.suggested_care_space_id, ev.collection_care_space_id)
        WHERE a.id = ANY(?::uuid[])
        ORDER BY a.id, (sr.suggested_care_space_id IS NOT NULL) DESC, ev.occurred_at DESC`,
      [`{${accessionIds.join(',')}}`],
      'all',
    );
    return new Map(
      rows.map((r) => [
        r.accession_id,
        { id: r.id, code: r.code, name: r.name },
      ]),
    );
  }

  findWorkOrder(
    em: EntityManager,
    id: string,
  ): Promise<LaboratoryWorkOrders | null> {
    return em.findOne(LaboratoryWorkOrders, { id });
  }

  /**
   * Obtiene find work order test.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find work order test conforme al contrato `Promise<LaboratoryWorkOrderTests | null>`.
   */
  findWorkOrderTest(
    em: EntityManager,
    id: string,
  ): Promise<LaboratoryWorkOrderTests | null> {
    return em.findOne(LaboratoryWorkOrderTests, { id });
  }

  /**
   * Obtiene find analyzer run.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find analyzer run conforme al contrato `Promise<AnalyzerRuns | null>`.
   */
  findAnalyzerRun(em: EntityManager, id: string): Promise<AnalyzerRuns | null> {
    return em.findOne(AnalyzerRuns, { id });
  }

  /**
   * Crea create work order.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create work order conforme al contrato `LaboratoryWorkOrders`.
   */
  createWorkOrder(
    em: EntityManager,
    data: CreateWorkOrderData,
  ): LaboratoryWorkOrders {
    return em.create(
      LaboratoryWorkOrders,
      {
        custodianTenantId: data.custodianTenantId,
        laboratoryAccessionId: data.laboratoryAccessionId,
        workOrderNumber: data.workOrderNumber,
        priorityConceptId: data.priorityConceptId,
        statusConceptId: data.statusConceptId,
        assignedLaboratoryUnitId: data.assignedLaboratoryUnitId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create work order test.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create work order test conforme al contrato `LaboratoryWorkOrderTests`.
   */
  createWorkOrderTest(
    em: EntityManager,
    data: CreateWorkOrderTestData,
  ): LaboratoryWorkOrderTests {
    return em.create(
      LaboratoryWorkOrderTests,
      {
        laboratoryWorkOrderId: data.laboratoryWorkOrderId,
        serviceRequestId: data.serviceRequestId,
        testCodeConceptId: data.testCodeConceptId,
        statusConceptId: data.statusConceptId,
        specimenId: data.specimenId,
        methodConceptId: data.methodConceptId,
        analyzerDeviceId: data.analyzerDeviceId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create analyzer run.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create analyzer run conforme al contrato `AnalyzerRuns`.
   */
  createAnalyzerRun(
    em: EntityManager,
    data: CreateAnalyzerRunData,
  ): AnalyzerRuns {
    return em.create(
      AnalyzerRuns,
      {
        custodianTenantId: data.custodianTenantId,
        analyzerDeviceId: data.analyzerDeviceId,
        runIdentifier: data.runIdentifier,
        startedAt: data.startedAt,
        statusConceptId: data.statusConceptId,
        reagentLotId: data.reagentLotId,
        calibrationReference: data.calibrationReference,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /** Busca un mensaje por (run, control id) para idempotencia. */
  findMessageByControlId(
    em: EntityManager,
    analyzerRunId: string,
    messageControlId: string,
  ): Promise<AnalyzerResultMessages | null> {
    return em.findOne(AnalyzerResultMessages, {
      analyzerRunId,
      messageControlId,
    });
  }

  /** Registra un mensaje de resultado (append-only, sin flush). */
  recordMessage(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a analyzer run.
       */
      analyzerRunId: string;
      /**
       * Valor de received at mantenido por la instancia.
       */
      receivedAt: Date;
      /**
       * Identificador asociado a message format concept.
       */
      messageFormatConceptId: string;
      /**
       * Valor de payload hash mantenido por la instancia.
       */
      payloadHash: string;
      /**
       * Identificador asociado a validation status concept.
       */
      validationStatusConceptId: string;
      /**
       * Identificador asociado a message control.
       */
      messageControlId?: string;
      /**
       * Identificador asociado a laboratory work order test.
       */
      laboratoryWorkOrderTestId?: string;
      /**
       * Identificador asociado a mapped observation.
       */
      mappedObservationId?: string;
      /**
       * Identificador asociado a raw message file.
       */
      rawMessageFileId?: string;
    },
  ): AnalyzerResultMessages {
    return em.create(
      AnalyzerResultMessages,
      {
        analyzerRunId: data.analyzerRunId,
        receivedAt: data.receivedAt,
        messageFormatConceptId: data.messageFormatConceptId,
        payloadHash: data.payloadHash,
        validationStatusConceptId: data.validationStatusConceptId,
        messageControlId: data.messageControlId,
        laboratoryWorkOrderTestId: data.laboratoryWorkOrderTestId,
        mappedObservationId: data.mappedObservationId,
        rawMessageFileId: data.rawMessageFileId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /** Registra una verificación de resultado (ledger inmutable, sin flush). */
  recordVerification(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a custodian tenant.
       */
      custodianTenantId: string;
      /**
       * Identificador asociado a verifiable type concept.
       */
      verifiableTypeConceptId: string;
      /**
       * Identificador asociado a verifiable.
       */
      verifiableId: string;
      /**
       * Identificador asociado a verification level concept.
       */
      verificationLevelConceptId: string;
      /**
       * Identificador asociado a result concept.
       */
      resultConceptId: string;
      /**
       * Identificador asociado a verified by profile.
       */
      verifiedByProfileId: string;
      /**
       * Valor de verified at mantenido por la instancia.
       */
      verifiedAt: Date;
      /**
       * Valor de verification comment mantenido por la instancia.
       */
      verificationComment?: string;
      /**
       * Identificador asociado a previous verification.
       */
      previousVerificationId?: string;
    },
  ): ResultVerifications {
    return em.create(
      ResultVerifications,
      {
        custodianTenantId: data.custodianTenantId,
        verifiableTypeConceptId: data.verifiableTypeConceptId,
        verifiableId: data.verifiableId,
        verificationLevelConceptId: data.verificationLevelConceptId,
        resultConceptId: data.resultConceptId,
        verifiedByProfileId: data.verifiedByProfileId,
        verifiedAt: data.verifiedAt,
        verificationComment: data.verificationComment,
        previousVerificationId: data.previousVerificationId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /** Marca como verificadas las pruebas asociadas a una observación. */
  markTestsVerifiedForObservation(
    em: EntityManager,
    observationId: string,
    verifiedStatusConceptId: string,
  ): Promise<number> {
    return em.nativeUpdate(
      LaboratoryWorkOrderTests,
      { observationId },
      { statusConceptId: verifiedStatusConceptId, updatedAt: new Date() },
    );
  }
}
