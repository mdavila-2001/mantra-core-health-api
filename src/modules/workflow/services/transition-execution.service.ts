import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConcurrencyConflictException,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { OutboxService } from '../../messaging/services';
import type { StateMachineDefinitions, TransitionGuards } from '../entities';
import {
  AggregateStateRepository,
  StateMachinesRepository,
  WorkflowRuntimeRepository,
} from '../repositories';
import {
  TriggerTransitionDto,
  TransitionEventResponseDto,
  CompensateTransitionDto,
  CompensateTransitionResponseDto,
  RetryTransitionDto,
  RetryTransitionResponseDto,
  QueryTransitionHistoryDto,
  TransitionHistoryResponseDto,
} from '../dto';

/** Lo que ve una guarda al evaluarse. */
interface GuardContext {
  payload: Record<string, unknown>;
  actorRoles: string[];
  currentStateConceptId: string;
}

const DEFAULT_HISTORY_LIMIT = 50;
const MAX_HISTORY_LIMIT = 200;

/**
 * Ejecución de transiciones (UC-32-05, 06, 08, 09, 11): disparar un comando
 * validado, aplicar idempotencia, compensar y reintentar, y leer el historial.
 *
 * La regla que estructura todo el servicio: **el cambio del agregado, el evento
 * que lo describe y los mensajes de sus efectos se confirman en la misma
 * transacción**. Ninguna llamada externa ocurre aquí; los efectos salen por el
 * outbox y los despacha el relay después del commit.
 */
