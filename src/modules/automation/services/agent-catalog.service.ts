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
import {
  AgentsRepository,
  AutomationGovernanceRepository,
} from '../repositories';
import {
  RegisterAgentDto,
  AgentResponseDto,
  PublishAgentVersionDto,
  AgentVersionResponseDto,
  RegisterToolDto,
  ToolResponseDto,
  BindToolsDto,
  BindToolsResponseDto,
  DefineGuardrailDto,
  GuardrailResponseDto,
  AttachGuardrailDto,
  AttachGuardrailResponseDto,
  UpsertAgentMemoryDto,
  AgentMemoryResponseDto,
} from '../dto';

/** Niveles de autonomía que implican que el agente actúa, no sólo sugiere. */
const ACTING_AUTONOMY_LEVELS = [
  CONCEPTS.AUTO_AUTONOMY_ACT_WITH_APPROVAL,
  CONCEPTS.AUTO_AUTONOMY_AUTONOMOUS,
];

/**
 * Catálogo de la automatización (UC-48-01 … 05, 12): agentes y sus versiones,
 * herramientas, enlaces, guardrails y memoria.
 *
 * Nada de esto ejecuta: describe qué puede hacer un agente y con qué límites.
 */
@Injectable()
export class AgentCatalogService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param agentsRepo - Valor de agents repo requerido por la operación.
   * @param governanceRepo - Valor de governance repo requerido por la operación.
   * @param outbox - Valor de outbox requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly agentsRepo: AgentsRepository,
    private readonly governanceRepo: AutomationGovernanceRepository,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AgentCatalogService.name);
  }

  /**
   * UC-48-01: registrar el agente con su versión 1.
   *
   * El agente nace en borrador y su versión 1 también: un agente sin versión
   * publicada no puede ejecutarse, y crear el agente ya activo daría a entender
   * que sí.
   *
   * Un agente que actúa —con aprobación o solo— necesita `acts_as_user_id`. Sin
   * identidad de servicio, sus escrituras no quedarían atribuidas a nadie, y la
   * pregunta "quién cambió esto" no tendría respuesta.
   */
  async registerAgent(
    dto: RegisterAgentDto,
    actor: AuthenticatedUser,
  ): Promise<AgentResponseDto> {
    return this.em.transactional(async (tx) => {
      const existing = await this.agentsRepo.findAgentByCode(tx, dto.code);
      if (existing) {
        throw new ConflictException('Ya existe un agente con ese código.', {
          code: dto.code,
        });
      }

      if (
        ACTING_AUTONOMY_LEVELS.includes(dto.autonomyLevelConceptId) &&
        !dto.actsAsUserId
      ) {
        throw new PreconditionFailedException(
          'Un agente que actúa necesita una identidad de servicio (`actsAsUserId`).',
          { code: dto.code },
        );
      }

      const agent = this.agentsRepo.createAgent(tx, {
        tenantId: dto.tenantId,
        code: dto.code,
        name: dto.name,
        agentTypeConceptId: dto.agentTypeConceptId,
        description: dto.description,
        defaultModelConceptId: dto.defaultModelConceptId,
        systemServiceComponentId: dto.systemServiceComponentId,
        autonomyLevelConceptId: dto.autonomyLevelConceptId,
        actsAsUserId: dto.actsAsUserId,
        currentVersion: 1,
        stateConceptId: CONCEPTS.AUTO_AGENT_DRAFT,
        actorUserId: actor.id,
      });

      const version = this.agentsRepo.createAgentVersion(tx, {
        agentId: agent.id,
        version: 1,
        promptTemplate: dto.promptTemplate,
        modelConceptId: dto.modelConceptId ?? dto.defaultModelConceptId,
        modelParamsJson: dto.modelParamsJson,
        inputSchemaJson: dto.inputSchemaJson,
        outputSchemaJson: dto.outputSchemaJson,
        statusConceptId: CONCEPTS.AUTO_VERSION_DRAFT,
        actorUserId: actor.id,
      });

      await this.outbox.publishDomainEvent(tx, {
        tenantId: dto.tenantId,
        eventType: 'AgentRegistered',
        aggregateType: 'automation.agents',
        aggregateId: agent.id,
        payloadJson: { code: agent.code, agentVersionId: version.id },
        actorUserId: actor.id,
      });

      this.logger.info(
        { operation: 'automation.agent.register', agentId: agent.id },
        'Agente registrado en borrador',
      );

      return {
        id: agent.id,
        code: agent.code,
        currentVersion: agent.currentVersion,
        stateConceptId: agent.stateConceptId,
        agentVersionId: version.id,
      };
    });
  }

  /**
   * UC-48-02: publicar una versión.
   *
   * Dos caminos, según lo que llegue: publicar una versión que ya existía en
   * borrador, o crear la siguiente y publicarla de una vez. En ambos, `current_version`
   * del agente pasa a ser la publicada — es un valor derivado, y por eso el agente
   * se bloquea antes de tocarlo.
   *
   * Publicar la primera versión activa el agente: es el momento en que deja de ser
   * una declaración y pasa a poder ejecutarse.
   */
  async publishAgentVersion(
    agentId: string,
    dto: PublishAgentVersionDto,
    actor: AuthenticatedUser,
  ): Promise<AgentVersionResponseDto> {
    return this.em.transactional(async (tx) => {
      const agent = await this.agentsRepo.findAgentForUpdate(tx, agentId);
      if (!agent) {
        throw new ResourceNotFoundException('Agente no encontrado.', {
          agentId,
        });
      }

      const now = new Date();
      let version;

      if (dto.agentVersionId) {
        version = await this.agentsRepo.findVersionById(tx, dto.agentVersionId);
        if (!version || version.agentId !== agentId) {
          throw new ResourceNotFoundException(
            'La versión no existe para ese agente.',
            {
              agentVersionId: dto.agentVersionId,
            },
          );
        }
        if (version.statusConceptId !== CONCEPTS.AUTO_VERSION_DRAFT) {
          throw new PreconditionFailedException(
            'La versión ya no está en borrador.',
            {
              agentVersionId: version.id,
            },
          );
        }
        version.statusConceptId = CONCEPTS.AUTO_VERSION_PUBLISHED;
        version.publishedAt = now;
        if (dto.changelog) version.changelog = dto.changelog;
        touch(version, actor.id);
      } else {
        if (!dto.promptTemplate) {
          throw new PreconditionFailedException(
            'Para crear una versión nueva hace falta su plantilla de prompt.',
            { agentId },
          );
        }
        const maxVersion = await this.agentsRepo.findMaxVersion(tx, agentId);
        version = this.agentsRepo.createAgentVersion(tx, {
          agentId,
          version: maxVersion + 1,
          promptTemplate: dto.promptTemplate,
          modelConceptId: dto.modelConceptId ?? agent.defaultModelConceptId,
          modelParamsJson: dto.modelParamsJson,
          inputSchemaJson: dto.inputSchemaJson,
          outputSchemaJson: dto.outputSchemaJson,
          changelog: dto.changelog,
          statusConceptId: CONCEPTS.AUTO_VERSION_PUBLISHED,
          publishedAt: now,
          actorUserId: actor.id,
        });
      }

      agent.currentVersion = version.version;
      if (agent.stateConceptId === CONCEPTS.AUTO_AGENT_DRAFT) {
        agent.stateConceptId = CONCEPTS.AUTO_AGENT_ACTIVE;
      }
      touch(agent, actor.id);

      await this.outbox.publishDomainEvent(tx, {
        tenantId: agent.tenantId,
        eventType: 'AgentVersionPublished',
        aggregateType: 'automation.agent_versions',
        aggregateId: version.id,
        payloadJson: { agentId, version: version.version },
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'automation.agent.publish',
          agentId,
          agentVersionId: version.id,
        },
        'Versión de agente publicada',
      );

      return {
        id: version.id,
        agentId,
        version: version.version,
        statusConceptId: version.statusConceptId,
        currentVersion: agent.currentVersion,
      };
    });
  }

  /**
   * UC-48-03: registrar una herramienta.
   *
   * Una herramienta que escribe y no exige aprobación sólo tiene sentido si el
   * agente que la use está autorizado a actuar solo; por eso las dos banderas se
   * guardan juntas y se leen juntas al ejecutar el paso.
   *
   * Una llamada HTTP sin endpoint de integración no tiene a dónde ir.
   */
  async registerTool(
    dto: RegisterToolDto,
    actor: AuthenticatedUser,
  ): Promise<ToolResponseDto> {
    return this.em.transactional(async (tx) => {
      const existing = await this.agentsRepo.findToolByCode(tx, dto.code);
      if (existing) {
        throw new ConflictException(
          'Ya existe una herramienta con ese código.',
          {
            code: dto.code,
          },
        );
      }

      if (
        dto.toolTypeConceptId === CONCEPTS.AUTO_TOOL_TYPE_HTTP_CALL &&
        !dto.integrationEndpointId
      ) {
        throw new PreconditionFailedException(
          'Una herramienta de llamada HTTP necesita un endpoint de integración.',
          { code: dto.code },
        );
      }

      const tool = this.agentsRepo.createTool(tx, {
        code: dto.code,
        name: dto.name,
        toolTypeConceptId: dto.toolTypeConceptId,
        targetResource: dto.targetResource,
        inputSchemaJson: dto.inputSchemaJson,
        outputSchemaJson: dto.outputSchemaJson,
        integrationEndpointId: dto.integrationEndpointId,
        isWrite: dto.isWrite === true,
        requiresApproval: dto.requiresApproval === true,
        stateConceptId: CONCEPTS.AUTO_TOOL_ACTIVE,
        actorUserId: actor.id,
      });

      await this.outbox.publishDomainEvent(tx, {
        eventType: 'AgentToolRegistered',
        aggregateType: 'automation.agent_tools',
        aggregateId: tool.id,
        payloadJson: {
          code: tool.code,
          isWrite: tool.isWrite,
          requiresApproval: tool.requiresApproval,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        { operation: 'automation.tool.register', toolId: tool.id },
        'Herramienta de agente registrada',
      );

      return {
        id: tool.id,
        code: tool.code,
        isWrite: tool.isWrite === true,
        requiresApproval: tool.requiresApproval === true,
        stateConceptId: tool.stateConceptId,
      };
    });
  }

  /**
   * UC-48-04: enlazar herramientas a una versión.
   *
   * Sólo herramientas activas: enlazar una deshabilitada dejaría al agente con una
   * capacidad declarada que fallaría al usarse, y el fallo aparecería a mitad de
   * una ejecución en vez de aquí.
   *
   * El lote es atómico: enlazar cinco herramientas y que entren tres deja al agente
   * con una capacidad parcial que nadie pidió.
   */
  async bindTools(
    agentId: string,
    agentVersionId: string,
    dto: BindToolsDto,
    actor: AuthenticatedUser,
  ): Promise<BindToolsResponseDto> {
    return this.em.transactional(async (tx) => {
      const version = await this.agentsRepo.findVersionById(tx, agentVersionId);
      if (!version || version.agentId !== agentId) {
        throw new ResourceNotFoundException(
          'La versión no existe para ese agente.',
          {
            agentId,
            agentVersionId,
          },
        );
      }

      const bindingIds: string[] = [];
      const seen = new Set<string>();

      for (const binding of dto.bindings) {
        if (seen.has(binding.agentToolId)) {
          throw new ConflictException(
            'La misma herramienta viene dos veces en el lote.',
            {
              agentToolId: binding.agentToolId,
            },
          );
        }
        seen.add(binding.agentToolId);

        const tool = await this.agentsRepo.findToolById(
          tx,
          binding.agentToolId,
        );
        if (!tool) {
          throw new ResourceNotFoundException('Herramienta no encontrada.', {
            agentToolId: binding.agentToolId,
          });
        }
        if (tool.stateConceptId !== CONCEPTS.AUTO_TOOL_ACTIVE) {
          throw new PreconditionFailedException(
            'La herramienta no está activa.',
            {
              agentToolId: tool.id,
            },
          );
        }

        const duplicate = await this.agentsRepo.findBinding(
          tx,
          agentVersionId,
          binding.agentToolId,
        );
        if (duplicate) {
          throw new ConflictException(
            'La herramienta ya está enlazada a esta versión.',
            {
              agentToolId: binding.agentToolId,
            },
          );
        }

        const created = this.agentsRepo.createBinding(tx, {
          agentVersionId,
          agentToolId: binding.agentToolId,
          scopeJson: binding.scopeJson,
          maxCallsPerRun: binding.maxCallsPerRun,
          permissionEffectConceptId: binding.permissionEffectConceptId,
          actorUserId: actor.id,
        });
        bindingIds.push(created.id);
      }

      await this.outbox.publishDomainEvent(tx, {
        eventType: 'AgentToolBound',
        aggregateType: 'automation.agent_versions',
        aggregateId: agentVersionId,
        payloadJson: { agentId, boundTools: bindingIds.length },
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'automation.tool.bind',
          agentVersionId,
          bound: bindingIds.length,
        },
        'Herramientas enlazadas a la versión',
      );

      return { agentVersionId, bindingIds };
    });
  }

  /**
   * UC-48-05 (primera mitad): definir la política de guardrail.
   *
   * Una política de coste sin tope no restringe nada; declararla sería dar por
   * cubierto un control que no existe.
   */
  async defineGuardrail(
    dto: DefineGuardrailDto,
    actor: AuthenticatedUser,
  ): Promise<GuardrailResponseDto> {
    return this.em.transactional(async (tx) => {
      const existing = await this.governanceRepo.findGuardrailPolicyByCode(
        tx,
        dto.code,
      );
      if (existing) {
        throw new ConflictException(
          'Ya existe una política de guardrail con ese código.',
          {
            code: dto.code,
          },
        );
      }

      if (
        dto.policyTypeConceptId === CONCEPTS.AUTO_GUARDRAIL_COST &&
        !dto.maxCostAmount
      ) {
        throw new PreconditionFailedException(
          'Una política de coste tiene que declarar su tope.',
          { code: dto.code },
        );
      }
      if (
        dto.policyTypeConceptId === CONCEPTS.AUTO_GUARDRAIL_PHI &&
        !dto.piiPhiHandlingConceptId
      ) {
        throw new PreconditionFailedException(
          'Una política de datos de paciente tiene que declarar cómo se tratan.',
          { code: dto.code },
        );
      }

      const policy = this.governanceRepo.createGuardrailPolicy(tx, {
        tenantId: dto.tenantId,
        code: dto.code,
        name: dto.name,
        policyTypeConceptId: dto.policyTypeConceptId,
        ruleJson: dto.ruleJson,
        piiPhiHandlingConceptId: dto.piiPhiHandlingConceptId,
        maxCostAmount: dto.maxCostAmount,
        enforcementConceptId: dto.enforcementConceptId,
        isActive: true,
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'automation.guardrail.define',
          guardrailPolicyId: policy.id,
        },
        'Política de guardrail definida',
      );

      return { id: policy.id, code: policy.code, isActive: policy.isActive };
    });
  }

  /** UC-48-05 (segunda mitad): adjuntar la política a un agente. */
  async attachGuardrail(
    agentId: string,
    dto: AttachGuardrailDto,
    actor: AuthenticatedUser,
  ): Promise<AttachGuardrailResponseDto> {
    return this.em.transactional(async (tx) => {
      const agent = await this.agentsRepo.findAgentForUpdate(tx, agentId);
      if (!agent) {
        throw new ResourceNotFoundException('Agente no encontrado.', {
          agentId,
        });
      }

      const policy = await this.governanceRepo.findGuardrailPolicyById(
        tx,
        dto.guardrailPolicyId,
      );
      if (!policy) {
        throw new ResourceNotFoundException(
          'Política de guardrail no encontrada.',
          {
            guardrailPolicyId: dto.guardrailPolicyId,
          },
        );
      }
      if (!policy.isActive) {
        throw new PreconditionFailedException(
          'La política de guardrail no está activa.',
          {
            guardrailPolicyId: policy.id,
          },
        );
      }

      const duplicate = await this.governanceRepo.findAgentGuardrail(
        tx,
        agentId,
        policy.id,
      );
      if (duplicate) {
        throw new ConflictException(
          'La política ya está adjunta a este agente.',
          {
            agentId,
            guardrailPolicyId: policy.id,
          },
        );
      }

      const attachment = this.governanceRepo.createAgentGuardrail(tx, {
        agentId,
        guardrailPolicyId: policy.id,
        isEnabled: dto.isEnabled !== false,
        actorUserId: actor.id,
      });
      touch(agent, actor.id);

      await this.outbox.publishDomainEvent(tx, {
        tenantId: agent.tenantId,
        eventType: 'GuardrailAttached',
        aggregateType: 'automation.agent_guardrails',
        aggregateId: attachment.id,
        payloadJson: {
          agentId,
          guardrailPolicyId: policy.id,
          code: policy.code,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'automation.guardrail.attach',
          agentId,
          guardrailPolicyId: policy.id,
        },
        'Guardrail adjunto al agente',
      );

      return {
        id: attachment.id,
        agentId,
        guardrailPolicyId: policy.id,
        isEnabled: attachment.isEnabled,
      };
    });
  }

  /**
   * UC-48-12: persistir memoria del agente.
   *
   * Upsert por `(agente, ámbito, referencia, tipo)`. Que sea upsert y no insert es
   * lo que impide que el agente acumule cien versiones de la misma preferencia y
   * que la recuperación tenga que decidir cuál de todas vale.
   *
   * Fuera del ámbito global la memoria necesita a qué se refiere: sin referencia,
   * una memoria "de este expediente" no se puede recuperar para ningún expediente.
   */
  async upsertMemory(
    agentId: string,
    dto: UpsertAgentMemoryDto,
    actor: AuthenticatedUser,
  ): Promise<AgentMemoryResponseDto> {
    return this.em.transactional(async (tx) => {
      const agent = await this.agentsRepo.findAgentById(tx, agentId);
      if (!agent) {
        throw new ResourceNotFoundException('Agente no encontrado.', {
          agentId,
        });
      }

      if (
        dto.scopeConceptId !== CONCEPTS.AUTO_MEMORY_SCOPE_GLOBAL &&
        !dto.scopeRefId
      ) {
        throw new PreconditionFailedException(
          'Fuera del ámbito global la memoria tiene que declarar a qué se refiere.',
          { agentId },
        );
      }

      const key = {
        agentId,
        scopeConceptId: dto.scopeConceptId,
        scopeRefId: dto.scopeRefId,
        memoryTypeConceptId: dto.memoryTypeConceptId,
      };
      const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;

      const existing = await this.agentsRepo.findMemoryForUpdate(tx, key);
      if (existing) {
        existing.contentText = dto.contentText;
        existing.embeddingRef = dto.embeddingRef;
        existing.importance = dto.importance;
        existing.expiresAt = expiresAt;
        existing.statusConceptId = CONCEPTS.AUTO_MEMORY_ACTIVE;
        touch(existing, actor.id);

        await this.publishMemoryEvent(
          tx,
          agent.tenantId,
          existing.id,
          agentId,
          true,
          actor.id,
        );

        return {
          id: existing.id,
          agentId,
          statusConceptId: existing.statusConceptId,
          updated: true,
        };
      }

      const memory = this.agentsRepo.createMemory(tx, {
        ...key,
        contentText: dto.contentText,
        embeddingRef: dto.embeddingRef,
        importance: dto.importance,
        expiresAt,
        statusConceptId: CONCEPTS.AUTO_MEMORY_ACTIVE,
        actorUserId: actor.id,
      });

      await this.publishMemoryEvent(
        tx,
        agent.tenantId,
        memory.id,
        agentId,
        false,
        actor.id,
      );

      return {
        id: memory.id,
        agentId,
        statusConceptId: memory.statusConceptId,
        updated: false,
      };
    });
  }

  /**
   * Ejecuta la operación publish memory event.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @param memoryId - Identificador de memory.
   * @param agentId - Identificador de agent.
   * @param updated - Valor de updated requerido por la operación.
   * @param actorUserId - Identificador de actor user.
   */
  private async publishMemoryEvent(
    tx: EntityManager,
    tenantId: string | undefined,
    memoryId: string,
    agentId: string,
    updated: boolean,
    actorUserId: string,
  ): Promise<void> {
    await this.outbox.publishDomainEvent(tx, {
      tenantId,
      eventType: 'AgentMemoryUpserted',
      aggregateType: 'automation.agent_memory',
      aggregateId: memoryId,
      payloadJson: { agentId, updated },
      actorUserId,
    });

    this.logger.info(
      { operation: 'automation.memory.upsert', agentId, memoryId, updated },
      'Memoria de agente persistida',
    );
  }
}
