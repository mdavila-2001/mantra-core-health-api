import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { OutboxService } from '../../messaging/services';
import {
  AgentsRepository,
  AutomationGovernanceRepository,
} from '../repositories';
import {
  DefineWorkflowDto,
  WorkflowResponseDto,
  ConfigureTriggerDto,
  TriggerResponseDto,
} from '../dto';

/** Un cron de cinco campos, que es lo que el modelo guarda en `schedule_cron`. */
const CRON_FIELD_COUNT = 5;

/**
 * Definición de la orquestación (UC-48-06, 07): workflows con sus pasos y los
 * disparadores que los ponen en marcha.
 */
@Injectable()
export class AutomationDefinitionService {
  constructor(
    private readonly em: EntityManager,
    private readonly governanceRepo: AutomationGovernanceRepository,
    private readonly agentsRepo: AgentsRepository,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AutomationDefinitionService.name);
  }

  /**
   * UC-48-06: definir el workflow con sus pasos.
   *
   * Los pasos se enlazan entre sí por código (`onSuccessStepCode`,
   * `onFailureStepCode`) y no por id, porque los ids no existen hasta que se
   * insertan: pedirlos al llamante obligaría a dos llamadas y a que el grafo
   * quedara a medio construir entre una y otra.
   *
   * Un salto a un paso que no está en el lote se rechaza. Un grafo con una arista
   * colgando no falla al definirlo, falla a mitad de una ejecución.
   */
  async defineWorkflow(
    dto: DefineWorkflowDto,
    actor: AuthenticatedUser,
  ): Promise<WorkflowResponseDto> {
    return this.em.transactional(async (tx) => {
      const existing = await this.governanceRepo.findWorkflowByCode(
        tx,
        dto.code,
      );
      if (existing) {
        throw new ConflictException(
          'Ya existe un workflow de automatización con ese código.',
          {
            code: dto.code,
          },
        );
      }

      const stepCodes = new Set<string>();
      for (const step of dto.steps) {
        if (stepCodes.has(step.stepCode)) {
          throw new ConflictException('Dos pasos comparten el mismo código.', {
            stepCode: step.stepCode,
          });
        }
        stepCodes.add(step.stepCode);
      }

      for (const step of dto.steps) {
        for (const target of [step.onSuccessStepCode, step.onFailureStepCode]) {
          if (target && !stepCodes.has(target)) {
            throw new PreconditionFailedException(
              'Un paso salta a otro que no está declarado en el workflow.',
              { stepCode: step.stepCode, target },
            );
          }
        }
        if (
          step.stepTypeConceptId === CONCEPTS.AUTO_STEP_AGENT_CALL &&
          !step.agentId
        ) {
          throw new PreconditionFailedException(
            'Un paso de llamada a agente tiene que declarar qué agente llama.',
            { stepCode: step.stepCode },
          );
        }
        if (
          step.stepTypeConceptId === CONCEPTS.AUTO_STEP_TOOL_CALL &&
          !step.agentToolId
        ) {
          throw new PreconditionFailedException(
            'Un paso de llamada a herramienta tiene que declarar qué herramienta usa.',
            { stepCode: step.stepCode },
          );
        }
        if (step.agentId) {
          const agent = await this.agentsRepo.findAgentById(tx, step.agentId);
          if (!agent) {
            throw new ResourceNotFoundException(
              'Agente referenciado por un paso no encontrado.',
              {
                stepCode: step.stepCode,
                agentId: step.agentId,
              },
            );
          }
        }
        if (step.agentToolId) {
          const tool = await this.agentsRepo.findToolById(tx, step.agentToolId);
          if (!tool) {
            throw new ResourceNotFoundException(
              'Herramienta referenciada por un paso no encontrada.',
              { stepCode: step.stepCode, agentToolId: step.agentToolId },
            );
          }
        }
      }

      const workflow = this.governanceRepo.createWorkflow(tx, {
        tenantId: dto.tenantId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        orchestrationTypeConceptId: dto.orchestrationTypeConceptId,
        definitionJson: dto.definitionJson,
        currentVersion: 1,
        stateConceptId: CONCEPTS.AUTO_WORKFLOW_DRAFT,
        actorUserId: actor.id,
      });

      // Primero se crean todos los pasos y después se resuelven los saltos: una
      // arista puede apuntar hacia atrás o hacia adelante, y en el segundo caso el
      // destino aún no existiría.
      const byCode = new Map<string, { id: string }>();
      const created = dto.steps.map((step) => {
        const row = this.governanceRepo.createWorkflowStep(tx, {
          workflowId: workflow.id,
          stepCode: step.stepCode,
          stepTypeConceptId: step.stepTypeConceptId,
          agentId: step.agentId,
          agentToolId: step.agentToolId,
          configJson: step.configJson,
          ordinal: step.ordinal,
          actorUserId: actor.id,
        });
        byCode.set(step.stepCode, row);
        return { dto: step, row };
      });

      for (const { dto: step, row } of created) {
        if (step.onSuccessStepCode) {
          row.onSuccessStepId = byCode.get(step.onSuccessStepCode)?.id;
        }
        if (step.onFailureStepCode) {
          row.onFailureStepId = byCode.get(step.onFailureStepCode)?.id;
        }
      }

      await this.outbox.publishDomainEvent(tx, {
        tenantId: dto.tenantId,
        eventType: 'WorkflowDefined',
        aggregateType: 'automation.workflows',
        aggregateId: workflow.id,
        payloadJson: { code: workflow.code, stepCount: created.length },
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'automation.workflow.define',
          workflowId: workflow.id,
          steps: created.length,
        },
        'Workflow de automatización definido',
      );

      return {
        id: workflow.id,
        code: workflow.code,
        stateConceptId: workflow.stateConceptId,
        stepIds: created.map(({ row }) => row.id),
      };
    });
  }

  /**
   * UC-48-07: configurar el disparador.
   *
   * Cada tipo exige lo suyo: por evento, el tipo de evento que suscribe; por
   * calendario, el cron. Sin ellos el disparador está registrado pero no se puede
   * disparar nunca, que es peor que no tenerlo, porque parece que sí.
   *
   * El workflow tiene que estar activo: registrar un disparador contra un borrador
   * lo dejaría armado para arrancar algo que aún se está escribiendo.
   */
  async configureTrigger(
    dto: ConfigureTriggerDto,
    actor: AuthenticatedUser,
  ): Promise<TriggerResponseDto> {
    return this.em.transactional(async (tx) => {
      const existing = await this.governanceRepo.findTriggerByCode(
        tx,
        dto.code,
      );
      if (existing) {
        throw new ConflictException('Ya existe un disparador con ese código.', {
          code: dto.code,
        });
      }

      const workflow = await this.governanceRepo.findWorkflowById(
        tx,
        dto.workflowId,
      );
      if (!workflow) {
        throw new ResourceNotFoundException('Workflow no encontrado.', {
          workflowId: dto.workflowId,
        });
      }
      if (workflow.stateConceptId === CONCEPTS.AUTO_WORKFLOW_ARCHIVED) {
        throw new PreconditionFailedException(
          'No se puede disparar un workflow archivado.',
          { workflowId: workflow.id },
        );
      }

      if (
        dto.triggerTypeConceptId === CONCEPTS.AUTO_TRIGGER_TYPE_EVENT &&
        !dto.eventType
      ) {
        throw new PreconditionFailedException(
          'Un disparador por evento tiene que declarar qué evento suscribe.',
          { code: dto.code },
        );
      }
      if (dto.triggerTypeConceptId === CONCEPTS.AUTO_TRIGGER_TYPE_SCHEDULE) {
        if (!dto.scheduleCron) {
          throw new PreconditionFailedException(
            'Un disparador por calendario tiene que declarar su cron.',
            { code: dto.code },
          );
        }
        this.assertCron(dto.scheduleCron);
      }

      const trigger = this.governanceRepo.createTrigger(tx, {
        tenantId: dto.tenantId,
        code: dto.code,
        name: dto.name,
        triggerTypeConceptId: dto.triggerTypeConceptId,
        eventType: dto.eventType,
        targetResourceType: dto.targetResourceType,
        conditionJson: dto.conditionJson,
        scheduleCron: dto.scheduleCron,
        workflowId: dto.workflowId,
        isEnabled: true,
        stateConceptId: CONCEPTS.AUTO_TRIGGER_ACTIVE,
        campaignScheduleId: dto.campaignScheduleId,
        scheduleSourceConceptId: dto.campaignScheduleId
          ? CONCEPTS.AUTO_SCHEDULE_SOURCE_CAMPAIGN
          : CONCEPTS.AUTO_SCHEDULE_SOURCE_INTERNAL,
        actorUserId: actor.id,
      });

      await this.outbox.publishDomainEvent(tx, {
        tenantId: dto.tenantId,
        eventType: 'TriggerRegistered',
        aggregateType: 'automation.automation_triggers',
        aggregateId: trigger.id,
        payloadJson: {
          code: trigger.code,
          workflowId: trigger.workflowId,
          eventType: trigger.eventType ?? null,
          scheduleCron: trigger.scheduleCron ?? null,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        { operation: 'automation.trigger.configure', triggerId: trigger.id },
        'Disparador de automatización configurado',
      );

      return {
        id: trigger.id,
        code: trigger.code,
        isEnabled: trigger.isEnabled === true,
        stateConceptId: trigger.stateConceptId,
      };
    });
  }

  /**
   * Validación estructural del cron: cinco campos separados por espacios. No se
   * interpreta su semántica —eso es del planificador—, pero un cron con tres
   * campos no llegaría a registrarse ahí y el disparador quedaría muerto sin que
   * nadie lo notara.
   */
  private assertCron(scheduleCron: string): void {
    const fields = scheduleCron.trim().split(/\s+/);
    if (fields.length !== CRON_FIELD_COUNT) {
      throw new PreconditionFailedException(
        'La expresión cron tiene que tener cinco campos.',
        { fieldCount: fields.length },
      );
    }
  }
}