@Injectable()
export class TransitionExecutionService {
  constructor(
    private readonly em: EntityManager,
    private readonly machinesRepo: StateMachinesRepository,
    private readonly runtimeRepo: WorkflowRuntimeRepository,
    private readonly aggregateRepo: AggregateStateRepository,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TransitionExecutionService.name);
  }

  /**
   * UC-32-05: disparar una transición validada.
   *
   * El orden importa y no es arbitrario: se bloquea el agregado *antes* de leer su
   * estado, porque si se leyera primero dos comandos concurrentes podrían partir
   * los dos del mismo estado de origen y aplicar los dos su transición.
   */
  async triggerTransition(
    aggregateId: string,
    commandCode: string,
    dto: TriggerTransitionDto,
    actor: AuthenticatedUser,
    idempotencyKey?: string,
  ): Promise<TransitionEventResponseDto> {
    return this.em.transactional(async (tx) => {
      const machine = await this.requireActiveMachine(tx, dto.machineCode);

      const aggregate = await this.aggregateRepo.findForUpdate(
        tx,
        {
          schemaName: machine.aggregateSchemaName,
          entityName: machine.aggregateEntityName,
          statusFieldName: machine.statusFieldName,
        },
        aggregateId,
      );
      if (!aggregate) {
        throw new ResourceNotFoundException(
          'El agregado gobernado no existe.',
          { aggregateId },
        );
      }

      const transition = await this.machinesRepo.findTransitionByCommand(
        tx,
        machine.id,
        aggregate.stateConceptId,
        commandCode,
      );
      if (!transition) {
        throw new PreconditionFailedException(
          'El comando no es aplicable desde el estado actual del agregado.',
          { commandCode, currentStateConceptId: aggregate.stateConceptId },
        );
      }

      // UC-32-06: la clave corta antes de tocar nada. Reaplicar una transición ya
      // aplicada movería el agregado una segunda vez.
      if (transition.idempotencyRequired && !idempotencyKey) {
        throw new PreconditionFailedException(
          'Esta transición exige cabecera Idempotency-Key.',
          { commandCode },
        );
      }
      if (idempotencyKey) {
        const previous =
          await this.runtimeRepo.findTransitionEventByIdempotencyKey(
            tx,
            machine.id,
            aggregateId,
            idempotencyKey,
          );
        if (previous) {
          return {
            id: previous.id,
            aggregateId: previous.aggregateId,
            fromStateConceptId: previous.fromStateConceptId,
            toStateConceptId: previous.toStateConceptId,
            occurredAt: previous.occurredAt.toISOString(),
            publishedEffects: 0,
            duplicate: true,
          };
        }
      }

      if (
        transition.reasonRequired &&
        !dto.reasonConceptId &&
        !dto.reasonText
      ) {
        throw new PreconditionFailedException(
          'Esta transición exige declarar el motivo.',
          {
            commandCode,
          },
        );
      }

      if (
        transition.optimisticLockRequired &&
        dto.expectedRowVersion === undefined
      ) {
        throw new PreconditionFailedException(
          'Esta transición exige enviar la versión del agregado que vio el llamante.',
          { commandCode },
        );
      }

      const guards = await this.machinesRepo.findGuardsByTransition(
        tx,
        transition.id,
      );
      this.assertGuards(guards, {
        payload: dto.payloadJson ?? {},
        actorRoles: actor.roles ?? [],
        currentStateConceptId: aggregate.stateConceptId,
      });

      const applied = await this.aggregateRepo.updateState(
        tx,
        {
          schemaName: machine.aggregateSchemaName,
          entityName: machine.aggregateEntityName,
          statusFieldName: machine.statusFieldName,
        },
        aggregateId,
        transition.toStateConceptId,
        transition.optimisticLockRequired ? dto.expectedRowVersion : undefined,
      );
      if (!applied) {
        throw new ConcurrencyConflictException(
          'El agregado cambió desde que el llamante lo leyó.',
          { aggregateId, expectedRowVersion: dto.expectedRowVersion },
        );
      }

      const event = this.runtimeRepo.createTransitionEvent(tx, {
        stateMachineDefinitionId: machine.id,
        transitionDefinitionId: transition.id,
        aggregateId,
        fromStateConceptId: aggregate.stateConceptId,
        toStateConceptId: transition.toStateConceptId,
        actorUserId: actor.id,
        actorTenantId: dto.actorTenantId,
        reasonConceptId: dto.reasonConceptId ?? CONCEPTS.WF_REASON_MANUAL,
        reasonText: dto.reasonText,
        idempotencyKey,
        correlationId: dto.correlationId,
        causationId: dto.causationId,
        aggregateRowVersionBefore: aggregate.rowVersion,
        aggregateRowVersionAfter: aggregate.rowVersion + 1,
      });

      const publishedEffects = await this.publishSideEffects(
        tx,
        transition.id,
        {
          eventId: event.id,
          aggregateId,
          machineCode: machine.machineCode,
          fromStateConceptId: aggregate.stateConceptId,
          toStateConceptId: transition.toStateConceptId,
          correlationId: dto.correlationId,
          actorUserId: actor.id,
          compensating: false,
        },
      );

      this.logger.info(
        {
          operation: 'workflow.transition.trigger',
          aggregateId,
          transitionId: transition.id,
          eventId: event.id,
        },
        'Transición aplicada',
      );

      return {
        id: event.id,
        aggregateId,
        fromStateConceptId: event.fromStateConceptId,
        toStateConceptId: event.toStateConceptId,
        occurredAt: event.occurredAt.toISOString(),
        publishedEffects,
        duplicate: false,
      };
    });
  }

  /**
   * UC-32-08: compensar una transición (saga).
   *
   * Sólo se compensa lo que la definición declaró compensable: si ningún efecto de
   * la transición trae `compensation_spec_json`, no hay forma declarada de
   * deshacerla y devolver el agregado al estado anterior dejaría los efectos ya
   * despachados sin revertir.
   *
   * La compensación es un evento nuevo, no un borrado: `causation_id` apunta al
   * original. El histórico tiene que poder contar que se hizo y que se deshizo.
   */
  async compensateTransition(
    aggregateId: string,
    eventId: string,
    dto: CompensateTransitionDto,
    actor: AuthenticatedUser,
  ): Promise<CompensateTransitionResponseDto> {
    return this.em.transactional(async (tx) => {
      const original = await this.runtimeRepo.findTransitionEventById(
        tx,
        eventId,
      );
      if (!original || original.aggregateId !== aggregateId) {
        throw new ResourceNotFoundException(
          'La transición original no existe para ese agregado.',
          {
            eventId,
            aggregateId,
          },
        );
      }

      const machine = await this.machinesRepo.findMachineById(
        tx,
        original.stateMachineDefinitionId,
      );
      if (!machine) {
        throw new ResourceNotFoundException(
          'Máquina de estado no encontrada.',
          {
            machineId: original.stateMachineDefinitionId,
          },
        );
      }

      const sideEffects = await this.machinesRepo.findSideEffectsByTransition(
        tx,
        original.transitionDefinitionId,
      );
      const compensable = sideEffects.filter((e) => e.compensationSpecJson);
      if (compensable.length === 0) {
        throw new PreconditionFailedException(
          'La transición no declara compensación, así que no es reversible.',
          { eventId },
        );
      }

      const aggregate = await this.aggregateRepo.findForUpdate(
        tx,
        {
          schemaName: machine.aggregateSchemaName,
          entityName: machine.aggregateEntityName,
          statusFieldName: machine.statusFieldName,
        },
        aggregateId,
      );
      if (!aggregate) {
        throw new ResourceNotFoundException(
          'El agregado gobernado no existe.',
          { aggregateId },
        );
      }

      // Si el agregado ya se movió a otro sitio, compensar sobreescribiría un
      // cambio posterior que nadie pidió deshacer.
      if (aggregate.stateConceptId !== original.toStateConceptId) {
        throw new ConflictException(
          'El agregado ya no está en el estado que dejó la transición que se quiere compensar.',
          { aggregateId, currentStateConceptId: aggregate.stateConceptId },
        );
      }

      const applied = await this.aggregateRepo.updateState(
        tx,
        {
          schemaName: machine.aggregateSchemaName,
          entityName: machine.aggregateEntityName,
          statusFieldName: machine.statusFieldName,
        },
        aggregateId,
        original.fromStateConceptId,
      );
      if (!applied) {
        throw new ConcurrencyConflictException(
          'El agregado cambió durante la compensación.',
          {
            aggregateId,
          },
        );
      }

      const compensation = this.runtimeRepo.createTransitionEvent(tx, {
        stateMachineDefinitionId: machine.id,
        transitionDefinitionId: original.transitionDefinitionId,
        aggregateId,
        fromStateConceptId: original.toStateConceptId,
        toStateConceptId: original.fromStateConceptId,
        actorUserId: actor.id,
        actorTenantId: original.actorTenantId,
        reasonConceptId: CONCEPTS.WF_REASON_COMPENSATION,
        reasonText: dto.reasonText,
        // La clave de idempotencia del reverso es propia: el reverso es un hecho
        // distinto del original, y compartirla lo haría parecer un duplicado.
        idempotencyKey: `compensate:${eventId}`,
        correlationId: dto.correlationId ?? original.correlationId,
        causationId: eventId,
        aggregateRowVersionBefore: aggregate.rowVersion,
        aggregateRowVersionAfter: aggregate.rowVersion + 1,
      });

      await this.outbox.publishDomainEvent(tx, {
        eventType: 'TransitionCompensated',
        aggregateType: 'workflow.state_transition_events',
        aggregateId: compensation.id,
        payloadJson: {
          originalEventId: eventId,
          aggregateId,
          restoredStateConceptId: original.fromStateConceptId,
        },
        correlationId: dto.correlationId ?? original.correlationId,
        causationId: eventId,
        actorUserId: actor.id,
      });

      let publishedEffects = 1;
      for (const effect of compensable) {
        if (!effect.outboxEventType) continue;
        const result = await this.outbox.publishDomainEvent(tx, {
          eventType: `${effect.outboxEventType}.compensated`,
          aggregateType: 'workflow.transition_side_effects',
          aggregateId: compensation.id,
          payloadJson: {
            sideEffectCode: effect.sideEffectCode,
            compensationSpec: effect.compensationSpecJson,
            originalEventId: eventId,
            aggregateId,
          },
          correlationId: dto.correlationId ?? original.correlationId,
          causationId: eventId,
          actorUserId: actor.id,
        });
        if (!result.duplicate) publishedEffects += 1;
      }

      this.logger.warn(
        {
          operation: 'workflow.transition.compensate',
          aggregateId,
          originalEventId: eventId,
          compensationEventId: compensation.id,
        },
        'Transición compensada',
      );

      return {
        compensationEventId: compensation.id,
        originalEventId: eventId,
        restoredStateConceptId: original.fromStateConceptId,
        publishedEffects,
      };
    });
  }

  /**
   * UC-32-09: reintentar una transición cuyo efecto asíncrono falló.
   *
   * El reintento **conserva la clave de idempotencia del original**. Es lo que
   * distingue reintentar de volver a hacer: el efecto de negocio debe ocurrir una
   * vez, aunque el mensaje se entregue varias.
   *
   * No mueve el agregado: la transición ya se aplicó, lo que falló fue el efecto.
   */
  async retryTransition(
    aggregateId: string,
    eventId: string,
    dto: RetryTransitionDto,
    actor: AuthenticatedUser,
  ): Promise<RetryTransitionResponseDto> {
    return this.em.transactional(async (tx) => {
      const original = await this.runtimeRepo.findTransitionEventById(
        tx,
        eventId,
      );
      if (!original || original.aggregateId !== aggregateId) {
        throw new ResourceNotFoundException(
          'La transición original no existe para ese agregado.',
          {
            eventId,
            aggregateId,
          },
        );
      }

      let instanceId: string | undefined;
      if (dto.workflowInstanceId) {
        const instance = await this.runtimeRepo.findInstanceForUpdate(
          tx,
          dto.workflowInstanceId,
        );
        if (!instance) {
          throw new ResourceNotFoundException(
            'Instancia de workflow no encontrada.',
            {
              workflowInstanceId: dto.workflowInstanceId,
            },
          );
        }
        if (
          instance.currentStateConceptId !==
          CONCEPTS.WF_INSTANCE_RETRY_SCHEDULED
        ) {
          throw new PreconditionFailedException(
            'La instancia no está en espera de reintento.',
            { workflowInstanceId: instance.id },
          );
        }
        instance.currentStateConceptId = CONCEPTS.WF_INSTANCE_RUNNING;
        instance.statusConceptId = CONCEPTS.WF_INSTANCE_ACTIVE;
        touch(instance, actor.id);
        instanceId = instance.id;
      }

      const retry = this.runtimeRepo.createTransitionEvent(tx, {
        stateMachineDefinitionId: original.stateMachineDefinitionId,
        transitionDefinitionId: original.transitionDefinitionId,
        aggregateId,
        // El reintento no mueve el agregado: origen y destino son el estado al que
        // ya llegó. El evento existe para dejar constancia del reintento.
        fromStateConceptId: original.toStateConceptId,
        toStateConceptId: original.toStateConceptId,
        actorUserId: actor.id,
        actorTenantId: original.actorTenantId,
        reasonConceptId: CONCEPTS.WF_REASON_RETRY,
        idempotencyKey: original.idempotencyKey,
        correlationId: original.correlationId,
        causationId: eventId,
      });

      const publishedEffects = await this.publishSideEffects(
        tx,
        original.transitionDefinitionId,
        {
          eventId: retry.id,
          aggregateId,
          machineCode: undefined,
          fromStateConceptId: original.toStateConceptId,
          toStateConceptId: original.toStateConceptId,
          correlationId: original.correlationId,
          actorUserId: actor.id,
          compensating: false,
          // Reintentar reusa la clave original para que el consumidor reconozca
          // el mensaje como el mismo hecho y no lo aplique dos veces.
          idempotencyKeyPrefix: original.idempotencyKey,
        },
      );

      this.logger.warn(
        {
          operation: 'workflow.transition.retry',
          aggregateId,
          originalEventId: eventId,
          retryEventId: retry.id,
          publishedEffects,
        },
        'Transición reintentada',
      );

      return {
        retryEventId: retry.id,
        originalEventId: eventId,
        idempotencyKey: original.idempotencyKey,
        workflowInstanceId: instanceId,
      };
    });
  }

  /**
   * UC-32-11: historial de transiciones del agregado.
   *
   * Lectura pura sobre una tabla append-only: no bloquea y no necesita hacerlo.
   * Devuelve además el estado actual de la instancia asociada, que es lo que la
   * línea de tiempo necesita para pintar el "ahora".
   */
  async getTransitionHistory(
    aggregateId: string,
    query: QueryTransitionHistoryDto,
  ): Promise<TransitionHistoryResponseDto> {
    return this.em.transactional(async (tx) => {
      let machineId: string | undefined;
      if (query.machineCode) {
        const machine = await this.machinesRepo.findActiveMachineByCode(
          tx,
          query.machineCode,
          CONCEPTS.WF_DEF_ACTIVE,
        );
        if (!machine) {
          throw new ResourceNotFoundException(
            'No hay una máquina activa con ese código.',
            {
              machineCode: query.machineCode,
            },
          );
        }
        machineId = machine.id;
      }

      const limit = Math.min(
        query.limit ?? DEFAULT_HISTORY_LIMIT,
        MAX_HISTORY_LIMIT,
      );
      const [events, total] =
        await this.runtimeRepo.findTransitionEventsByAggregate(
          tx,
          aggregateId,
          {
            stateMachineDefinitionId: machineId,
            limit,
            offset: query.offset ?? 0,
          },
        );

      // Las etiquetas from/to y el `command_code` viven en la definición; se
      // resuelven una vez por definición distinta, no una vez por evento.
      const definitions = new Map<
        string,
        { transitionCode: string; commandCode: string }
      >();
      for (const event of events) {
        if (definitions.has(event.transitionDefinitionId)) continue;
        const definition = await this.machinesRepo.findTransitionById(
          tx,
          event.transitionDefinitionId,
        );
        if (definition) {
          definitions.set(event.transitionDefinitionId, {
            transitionCode: definition.transitionCode,
            commandCode: definition.commandCode,
          });
        }
      }

      const instance = await this.runtimeRepo.findInstanceByAggregate(
        tx,
        aggregateId,
      );

      return {
        aggregateId,
        total,
        currentStateConceptId: instance?.currentStateConceptId,
        transitions: events.map((event) => {
          const definition = definitions.get(event.transitionDefinitionId);
          return {
            id: event.id,
            fromStateConceptId: event.fromStateConceptId,
            toStateConceptId: event.toStateConceptId,
            transitionCode: definition?.transitionCode,
            commandCode: definition?.commandCode,
            actorUserId: event.actorUserId,
            reasonConceptId: event.reasonConceptId,
            reasonText: event.reasonText,
            correlationId: event.correlationId,
            causationId: event.causationId,
            occurredAt: event.occurredAt.toISOString(),
          };
        }),
      };
    });
  }

  // --- Piezas compartidas -------------------------------------------------

  private async requireActiveMachine(
    tx: EntityManager,
    machineCode: string,
  ): Promise<StateMachineDefinitions> {
    const machine = await this.machinesRepo.findActiveMachineByCode(
      tx,
      machineCode,
      CONCEPTS.WF_DEF_ACTIVE,
    );
    if (!machine) {
      throw new ResourceNotFoundException(
        'No hay una versión activa de esa máquina de estado.',
        { machineCode },
      );
    }
    return machine;
  }

  /**
   * UC-32-07 (parte transaccional): un mensaje de outbox por efecto con
   * `outbox_event_type`, en orden de ejecución. Publicarlos aquí y despacharlos
   * después del commit es lo que garantiza que ningún consumidor vea un efecto de
   * una transición que acabó deshaciéndose.
   *
   * Los efectos sin `outbox_event_type` no se publican: ver "Pendiente" en el
   * README del módulo.
   */
  private async publishSideEffects(
    tx: EntityManager,
    transitionDefinitionId: string,
    context: {
      eventId: string;
      aggregateId: string;
      machineCode?: string;
      fromStateConceptId: string;
      toStateConceptId: string;
      correlationId?: string;
      actorUserId: string;
      compensating: boolean;
      idempotencyKeyPrefix?: string;
    },
  ): Promise<number> {
    const effects = await this.machinesRepo.findSideEffectsByTransition(
      tx,
      transitionDefinitionId,
    );
    let published = 0;

    for (const effect of effects) {
      if (!effect.outboxEventType) continue;

      const result = await this.outbox.publishDomainEvent(tx, {
        eventType: effect.outboxEventType,
        aggregateType: 'workflow.state_transition_events',
        aggregateId: context.aggregateId,
        payloadJson: {
          transitionEventId: context.eventId,
          machineCode: context.machineCode,
          sideEffectCode: effect.sideEffectCode,
          executionOrder: effect.executionOrder,
          fromStateConceptId: context.fromStateConceptId,
          toStateConceptId: context.toStateConceptId,
          actionSpec: effect.actionSpecJson,
        },
        metadataJson: { executionModeConceptId: effect.executionModeConceptId },
        correlationId: context.correlationId,
        causationId: context.eventId,
        idempotencyKey: context.idempotencyKeyPrefix
          ? `${context.idempotencyKeyPrefix}:${effect.sideEffectCode}`
          : undefined,
        actorUserId: context.actorUserId,
      });
      if (!result.duplicate) published += 1;
    }

    return published;
  }

  /**
   * Evalúa las guardas en orden y lanza al primer fallo con su `failure_code`.
   *
   * El mensaje que sale es el `failure_message_key` declarado, nunca el detalle
   * interno de la expresión: el caso de uso pide un código de fallo estable "sin
   * exponer internos", y filtrar la expresión revelaría la regla de negocio a
   * quien acaba de chocar contra ella.
   */
  private assertGuards(
    guards: TransitionGuards[],
    context: GuardContext,
  ): void {
    for (const guard of guards) {
      if (this.evaluateGuard(guard, context)) continue;
      throw new PreconditionFailedException(
        guard.failureMessageKey ??
          'La transición no cumple una guarda de la definición.',
        { failureCode: guard.failureCode ?? guard.guardCode },
      );
    }
  }

  /**
   * Evaluador de guardas. `expression_json` se interpreta como
   * `{ field, op, value }`, donde `field` es una ruta con puntos dentro del
   * `payloadJson` del comando.
   *
   * **Falla cerrado**: una guarda cuya expresión no se entiende se considera no
   * cumplida. Una guarda existe para impedir algo; dejarla pasar porque no se sabe
   * leerla convierte un control en un adorno.
   */
  private evaluateGuard(
    guard: TransitionGuards,
    context: GuardContext,
  ): boolean {
    if (guard.guardTypeConceptId === CONCEPTS.WF_GUARD_STATE) {
      const expression = guard.expressionJson as
        { stateConceptId?: string } | undefined;
      return (
        typeof expression?.stateConceptId === 'string' &&
        expression.stateConceptId === context.currentStateConceptId
      );
    }

    if (guard.guardTypeConceptId === CONCEPTS.WF_GUARD_PERMISSION) {
      const expression = guard.expressionJson as
        { anyOfRoles?: unknown } | undefined;
      const roles = expression?.anyOfRoles;
      if (!Array.isArray(roles) || roles.length === 0) return false;
      return roles.some(
        (role) => typeof role === 'string' && context.actorRoles.includes(role),
      );
    }

    if (guard.guardTypeConceptId !== CONCEPTS.WF_GUARD_EXPRESSION) return false;

    const expression = guard.expressionJson as
      { field?: unknown; op?: unknown; value?: unknown } | undefined;
    if (
      typeof expression?.field !== 'string' ||
      typeof expression.op !== 'string'
    )
      return false;

    const actual = this.readPath(context.payload, expression.field);

    switch (expression.op) {
      case 'exists':
        return actual !== undefined && actual !== null;
      case 'eq':
        return actual === expression.value;
      case 'ne':
        return actual !== expression.value;
      case 'in':
        return (
          Array.isArray(expression.value) && expression.value.includes(actual)
        );
      case 'gt':
        return typeof actual === 'number' &&
          typeof expression.value === 'number'
          ? actual > expression.value
          : false;
      case 'lt':
        return typeof actual === 'number' &&
          typeof expression.value === 'number'
          ? actual < expression.value
          : false;
      default:
        return false;
    }
  }

  private readPath(source: Record<string, unknown>, path: string): unknown {
    let current: unknown = source;
    for (const segment of path.split('.')) {
      if (current === null || typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[segment];
    }
    return current;
  }
}
