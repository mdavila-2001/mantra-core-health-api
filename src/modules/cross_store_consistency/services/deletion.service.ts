import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { OutboxService } from '../../messaging/services';
import { DeletionRepository } from '../repositories';
import {
  DEFAULT_DELETION_SLA_DAYS,
  DEFAULT_DELETION_DISCOVERY_BATCH,
} from '../constants';
import {
  RequestDeletionDto,
  DeletionRequestResponseDto,
  ExpandDeletionDto,
  ExpandDeletionResponseDto,
  ExecuteDeletionDto,
  DeletionExecutionResponseDto,
  VerifyDeletionDto,
  VerificationResponseDto,
  CloseDeletionRequestDto,
  CloseDeletionResponseDto,
  PendingDeletionTargetsResponseDto,
  ExecutedDeletionTargetsResponseDto,
} from '../dto';

const MILLISECONDS_PER_DAY = 86_400_000;

/** Estados en los que una solicitud de borrado sigue en marcha. */
const LIVE_REQUEST_STATES = ['PENDING', 'EXPANDED'];

/**
 * Borrado cross-store (UC-62-08 … 11): solicitar, expandir a objetivos por store,
 * ejecutar y **verificar la ausencia**.
 *
 * La regla del modelo `cross_store_deletion_verification_required` es lo que
 * estructura el servicio: un borrado no está completo porque se haya ejecutado,
 * sino porque se ha comprobado que el dato ya no está en ningún sitio.
 */
