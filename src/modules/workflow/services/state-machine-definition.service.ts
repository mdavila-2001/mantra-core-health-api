import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { OutboxService } from '../../messaging/services';
import { StateMachinesRepository } from '../repositories';
import {
  RegisterStateMachineDto,
  StateMachineResponseDto,
  DefineStatesDto,
  DefineStatesResponseDto,
  DefineTransitionDto,
  TransitionDefinitionResponseDto,
  PublishStateMachineDto,
  PublishStateMachineResponseDto,
} from '../dto';

/**
 * Catálogo de máquinas de estado (UC-32-01 … 04): registrar la definición,
 * declarar sus estados, declarar sus transiciones con guardas y efectos, y
 * publicar la versión que pasa a regir.
 *
 * Todo lo que hay aquí es *definición*: nada de esto mueve un agregado. La
 * ejecución vive en `TransitionExecutionService`.
 */
@Injectable()
export class StateMachineDefinitionService {
  constructor(
    private readonly em: EntityManager,
    private readonly machinesRepo: StateMachinesRepository,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(StateMachineDefinitionService.name);
  }

  /**
   * UC-32-01: registrar una definición de máquina de estado.
   *
   * Nace en `draft`. Una máquina recién declarada todavía no tiene estados ni
   * transiciones, así que dejarla activa permitiría disparar comandos contra un
   * grafo vacío: el agregado quedaría en un estado del que no se puede salir.
   */
  async registerStateMachine(
    dto: RegisterStateMachineDto,
    actor: AuthenticatedUser,
  ): Promise<StateMachineResponseDto> {
    return this.em.transactional(async (tx) => {
      const existing = await this.machinesRepo.findMachineByCode(
        tx,
        dto.machineCode,
      );
      if (existing) {
        throw new ConflictException(
          'Ya existe una máquina de estado con ese código.',
          {
            machineCode: dto.machineCode,
          },
        );
      }

      // El número de versión se deriva del value set, no del código: es el value
      // set el que tiene el unique (state_value_set_id, version_number).
      const maxVersion = await this.machinesRepo.findMaxVersionNumber(
        tx,
        dto.stateValueSetId,
      );

      const machine = this.machinesRepo.createMachine(tx, {
        machineCode: dto.machineCode,
        aggregateSchemaName: dto.aggregateSchemaName,
        aggregateEntityName: dto.aggregateEntityName,
        statusFieldName: dto.statusFieldName,
        stateValueSetId: dto.stateValueSetId,
        versionNumber: maxVersion + 1,
        statusConceptId: CONCEPTS.WF_DEF_DRAFT,
        actorUserId: actor.id,
      });

      await this.outbox.publishDomainEvent(tx, {
        eventType: 'StateMachineDefined',
        aggregateType: 'workflow.state_machine_definitions',
        aggregateId: machine.id,
        payloadJson: {
          machineCode: machine.machineCode,
          versionNumber: machine.versionNumber,
          aggregateSchemaName: machine.aggregateSchemaName,
          aggregateEntityName: machine.aggregateEntityName,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        { operation: 'workflow.definition.register', machineId: machine.id },
        'Máquina de estado registrada en borrador',
      );

      return {
        id: machine.id,
        machineCode: machine.machineCode,
        versionNumber: machine.versionNumber,
        statusConceptId: machine.statusConceptId,
      };
    });
  }

  /**
   * UC-32-02: declarar los estados de la máquina.
   *
   * Sólo sobre una definición en borrador: añadir un estado a una máquina viva
   * cambiaría el grafo bajo los agregados que ya se están moviendo por él.
   *
   * Exactamente un estado inicial, contando los que ya estaban. Dos iniciales
   * dejan sin decidir dónde empieza una instancia nueva.
   */
  async defineStates(
    machineId: string,
    dto: DefineStatesDto,
    actor: AuthenticatedUser,
  ): Promise<DefineStatesResponseDto> {
    return this.em.transactional(async (tx) => {
      const machine = await this.machinesRepo.findMachineForUpdate(
        tx,
        machineId,
      );
      if (!machine) {
        throw new ResourceNotFoundException(
          'Máquina de estado no encontrada.',
          { machineId },
        );
      }
      if (machine.statusConceptId !== CONCEPTS.WF_DEF_DRAFT) {
        throw new PreconditionFailedException(
          'Sólo se pueden declarar estados sobre una definición en borrador.',
          { machineId },
        );
      }

      const existingStates = await this.machinesRepo.findStatesByMachine(
        tx,
        machineId,
      );
      const existingConceptIds = new Set(
        existingStates.map((s) => s.stateConceptId),
      );

      const incomingConceptIds = new Set<string>();
      for (const state of dto.states) {
        if (
          existingConceptIds.has(state.stateConceptId) ||
          incomingConceptIds.has(state.stateConceptId)
        ) {
          throw new ConflictException(
            'El estado ya está declarado en esta máquina.',
            {
              stateConceptId: state.stateConceptId,
            },
          );
        }
        incomingConceptIds.add(state.stateConceptId);
      }

      const initialCount =
        existingStates.filter((s) => s.isInitial).length +
        dto.states.filter((s) => s.isInitial === true).length;
      if (initialCount !== 1) {
        throw new PreconditionFailedException(
          'La máquina debe declarar exactamente un estado inicial.',
          { machineId, initialCount },
        );
      }

      const stateIds: string[] = [];
      for (const state of dto.states) {
        const created = this.machinesRepo.createState(tx, {
          stateMachineDefinitionId: machineId,
          stateConceptId: state.stateConceptId,
          stateCodeSnapshot: state.stateCodeSnapshot,
          isInitial: state.isInitial === true,
          isTerminal: state.isTerminal === true,
          allowsEdit: state.allowsEdit !== false,
          ordinal: state.ordinal,
          statusConceptId: CONCEPTS.WF_ELEMENT_ACTIVE,
          actorUserId: actor.id,
        });
        stateIds.push(created.id);
      }

      touch(machine, actor.id);

      this.logger.info(
        {
          operation: 'workflow.definition.states',
          machineId,
          added: stateIds.length,
        },
        'Estados declarados',
      );

      return {
        stateMachineDefinitionId: machineId,
        stateIds,
        totalStates: existingStates.length + stateIds.length,
      };
    });
  }

  /**
   * UC-32-03: declarar una transición permitida, con sus guardas y sus efectos.
   *
   * El origen y el destino tienen que ser estados declarados de esta máquina, y el
   * origen no puede ser terminal: una transición que sale de un estado terminal
   * hace que el estado no sea terminal, y el grafo dice una cosa mientras las
   * transiciones dicen otra.
   */
  async defineTransition(
    machineId: string,
    dto: DefineTransitionDto,
    actor: AuthenticatedUser,
  ): Promise<TransitionDefinitionResponseDto> {
    return this.em.transactional(async (tx) => {
      const machine = await this.machinesRepo.findMachineForUpdate(
        tx,
        machineId,
      );
      if (!machine) {
        throw new ResourceNotFoundException(
          'Máquina de estado no encontrada.',
          { machineId },
        );
      }
      if (machine.statusConceptId !== CONCEPTS.WF_DEF_DRAFT) {
        throw new PreconditionFailedException(
          'Sólo se pueden declarar transiciones sobre una definición en borrador.',
          { machineId },
        );
      }

      const duplicate = await this.machinesRepo.findTransitionByCode(
        tx,
        machineId,
        dto.transitionCode,
      );
      if (duplicate) {
        throw new ConflictException(
          'Ya existe una transición con ese código en la máquina.',
          {
            transitionCode: dto.transitionCode,
          },
        );
      }

      const fromState = await this.machinesRepo.findState(
        tx,
        machineId,
        dto.fromStateConceptId,
      );
      if (!fromState) {
        throw new PreconditionFailedException(
          'El estado de origen no está declarado en esta máquina.',
          { stateConceptId: dto.fromStateConceptId },
        );
      }
      if (fromState.isTerminal) {
        throw new PreconditionFailedException(
          'Un estado terminal no puede tener transiciones de salida.',
          { stateConceptId: dto.fromStateConceptId },
        );
      }

      const toState = await this.machinesRepo.findState(
        tx,
        machineId,
        dto.toStateConceptId,
      );
      if (!toState) {
        throw new PreconditionFailedException(
          'El estado de destino no está declarado en esta máquina.',
          { stateConceptId: dto.toStateConceptId },
        );
      }

      const transition = this.machinesRepo.createTransition(tx, {
        stateMachineDefinitionId: machineId,
        transitionCode: dto.transitionCode,
        fromStateConceptId: dto.fromStateConceptId,
        toStateConceptId: dto.toStateConceptId,
        commandCode: dto.commandCode,
        requiredPermissionId: dto.requiredPermissionId,
        purposeOfUseConceptId: dto.purposeOfUseConceptId,
        idempotencyRequired: dto.idempotencyRequired === true,
        optimisticLockRequired: dto.optimisticLockRequired === true,
        reasonRequired: dto.reasonRequired === true,
        transitionTimeoutSeconds: dto.transitionTimeoutSeconds,
        statusConceptId: CONCEPTS.WF_ELEMENT_ACTIVE,
        actorUserId: actor.id,
      });

      // El orden de evaluación es contractual: la guarda que corta determina qué
      // `failure_code` ve el llamante. Dos guardas con el mismo orden harían que
      // el mensaje de error dependiera del plan de la consulta.
      const guardOrders = new Set<number>();
      for (const guard of dto.guards ?? []) {
        if (guardOrders.has(guard.evaluationOrder)) {
          throw new ConflictException(
            'Dos guardas comparten el mismo orden de evaluación.',
            {
              evaluationOrder: guard.evaluationOrder,
            },
          );
        }
        guardOrders.add(guard.evaluationOrder);
        this.machinesRepo.createGuard(tx, {
          stateTransitionDefinitionId: transition.id,
          guardCode: guard.guardCode,
          guardTypeConceptId: guard.guardTypeConceptId,
          evaluationOrder: guard.evaluationOrder,
          expressionJson: guard.expressionJson,
          failureCode: guard.failureCode,
          failureMessageKey: guard.failureMessageKey,
          statusConceptId: CONCEPTS.WF_ELEMENT_ACTIVE,
          actorUserId: actor.id,
        });
      }

      const effectOrders = new Set<number>();
      for (const effect of dto.sideEffects ?? []) {
        if (effectOrders.has(effect.executionOrder)) {
          throw new ConflictException(
            'Dos efectos comparten el mismo orden de ejecución.',
            {
              executionOrder: effect.executionOrder,
            },
          );
        }
        effectOrders.add(effect.executionOrder);
        this.machinesRepo.createSideEffect(tx, {
          stateTransitionDefinitionId: transition.id,
          sideEffectCode: effect.sideEffectCode,
          sideEffectTypeConceptId: effect.sideEffectTypeConceptId,
          executionModeConceptId: effect.executionModeConceptId,
          executionOrder: effect.executionOrder,
          outboxEventType: effect.outboxEventType,
          actionSpecJson: effect.actionSpecJson,
          compensationSpecJson: effect.compensationSpecJson,
          statusConceptId: CONCEPTS.WF_ELEMENT_ACTIVE,
          actorUserId: actor.id,
        });
      }

      touch(machine, actor.id);

      this.logger.info(
        {
          operation: 'workflow.definition.transition',
          machineId,
          transitionId: transition.id,
        },
        'Transición declarada',
      );

      return {
        id: transition.id,
        transitionCode: transition.transitionCode,
        guardCount: dto.guards?.length ?? 0,
        sideEffectCount: dto.sideEffects?.length ?? 0,
      };
    });
  }

  /**
   * UC-32-04: publicar la versión.
   *
   * Antes de dejar que un agregado real entre en el grafo se comprueba que el
   * grafo sirve: hay estado inicial, hay al menos un terminal, y todo estado no
   * terminal es alcanzable desde el inicial. Un estado inalcanzable es código
   * muerto; un agregado que llega a un estado sin salida y que no es terminal se
   * queda ahí para siempre.
   *
   * Publicar retira la versión activa anterior del mismo value set: dos versiones
   * vigentes dejarían sin decidir cuál gobierna la próxima transición.
   */
  async publishStateMachine(
    machineId: string,
    dto: PublishStateMachineDto,
    actor: AuthenticatedUser,
  ): Promise<PublishStateMachineResponseDto> {
    return this.em.transactional(async (tx) => {
      const machine = await this.machinesRepo.findMachineForUpdate(
        tx,
        machineId,
      );
      if (!machine) {
        throw new ResourceNotFoundException(
          'Máquina de estado no encontrada.',
          { machineId },
        );
      }
      if (machine.statusConceptId !== CONCEPTS.WF_DEF_DRAFT) {
        throw new PreconditionFailedException(
          'La definición ya no está en borrador.',
          {
            machineId,
            statusConceptId: machine.statusConceptId,
          },
        );
      }

      const states = await this.machinesRepo.findStatesByMachine(tx, machineId);
      const initial = states.filter((s) => s.isInitial);
      if (initial.length !== 1) {
        throw new PreconditionFailedException(
          'La definición debe tener exactamente un estado inicial para publicarse.',
          { machineId, initialCount: initial.length },
        );
      }
      if (!states.some((s) => s.isTerminal)) {
        throw new PreconditionFailedException(
          'La definición debe tener al menos un estado terminal para publicarse.',
          { machineId },
        );
      }

      const transitions = await this.machinesRepo.findTransitionsByMachine(
        tx,
        machineId,
      );
      const unreachable = this.findUnreachableStates(
        initial[0].stateConceptId,
        states.map((s) => ({
          conceptId: s.stateConceptId,
          isTerminal: s.isTerminal,
        })),
        transitions.map((t) => ({
          from: t.fromStateConceptId,
          to: t.toStateConceptId,
        })),
      );
      if (unreachable.length > 0) {
        throw new PreconditionFailedException(
          'Hay estados inalcanzables desde el estado inicial.',
          { machineId, unreachable },
        );
      }

      const effectiveFrom = dto.effectiveFrom
        ? new Date(dto.effectiveFrom)
        : new Date();

      const previous = await this.machinesRepo.findActiveMachineForUpdate(
        tx,
        machine.stateValueSetId,
        CONCEPTS.WF_DEF_ACTIVE,
      );
      let retiredVersionId: string | undefined;
      if (previous && previous.id !== machine.id) {
        previous.statusConceptId = CONCEPTS.WF_DEF_RETIRED;
        previous.effectiveTo = effectiveFrom;
        touch(previous, actor.id);
        retiredVersionId = previous.id;
      }

      machine.statusConceptId = CONCEPTS.WF_DEF_ACTIVE;
      machine.effectiveFrom = effectiveFrom;
      touch(machine, actor.id);

      await this.outbox.publishDomainEvent(tx, {
        eventType: 'StateMachineVersionPublished',
        aggregateType: 'workflow.state_machine_definitions',
        aggregateId: machine.id,
        payloadJson: {
          machineCode: machine.machineCode,
          versionNumber: machine.versionNumber,
          retiredVersionId: retiredVersionId ?? null,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'workflow.definition.publish',
          machineId,
          retiredVersionId,
        },
        'Versión de máquina de estado publicada',
      );

      return {
        id: machine.id,
        versionNumber: machine.versionNumber,
        statusConceptId: machine.statusConceptId,
        retiredVersionId,
      };
    });
  }

  /**
   * Recorrido en anchura desde el estado inicial. Devuelve los estados que no se
   * alcanzan: son los que hacen que el grafo publicado no describa lo que puede
   * pasar de verdad.
   */
  private findUnreachableStates(
    initialConceptId: string,
    states: { conceptId: string; isTerminal: boolean }[],
    transitions: { from: string; to: string }[],
  ): string[] {
    const outgoing = new Map<string, string[]>();
    for (const t of transitions) {
      const list = outgoing.get(t.from);
      if (list) list.push(t.to);
      else outgoing.set(t.from, [t.to]);
    }

    const reached = new Set<string>([initialConceptId]);
    const queue = [initialConceptId];
    while (queue.length > 0) {
      const current = queue.shift() as string;
      for (const next of outgoing.get(current) ?? []) {
        if (!reached.has(next)) {
          reached.add(next);
          queue.push(next);
        }
      }
    }

    return states
      .filter((s) => !reached.has(s.conceptId))
      .map((s) => s.conceptId);
  }
}
