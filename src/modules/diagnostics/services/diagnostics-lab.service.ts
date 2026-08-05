import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  ConflictException,
  PreconditionFailedException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { SpecimensRepository, LabWorkRepository } from '../repositories';
import { DIAG } from '../diagnostics.concepts';
import {
  CreateWorkOrderDto,
  CreateAnalyzerRunDto,
  IngestAnalyzerMessageDto,
  VerifyResultDto,
  WorkOrderCreatedDto,
  ResourceCreatedDto,
} from '../dto';

/**
 * Casos de uso del flujo de laboratorio: abrir orden de trabajo y desglosar
 * pruebas (UC-20-04), correr analizador e ingerir mensaje de resultado (UC-20-05)
 * y verificar (técnica/facultativa) un resultado (UC-20-06). Incluye el endpoint
 * de soporte de alta de corrida de analizador (padre del mensaje de resultado).
 */
@Injectable()
export class DiagnosticsLabService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param repo - Valor de repo requerido por la operación.
   * @param specimensRepo - Valor de specimens repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: LabWorkRepository,
    private readonly specimensRepo: SpecimensRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DiagnosticsLabService.name);
  }

  /** UC-20-04: abre una orden de trabajo y desglosa sus pruebas. */
  async createWorkOrder(
    dto: CreateWorkOrderDto,
    actor: AuthenticatedUser,
  ): Promise<WorkOrderCreatedDto> {
    this.logger.info(
      {
        operation: 'diagnostics.workOrder.create',
        accessionId: dto.laboratoryAccessionId,
      },
      'Opening work order',
    );
    return this.em.transactional(async (tx) => {
      const accession = await this.specimensRepo.findAccession(
        tx,
        dto.laboratoryAccessionId,
      );
      if (!accession) {
        throw new ResourceNotFoundException('Acesión no encontrada', {
          laboratoryAccessionId: dto.laboratoryAccessionId,
        });
      }

      const order = this.repo.createWorkOrder(tx, {
        custodianTenantId: dto.custodianTenantId ?? accession.custodianTenantId,
        laboratoryAccessionId: accession.id,
        workOrderNumber: dto.workOrderNumber ?? `WO-${Date.now()}`,
        priorityConceptId: dto.priorityConceptId ?? DIAG.PRIORITY_ROUTINE,
        statusConceptId: DIAG.WORK_ORDER_OPEN,
        assignedLaboratoryUnitId: dto.assignedLaboratoryUnitId,
        actorUserId: actor.id,
      });
      await tx.flush();

      const testIds: string[] = [];
      for (const t of dto.tests) {
        const test = this.repo.createWorkOrderTest(tx, {
          laboratoryWorkOrderId: order.id,
          serviceRequestId: t.serviceRequestId,
          testCodeConceptId: t.testCodeConceptId,
          statusConceptId: DIAG.TEST_PENDING,
          specimenId: t.specimenId,
          methodConceptId: t.methodConceptId,
          analyzerDeviceId: t.analyzerDeviceId,
          actorUserId: actor.id,
        });
        testIds.push(test.id);
      }
      // La acesión pasa a en_proceso.
      accession.statusConceptId = DIAG.ACCESSION_IN_PROCESS;
      touch(accession, actor.id);
      await tx.flush();

      return { id: order.id, status: order.statusConceptId, testIds };
    });
  }

  /** Soporte: abre una corrida de analizador. */
  async createAnalyzerRun(
    dto: CreateAnalyzerRunDto,
    _actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    this.logger.info(
      {
        operation: 'diagnostics.analyzerRun.create',
        device: dto.analyzerDeviceId,
      },
      'Opening analyzer run',
    );
    return this.em.transactional(async (tx) => {
      const tenantId = dto.custodianTenantId;
      if (!tenantId) {
        throw new PreconditionFailedException(
          'Falta el tenant custodio de la corrida',
          {},
        );
      }
      const run = this.repo.createAnalyzerRun(tx, {
        custodianTenantId: tenantId,
        analyzerDeviceId: dto.analyzerDeviceId,
        runIdentifier: dto.runIdentifier,
        startedAt: new Date(),
        statusConceptId: DIAG.ANALYZER_RUN_OPEN,
        reagentLotId: dto.reagentLotId,
        calibrationReference: dto.calibrationReference,
      });
      await tx.flush();
      return { id: run.id, status: run.statusConceptId };
    });
  }

  /** UC-20-05: ingiere un mensaje de resultado en una corrida abierta (idempotente). */
  async ingestMessage(
    analyzerRunId: string,
    dto: IngestAnalyzerMessageDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    this.logger.info(
      { operation: 'diagnostics.analyzerRun.ingest', analyzerRunId },
      'Ingesting analyzer result message',
    );
    return this.em.transactional(async (tx) => {
      const run = await this.repo.findAnalyzerRun(tx, analyzerRunId);
      if (!run)
        throw new ResourceNotFoundException(
          'Corrida de analizador no encontrada',
          { analyzerRunId },
        );

      // Idempotencia por (run, message_control_id).
      if (dto.messageControlId) {
        const dup = await this.repo.findMessageByControlId(
          tx,
          analyzerRunId,
          dto.messageControlId,
        );
        if (dup) {
          throw new ConflictException(
            'El mensaje ya fue ingerido para esta corrida',
            {
              messageControlId: dto.messageControlId,
            },
          );
        }
      }

      const message = this.repo.recordMessage(tx, {
        analyzerRunId,
        receivedAt: new Date(),
        messageFormatConceptId:
          dto.messageFormatConceptId ?? DIAG.MESSAGE_FORMAT_HL7,
        payloadHash: dto.payloadHash,
        validationStatusConceptId: DIAG.MESSAGE_VALIDATED,
        messageControlId: dto.messageControlId,
        laboratoryWorkOrderTestId: dto.laboratoryWorkOrderTestId,
        mappedObservationId: dto.mappedObservationId,
        rawMessageFileId: dto.rawMessageFileId,
      });
      await tx.flush();

      // Si el mensaje mapea a una prueba, la marca con resultado preliminar.
      if (dto.laboratoryWorkOrderTestId) {
        const test = await this.repo.findWorkOrderTest(
          tx,
          dto.laboratoryWorkOrderTestId,
        );
        if (test) {
          test.statusConceptId = DIAG.TEST_PRELIMINARY;
          test.observationId = dto.mappedObservationId ?? test.observationId;
          test.completedAt = new Date();
          touch(test, actor.id);
          await tx.flush();
        }
      }

      return { id: message.id, status: message.validationStatusConceptId };
    });
  }

  /** UC-20-06: registra una verificación técnica o facultativa de un resultado. */
  async verifyResult(
    observationId: string,
    dto: VerifyResultDto,
    _actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    this.logger.info(
      {
        operation: 'diagnostics.result.verify',
        observationId,
        level: dto.level,
      },
      'Verifying result',
    );
    return this.em.transactional(async (tx) => {
      const tenantId = dto.custodianTenantId;
      if (!tenantId) {
        throw new PreconditionFailedException(
          'Falta el tenant custodio de la verificación',
          {},
        );
      }
      const levelConceptId =
        dto.level === 'MEDICAL'
          ? DIAG.VERIFICATION_MEDICAL
          : DIAG.VERIFICATION_TECHNICAL;

      const verification = this.repo.recordVerification(tx, {
        custodianTenantId: tenantId,
        verifiableTypeConceptId: DIAG.VERIFIABLE_OBSERVATION,
        verifiableId: observationId,
        verificationLevelConceptId: levelConceptId,
        resultConceptId: dto.resultConceptId ?? DIAG.VERIFICATION_ACCEPTED,
        verifiedByProfileId: dto.verifiedByProfileId,
        verifiedAt: new Date(),
        verificationComment: dto.verificationComment,
        previousVerificationId: dto.previousVerificationId,
      });
      await tx.flush();

      // Marca como verificadas las pruebas ligadas a esa observación (si existen).
      await this.repo.markTestsVerifiedForObservation(
        tx,
        observationId,
        DIAG.TEST_VERIFIED,
      );

      return { id: verification.id, status: verification.resultConceptId };
    });
  }
}