@Injectable()
export class DeletionService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param deletionRepo - Valor de deletion repo requerido por la operación.
   * @param outbox - Valor de outbox requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly deletionRepo: DeletionRepository,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DeletionService.name);
  }

  /**
   * UC-62-08: solicitar el borrado del sujeto.
   *
   * Una sola solicitud viva por sujeto: dos borrados en marcha del mismo paciente
   * darían dos expansiones que se pisan y una verificación que nunca cuadra.
   *
   * El `due_at` no es decorativo — gobierna el plazo legal de cumplimiento, y por
   * eso se fija al crear la solicitud y no cuando alguien se acuerda.
   */
  async requestDeletion(
    dto: RequestDeletionDto,
    actor: AuthenticatedUser,
  ): Promise<DeletionRequestResponseDto> {
    return this.em.transactional(async (tx) => {
      const live = await this.deletionRepo.findLiveRequestBySubject(
        tx,
        dto.tenantId,
        dto.subjectType,
        dto.subjectId,
        LIVE_REQUEST_STATES,
      );
      if (live) {
        return {
          id: live.id,
          state: live.state,
          dueAt: live.dueAt.toISOString(),
          duplicate: true,
        };
      }

      const slaDays = dto.slaDays ?? DEFAULT_DELETION_SLA_DAYS;
      const request = this.deletionRepo.createRequest(tx, {
        tenantId: dto.tenantId,
        subjectType: dto.subjectType,
        subjectId: dto.subjectId,
        reasonCode: dto.reasonCode,
        legalBasisCode: dto.legalBasisCode,
        requestedByUserId: actor.id,
        state: 'PENDING',
        dueAt: new Date(Date.now() + slaDays * MILLISECONDS_PER_DAY),
      });

      await this.outbox.publishDomainEvent(tx, {
        tenantId: dto.tenantId,
        eventType: 'DeletionRequested',
        aggregateType: 'cross_store_consistency.deletion_requests',
        aggregateId: request.id,
        payloadJson: {
          subjectType: dto.subjectType,
          subjectId: dto.subjectId,
          reasonCode: dto.reasonCode,
          legalBasisCode: dto.legalBasisCode,
          dueAt: request.dueAt.toISOString(),
        },
        actorUserId: actor.id,
      });

      this.logger.warn(
        {
          operation: 'xstore.deletion.request',
          requestId: request.id,
          subjectType: dto.subjectType,
          dueAt: request.dueAt.toISOString(),
        },
        'Solicitud de borrado registrada',
      );

      return {
        id: request.id,
        state: request.state,
        dueAt: request.dueAt.toISOString(),
        duplicate: false,
      };
    });
  }

  /**
   * UC-62-09: expandir la solicitud a objetivos por store.
   *
   * Es el paso que convierte "borra a este paciente" en una lista concreta de
   * sitios. Un objetivo marcado con retención legal se registra igualmente y nace
   * `BLOCKED`: dejarlo fuera de la lista haría creer que no existe, y el cierre
   * daría por borrado algo que sigue ahí por obligación.
   */
  async expandDeletion(
    requestId: string,
    dto: ExpandDeletionDto,
    _actor: AuthenticatedUser,
  ): Promise<ExpandDeletionResponseDto> {
    return this.em.transactional(async (tx) => {
      const request = await this.deletionRepo.findRequestForUpdate(
        tx,
        requestId,
      );
      if (!request) {
        throw new ResourceNotFoundException(
          'Solicitud de borrado no encontrada.',
          { requestId },
        );
      }
      if (!LIVE_REQUEST_STATES.includes(request.state)) {
        throw new PreconditionFailedException(
          'La solicitud ya no admite expansión.',
          {
            requestId,
            state: request.state,
          },
        );
      }

      let targetsCreated = 0;
      let targetsSkipped = 0;
      let blockedByLegalHold = 0;

      for (const target of dto.targets) {
        const duplicate = await this.deletionRepo.findTarget(
          tx,
          requestId,
          target.datasetId,
          target.backendCode,
          target.targetLocator,
        );
        if (duplicate) {
          targetsSkipped += 1;
          continue;
        }

        const blocked = target.blockedByLegalHold === true;
        this.deletionRepo.createTarget(tx, {
          deletionRequestId: requestId,
          datasetId: target.datasetId,
          backendCode: target.backendCode,
          targetLocator: target.targetLocator,
          deletionMode: target.deletionMode,
          blockedByLegalHold: blocked,
          state: blocked ? 'BLOCKED' : 'PENDING',
        });
        targetsCreated += 1;
        if (blocked) blockedByLegalHold += 1;
      }

      request.state = 'EXPANDED';

      this.logger.info(
        {
          operation: 'xstore.deletion.expand',
          requestId,
          targetsCreated,
          targetsSkipped,
          blockedByLegalHold,
        },
        'Solicitud de borrado expandida a objetivos',
      );

      return {
        deletionRequestId: requestId,
        state: request.state,
        targetsCreated,
        targetsSkipped,
        blockedByLegalHold,
      };
    });
  }

  /**
   * Descubrimiento (Fase 4 del plan de corrección de workers): objetivos
   * `PENDING` sin bloqueo, listos para que el worker llame `executeDeletion`.
   * Sin esto, el worker no tenía forma de saber qué `targetId` procesar — el
   * propio README documenta que ese barrido "lo hace el worker antes de
   * llamar".
   */
  async listPendingTargets(
    limit?: number,
  ): Promise<PendingDeletionTargetsResponseDto> {
    const em = this.em.fork();
    const targets = await this.deletionRepo.findPendingTargets(
      em,
      limit ?? DEFAULT_DELETION_DISCOVERY_BATCH,
    );
    return {
      targets: targets.map((target) => ({
        id: target.id,
        deletionRequestId: target.deletionRequestId,
        datasetId: target.datasetId,
        backendCode: target.backendCode,
        targetLocator: target.targetLocator,
        deletionMode: target.deletionMode,
      })),
    };
  }

  /**
   * Descubrimiento (Fase 4): objetivos `EXECUTED` listos para que el worker
   * llame `verifyDeletion`. Misma razón que `listPendingTargets`.
   */
  async listExecutedTargets(
    limit?: number,
  ): Promise<ExecutedDeletionTargetsResponseDto> {
    const em = this.em.fork();
    const targets = await this.deletionRepo.findExecutedTargets(
      em,
      limit ?? DEFAULT_DELETION_DISCOVERY_BATCH,
    );
    return {
      targets: targets.map((target) => ({
        id: target.id,
        deletionRequestId: target.deletionRequestId,
        datasetId: target.datasetId,
        backendCode: target.backendCode,
        targetLocator: target.targetLocator,
        deletionMode: target.deletionMode,
      })),
    };
  }

  /**
   * UC-62-10: ejecutar el borrado en el store destino.
   *
   * **Un objetivo con retención legal no se toca.** Es la única razón legítima por
   * la que un dato sobrevive a un borrado, y saltárselo silenciosamente sería
   * borrar algo que la ley obliga a conservar.
   *
   * La clave de idempotencia se deriva de `(objetivo, intento)`, y el
   * `provider_receipt` es la evidencia: sin él, "se borró" es una afirmación sin
   * respaldo.
   */
  async executeDeletion(
    targetId: string,
    dto: ExecuteDeletionDto,
    _actor: AuthenticatedUser,
  ): Promise<DeletionExecutionResponseDto> {
    return this.em.transactional(async (tx) => {
      const target = await this.deletionRepo.findTargetForUpdate(tx, targetId);
      if (!target) {
        throw new ResourceNotFoundException(
          'Objetivo de borrado no encontrado.',
          { targetId },
        );
      }
      if (target.blockedByLegalHold) {
        throw new PreconditionFailedException(
          'El objetivo está bloqueado por retención legal; no se borra.',
          { targetId },
        );
      }
      if (target.state !== 'PENDING' && target.state !== 'EXECUTED') {
        throw new PreconditionFailedException(
          'El objetivo no está en un estado que admita ejecución.',
          { targetId, state: target.state },
        );
      }

      const attemptNumber =
        (await this.deletionRepo.countExecutions(tx, targetId)) + 1;
      const idempotencyKey = createHash('sha256')
        .update(targetId)
        .update(String(attemptNumber))
        .digest('hex');

      const duplicate = await this.deletionRepo.findExecutionByKey(
        tx,
        idempotencyKey,
      );
      if (duplicate) {
        return {
          id: duplicate.id,
          attemptNumber: duplicate.attemptNumber,
          status: duplicate.status,
          targetState: target.state,
          duplicate: true,
        };
      }

      const succeeded = dto.succeeded !== false;
      const execution = this.deletionRepo.createExecution(tx, {
        deletionTargetId: targetId,
        attemptNumber,
        idempotencyKey,
        status: succeeded ? 'SUCCEEDED' : 'FAILED',
        providerReceipt: dto.providerReceipt,
        errorCode: succeeded ? undefined : dto.errorCode,
        startedAt: new Date(),
      });
      execution.completedAt = new Date();

      if (succeeded) target.state = 'EXECUTED';

      this.logger.warn(
        {
          operation: 'xstore.deletion.execute',
          targetId,
          attemptNumber,
          status: execution.status,
        },
        'Borrado ejecutado en el store destino',
      );

      return {
        id: execution.id,
        attemptNumber,
        status: execution.status,
        targetState: target.state,
        duplicate: false,
      };
    });
  }

  /**
   * UC-62-11 (verificación): comprobar la ausencia en el store.
   *
   * Un objetivo sólo pasa a `VERIFIED` si el dato está ausente **y** no quedan
   * referencias residuales. Con referencias, vuelve a `PENDING` para que se
   * reintente: una verificación que encuentra restos y aun así cierra convierte la
   * prueba de borrado en un trámite.
   */
  async verifyDeletion(
    targetId: string,
    dto: VerifyDeletionDto,
    _actor: AuthenticatedUser,
  ): Promise<VerificationResponseDto> {
    return this.em.transactional(async (tx) => {
      const target = await this.deletionRepo.findTargetForUpdate(tx, targetId);
      if (!target) {
        throw new ResourceNotFoundException(
          'Objetivo de borrado no encontrado.',
          { targetId },
        );
      }
      if (target.state !== 'EXECUTED' && target.state !== 'VERIFIED') {
        throw new PreconditionFailedException(
          'El objetivo tiene que estar ejecutado para poder verificarse.',
          { targetId, state: target.state },
        );
      }

      const residual = dto.residualReferenceCount ?? 0;
      const verification = this.deletionRepo.createVerification(tx, {
        deletionTargetId: targetId,
        verificationMethod: dto.verificationMethod,
        verifiedAbsent: dto.verifiedAbsent,
        residualReferenceCount: residual,
        evidenceObjectId: dto.evidenceObjectId,
      });

      const clean = dto.verifiedAbsent && residual === 0;
      target.state = clean ? 'VERIFIED' : 'PENDING';

      if (!clean) {
        this.logger.warn(
          {
            operation: 'xstore.deletion.residual',
            targetId,
            residualReferenceCount: residual,
          },
          'La verificación encontró referencias residuales; el objetivo vuelve a pendiente',
        );
      }

      return {
        id: verification.id,
        targetState: target.state,
        requiresReexecution: !clean,
      };
    });
  }

  /**
   * UC-62-11 (cierre): cerrar la solicitud cuando todos los objetivos están
   * resueltos.
   *
   * `cross_store_deletion_verification_required`: la solicitud sólo pasa a
   * `COMPLETED` si **todo** objetivo está verificado ausente o bloqueado por
   * retención legal. Con uno solo pendiente, la solicitud no se cierra — cerrarla
   * sería declarar cumplido un derecho que no lo está.
   *
   * Si todo lo que queda está bloqueado por retención, la solicitud queda
   * `BLOCKED` y no `COMPLETED`: son dos desenlaces distintos y hay que poder
   * distinguirlos.
   */
  async closeDeletionRequest(
    requestId: string,
    dto: CloseDeletionRequestDto,
    actor: AuthenticatedUser,
  ): Promise<CloseDeletionResponseDto> {
    return this.em.transactional(async (tx) => {
      const request = await this.deletionRepo.findRequestForUpdate(
        tx,
        requestId,
      );
      if (!request) {
        throw new ResourceNotFoundException(
          'Solicitud de borrado no encontrada.',
          { requestId },
        );
      }
      if (!LIVE_REQUEST_STATES.includes(request.state)) {
        throw new ConflictException('La solicitud ya está cerrada.', {
          requestId,
          state: request.state,
        });
      }

      const targets = await this.deletionRepo.findTargetsByRequest(
        tx,
        requestId,
      );
      if (targets.length === 0) {
        throw new PreconditionFailedException(
          'La solicitud no tiene objetivos; expándela antes de cerrarla.',
          { requestId },
        );
      }

      const verifiedTargets = targets.filter(
        (t) => t.state === 'VERIFIED',
      ).length;
      const blockedTargets = targets.filter((t) => t.blockedByLegalHold).length;
      const pendingTargets = targets.length - verifiedTargets - blockedTargets;

      if (pendingTargets > 0) {
        throw new PreconditionFailedException(
          'Quedan objetivos sin verificar; el borrado no está completo.',
          { requestId, pendingTargets },
        );
      }

      // Todo bloqueado por retención no es un borrado cumplido: es un borrado que
      // la ley impide, y quien lo pidió tiene derecho a saberlo.
      request.state = verifiedTargets > 0 ? 'COMPLETED' : 'BLOCKED';

      await this.outbox.publishDomainEvent(tx, {
        tenantId: request.tenantId,
        eventType: 'DeletionRequestClosed',
        aggregateType: 'cross_store_consistency.deletion_requests',
        aggregateId: request.id,
        payloadJson: {
          subjectType: request.subjectType,
          subjectId: request.subjectId,
          state: request.state,
          verifiedTargets,
          blockedTargets,
          note: dto.note ?? null,
        },
        actorUserId: actor.id,
      });

      this.logger.warn(
        {
          operation: 'xstore.deletion.close',
          requestId,
          state: request.state,
          verifiedTargets,
          blockedTargets,
        },
        'Solicitud de borrado cerrada',
      );

      return {
        id: request.id,
        state: request.state,
        verifiedTargets,
        blockedTargets,
        pendingTargets: 0,
      };
    });
  }
}
