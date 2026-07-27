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

/** Datos de alta de una orden de trabajo. */
export interface CreateWorkOrderData {
  custodianTenantId: string;
  laboratoryAccessionId: string;
  workOrderNumber: string;
  priorityConceptId: string;
  statusConceptId: string;
  assignedLaboratoryUnitId?: string;
  actorUserId?: string;
}

/** Datos de alta de una prueba de la orden. */
export interface CreateWorkOrderTestData {
  laboratoryWorkOrderId: string;
  serviceRequestId: string;
  testCodeConceptId: string;
  statusConceptId: string;
  specimenId?: string;
  methodConceptId?: string;
  analyzerDeviceId?: string;
  actorUserId?: string;
}

/** Datos de alta de una corrida de analizador. */
export interface CreateAnalyzerRunData {
  custodianTenantId: string;
  analyzerDeviceId: string;
  runIdentifier: string;
  startedAt: Date;
  statusConceptId: string;
  reagentLotId?: string;
  calibrationReference?: string;
}

/**
 * Acceso a datos del flujo de laboratorio: órdenes de trabajo y sus pruebas
 * (con auditoría y `row_version`), corridas de analizador y mensajes de resultado
 * (append-only), y el ledger inmutable de verificaciones de resultado.
 */
@Injectable()
export class LabWorkRepository {
  findWorkOrder(
    em: EntityManager,
    id: string,
  ): Promise<LaboratoryWorkOrders | null> {
    return em.findOne(LaboratoryWorkOrders, { id });
  }

  findWorkOrderTest(
    em: EntityManager,
    id: string,
  ): Promise<LaboratoryWorkOrderTests | null> {
    return em.findOne(LaboratoryWorkOrderTests, { id });
  }

  findAnalyzerRun(em: EntityManager, id: string): Promise<AnalyzerRuns | null> {
    return em.findOne(AnalyzerRuns, { id });
  }

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
      analyzerRunId: string;
      receivedAt: Date;
      messageFormatConceptId: string;
      payloadHash: string;
      validationStatusConceptId: string;
      messageControlId?: string;
      laboratoryWorkOrderTestId?: string;
      mappedObservationId?: string;
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
      custodianTenantId: string;
      verifiableTypeConceptId: string;
      verifiableId: string;
      verificationLevelConceptId: string;
      resultConceptId: string;
      verifiedByProfileId: string;
      verifiedAt: Date;
      verificationComment?: string;
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
